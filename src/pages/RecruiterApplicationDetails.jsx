import "../styles/RecruiterApplicationDetails.css";

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  User,
  FileText,
  CalendarDays,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Video,
  MapPin,
  Phone,
  Bell,
} from "lucide-react";

import api from "../services/api";

function RecruiterApplicationDetails() {
  const { applicationId } = useParams();

  // =========================================================
  // STATE
  // =========================================================

  const [application, setApplication] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [interviews, setInterviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    interviewType: "ONLINE",
    meetingLink: "",
    location: "",
    notes: "",
  });

  // =========================================================
  // NORMALIZE APPLICATION STATUS
  // =========================================================

  const getApplicationStatus = () => {
    const rawStatus =
      application?.status ??
      application?.applicationStatus ??
      application?.currentStatus ??
      "APPLIED";

    return String(rawStatus).trim().toUpperCase();
  };

  // =========================================================
  // NORMALIZE INTERVIEW STATUS
  // =========================================================

  const normalizeInterviewStatus = (interview) => {
    return String(
      interview?.status ?? interview?.interviewStatus ?? "SCHEDULED",
    )
      .trim()
      .toUpperCase();
  };

  // =========================================================
  // FETCH APPLICATION
  // =========================================================

  const fetchApplication = async () => {
    if (!applicationId) {
      setError("Application ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setActionError("");

      const response = await api.get(`/applications/${applicationId}`);

      console.log("=================================");
      console.log("APPLICATION RESPONSE");
      console.log(response.data);
      console.log("=================================");

      setApplication(response.data);

      // -------------------------------------------------------
      // FETCH APPLICANT
      // -------------------------------------------------------

      try {
        const applicantResponse = await api.get(
          `/applications/${applicationId}/applicant`,
        );

        console.log("Applicant response:", applicantResponse.data);

        setApplicant(applicantResponse.data);
      } catch (applicantError) {
        console.warn(
          "Applicant details unavailable:",
          applicantError?.response?.data || applicantError,
        );

        setApplicant(null);
      }
    } catch (err) {
      console.error("Failed to load application:", err?.response?.data || err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load application details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH INTERVIEWS
  // =========================================================

  const fetchInterviews = async () => {
    if (!applicationId) {
      return;
    }

    try {
      setInterviewLoading(true);

      const response = await api.get(
        `/interviews/application/${applicationId}`,
      );

      console.log("=================================");
      console.log("INTERVIEW RESPONSE");
      console.log(response.data);
      console.log("=================================");

      let data = response.data;

      // Spring Page response
      if (data && typeof data === "object" && Array.isArray(data.content)) {
        data = data.content;
      }

      // Some APIs return { interviews: [...] }
      if (data && typeof data === "object" && Array.isArray(data.interviews)) {
        data = data.interviews;
      }

      if (!Array.isArray(data)) {
        data = [];
      }

      setInterviews(data);
    } catch (err) {
      console.error("Failed to load interviews:", err?.response?.data || err);

      setInterviews([]);
    } finally {
      setInterviewLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!applicationId) {
      setError("Application ID is missing.");
      setLoading(false);
      return;
    }

    fetchApplication();
    fetchInterviews();
  }, [applicationId]);

  // =========================================================
  // REFRESH EVERYTHING
  // =========================================================

  const refreshPage = async () => {
    setActionError("");
    setSuccessMessage("");

    await Promise.all([fetchApplication(), fetchInterviews()]);
  };

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const sendSeekerNotification = async (message) => {
    const seekerId =
      application?.seekerId ??
      application?.seeker?.id ??
      application?.seeker?.seekerId;

    if (!seekerId) {
      console.warn("Seeker ID unavailable. Notification was not sent.");

      return;
    }

    try {
      const notificationData = {
        seekerId: Number(seekerId),
        applicationId: Number(applicationId),
        message,
      };

      console.log("Sending seeker notification:", notificationData);

      await api.post("/notifications", notificationData);

      console.log("Notification sent successfully.");
    } catch (err) {
      // Notification failure must NOT break recruiter action.
      console.error("Notification failed:", err?.response?.data || err);
    }
  };

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const getInterviewDate = (interview) => {
    if (!interview || typeof interview !== "object") {
      return null;
    }

    return (
      interview.interviewDate ??
      interview.startTime ??
      interview.startDateTime ??
      interview.dateTime ??
      interview.scheduledAt ??
      null
    );
  };

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

  const formatDateTime = (date) => {
    if (!date) {
      return "Date and time not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const formatStatus = (status) => {
    return String(status || "APPLIED")
      .replaceAll("_", " ")
      .toUpperCase();
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "APPLIED")
      .trim()
      .toUpperCase();

    if (
      normalized === "SELECTED" ||
      normalized === "SHORTLISTED" ||
      normalized === "COMPLETED"
    ) {
      return "status-success";
    }

    if (normalized === "REJECTED" || normalized === "CANCELLED") {
      return "status-danger";
    }

    if (
      normalized === "INTERVIEW" ||
      normalized === "INTERVIEW_SCHEDULED" ||
      normalized === "SCHEDULED"
    ) {
      return "status-warning";
    }

    return "status-applied";
  };

  // =========================================================
  // APPLICANT NAME
  // =========================================================

  const getApplicantName = () => {
    if (!applicant) {
      return `Applicant #${application?.seekerId || "—"}`;
    }

    return (
      applicant.name ||
      applicant.fullName ||
      applicant.seekerName ||
      applicant.username ||
      applicant.userName ||
      `Applicant #${application?.seekerId || "—"}`
    );
  };

  // =========================================================
  // APPLICANT EMAIL
  // =========================================================

  const getApplicantEmail = () => {
    if (!applicant) {
      return null;
    }

    return (
      applicant.email || applicant.userEmail || applicant.seekerEmail || null
    );
  };

  // =========================================================
  // COMPLETED INTERVIEW
  // =========================================================

  const hasCompletedInterview = () => {
    return interviews.some((interview) => {
      return normalizeInterviewStatus(interview) === "COMPLETED";
    });
  };

  // =========================================================
  // ACTIVE INTERVIEW
  // =========================================================

  const hasActiveInterview = () => {
    return interviews.some((interview) => {
      const status = normalizeInterviewStatus(interview);

      return status === "SCHEDULED" || status === "INTERVIEW_SCHEDULED";
    });
  };

  // =========================================================
  // CAN SCHEDULE INTERVIEW
  // =========================================================

  const canScheduleInterview = () => {
    const status = getApplicationStatus();

    /*
     * IMPORTANT:
     *
     * Scheduling is allowed for a shortlisted candidate.
     *
     * We also allow INTERVIEW / INTERVIEW_SCHEDULED /
     * SCHEDULED because some backend implementations
     * automatically change the application status after
     * creating an interview.
     *
     * Scheduling is blocked only for terminal states.
     */

    if (status === "REJECTED" || status === "SELECTED") {
      return false;
    }

    return (
      status === "SHORTLISTED" ||
      status === "INTERVIEW" ||
      status === "INTERVIEW_SCHEDULED" ||
      status === "SCHEDULED"
    );
  };

  // =========================================================
  // STATUS TRANSITION VALIDATION
  // =========================================================

  const validateStatusTransition = (newStatus, currentStatus) => {
    if (newStatus === "SHORTLISTED" && currentStatus !== "APPLIED") {
      return {
        type: "BLOCK",
        message: "Only an applied candidate can be shortlisted.",
      };
    }

    if (newStatus === "SELECTED" && currentStatus !== "SHORTLISTED") {
      return {
        type: "BLOCK",
        message: "Candidate must be shortlisted before selection.",
      };
    }

    if (newStatus === "SELECTED" && !hasCompletedInterview()) {
      return {
        type: "BLOCK",
        message:
          "Candidate can be selected only after completing an interview.",
      };
    }

    if (
      newStatus === "REJECTED" &&
      (currentStatus === "REJECTED" || currentStatus === "SELECTED")
    ) {
      return {
        type: "SKIP",
      };
    }

    if (currentStatus === newStatus) {
      return {
        type: "SKIP",
      };
    }

    return {
      type: "CONTINUE",
    };
  };

  // =========================================================
  // STATUS NOTIFICATION
  // =========================================================

  const sendStatusNotification = async (newStatus) => {
    const notifications = {
      SHORTLISTED:
        "Congratulations! Your application has been shortlisted by the recruiter.",

      REJECTED:
        "Your application has been reviewed by the recruiter and was not selected for the next stage.",

      SELECTED: "Congratulations! You have been selected for this job.",
    };

    const message = notifications[newStatus];

    if (message) {
      await sendSeekerNotification(message);
    }
  };

  // =========================================================
  // UPDATE APPLICATION STATUS
  // =========================================================

  const updateStatus = async (newStatus) => {
    if (!application) {
      return;
    }

    const currentStatus = getApplicationStatus();

    setActionError("");
    setSuccessMessage("");

    const transitionResult = validateStatusTransition(newStatus, currentStatus);

    if (transitionResult.type === "BLOCK") {
      setActionError(transitionResult.message);
      return;
    }

    if (transitionResult.type === "SKIP") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to change this application status to ${formatStatus(
        newStatus,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdating(true);

      const response = await api.put(
        `/applications/${applicationId}/status`,
        null,
        {
          params: {
            status: newStatus,
          },
        },
      );

      console.log("Application status updated:", response.data);

      setApplication(response.data);

      await sendStatusNotification(newStatus);

      setSuccessMessage(
        `Application status updated to ${formatStatus(newStatus)}.`,
      );

      await fetchApplication();
      await fetchInterviews();
    } catch (err) {
      console.error(
        "Failed to update application status:",
        err?.response?.data || err,
      );

      setActionError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update application status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // INTERVIEW FORM CHANGE
  // =========================================================

  const handleInterviewChange = (event) => {
    const { name, value } = event.target;

    setInterviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setActionError("");
    setSuccessMessage("");
  };

  // =========================================================
  // VALIDATE URL
  // =========================================================

  const isValidMeetingLink = (link) => {
    if (!link?.trim()) {
      return false;
    }

    try {
      const url = new URL(link.trim());

      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        Boolean(url.hostname)
      );
    } catch {
      return false;
    }
  };

  // =========================================================
  // INTERVIEW VALIDATION
  // =========================================================

  const getInterviewValidationError = (currentStatus, form) => {
    if (currentStatus === "REJECTED" || currentStatus === "SELECTED") {
      return `Interview cannot be scheduled because the application is ${formatStatus(
        currentStatus,
      )}.`;
    }

    if (!canScheduleInterview()) {
      return "Please shortlist the candidate before scheduling an interview.";
    }

    if (!form.interviewDate) {
      return "Please select an interview date and time.";
    }

    const selectedDate = new Date(form.interviewDate);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      return "Interview date and time must be in the future.";
    }

    if (form.interviewType === "ONLINE") {
      const meetingLink = form.meetingLink.trim();

      if (!meetingLink) {
        return "Meeting link is required for an online interview.";
      }

      if (!isValidMeetingLink(meetingLink)) {
        return "Please enter a valid meeting link starting with http:// or https://.";
      }
    }

    if (form.interviewType === "OFFLINE") {
      const location = form.location.trim();

      if (!location) {
        return "Interview location is required for an offline interview.";
      }
    }

    // PHONE does not require link or location.

    return "";
  };

  // =========================================================
  // BUILD INTERVIEW DATA
  // =========================================================

  const buildInterviewData = (applicationIdValue, form) => {
    return {
      applicationId: Number(applicationIdValue),

      interviewDate: form.interviewDate,

      interviewType: form.interviewType,

      meetingLink:
        form.interviewType === "ONLINE" ? form.meetingLink.trim() : null,

      location: form.interviewType === "OFFLINE" ? form.location.trim() : null,

      notes: form.notes.trim() || null,

      status: "SCHEDULED",
    };
  };

  // =========================================================
  // INTERVIEW NOTIFICATION
  // =========================================================

  const buildInterviewNotificationMessage = (form) => {
    let typeText = "phone";

    if (form.interviewType === "ONLINE") {
      typeText = "online";
    }

    if (form.interviewType === "OFFLINE") {
      typeText = "offline";
    }

    let message = `An ${typeText} interview has been scheduled for your application on ${formatDateTime(
      form.interviewDate,
    )}.`;

    if (form.interviewType === "ONLINE") {
      message += ` Meeting link: ${form.meetingLink.trim()}`;
    }

    if (form.interviewType === "OFFLINE") {
      message += ` Location: ${form.location.trim()}`;
    }

    if (form.notes.trim()) {
      message += ` Notes: ${form.notes.trim()}`;
    }

    return message;
  };

  // =========================================================
  // OPEN INTERVIEW FORM
  // =========================================================

  const openInterviewForm = () => {
    setActionError("");
    setSuccessMessage("");

    if (!canScheduleInterview()) {
      setActionError(
        "Interview can be scheduled only for a shortlisted candidate.",
      );

      return;
    }

    setShowInterviewForm(true);
  };

  // =========================================================
  // CLOSE INTERVIEW FORM
  // =========================================================

  const closeInterviewForm = () => {
    if (interviewLoading) {
      return;
    }

    setShowInterviewForm(false);

    setActionError("");

    setInterviewForm({
      interviewDate: "",
      interviewType: "ONLINE",
      meetingLink: "",
      location: "",
      notes: "",
    });
  };

  // =========================================================
  // SCHEDULE INTERVIEW
  // =========================================================

  const scheduleInterview = async (event) => {
    event.preventDefault();

    setActionError("");
    setSuccessMessage("");

    const currentStatus = getApplicationStatus();

    const validationError = getInterviewValidationError(
      currentStatus,
      interviewForm,
    );

    if (validationError) {
      setActionError(validationError);
      return;
    }

    /*
     * Prevent accidental duplicate scheduling
     * when an active interview already exists.
     */

    if (hasActiveInterview()) {
      setActionError(
        "An active interview is already scheduled for this application.",
      );

      return;
    }

    const interviewData = buildInterviewData(applicationId, interviewForm);

    console.log("=================================");

    console.log("CREATING INTERVIEW");

    console.log(interviewData);

    console.log("=================================");

    try {
      setInterviewLoading(true);

      const response = await api.post("/interviews", interviewData);

      console.log("Interview created:", response.data);

      /*
       * Notification is intentionally AFTER
       * successful interview creation.
       *
       * Even if notification fails, interview
       * remains successfully scheduled.
       */

      await sendSeekerNotification(
        buildInterviewNotificationMessage(interviewForm),
      );

      setSuccessMessage(
        "Interview scheduled successfully. The job seeker has been notified.",
      );

      setInterviewForm({
        interviewDate: "",
        interviewType: "ONLINE",
        meetingLink: "",
        location: "",
        notes: "",
      });

      setShowInterviewForm(false);

      /*
       * Reload both application and interviews.
       *
       * This handles backends that automatically
       * change application status after scheduling.
       */

      await fetchApplication();
      await fetchInterviews();
    } catch (err) {
      console.error(
        "Failed to schedule interview:",
        err?.response?.data || err,
      );

      setActionError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to schedule interview.",
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  // =========================================================
  // UPDATE INTERVIEW STATUS
  // =========================================================

  const updateInterviewStatus = async (interviewId, status) => {
    if (!interviewId) {
      setActionError("Interview ID is missing. Unable to update interview.");

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark this interview as ${formatStatus(
        status,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setInterviewLoading(true);
      setActionError("");
      setSuccessMessage("");

      console.log("Updating interview:", interviewId, status);

      const response = await api.put(
        `/interviews/${interviewId}/status`,
        null,
        {
          params: {
            status,
          },
        },
      );

      console.log("Interview status response:", response.data);

      if (status === "COMPLETED") {
        await sendSeekerNotification(
          "Your interview has been marked as completed by the recruiter.",
        );
      }

      if (status === "CANCELLED") {
        await sendSeekerNotification(
          "Your scheduled interview has been cancelled by the recruiter.",
        );
      }

      setSuccessMessage(`Interview marked as ${formatStatus(status)}.`);

      await fetchApplication();
      await fetchInterviews();
    } catch (err) {
      console.error("Failed to update interview:", err?.response?.data || err);

      setActionError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update interview status.",
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="recruiter-application-details-page">
        <section className="page-section">
          <div className="container">
            <div className="applications-state">
              <div className="spinner"></div>

              <p>Loading applicant details...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error && !application) {
    return (
      <div className="recruiter-application-details-page">
        <section className="page-section">
          <div className="container">
            <div className="applications-state error-state">
              <FileText size={45} />

              <h3>Unable to load applicant</h3>

              <p>{error}</p>

              <button
                type="button"
                className="primary-btn"
                onClick={fetchApplication}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // VALUES
  // =========================================================

  const currentStatus = getApplicationStatus();

  const completedInterview = hasCompletedInterview();

  const activeInterview = hasActiveInterview();

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="recruiter-application-details-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="applications-header">
        <div className="container">
          <Link
            to={
              application?.jobId
                ? `/recruiter/jobs/${application.jobId}/applicants`
                : "/recruiter/jobs"
            }
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to Applicants
          </Link>

          <span className="section-label">Recruiter Portal</span>

          <h1>Applicant Details</h1>

          <p>Review the candidate's application, resume and interview.</p>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="page-section">
        <div className="container">
          <div className="application-details-card card">
            {/* =================================================
                APPLICANT HEADER
            ================================================== */}

            <div className="application-details-header">
              <div className="application-icon">
                <User size={30} />
              </div>

              <div className="application-details-title">
                <h2>{getApplicantName()}</h2>

                <p>
                  Application #
                  {application?.applicationId ||
                    application?.id ||
                    applicationId}
                </p>

                {getApplicantEmail() && <p>{getApplicantEmail()}</p>}
              </div>

              <span
                className={`application-badge ${getStatusClass(currentStatus)}`}
              >
                {formatStatus(currentStatus)}
              </span>
            </div>

            {/* =================================================
                SUCCESS MESSAGE
            ================================================== */}

            {successMessage && (
              <div className="auth-success">
                <CheckCircle size={18} />

                {successMessage}
              </div>
            )}

            {/* =================================================
                ERROR MESSAGE
            ================================================== */}

            {actionError && (
              <div className="auth-error">
                <XCircle size={18} />

                {actionError}
              </div>
            )}

            {/* =================================================
                APPLICANT INFORMATION
            ================================================== */}

            <div className="details-section">
              <div className="details-section-title">
                <User size={20} />

                <h3>Applicant Information</h3>
              </div>

              <div className="application-details-grid">
                <div className="detail-item">
                  <span>Applicant</span>

                  <strong>{getApplicantName()}</strong>
                </div>

                <div className="detail-item">
                  <span>Seeker ID</span>

                  <strong>{application?.seekerId || "—"}</strong>
                </div>

                <div className="detail-item">
                  <span>Email</span>

                  <strong>{getApplicantEmail() || "—"}</strong>
                </div>

                <div className="detail-item">
                  <span>Resume ID</span>

                  <strong>{application?.resumeId || "—"}</strong>
                </div>
              </div>
            </div>

            {/* =================================================
                APPLICATION INFORMATION
            ================================================== */}

            <div className="details-section">
              <div className="details-section-title">
                <FileText size={20} />

                <h3>Application Information</h3>
              </div>

              <div className="application-details-grid">
                <div className="detail-item">
                  <span>Application ID</span>

                  <strong>
                    {application?.applicationId ||
                      application?.id ||
                      applicationId}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Job ID</span>

                  <strong>{application?.jobId || "—"}</strong>
                </div>

                <div className="detail-item">
                  <span>Status</span>

                  <strong
                    className={`status-text ${getStatusClass(currentStatus)}`}
                  >
                    {formatStatus(currentStatus)}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Applied Date</span>

                  <strong>
                    <CalendarDays size={15} />

                    {formatDate(
                      application?.appliedAt || application?.appliedDate,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* =================================================
                RESUME
            ================================================== */}

            <div className="details-section">
              <div className="details-section-title">
                <FileText size={20} />

                <h3>Resume</h3>
              </div>

              <div className="resume-box">
                <div>
                  <strong>Resume #{application?.resumeId || "—"}</strong>

                  <p>Resume submitted with this application.</p>
                </div>

                {application?.resumeId && (
                  <a
                    href={`${api.defaults.baseURL}/resumes/${application.resumeId}/download`}
                    className="secondary-btn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText size={17} />
                    View Resume
                  </a>
                )}
              </div>
            </div>

            {/* =================================================
                INTERVIEW SECTION
            ================================================== */}

            <div className="details-section">
              <div className="details-section-title">
                <CalendarDays size={20} />

                <h3>Interview</h3>
              </div>

              {/* =================================================
                  CURRENT INTERVIEW INFO
              ================================================== */}

              {activeInterview && !showInterviewForm && (
                <div
                  className="auth-success"
                  style={{
                    marginBottom: "15px",
                  }}
                >
                  <CheckCircle size={17} />
                  An interview is already scheduled for this application.
                </div>
              )}

              {/* =================================================
                  SCHEDULE BUTTON
              ================================================== */}

              {!showInterviewForm && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={openInterviewForm}
                  disabled={
                    interviewLoading ||
                    !canScheduleInterview() ||
                    activeInterview
                  }
                  title={
                    activeInterview
                      ? "An interview is already scheduled"
                      : currentStatus === "REJECTED"
                        ? "Rejected applications cannot have interviews"
                        : currentStatus === "SELECTED"
                          ? "Selected applications cannot have interviews"
                          : "Schedule interview"
                  }
                >
                  <CalendarDays size={17} />

                  {activeInterview
                    ? "Interview Already Scheduled"
                    : "Schedule Interview"}
                </button>
              )}

              {/* =================================================
                  INTERVIEW FORM
              ================================================== */}

              {showInterviewForm && (
                <form className="interview-form" onSubmit={scheduleInterview}>
                  <div className="form-grid">
                    {/* DATE */}

                    <div className="form-group">
                      <label htmlFor="interviewDate">
                        Interview Date & Time
                      </label>

                      <input
                        id="interviewDate"
                        type="datetime-local"
                        name="interviewDate"
                        value={interviewForm.interviewDate}
                        onChange={handleInterviewChange}
                        min={(() => {
                          const now = new Date();

                          now.setMinutes(
                            now.getMinutes() - now.getTimezoneOffset(),
                          );

                          return now.toISOString().slice(0, 16);
                        })()}
                        required
                      />
                    </div>

                    {/* TYPE */}

                    <div className="form-group">
                      <label htmlFor="interviewType">Interview Type</label>

                      <select
                        id="interviewType"
                        name="interviewType"
                        value={interviewForm.interviewType}
                        onChange={handleInterviewChange}
                      >
                        <option value="ONLINE">Online</option>

                        <option value="OFFLINE">Offline</option>

                        <option value="PHONE">Phone</option>
                      </select>
                    </div>

                    {/* ONLINE */}

                    {interviewForm.interviewType === "ONLINE" && (
                      <div className="form-group">
                        <label htmlFor="meetingLink">Meeting Link</label>

                        <input
                          id="meetingLink"
                          type="url"
                          name="meetingLink"
                          placeholder="https://meet.google.com/..."
                          value={interviewForm.meetingLink}
                          onChange={handleInterviewChange}
                          required
                        />

                        <small>
                          Enter a valid meeting URL starting with http:// or
                          https://
                        </small>
                      </div>
                    )}

                    {/* OFFLINE */}

                    {interviewForm.interviewType === "OFFLINE" && (
                      <div className="form-group">
                        <label htmlFor="location">Interview Location</label>

                        <input
                          id="location"
                          type="text"
                          name="location"
                          placeholder="Office / Interview location"
                          value={interviewForm.location}
                          onChange={handleInterviewChange}
                          required
                        />
                      </div>
                    )}

                    {/* PHONE */}

                    {interviewForm.interviewType === "PHONE" && (
                      <div className="form-group">
                        <span className="form-label">Phone Interview</span>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Phone size={18} />

                          <span>
                            The recruiter will contact the candidate at the
                            scheduled time.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* NOTES */}

                    <div className="form-group full-width">
                      <label htmlFor="notes">Notes</label>

                      <textarea
                        id="notes"
                        name="notes"
                        rows="4"
                        placeholder="Interview instructions or notes..."
                        value={interviewForm.notes}
                        onChange={handleInterviewChange}
                      />
                    </div>
                  </div>

                  {/* FORM ACTIONS */}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={interviewLoading}
                    >
                      <CheckCircle size={17} />

                      {interviewLoading
                        ? "Scheduling..."
                        : "Schedule Interview"}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={closeInterviewForm}
                      disabled={interviewLoading}
                    >
                      <XCircle size={17} />
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* =================================================
                  INTERVIEW LOADING
              ================================================== */}

              {interviewLoading && interviews.length === 0 && (
                <p className="status-updating">Loading interviews...</p>
              )}

              {/* =================================================
                  NO INTERVIEW
              ================================================== */}

              {!interviewLoading &&
                interviews.length === 0 &&
                !showInterviewForm && (
                  <div className="interview-empty">
                    <CalendarDays size={28} />

                    <p>No interview scheduled for this application.</p>
                  </div>
                )}

              {/* =================================================
                  INTERVIEW LIST
              ================================================== */}

              {interviews.length > 0 && (
                <div className="interview-list">
                  {interviews.map((interview, index) => {
                    if (!interview || typeof interview !== "object") {
                      return null;
                    }

                    const interviewStatus = normalizeInterviewStatus(interview);

                    const interviewDate = getInterviewDate(interview);

                    const interviewId =
                      interview.interviewId ??
                      interview.id ??
                      interview._id ??
                      `interview-${index}`;

                    return (
                      <div className="interview-card" key={interviewId}>
                        {/* HEADER */}

                        <div className="interview-card-header">
                          <div>
                            <h4>
                              {formatStatus(
                                interview.interviewType || "INTERVIEW",
                              )}{" "}
                              Interview
                            </h4>

                            <span
                              className={`application-badge ${getStatusClass(
                                interviewStatus,
                              )}`}
                            >
                              {formatStatus(interviewStatus)}
                            </span>
                          </div>
                        </div>

                        {/* DETAILS */}

                        <div className="interview-details">
                          <span>
                            <CalendarDays size={16} />

                            {formatDateTime(interviewDate)}
                          </span>

                          {interview.meetingLink && (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Video size={16} />
                              Join Meeting
                            </a>
                          )}

                          {interview.location && (
                            <span>
                              <MapPin size={16} />

                              {interview.location}
                            </span>
                          )}

                          {String(
                            interview.interviewType || "",
                          ).toUpperCase() === "PHONE" && (
                            <span>
                              <Phone size={16} />
                              Phone Interview
                            </span>
                          )}
                        </div>

                        {/* NOTES */}

                        {interview.notes && (
                          <p className="interview-notes">{interview.notes}</p>
                        )}

                        {/* ACTIONS */}

                        {interviewStatus === "SCHEDULED" && (
                          <div className="interview-actions">
                            <button
                              type="button"
                              className="primary-btn"
                              onClick={() =>
                                updateInterviewStatus(interviewId, "COMPLETED")
                              }
                              disabled={interviewLoading}
                            >
                              <CheckCircle size={17} />
                              Mark Completed
                            </button>

                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() =>
                                updateInterviewStatus(interviewId, "CANCELLED")
                              }
                              disabled={interviewLoading}
                            >
                              <XCircle size={17} />
                              Cancel Interview
                            </button>
                          </div>
                        )}

                        {/* COMPLETED */}

                        {interviewStatus === "COMPLETED" && (
                          <div
                            className="auth-success"
                            style={{
                              marginTop: "12px",
                            }}
                          >
                            <CheckCircle size={17} />
                            Interview completed.
                          </div>
                        )}

                        {/* CANCELLED */}

                        {interviewStatus === "CANCELLED" && (
                          <div
                            className="auth-error"
                            style={{
                              marginTop: "12px",
                            }}
                          >
                            <XCircle size={17} />
                            Interview cancelled.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =================================================
                APPLICATION STATUS
            ================================================== */}

            <div className="details-section">
              <div className="details-section-title">
                <Clock size={20} />

                <h3>Application Status</h3>
              </div>

              <div className="status-actions">
                {/* SHORTLIST */}

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => updateStatus("SHORTLISTED")}
                  disabled={updating || currentStatus !== "APPLIED"}
                >
                  <CheckCircle size={17} />
                  Shortlist
                </button>

                {/* REJECT */}

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => updateStatus("REJECTED")}
                  disabled={
                    updating || ["REJECTED", "SELECTED"].includes(currentStatus)
                  }
                >
                  <XCircle size={17} />
                  Reject
                </button>

                {/* SELECT */}

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => updateStatus("SELECTED")}
                  disabled={
                    updating ||
                    currentStatus !== "SHORTLISTED" ||
                    !completedInterview
                  }
                  title={
                    completedInterview
                      ? "Select candidate"
                      : "Complete an interview before selecting the candidate"
                  }
                >
                  <CheckCircle size={17} />
                  Select Candidate
                </button>
              </div>

              {/* STATUS HELP */}

              <p
                className="status-help"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Bell size={15} />
                APPLIED → SHORTLISTED → INTERVIEW → COMPLETED → SELECTED
              </p>

              {/* CURRENT STATE HELP */}

              {currentStatus === "SHORTLISTED" && !activeInterview && (
                <p
                  className="status-help"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CalendarDays size={15} />
                  Candidate is shortlisted. You can schedule an interview.
                </p>
              )}

              {currentStatus === "SHORTLISTED" &&
                !completedInterview &&
                activeInterview && (
                  <p
                    className="status-help"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Clock size={15} />
                    Complete the scheduled interview before selecting the
                    candidate.
                  </p>
                )}

              {completedInterview && currentStatus === "SHORTLISTED" && (
                <p
                  className="status-help"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle size={15} />
                  Interview completed. The candidate can now be selected.
                </p>
              )}

              {updating && (
                <p className="status-updating">
                  Updating application status...
                </p>
              )}
            </div>

            {/* =================================================
                FOOTER
            ================================================== */}

            <div className="application-details-actions">
              <Link
                to={
                  application?.jobId
                    ? `/recruiter/jobs/${application.jobId}/applicants`
                    : "/recruiter/jobs"
                }
                className="secondary-btn"
              >
                <ArrowLeft size={17} />
                Back to Applicants
              </Link>

              <button
                type="button"
                className="secondary-btn"
                onClick={refreshPage}
                disabled={loading || updating || interviewLoading}
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RecruiterApplicationDetails;
