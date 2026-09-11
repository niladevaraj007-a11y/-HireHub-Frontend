import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  BriefcaseBusiness,
  MapPin,
  Users,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  CalendarDays,
  Layers3,
  IndianRupee,
  XCircle,
  RotateCcw,
} from "lucide-react";

import api from "../services/api";
import "./RecruiterJobs.css";

function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // GET LOGGED-IN USER ID
  // =========================================================

  const getUserId = () => {
    try {
      const directRecruiterId = localStorage.getItem("recruiterUserId");

      if (directRecruiterId) {
        const id = Number(directRecruiterId);

        if (!Number.isNaN(id)) {
          return id;
        }
      }

      const possibleKeys = [
        "user",
        "currentUser",
        "loggedInUser",
        "authUser",
        "recruiterUser",
      ];

      for (const key of possibleKeys) {
        const storedUser = localStorage.getItem(key);

        if (!storedUser) {
          continue;
        }

        try {
          const user = JSON.parse(storedUser);

          console.log(`User found in localStorage "${key}":`, user);

          const userId =
            user?.userId ??
            user?.user_id ??
            user?.id ??
            user?.recruiterUserId ??
            user?.UserId ??
            user?.ID;

          if (userId !== null && userId !== undefined && userId !== "") {
            const numericId = Number(userId);

            if (!Number.isNaN(numericId)) {
              return numericId;
            }
          }
        } catch {
          // Ignore invalid JSON
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting logged-in user ID:", error);

      return null;
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT JOB TYPE
  // =========================================================

  const formatJobType = (jobType) => {
    return String(jobType || "FULL_TIME")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // =========================================================
  // FORMAT SALARY
  // =========================================================

  const formatSalary = (min, max) => {
    const hasMin =
      min !== null && min !== undefined && min !== "" && Number(min) > 0;

    const hasMax =
      max !== null && max !== undefined && max !== "" && Number(max) > 0;

    if (!hasMin && !hasMax) {
      return "Not disclosed";
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
  // GET SKILLS
  // =========================================================

  const getSkills = (skills) => {
    if (!skills) {
      return [];
    }

    return String(skills)
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  };

  // =========================================================
  // FETCH JOBS
  // =========================================================

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const recruiterUserId = getUserId();

      console.log("Recruiter User ID:", recruiterUserId);

      if (!recruiterUserId) {
        setError(
          "Unable to identify your recruiter account. Please login again.",
        );
        return;
      }

      // -----------------------------------------------------
      // GET RECRUITER
      // -----------------------------------------------------

      const recruiterResponse = await api.get(
        `/recruiters/user/${recruiterUserId}`,
      );

      console.log("Recruiter response:", recruiterResponse.data);

      const recruiter = recruiterResponse.data;

      const companyId =
        recruiter?.companyId ??
        recruiter?.company?.companyId ??
        recruiter?.company?.id ??
        null;

      console.log("Company ID:", companyId);

      if (!companyId) {
        setError("Your recruiter account is not associated with a company.");
        return;
      }

      // -----------------------------------------------------
      // GET COMPANY JOBS
      // -----------------------------------------------------

      const jobsResponse = await api.get(`/jobs/company/${companyId}`);

      console.log("Jobs response:", jobsResponse.data);

      const receivedJobs = Array.isArray(jobsResponse.data)
        ? jobsResponse.data
        : [];

      setJobs(receivedJobs);
    } catch (error) {
      console.error("Failed to fetch recruiter jobs:", error);

      setJobs([]);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load your jobs. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD JOBS
  // =========================================================

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // =========================================================
  // DELETE JOB
  // =========================================================

  const handleDelete = async (jobId, jobTitle) => {
    const recruiterUserId = getUserId();

    if (!recruiterUserId) {
      alert("Unable to identify your recruiter account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${jobTitle}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Deleting job:", jobId);

      await api.delete(`/jobs/${jobId}`, {
        params: {
          recruiterUserId,
        },
      });

      setJobs((previousJobs) =>
        previousJobs.filter((job) => job.jobId !== jobId),
      );

      alert("Job deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete this job.",
      );
    }
  };

  // =========================================================
  // CLOSE JOB
  // =========================================================

  const handleCloseJob = async (jobId, jobTitle) => {
    const recruiterUserId = getUserId();

    if (!recruiterUserId) {
      alert("Unable to identify your recruiter account. Please login again.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to close "${jobTitle}"?\n\nCandidates will no longer be able to apply for this position.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Closing job:", jobId, "Recruiter:", recruiterUserId);

      /*
       * We use the existing UPDATE JOB endpoint.
       *
       * Backend:
       *
       * PUT /api/jobs/{jobId}?recruiterUserId=1
       *
       * Body:
       * {
       *   "status": "CLOSED"
       * }
       */

      const response = await api.put(
        `/jobs/${jobId}`,
        {
          status: "CLOSED",
        },
        {
          params: {
            recruiterUserId,
          },
        },
      );

      console.log("Close job response:", response.data);

      // -----------------------------------------------------
      // Update the card immediately
      // -----------------------------------------------------

      setJobs((previousJobs) =>
        previousJobs.map((job) =>
          job.jobId === jobId
            ? {
                ...job,
                status: "CLOSED",
              }
            : job,
        ),
      );

      alert("Job closed successfully.");
    } catch (error) {
      console.error("Close job failed:", error);

      console.error("Backend response:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to close this job.",
      );
    }
  };

  // =========================================================
  // REOPEN JOB
  // =========================================================

  const handleReopenJob = async (jobId, jobTitle) => {
    const recruiterUserId = getUserId();

    if (!recruiterUserId) {
      alert("Unable to identify your recruiter account. Please login again.");
      return;
    }

    const confirmed = window.confirm(
      `Do you want to reopen "${jobTitle}"?\n\nCandidates will be able to apply again.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Reopening job:", jobId, "Recruiter:", recruiterUserId);

      const response = await api.put(
        `/jobs/${jobId}`,
        {
          status: "OPEN",
        },
        {
          params: {
            recruiterUserId,
          },
        },
      );

      console.log("Reopen response:", response.data);

      setJobs((previousJobs) =>
        previousJobs.map((job) =>
          job.jobId === jobId
            ? {
                ...job,
                status: "OPEN",
              }
            : job,
        ),
      );

      alert("Job reopened successfully.");
    } catch (error) {
      console.error("Reopen job failed:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to reopen this job.",
      );
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    const value = String(status || "OPEN").toUpperCase();

    return value === "OPEN" ? "job-status-open" : "job-status-closed";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="recruiter-jobs-page">
        <div className="recruiter-loading">
          <div className="recruiter-spinner"></div>

          <p>Loading your jobs...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="recruiter-jobs-page">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="recruiter-jobs-hero">
        <div className="recruiter-hero-content">
          {/* HERO TEXT */}

          <div className="recruiter-hero-text">
            <span className="recruiter-eyebrow">RECRUITER PORTAL</span>

            <h1>Job Postings</h1>

            <p>
              Manage your job postings and find the best talent for your team.
            </p>
          </div>

          {/* HERO ACTIONS */}

          <div className="recruiter-hero-actions">
            {/* JOB COUNT */}

            <div className="job-count-box">
              <div className="job-count-icon">
                <BriefcaseBusiness size={27} />
              </div>

              <div>
                <strong>{jobs.length} Jobs</strong>

                <span>Total job postings</span>
              </div>
            </div>

            {/* REFRESH + POST JOB */}

            <div className="hero-action-buttons">
              <button
                type="button"
                className="hero-refresh-button"
                onClick={fetchJobs}
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <Link
                to="/recruiter/jobs/create"
                className="hero-post-job-button"
              >
                <Plus size={18} />
                Post Job
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <main className="recruiter-jobs-content">
        <div className="recruiter-jobs-container">
          {/* ERROR */}

          {error && (
            <div className="recruiter-error-box">
              <BriefcaseBusiness size={26} />

              <div>
                <strong>Unable to load jobs</strong>

                <p>{error}</p>
              </div>

              <button
                type="button"
                className="error-refresh-button"
                onClick={fetchJobs}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY */}

          {!error && jobs.length === 0 && (
            <div className="recruiter-empty-state">
              <div className="empty-icon">
                <BriefcaseBusiness size={36} />
              </div>

              <h2>No jobs posted yet</h2>

              <p>
                Create your first job posting and start receiving applications
                from candidates.
              </p>

              <Link to="/recruiter/jobs/create" className="post-job-button">
                <Plus size={18} />
                Post Your First Job
              </Link>
            </div>
          )}

          {/* JOB GRID */}

          {!error && jobs.length > 0 && (
            <div className="recruiter-job-grid">
              {jobs.map((job, index) => {
                const status = String(job.status || "OPEN").toUpperCase();

                const isOpen = status === "OPEN";

                const skills = getSkills(job.requiredSkills);

                return (
                  <article
                    key={job.jobId}
                    className={`recruiter-job-card ${
                      index % 2 === 0 ? "card-blue" : "card-green"
                    } ${!isOpen ? "job-card-closed" : ""}`}
                  >
                    {/* CARD TOP */}

                    <div className="job-card-top">
                      <div
                        className={`job-icon ${
                          index % 2 === 0 ? "job-icon-blue" : "job-icon-green"
                        }`}
                      >
                        <BriefcaseBusiness size={27} />
                      </div>

                      <span className={`job-status ${getStatusClass(status)}`}>
                        <span className="status-dot"></span>

                        {status}
                      </span>
                    </div>

                    {/* TITLE */}

                    <div className="job-title-section">
                      <h2>{job.title || "Untitled Position"}</h2>

                      <p>
                        {job.description
                          ? job.description.length > 150
                            ? `${job.description.substring(0, 150)}...`
                            : job.description
                          : "No description provided."}
                      </p>
                    </div>

                    {/* JOB INFORMATION */}

                    <div className="job-information">
                      <div className="job-information-item">
                        <MapPin size={22} />

                        <div>
                          <strong>{job.location || "Not specified"}</strong>

                          <span>Location</span>
                        </div>
                      </div>

                      <div className="job-information-divider"></div>

                      <div className="job-information-item">
                        <BriefcaseBusiness size={22} />

                        <div>
                          <strong>{formatJobType(job.jobType)}</strong>

                          <span>Employment Type</span>
                        </div>
                      </div>

                      <div className="job-information-divider"></div>

                      <div className="job-information-item">
                        <Users size={22} />

                        <div>
                          <strong>{job.vacancies || 0}</strong>

                          <span>
                            {job.vacancies === 1 ? "Opening" : "Openings"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DATE + SALARY */}

                    <div className="job-bottom-info">
                      <div className="posted-date">
                        <CalendarDays size={21} />

                        <div>
                          <strong>Posted {formatDate(job.createdAt)}</strong>

                          <span>Posted On</span>
                        </div>
                      </div>

                      <div
                        className={`salary-box ${
                          index % 2 === 0 ? "salary-blue" : "salary-green"
                        }`}
                      >
                        <IndianRupee size={19} />

                        <div>
                          <strong>
                            {formatSalary(job.minSalary, job.maxSalary)}
                          </strong>

                          <span>Salary Range</span>
                        </div>
                      </div>
                    </div>

                    {/* SKILLS */}

                    <div className="skills-section">
                      <div className="skills-label">
                        <Layers3 size={21} />

                        <strong>Required Skills</strong>
                      </div>

                      <div className="skills-list">
                        {skills.length > 0 ? (
                          skills.map((skill, skillIndex) => (
                            <span
                              key={`${skill}-${skillIndex}`}
                              className={
                                index % 2 === 0 ? "skill-blue" : "skill-green"
                              }
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="no-skills">No skills specified</span>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="job-actions">
                      {/* APPLICANTS */}

                      <Link
                        to={`/recruiter/jobs/${job.jobId}/applicants`}
                        className="applicants-button"
                      >
                        <Users size={17} />
                        Applicants
                      </Link>

                      {/* EDIT */}

                      <Link
                        to={`/recruiter/jobs/${job.jobId}/edit`}
                        className="edit-button"
                      >
                        <Pencil size={17} />
                        Edit
                      </Link>

                      {/* CLOSE / REOPEN */}

                      {isOpen ? (
                        <button
                          type="button"
                          className="close-job-button"
                          onClick={() =>
                            handleCloseJob(job.jobId, job.title || "this job")
                          }
                        >
                          <XCircle size={17} />
                          Close Job
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="reopen-job-button"
                          onClick={() =>
                            handleReopenJob(job.jobId, job.title || "this job")
                          }
                        >
                          <RotateCcw size={17} />
                          Reopen
                        </button>
                      )}

                      {/* DELETE */}

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(job.jobId, job.title || "this job")
                        }
                      >
                        <Trash2 size={17} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default RecruiterJobs;
