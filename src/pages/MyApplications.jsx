import { useEffect, useState } from "react";
import {
  FileText,
  CalendarDays,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";
import "./MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const seekerId = localStorage.getItem("seekerId");

  // =========================================================
  // FETCH APPLICATIONS
  // =========================================================

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      if (!seekerId) {
        setError("Seeker ID not found. Please login again.");
        return;
      }

      const response = await api.get(`/applications/seeker/${seekerId}`);

      setApplications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load applications:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load your applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD APPLICATIONS
  // =========================================================

  useEffect(() => {
    fetchApplications();
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Date not available";
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
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status) => {
    return String(status || "APPLIED").replaceAll("_", " ");
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    const normalized = String(status || "APPLIED").toUpperCase();

    if (normalized === "SELECTED" || normalized === "SHORTLISTED") {
      return "status-success";
    }

    if (normalized === "REJECTED" || normalized === "CANCELLED") {
      return "status-danger";
    }

    if (normalized === "INTERVIEW" || normalized === "INTERVIEW_SCHEDULED") {
      return "status-warning";
    }

    return "status-applied";
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="my-applications-page">
        <div className="applications-state">
          <div className="spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="my-applications-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="my-applications-header">
        <div className="my-applications-container">
          <span className="section-label">Job Seeker Portal</span>

          <h1>My Applications</h1>

          <p>Track your job applications and application status.</p>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="my-applications-section">
        <div className="my-applications-container">
          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="application-message error-message">
              <XCircle size={20} />

              <span>{error}</span>

              <button type="button" onClick={fetchApplications}>
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          )}

          {/* =================================================
              EMPTY APPLICATIONS
          ================================================= */}

          {!error && applications.length === 0 && (
            <div className="applications-empty">
              <FileText size={48} />

              <h2>No Applications Yet</h2>

              <p>You have not applied for any jobs yet.</p>
            </div>
          )}

          {/* =================================================
              APPLICATION LIST
          ================================================= */}

          {!error && applications.length > 0 && (
            <div className="applications-list">
              {applications.map((application) => (
                <article
                  className="application-card"
                  key={application.applicationId || application.id}
                >
                  {/* =========================================
                      CARD HEADER
                  ========================================= */}

                  <div className="application-card-header">
                    <div className="application-card-icon">
                      <FileText size={25} />
                    </div>

                    <div className="application-card-title">
                      <h2>{application.jobTitle || "Job Application"}</h2>

                      <p>{application.companyName || "Company"}</p>
                    </div>

                    <span
                      className={`application-status ${getStatusClass(
                        application.status,
                      )}`}
                    >
                      {formatStatus(application.status)}
                    </span>
                  </div>

                  {/* =========================================
                      APPLICATION DETAILS
                  ========================================= */}

                  <div className="application-info-grid">
                    <div className="application-info-item">
                      <span>Application ID</span>

                      <strong>{application.applicationId || "—"}</strong>
                    </div>

                    <div className="application-info-item">
                      <span>Job ID</span>

                      <strong>{application.jobId || "—"}</strong>
                    </div>

                    <div className="application-info-item">
                      <span>Location</span>

                      <strong>{application.location || "Not specified"}</strong>
                    </div>

                    <div className="application-info-item">
                      <span>Applied Date</span>

                      <strong className="date-value">
                        <CalendarDays size={15} />

                        {formatDate(application.appliedAt)}
                      </strong>
                    </div>
                  </div>

                  {/* =========================================
                      RESUME
                  ========================================= */}

                  <div className="resume-information">
                    <div className="resume-details">
                      <FileText size={20} />

                      <div>
                        <strong>Resume Submitted</strong>

                        <span>Resume ID: {application.resumeId || "—"}</span>
                      </div>
                    </div>

                    {application.resumeId && (
                      <a
                        href={`${api.defaults.baseURL}/resumes/${application.resumeId}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="resume-button"
                      >
                        <FileText size={16} />
                        View Resume
                      </a>
                    )}
                  </div>

                  {/* =========================================
                      APPLICATION PROGRESS
                  ========================================= */}

                  <div className="application-progress">
                    {/* APPLIED */}

                    <div className="progress-step active">
                      <div className="progress-icon">
                        <CheckCircle size={17} />
                      </div>

                      <span>Applied</span>
                    </div>

                    <div className="progress-line"></div>

                    {/* SHORTLISTED */}

                    <div
                      className={`progress-step ${
                        ["SHORTLISTED", "SELECTED"].includes(
                          String(application.status).toUpperCase(),
                        )
                          ? "active"
                          : ""
                      }`}
                    >
                      <div className="progress-icon">
                        <CheckCircle size={17} />
                      </div>

                      <span>Shortlisted</span>
                    </div>

                    <div className="progress-line"></div>

                    {/* SELECTED */}

                    <div
                      className={`progress-step ${
                        String(application.status).toUpperCase() === "SELECTED"
                          ? "active"
                          : ""
                      }`}
                    >
                      <div className="progress-icon">
                        <CheckCircle size={17} />
                      </div>

                      <span>Selected</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* =================================================
              REFRESH
          ================================================= */}

          {!error && applications.length > 0 && (
            <div className="applications-refresh">
              <button type="button" onClick={fetchApplications}>
                <RefreshCw size={17} />
                Refresh Applications
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default MyApplications;
