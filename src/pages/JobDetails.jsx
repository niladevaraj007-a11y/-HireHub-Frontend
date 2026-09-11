import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle,
  MapPin,
  Clock,
  IndianRupee,
  Users,
  FileText,
} from "lucide-react";

import api from "../services/api";

// =========================================================
// GET LOGGED-IN USER
// =========================================================

const getLoggedInUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Invalid user data:", error);

    localStorage.removeItem("user");

    return null;
  }
};

// =========================================================
// NORMALIZE RESUMES
// =========================================================

const normalizeResumes = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (data && typeof data === "object") {
    return [data];
  }

  return [];
};

// =========================================================
// GET RESUME ID
// =========================================================

const getResumeId = (resume) => {
  if (!resume) {
    return null;
  }

  return resume.resumeId ?? resume.id ?? null;
};

// =========================================================
// GET USER ROLE
// =========================================================

const getUserRole = (user) => {
  if (!user) {
    return "";
  }

  return user.role || user.userRole || user.roles?.[0] || user.authority || "";
};

// =========================================================
// CHECK JOB SEEKER
// =========================================================

const isJobSeeker = (user) => {
  if (!user) {
    return false;
  }

  const role = getUserRole(user);

  if (!role) {
    return true;
  }

  return String(role).toUpperCase().includes("JOB_SEEKER");
};

// =========================================================
// GET SEEKER ID
// =========================================================

const getSeekerId = (user) => {
  const storedSeekerId = localStorage.getItem("seekerId");

  if (
    storedSeekerId !== null &&
    storedSeekerId !== undefined &&
    storedSeekerId !== ""
  ) {
    return storedSeekerId;
  }

  if (!user) {
    return null;
  }

  const seekerId =
    user.seekerId ??
    user.jobSeekerId ??
    user.jobseekerId ??
    user.seeker?.seekerId ??
    user.seeker?.id ??
    user.jobSeeker?.seekerId ??
    user.jobSeeker?.id;

  if (seekerId !== null && seekerId !== undefined && seekerId !== "") {
    return seekerId;
  }

  const role = getUserRole(user);

  const seekerRole = String(role).toUpperCase().includes("JOB_SEEKER");

  if (!seekerRole) {
    return null;
  }

  return user.id ?? user.userId ?? null;
};

// =========================================================
// GET JOB STATUS
// =========================================================

const getJobStatus = (job) => {
  return String(job?.status || "OPEN").toUpperCase();
};

// =========================================================
// FORMAT JOB TYPE
// =========================================================

const formatJobType = (type) => {
  if (!type) {
    return "Not specified";
  }

  return String(type)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// =========================================================
// FORMAT SALARY
// =========================================================

const formatSalary = (min, max) => {
  const hasMin = min !== null && min !== undefined && Number(min) > 0;

  const hasMax = max !== null && max !== undefined && Number(max) > 0;

  if (!hasMin && !hasMax) {
    return "Salary not disclosed";
  }

  if (hasMin && hasMax) {
    return `₹${Number(min).toLocaleString("en-IN")} – ₹${Number(
      max,
    ).toLocaleString("en-IN")}`;
  }

  if (hasMin) {
    return `From ₹${Number(min).toLocaleString("en-IN")}`;
  }

  return `Up to ₹${Number(max).toLocaleString("en-IN")}`;
};

// =========================================================
// FETCH RESUME
// =========================================================

const fetchResumeId = async (seekerId) => {
  if (seekerId === null || seekerId === undefined || seekerId === "") {
    throw new Error(
      "Unable to identify your job seeker account. Please log in again.",
    );
  }

  console.log("Checking resume for seeker:", seekerId);

  const response = await api.get(
    `/resumes/seeker/${encodeURIComponent(seekerId)}`,
  );

  console.log("Resume response:", response.data);

  const resumes = normalizeResumes(response.data);

  if (resumes.length === 0) {
    throw new Error("Please upload your resume before applying for a job.");
  }

  const resumeId = getResumeId(resumes[0]);

  if (resumeId === null || resumeId === undefined || resumeId === "") {
    throw new Error("Unable to identify your resume.");
  }

  return resumeId;
};

// =========================================================
// SUBMIT APPLICATION
// =========================================================

const submitApplication = async (jobId, seekerId, resumeId) => {
  console.log("Submitting application:", {
    jobId,
    seekerId,
    resumeId,
  });

  const response = await api.post(
    `/applications/apply?jobId=${encodeURIComponent(
      jobId,
    )}&seekerId=${encodeURIComponent(seekerId)}&resumeId=${encodeURIComponent(
      resumeId,
    )}`,
  );

  console.log("Application response:", response.data);

  return response;
};

// =========================================================
// APPLICATION ERROR
// =========================================================

const getApplicationErrorMessage = (error) => {
  const status = error?.response?.status;

  const data = error?.response?.data;

  if (status === 409) {
    return (
      data?.message || data?.error || "You have already applied for this job."
    );
  }

  if (status === 400) {
    return data?.message || data?.error || "Invalid application details.";
  }

  if (status === 401) {
    return "Your login session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You are not authorized to apply for this job.";
  }

  if (status === 404) {
    return (
      data?.message ||
      data?.error ||
      "The job or application service was not found."
    );
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return (
    data?.message ||
    data?.error ||
    error?.message ||
    "Unable to submit your application."
  );
};

// =========================================================
// JOB DETAILS
// =========================================================

function JobDetails() {
  /*
   * IMPORTANT:
   *
   * App.jsx:
   *
   * /jobs/:jobId
   *
   * Therefore:
   *
   * useParams().jobId
   */

  const { jobId } = useParams();

  const navigate = useNavigate();

  const [job, setJob] = useState(null);

  const [loading, setLoading] = useState(true);

  const [applying, setApplying] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =======================================================
  // FETCH JOB
  // =======================================================

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || jobId === "undefined" || jobId === "null") {
        console.error("Invalid job ID:", jobId);

        setError("Invalid job ID.");

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("=================================");

        console.log("Fetching Job");

        console.log("Job ID:", jobId);

        console.log("Endpoint:", `/jobs/${jobId}`);

        console.log("=================================");

        const response = await api.get(`/jobs/${encodeURIComponent(jobId)}`);

        console.log("Job response:", response.data);

        setJob(response.data);
      } catch (fetchError) {
        console.error("Failed to fetch job:", fetchError);

        console.error("Status:", fetchError.response?.status);

        console.error("Backend response:", fetchError.response?.data);

        const backendMessage =
          fetchError.response?.data?.message ||
          fetchError.response?.data?.error;

        setError(backendMessage || "Unable to load this job.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // =======================================================
  // APPLY
  // =======================================================

  const handleApply = async () => {
    if (applying) {
      return;
    }

    setMessage("");
    setError("");

    const user = getLoggedInUser();

    // LOGIN CHECK

    if (!user) {
      localStorage.setItem("applyAfterLogin", `/jobs/${jobId}`);

      navigate("/login");

      return;
    }

    // JOB CHECK

    if (!job) {
      setError("Job information is not available.");

      return;
    }

    // STATUS CHECK

    const status = getJobStatus(job);

    if (status !== "OPEN") {
      setError("This job is no longer accepting applications.");

      return;
    }

    // ROLE CHECK

    if (!isJobSeeker(user)) {
      setError("Only job seekers can apply for jobs.");

      return;
    }

    // SEEKER ID

    const seekerId = getSeekerId(user);

    if (seekerId === null || seekerId === undefined || seekerId === "") {
      setError(
        "Unable to identify your job seeker account. Please log out and log in again.",
      );

      return;
    }

    try {
      setApplying(true);

      console.log("Getting resume...");

      const resumeId = await fetchResumeId(seekerId);

      console.log("Resume ID:", resumeId);

      await submitApplication(jobId, seekerId, resumeId);

      setMessage("Application submitted successfully!");

      localStorage.removeItem("applyAfterLogin");

      window.setTimeout(() => {
        navigate("/applications", {
          replace: true,
        });
      }, 1200);
    } catch (applicationError) {
      console.error("Application failed:", applicationError);

      console.error("Status:", applicationError.response?.status);

      console.error("Backend response:", applicationError.response?.data);

      setError(getApplicationErrorMessage(applicationError));
    } finally {
      setApplying(false);
    }
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="job-details-state">
        <div className="spinner"></div>

        <p>Loading job details...</p>
      </div>
    );
  }

  // =======================================================
  // JOB NOT FOUND
  // =======================================================

  if (!job) {
    return (
      <div className="job-details-state">
        <Briefcase size={48} />

        <h2>Job not found</h2>

        <p>{error || "This job does not exist."}</p>

        <Link to="/jobs" className="primary-btn">
          Browse Jobs
        </Link>
      </div>
    );
  }

  // =======================================================
  // JOB DATA
  // =======================================================

  const companyName =
    job.company?.name ||
    job.company?.companyName ||
    job.companyName ||
    (job.companyId ? `Company ${job.companyId}` : "Company");

  const jobStatus = getJobStatus(job);

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <div className="job-details-page">
      {/* HEADER */}

      <section className="job-details-header">
        <div className="container">
          <Link to="/jobs" className="back-link">
            <ArrowLeft size={18} />
            Back to Jobs
          </Link>

          <div className="job-details-main">
            <div className="job-details-icon">
              <Building2 size={34} />
            </div>

            <div>
              <span className="section-label">Job Opportunity</span>

              <h1>{job.title || "Job Position"}</h1>

              <p className="details-company">{companyName}</p>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILS */}

      <section className="page-section">
        <div className="container job-details-layout">
          {/* LEFT */}

          <div className="job-details-content">
            {/* OVERVIEW */}

            <div className="card details-card">
              <h2>Job Overview</h2>

              <div className="overview-grid">
                <div>
                  <MapPin size={20} />

                  <span>
                    <small>Location</small>

                    <strong>{job.location || "Not specified"}</strong>
                  </span>
                </div>

                <div>
                  <Briefcase size={20} />

                  <span>
                    <small>Employment</small>

                    <strong>{formatJobType(job.jobType)}</strong>
                  </span>
                </div>

                <div>
                  <IndianRupee size={20} />

                  <span>
                    <small>Salary</small>

                    <strong>
                      {formatSalary(job.minSalary, job.maxSalary)}
                    </strong>
                  </span>
                </div>

                <div>
                  <Users size={20} />

                  <span>
                    <small>Vacancies</small>

                    <strong>{job.vacancies ?? "Not specified"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* EXPERIENCE */}

            <div className="card details-card">
              <h2>Experience Required</h2>

              <p className="description-text">
                {job.experienceRequired !== null &&
                job.experienceRequired !== undefined
                  ? `${job.experienceRequired} years`
                  : "Not specified"}
              </p>
            </div>

            {/* SKILLS */}

            <div className="card details-card">
              <h2>Required Skills</h2>

              {job.requiredSkills ? (
                <div className="details-skills">
                  {String(job.requiredSkills)
                    .split(",")
                    .map((skill, index) => {
                      const cleanSkill = skill.trim();

                      if (!cleanSkill) {
                        return null;
                      }

                      return (
                        <span key={`${cleanSkill}-${index}`}>
                          <CheckCircle size={15} />

                          {cleanSkill}
                        </span>
                      );
                    })}
                </div>
              ) : (
                <p className="muted-text">No specific skills listed.</p>
              )}
            </div>

            {/* DESCRIPTION */}

            <div className="card details-card">
              <h2>About This Opportunity</h2>

              <p className="description-text">
                {job.description || "No job description has been provided."}
              </p>
            </div>
          </div>

          {/* APPLY CARD */}

          <aside className="job-apply-card card">
            <span className="job-status">{jobStatus}</span>

            <h2>{job.title || "Job Position"}</h2>

            <p>{companyName}</p>

            <div className="apply-info">
              <span>
                <MapPin size={17} />

                {job.location || "Not specified"}
              </span>

              <span>
                <Clock size={17} />

                {formatJobType(job.jobType)}
              </span>
            </div>

            {/* SUCCESS */}

            {message && (
              <output className="success-message">
                <CheckCircle size={18} />

                <span>{message}</span>
              </output>
            )}

            {/* ERROR */}

            {error && (
              <div className="apply-error" role="alert">
                {error}
              </div>
            )}

            {/* APPLY */}

            <button
              type="button"
              className="primary-btn apply-btn"
              onClick={handleApply}
              disabled={applying || Boolean(message) || jobStatus !== "OPEN"}
            >
              {applying ? (
                <>
                  <span className="spinner-small"></span>

                  <span>Checking Resume...</span>
                </>
              ) : message ? (
                <>
                  <CheckCircle size={17} />

                  <span>Application Submitted</span>
                </>
              ) : jobStatus !== "OPEN" ? (
                "Job Closed"
              ) : (
                <>
                  <FileText size={17} />

                  <span>Apply Now</span>
                </>
              )}
            </button>

            <p className="apply-note">
              You need an account and uploaded resume to apply.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default JobDetails;
