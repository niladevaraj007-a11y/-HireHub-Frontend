import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Upload,
} from "lucide-react";

import api from "../services/api";

function ApplicationReview() {
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // GET JOB ID FROM URL
  // =========================================================

  const params = new URLSearchParams(location.search);

  const jobId = params.get("jobId");

  // =========================================================
  // LOAD USER + JOB + RESUME
  // =========================================================

  useEffect(() => {
    const loadApplicationReview = async () => {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------------------
        // CHECK JOB ID
        // -----------------------------------------------------

        if (!jobId) {
          setError("Job information is missing.");
          return;
        }

        // -----------------------------------------------------
        // GET USER
        // -----------------------------------------------------

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          localStorage.setItem(
            "applyAfterLogin",
            `/application-review?jobId=${jobId}`,
          );

          navigate("/login");
          return;
        }

        let parsedUser;

        try {
          parsedUser = JSON.parse(storedUser);
        } catch (err) {
          console.error("Invalid user data:", err);

          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        setUser(parsedUser);

        // -----------------------------------------------------
        // GET SEEKER ID
        // -----------------------------------------------------

        const seekerId =
          parsedUser.seekerId || parsedUser.id || parsedUser.userId;

        if (!seekerId) {
          setError("Unable to identify your job seeker account.");
          return;
        }

        // -----------------------------------------------------
        // FETCH JOB
        // -----------------------------------------------------

        const jobResponse = await api.get(`/jobs/${jobId}`);

        console.log("Review job:", jobResponse.data);

        setJob(jobResponse.data);

        // -----------------------------------------------------
        // FETCH RESUME
        // -----------------------------------------------------

        const resumeResponse = await api.get(`/resumes/seeker/${seekerId}`);

        console.log("Review resume:", resumeResponse.data);

        const resumes = Array.isArray(resumeResponse.data)
          ? resumeResponse.data
          : [];

        if (resumes.length === 0) {
          setError(
            "You do not have a resume uploaded. Please upload your resume before applying.",
          );
          return;
        }

        // Use latest/first resume
        setResume(resumes[0]);
      } catch (err) {
        console.error("Failed to load application review:", err);

        console.error("Backend response:", err.response?.data);

        const backendMessage =
          err.response?.data?.message || err.response?.data?.error;

        setError(backendMessage || "Unable to load application review.");
      } finally {
        setLoading(false);
      }
    };

    loadApplicationReview();
  }, [jobId, navigate]);

  // =========================================================
  // CONFIRM APPLICATION
  // =========================================================

  const handleConfirmApply = async () => {
    if (!job) {
      setError("Job information is missing.");
      return;
    }

    if (!resume) {
      setError("Please upload a resume before applying.");
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      localStorage.setItem(
        "applyAfterLogin",
        `/application-review?jobId=${jobId}`,
      );

      navigate("/login");
      return;
    }

    let parsedUser;

    try {
      parsedUser = JSON.parse(storedUser);
    } catch (err) {
      console.error("Invalid user data:", err);

      localStorage.removeItem("user");

      navigate("/login");
      return;
    }

    const seekerId = parsedUser.seekerId || parsedUser.id || parsedUser.userId;

    const resumeId = resume.resumeId || resume.id;

    const actualJobId = job.jobId || job.id || jobId;

    if (!seekerId) {
      setError("Unable to identify your seeker account.");
      return;
    }

    if (!resumeId) {
      setError("Unable to identify your resume.");
      return;
    }

    if (!actualJobId) {
      setError("Unable to identify this job.");
      return;
    }

    // =======================================================
    // SUBMIT APPLICATION
    // =======================================================

    try {
      setApplying(true);
      setError("");
      setMessage("");

      console.log("Submitting final application:", {
        jobId: actualJobId,
        seekerId,
        resumeId,
      });

      const response = await api.post(
        `/applications/apply?jobId=${actualJobId}&seekerId=${seekerId}&resumeId=${resumeId}`,
      );

      console.log("Application submitted:", response.data);

      setMessage("Application submitted successfully!");

      // -----------------------------------------------------
      // Redirect to applications after short delay
      // -----------------------------------------------------

      setTimeout(() => {
        navigate("/applications");
      }, 1200);
    } catch (err) {
      console.error("Application submission failed:", err);

      console.error("Backend response:", err.response?.data);

      const backendMessage =
        err.response?.data?.message || err.response?.data?.error;

      setError(
        backendMessage ||
          "Unable to submit your application. Please try again.",
      );
    } finally {
      setApplying(false);
    }
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
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="applications-state">
        <div className="spinner"></div>

        <p>Preparing your application review...</p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && (!job || !resume)) {
    return (
      <div className="applications-state error-state">
        <FileText size={45} />

        <h2>Unable to continue</h2>

        <p>{error}</p>

        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate(`/jobs/${jobId}`)}
        >
          <ArrowLeft size={17} />
          Back to Job
        </button>
      </div>
    );
  }

  // =========================================================
  // USER VALUES
  // =========================================================

  const userName =
    user?.name || user?.fullName || user?.username || "Not provided";

  const email = user?.email || "Not provided";

  const phone = user?.phone || "Not provided";

  const locationValue = user?.location || "Not provided";

  const skills = user?.skills || "Not provided";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="application-review-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="profile-header">
        <div className="container">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate(`/jobs/${jobId}`)}
          >
            <ArrowLeft size={18} />
            Back to Job
          </button>

          <span className="section-label">Application</span>

          <h1>Review Your Application</h1>

          <p>
            Please review your information before submitting your application.
          </p>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="page-section">
        <div className="container">
          {/* =================================================
              SUCCESS
          ================================================== */}

          {message && (
            <div className="profile-success">
              <CheckCircle size={20} />
              {message}
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================== */}

          {error && <div className="profile-error">{error}</div>}

          <div className="application-review-layout">
            {/* =================================================
                LEFT
            ================================================== */}

            <div>
              {/* JOB */}
              <div className="card details-card">
                <h2>Job You Are Applying For</h2>

                <div className="review-job">
                  <div className="application-icon">
                    <Briefcase size={25} />
                  </div>

                  <div>
                    <h3>{job?.title || "Job Position"}</h3>

                    <p>{job?.company?.name || job?.companyName || "Company"}</p>

                    <span>
                      <MapPin size={16} />
                      {job?.location || "Location not specified"}
                    </span>
                  </div>
                </div>

                <div className="review-job-details">
                  <div>
                    <small>Employment</small>

                    <strong>
                      {job?.jobType
                        ? String(job.jobType).replaceAll("_", " ")
                        : "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <small>Salary</small>

                    <strong>
                      {formatSalary(job?.minSalary, job?.maxSalary)}
                    </strong>
                  </div>

                  <div>
                    <small>Experience</small>

                    <strong>
                      {job?.experienceRequired !== null &&
                      job?.experienceRequired !== undefined
                        ? `${job.experienceRequired} years`
                        : "Not specified"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* PERSONAL INFORMATION */}
              <div className="card details-card">
                <h2>Your Information</h2>

                <div className="review-information">
                  <div>
                    <User size={18} />

                    <span>
                      <small>Full Name</small>

                      <strong>{userName}</strong>
                    </span>
                  </div>

                  <div>
                    <Mail size={18} />

                    <span>
                      <small>Email</small>

                      <strong>{email}</strong>
                    </span>
                  </div>

                  <div>
                    <Phone size={18} />

                    <span>
                      <small>Phone</small>

                      <strong>{phone}</strong>
                    </span>
                  </div>

                  <div>
                    <MapPin size={18} />

                    <span>
                      <small>Location</small>

                      <strong>{locationValue}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* SKILLS */}
              <div className="card details-card">
                <h2>Skills</h2>

                <p className="description-text">{skills}</p>
              </div>

              {/* RESUME */}
              <div className="card details-card">
                <h2>Resume</h2>

                <div className="review-resume">
                  <FileText size={30} />

                  <div>
                    <strong>
                      {resume?.fileName ||
                        resume?.originalFileName ||
                        resume?.name ||
                        "Resume"}
                    </strong>

                    <p>
                      Your selected resume will be sent with this application.
                    </p>
                  </div>

                  <CheckCircle size={22} />
                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT - FINAL APPLY
            ================================================== */}

            <aside className="job-apply-card card">
              <span className="job-status">READY TO APPLY</span>

              <h2>{job?.title || "Job Position"}</h2>

              <p>{job?.company?.name || job?.companyName || "Company"}</p>

              <hr />

              <div className="review-checklist">
                <div>
                  <CheckCircle size={17} />
                  Profile information
                </div>

                <div>
                  <CheckCircle size={17} />
                  Contact information
                </div>

                <div>
                  <CheckCircle size={17} />
                  Resume attached
                </div>
              </div>

              <button
                type="button"
                className="primary-btn apply-btn"
                onClick={handleConfirmApply}
                disabled={applying || Boolean(message)}
              >
                {applying ? (
                  <>
                    <Upload size={17} />
                    Submitting...
                  </>
                ) : message ? (
                  <>
                    <CheckCircle size={17} />
                    Application Submitted
                  </>
                ) : (
                  <>
                    <CheckCircle size={17} />
                    Confirm & Apply
                  </>
                )}
              </button>

              <p className="apply-note">
                By clicking "Confirm & Apply", your application will be
                submitted to the employer.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ApplicationReview;
