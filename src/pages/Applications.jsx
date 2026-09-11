import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FileText,
  Briefcase,
  MapPin,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Eye,
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
// GET SEEKER ID
// =========================================================

const getSeekerId = () => {
  // First check separately stored seekerId
  const storedSeekerId = localStorage.getItem("seekerId");

  if (
    storedSeekerId !== null &&
    storedSeekerId !== undefined &&
    storedSeekerId !== ""
  ) {
    return storedSeekerId;
  }

  // Then check logged-in user
  const user = getLoggedInUser();

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

  return null;
};

// =========================================================
// NORMALIZE APPLICATION RESPONSE
// =========================================================

const normalizeApplications = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.applications)) {
    return data.applications;
  }

  if (data && typeof data === "object") {
    return [data];
  }

  return [];
};

// =========================================================
// GET APPLICATION ID
// =========================================================

const getApplicationId = (application) => {
  if (!application) {
    return null;
  }

  return (
    application.applicationId ??
    application.id ??
    application.application?.applicationId ??
    application.application?.id ??
    null
  );
};

// =========================================================
// GET JOB ID
// =========================================================

const getJobId = (application) => {
  if (!application) {
    return null;
  }

  /*
   * Check direct job ID first.
   */
  const directJobId =
    application.jobId ?? application.jobID ?? application.job_id;

  if (directJobId !== null && directJobId !== undefined && directJobId !== "") {
    return directJobId;
  }

  /*
   * Check nested job object.
   */
  const nestedJobId =
    application.job?.jobId ?? application.job?.id ?? application.job?.jobID;

  if (nestedJobId !== null && nestedJobId !== undefined && nestedJobId !== "") {
    return nestedJobId;
  }

  /*
   * Some backend responses may use position/job fields.
   */
  return application.positionId ?? application.job?.positionId ?? null;
};

// =========================================================
// GET JOB TITLE
// =========================================================

const getJobTitle = (application) => {
  if (!application) {
    return "Job Application";
  }

  return (
    application.jobTitle ??
    application.title ??
    application.job?.title ??
    application.position?.title ??
    "Job Application"
  );
};

// =========================================================
// GET COMPANY NAME
// =========================================================

const getCompanyName = (application) => {
  if (!application) {
    return "Company";
  }

  return (
    application.companyName ??
    application.company?.name ??
    application.company?.companyName ??
    application.job?.companyName ??
    application.job?.company?.name ??
    "Company"
  );
};

// =========================================================
// GET LOCATION
// =========================================================

const getLocation = (application) => {
  if (!application) {
    return "Location not specified";
  }

  return (
    application.location ??
    application.job?.location ??
    application.company?.location ??
    "Location not specified"
  );
};

// =========================================================
// GET STATUS
// =========================================================

const getStatus = (application) => {
  return String(
    application?.status ?? application?.applicationStatus ?? "APPLIED",
  ).toUpperCase();
};

// =========================================================
// STATUS CLASS
// =========================================================

const getStatusClass = (status) => {
  const normalized = String(status || "APPLIED").toUpperCase();

  if (
    normalized === "SELECTED" ||
    normalized === "SHORTLISTED" ||
    normalized === "ACCEPTED"
  ) {
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
// FORMAT STATUS
// =========================================================

const formatStatus = (status) => {
  return String(status || "APPLIED")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

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
// GET APPLIED DATE
// =========================================================

const getAppliedDate = (application) => {
  return (
    application?.appliedAt ??
    application?.appliedDate ??
    application?.createdAt ??
    application?.applicationDate ??
    null
  );
};

// =========================================================
// APPLICATIONS COMPONENT
// =========================================================

function Applications() {
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =======================================================
  // FETCH APPLICATIONS
  // =======================================================

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const seekerId = getSeekerId();

      console.log("=================================");
      console.log("FETCH APPLICATIONS");
      console.log("Seeker ID:", seekerId);
      console.log("=================================");

      if (seekerId === null || seekerId === undefined || seekerId === "") {
        setError(
          "Unable to identify your job seeker account. Please log in again.",
        );

        setApplications([]);

        return;
      }

      const response = await api.get(
        `/applications/seeker/${encodeURIComponent(seekerId)}`,
      );

      console.log("Applications API response:", response.data);

      const data = normalizeApplications(response.data);

      console.log("Normalized applications:", data);

      /*
       * Print every application and its job ID.
       * This makes debugging much easier.
       */
      data.forEach((application, index) => {
        console.log(`Application ${index + 1}:`, {
          application,
          applicationId: getApplicationId(application),
          jobId: getJobId(application),
          jobTitle: getJobTitle(application),
        });
      });

      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);

      console.error("HTTP status:", err.response?.status);

      console.error("Backend response:", err.response?.data);

      setApplications([]);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load your applications. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // LOAD APPLICATIONS
  // =======================================================

  useEffect(() => {
    fetchApplications();
  }, []);

  // =======================================================
  // LOADING SCREEN
  // =======================================================

  if (loading) {
    return (
      <div className="applications-page">
        <section className="applications-header">
          <div className="container">
            <span className="section-label">Career Tracking</span>

            <h1>My Applications</h1>

            <p>
              Track the jobs you have applied for and monitor your application
              status.
            </p>
          </div>
        </section>

        <section className="page-section">
          <div className="container">
            <div className="applications-state">
              <div className="spinner"></div>

              <p>Loading your applications...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <div className="applications-page">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="applications-header">
        <div className="container">
          <span className="section-label">Career Tracking</span>

          <h1>My Applications</h1>

          <p>
            Track the jobs you have applied for and monitor your application
            status.
          </p>
        </div>
      </section>

      {/* =================================================
          APPLICATION SECTION
      ================================================== */}

      <section className="page-section applications-section">
        <div className="container">
          {/* =================================================
              TOOLBAR
          ================================================== */}

          <div className="applications-toolbar">
            <div>
              <h2>Application History</h2>

              {!error && (
                <p>
                  {applications.length}{" "}
                  {applications.length === 1 ? "application" : "applications"}
                </p>
              )}
            </div>

            <button
              type="button"
              className="secondary-btn refresh-btn"
              onClick={fetchApplications}
              disabled={loading}
            >
              <RefreshCw size={17} />

              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="applications-state error-state">
              <FileText size={45} />

              <h3>Unable to load applications</h3>

              <p>{error}</p>

              <button
                type="button"
                className="primary-btn"
                onClick={fetchApplications}
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================== */}

          {!error && applications.length === 0 && (
            <div className="applications-empty card">
              <div className="empty-icon">
                <FileText size={30} />
              </div>

              <h2>No applications yet</h2>

              <p>
                You haven't applied for any jobs yet. Start exploring
                opportunities and submit your first application.
              </p>

              <Link to="/jobs" className="primary-btn">
                Browse Jobs
                <ArrowRight size={17} />
              </Link>
            </div>
          )}

          {/* =================================================
              APPLICATION LIST
          ================================================== */}

          {!error && applications.length > 0 && (
            <div className="applications-list">
              {applications.map((application, index) => {
                const applicationId = getApplicationId(application);

                const jobId = getJobId(application);

                const jobTitle = getJobTitle(application);

                const companyName = getCompanyName(application);

                const location = getLocation(application);

                const status = getStatus(application);

                const appliedDate = getAppliedDate(application);

                /*
                 * Create a safe React key even when
                 * backend doesn't return applicationId.
                 */
                const applicationKey =
                  applicationId ?? `${jobId ?? "job"}-${index}`;

                return (
                  <article
                    className="application-card card"
                    key={applicationKey}
                  >
                    <div className="application-card-main">
                      {/* =================================
                            ICON
                        ================================== */}

                      <div className="application-icon">
                        <Briefcase size={24} />
                      </div>

                      {/* =================================
                            INFORMATION
                        ================================== */}

                      <div className="application-info">
                        <div className="application-title-row">
                          <h3>{jobTitle}</h3>

                          <span
                            className={`application-badge ${getStatusClass(
                              status,
                            )}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </div>

                        <p className="application-company">{companyName}</p>

                        <div className="application-meta">
                          {/* LOCATION */}

                          <span>
                            <MapPin size={15} />

                            {location}
                          </span>

                          {/* APPLIED DATE */}

                          <span>
                            <CalendarDays size={15} />
                            Applied {formatDate(appliedDate)}
                          </span>

                          {/* APPLICATION ID */}

                          <span>
                            <FileText size={15} />
                            Application #{applicationId || "—"}
                          </span>
                        </div>
                      </div>

                      {/* =================================
                            VIEW JOB
                        ================================== */}

                      {jobId !== null && jobId !== undefined && jobId !== "" ? (
                        <Link
                          to={`/jobs/${encodeURIComponent(jobId)}`}
                          className="application-view"
                        >
                          <Eye size={17} />
                          View Job
                          <ArrowRight size={17} />
                        </Link>
                      ) : (
                        <span
                          className="application-view disabled"
                          title="Job ID was not returned by the backend"
                        >
                          Job unavailable
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Applications;
