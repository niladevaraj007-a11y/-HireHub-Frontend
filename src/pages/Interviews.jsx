import "../styles/Interviews.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Briefcase,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

import api from "../services/api";

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // GET LOGGED-IN SEEKER ID
  // =========================================================

  const getSeekerId = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser);

      return (
        user.seekerId ?? user.jobSeekerId ?? user.id ?? user.userId ?? null
      );
    } catch (err) {
      console.error("Invalid user data:", err);
      return null;
    }
  };

  // =========================================================
  // FETCH INTERVIEWS
  // =========================================================

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError("");

      const seekerId = getSeekerId();

      if (!seekerId) {
        setError("Unable to identify your account.");
        return;
      }

      const response = await api.get(`/interviews/seeker/${seekerId}`);

      let data = response.data;

      // Spring Boot Page response
      if (data && typeof data === "object" && Array.isArray(data.content)) {
        data = data.content;
      }

      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch interviews:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load your interviews. Please try again.",
      );

      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    fetchInterviews();
  }, []);

  // =========================================================
  // DATE
  // =========================================================

  const getInterviewDate = (interview) => {
    return (
      interview?.interviewDate ||
      interview?.scheduledAt ||
      interview?.startTime ||
      interview?.startDateTime ||
      interview?.dateTime ||
      interview?.date ||
      null
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return {
        date: "Date not available",
        time: "Time not available",
      };
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return {
        date: String(date),
        time: "",
      };
    }

    return {
      date: parsedDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      time: parsedDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // =========================================================
  // TYPE
  // =========================================================

  const getInterviewType = (interview) => {
    return interview?.interviewType || interview?.type || "ONLINE";
  };

  // =========================================================
  // STATUS
  // =========================================================

  const getInterviewStatus = (interview) => {
    return String(
      interview?.status || interview?.interviewStatus || "SCHEDULED",
    ).toUpperCase();
  };

  const formatStatus = (status) => {
    return String(status || "SCHEDULED")
      .replaceAll("_", " ")
      .toUpperCase();
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "SCHEDULED").toUpperCase();

    if (normalized === "COMPLETED") {
      return "interview-status-success";
    }

    if (normalized === "CANCELLED" || normalized === "REJECTED") {
      return "interview-status-danger";
    }

    return "interview-status-scheduled";
  };

  const getStatusIcon = (status) => {
    const normalized = String(status || "SCHEDULED").toUpperCase();

    if (normalized === "COMPLETED") {
      return <CheckCircle size={16} />;
    }

    if (normalized === "CANCELLED" || normalized === "REJECTED") {
      return <XCircle size={16} />;
    }

    return <Clock size={16} />;
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalInterviews = interviews.length;

  const completedInterviews = interviews.filter(
    (interview) => getInterviewStatus(interview) === "COMPLETED",
  ).length;

  const cancelledInterviews = interviews.filter(
    (interview) => getInterviewStatus(interview) === "CANCELLED",
  ).length;

  const scheduledInterviews = interviews.filter(
    (interview) => getInterviewStatus(interview) === "SCHEDULED",
  ).length;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="interviews-page">
      {/* HEADER */}

      <section className="interviews-header">
        <div className="container">
          <span className="section-label">Career Opportunities</span>

          <h1>My Interviews</h1>

          <p>
            View your interviews and keep track of your upcoming opportunities.
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <section className="page-section interviews-section">
        <div className="container">
          {/* TOOLBAR */}

          <div className="interviews-toolbar">
            <div>
              <h2>Interview Schedule</h2>

              {!loading && !error && (
                <p>
                  {totalInterviews}{" "}
                  {totalInterviews === 1 ? "interview" : "interviews"} total
                </p>
              )}
            </div>

            <button
              type="button"
              className="secondary-btn refresh-btn"
              onClick={fetchInterviews}
              disabled={loading}
            >
              <RefreshCw size={17} />

              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* STATISTICS */}

          {!loading && !error && interviews.length > 0 && (
            <div className="interview-summary">
              <div className="interview-summary-card">
                <CalendarDays size={20} />

                <div>
                  <span>Total</span>
                  <strong>{totalInterviews}</strong>
                </div>
              </div>

              <div className="interview-summary-card">
                <Clock size={20} />

                <div>
                  <span>Upcoming</span>
                  <strong>{scheduledInterviews}</strong>
                </div>
              </div>

              <div className="interview-summary-card">
                <CheckCircle size={20} />

                <div>
                  <span>Completed</span>
                  <strong>{completedInterviews}</strong>
                </div>
              </div>

              <div className="interview-summary-card">
                <XCircle size={20} />

                <div>
                  <span>Cancelled</span>
                  <strong>{cancelledInterviews}</strong>
                </div>
              </div>
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="interviews-state">
              <div className="spinner"></div>

              <p>Loading your interviews...</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="interviews-state error-state">
              <CalendarDays size={45} />

              <h3>Unable to load interviews</h3>

              <p>{error}</p>

              <button
                type="button"
                className="primary-btn"
                onClick={fetchInterviews}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && interviews.length === 0 && (
            <div className="interviews-empty card">
              <div className="interview-empty-icon">
                <CalendarDays size={30} />
              </div>

              <h2>No interviews scheduled</h2>

              <p>
                You don't have any interviews yet. Keep applying to suitable
                jobs and check back here for updates.
              </p>

              <Link to="/jobs" className="primary-btn">
                Browse Jobs
                <ArrowRight size={17} />
              </Link>
            </div>
          )}

          {/* INTERVIEW LIST */}

          {!loading && !error && interviews.length > 0 && (
            <div className="interviews-list">
              {interviews.map((interview, index) => {
                const dateValue = getInterviewDate(interview);

                const dateTime = formatDateTime(dateValue);

                const type = getInterviewType(interview);

                const status = getInterviewStatus(interview);

                const application = interview?.application || {};

                const job = application?.job || interview?.job || {};

                const jobId =
                  job?.id ||
                  job?.jobId ||
                  application?.jobId ||
                  interview?.jobId ||
                  null;

                const jobTitle =
                  job?.title ||
                  interview?.jobTitle ||
                  application?.jobTitle ||
                  "Job Interview";

                const companyName =
                  job?.company?.name ||
                  job?.companyName ||
                  interview?.companyName ||
                  application?.companyName ||
                  "Company";

                const isOnline = String(type).toUpperCase() === "ONLINE";

                const isScheduled = status === "SCHEDULED";

                const isCompleted = status === "COMPLETED";

                const isCancelled = status === "CANCELLED";

                const interviewId =
                  interview?.interviewId ||
                  interview?.id ||
                  `interview-${index}`;

                return (
                  <article className="interview-card card" key={interviewId}>
                    {/* DATE */}

                    <div className="interview-date-box">
                      <CalendarDays size={22} />

                      <strong>{dateTime.date}</strong>

                      <span>{dateTime.time}</span>
                    </div>

                    {/* DETAILS */}

                    <div className="interview-details">
                      <div className="interview-title-row">
                        <div>
                          <h3>{jobTitle}</h3>

                          <p>{companyName}</p>
                        </div>

                        <span
                          className={`interview-status ${getStatusClass(
                            status,
                          )}`}
                        >
                          {getStatusIcon(status)}
                          {formatStatus(status)}
                        </span>
                      </div>

                      {/* META */}

                      <div className="interview-meta">
                        <span>
                          {isOnline ? (
                            <Video size={16} />
                          ) : (
                            <MapPin size={16} />
                          )}

                          {isOnline
                            ? "Online Interview"
                            : interview?.location || "Office Interview"}
                        </span>

                        <span>
                          <Clock size={16} />
                          {dateTime.time}
                        </span>

                        <span>
                          <Briefcase size={16} />
                          {formatStatus(type)}
                        </span>
                      </div>

                      {/* JOIN */}

                      {isScheduled && isOnline && interview?.meetingLink && (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="interview-link"
                        >
                          <Video size={16} />
                          Join Interview
                          <ArrowRight size={16} />
                        </a>
                      )}

                      {/* COMPLETED */}

                      {isCompleted && (
                        <div className="interview-completed-message">
                          <CheckCircle size={17} />
                          Interview completed
                        </div>
                      )}

                      {/* CANCELLED */}

                      {isCancelled && (
                        <div className="interview-cancelled-message">
                          <XCircle size={17} />
                          Interview cancelled
                        </div>
                      )}

                      {/* OFFLINE LOCATION */}

                      {!isOnline && interview?.location && (
                        <div className="interview-location">
                          <MapPin size={16} />
                          {interview.location}
                        </div>
                      )}

                      {/* JOB */}

                      {jobId && (
                        <Link
                          to={`/jobs/${jobId}`}
                          className="interview-job-link"
                        >
                          View Job
                          <ArrowRight size={15} />
                        </Link>
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

export default Interviews;
