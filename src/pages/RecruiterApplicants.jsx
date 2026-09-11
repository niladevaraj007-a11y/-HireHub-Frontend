import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  UserCheck,
  UserX,
  CalendarDays,
  Video,
} from "lucide-react";

import api from "../services/api";
import "./RecruiterApplicants.css";

function RecruiterApplicants() {
  const { jobId } = useParams();

  // =========================================================
  // APPLICANTS
  // =========================================================

  const [applicants, setApplicants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // INTERVIEWS
  // =========================================================

  /*
   * Stores interviews by application ID.
   *
   * Example:
   *
   * {
   *   23: [
   *      {
   *        interviewId: 5,
   *        applicationId: 23,
   *        interviewDate: "...",
   *        interviewType: "ONLINE",
   *        status: "SCHEDULED"
   *      }
   *   ]
   * }
   */

  const [interviewsByApplication, setInterviewsByApplication] = useState({});

  const [interviewLoading, setInterviewLoading] = useState(false);

  // =========================================================
  // SCHEDULE INTERVIEW MODAL
  // =========================================================

  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    interviewType: "ONLINE",
    meetingLink: "",
    location: "",
    notes: "",
  });

  // =========================================================
  // ACTION STATE
  // =========================================================

  const [actionLoading, setActionLoading] = useState(false);

  const [actionError, setActionError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // FETCH APPLICANTS
  // =========================================================

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading applicants for Job ID:", jobId);

      const response = await api.get(`/applications/job/${jobId}`);

      console.log("Applicants response:", response.data);

      const data = Array.isArray(response.data) ? response.data : [];

      setApplicants(data);

      /*
       * After applicants are loaded, fetch interviews
       * for shortlisted / selected candidates.
       */
      await fetchAllInterviews(data);
    } catch (err) {
      console.error("Failed to load applicants:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load applicants.",
      );

      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH INTERVIEWS FOR ALL RELEVANT APPLICATIONS
  // =========================================================

  const fetchAllInterviews = async (applicantList) => {
    if (!Array.isArray(applicantList) || applicantList.length === 0) {
      setInterviewsByApplication({});
      return;
    }

    const relevantApplicants = applicantList.filter((applicant) => {
      const status = String(applicant.status || "APPLIED").toUpperCase();

      return (
        status === "SHORTLISTED" ||
        status === "SELECTED" ||
        status === "REJECTED"
      );
    });

    if (relevantApplicants.length === 0) {
      setInterviewsByApplication({});
      return;
    }

    setInterviewLoading(true);

    try {
      const results = await Promise.all(
        relevantApplicants.map(async (applicant) => {
          const applicationId = applicant.applicationId;

          if (!applicationId) {
            return {
              applicationId: null,
              interviews: [],
            };
          }

          try {
            const response = await api.get(
              `/interviews/application/${applicationId}`,
            );

            let data = response.data;

            /*
             * Supports both:
             *
             * [
             *   {...}
             * ]
             *
             * and Spring Page:
             *
             * {
             *   content: [...]
             * }
             */

            if (
              data &&
              typeof data === "object" &&
              Array.isArray(data.content)
            ) {
              data = data.content;
            }

            if (!Array.isArray(data)) {
              data = [];
            }

            return {
              applicationId,
              interviews: data,
            };
          } catch (err) {
            console.warn(
              `Unable to load interviews for application ${applicationId}:`,
              err,
            );

            return {
              applicationId,
              interviews: [],
            };
          }
        }),
      );

      const interviewMap = {};

      results.forEach((result) => {
        if (result.applicationId) {
          interviewMap[result.applicationId] = result.interviews;
        }
      });

      setInterviewsByApplication(interviewMap);
    } finally {
      setInterviewLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!jobId) {
      setError("Job ID is missing.");
      setLoading(false);
      return;
    }

    fetchApplicants();
  }, [jobId]);

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const sendSeekerNotification = async (applicant, message) => {
    if (!applicant?.seekerId) {
      console.warn("Seeker ID unavailable. Notification was not sent.");
      return;
    }

    try {
      const notificationData = {
        seekerId: Number(applicant.seekerId),
        applicationId: Number(applicant.applicationId),
        message,
      };

      console.log("Sending seeker notification:", notificationData);

      await api.post("/notifications", notificationData);

      console.log("Notification sent successfully.");
    } catch (err) {
      /*
       * Notification failure should NOT
       * fail the recruiter action.
       */
      console.error("Notification failed:", err.response?.data || err);
    }
  };

  // =========================================================
  // GET APPLICATION STATUS
  // =========================================================

  const getStatus = (applicant) => {
    return String(applicant?.status || "APPLIED").toUpperCase();
  };

  // =========================================================
  // GET INTERVIEWS
  // =========================================================

  const getInterviews = (applicationId) => {
    if (!applicationId) {
      return [];
    }

    return interviewsByApplication[applicationId] || [];
  };

  // =========================================================
  // CHECK COMPLETED INTERVIEW
  // =========================================================

  const hasCompletedInterview = (applicationId) => {
    const interviews = getInterviews(applicationId);

    return interviews.some(
      (interview) =>
        String(interview?.status || "").toUpperCase() === "COMPLETED",
    );
  };

  // =========================================================
  // CHECK SCHEDULED INTERVIEW
  // =========================================================

  const hasScheduledInterview = (applicationId) => {
    const interviews = getInterviews(applicationId);

    return interviews.some(
      (interview) =>
        String(interview?.status || "").toUpperCase() === "SCHEDULED",
    );
  };

  // =========================================================
  // GET LATEST ACTIVE INTERVIEW
  // =========================================================

  const getLatestInterview = (applicationId) => {
    const interviews = getInterviews(applicationId);

    if (interviews.length === 0) {
      return null;
    }

    /*
     * Prefer SCHEDULED interview.
     */
    const scheduled = interviews.find(
      (interview) =>
        String(interview?.status || "").toUpperCase() === "SCHEDULED",
    );

    if (scheduled) {
      return scheduled;
    }

    /*
     * Otherwise return latest interview.
     */
    return interviews[interviews.length - 1];
  };

  // =========================================================
  // UPDATE APPLICATION STATUS
  // =========================================================

  const updateStatus = async (applicant, newStatus) => {
    if (!applicant?.applicationId) {
      alert("Application ID is missing.");
      return;
    }

    const applicationId = applicant.applicationId;

    const currentStatus = getStatus(applicant);

    // =======================================================
    // VALIDATION
    // =======================================================

    if (newStatus === "SHORTLISTED" && currentStatus !== "APPLIED") {
      alert("Only an applied candidate can be shortlisted.");
      return;
    }

    if (newStatus === "SELECTED" && currentStatus !== "SHORTLISTED") {
      alert("Candidate must be shortlisted before selection.");
      return;
    }

    /*
     * IMPORTANT:
     *
     * Candidate can ONLY be selected after
     * at least one interview is COMPLETED.
     */
    if (newStatus === "SELECTED" && !hasCompletedInterview(applicationId)) {
      alert(
        "Candidate cannot be selected because no interview has been scheduled or completed for this application.",
      );
      return;
    }

    if (
      newStatus === "REJECTED" &&
      ["REJECTED", "SELECTED"].includes(currentStatus)
    ) {
      return;
    }

    if (currentStatus === newStatus) {
      return;
    }

    // =======================================================
    // CONFIRM
    // =======================================================

    const confirmed = window.confirm(
      `Are you sure you want to change this application to ${newStatus.replaceAll(
        "_",
        " ",
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    // =======================================================
    // API
    // =======================================================

    try {
      setActionLoading(true);
      setActionError("");
      setSuccessMessage("");

      console.log("Updating application:", applicationId, "to:", newStatus);

      const response = await api.put(
        `/applications/${applicationId}/status`,
        null,
        {
          params: {
            status: newStatus,
          },
        },
      );

      console.log("Updated application:", response.data);

      // =====================================================
      // UPDATE LOCAL STATE
      // =====================================================

      setApplicants((previous) =>
        previous.map((item) =>
          item.applicationId === applicationId
            ? {
                ...item,
                status: response.data?.status || newStatus,
              }
            : item,
        ),
      );

      // =====================================================
      // NOTIFICATION
      // =====================================================

      if (newStatus === "SHORTLISTED") {
        await sendSeekerNotification(
          applicant,
          "Congratulations! Your application has been shortlisted by the recruiter.",
        );
      }

      if (newStatus === "REJECTED") {
        await sendSeekerNotification(
          applicant,
          "Your application has been reviewed by the recruiter and was not selected for the next stage.",
        );
      }

      if (newStatus === "SELECTED") {
        await sendSeekerNotification(
          applicant,
          "Congratulations! You have been selected for this job.",
        );
      }

      setSuccessMessage(
        `Application ${newStatus
          .replaceAll("_", " ")
          .toLowerCase()} successfully.`,
      );
    } catch (err) {
      console.error("Status update failed:", err);

      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update application status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // OPEN INTERVIEW FORM
  // =========================================================

  const openInterviewForm = (applicant) => {
    if (!applicant?.applicationId) {
      setActionError("Application ID is missing.");
      return;
    }

    const status = getStatus(applicant);

    if (status !== "SHORTLISTED") {
      setActionError(
        "Please shortlist the candidate before scheduling an interview.",
      );
      return;
    }

    if (hasScheduledInterview(applicant.applicationId)) {
      setActionError("This candidate already has a scheduled interview.");
      return;
    }

    setSelectedApplicant(applicant);

    setInterviewForm({
      interviewDate: "",
      interviewType: "ONLINE",
      meetingLink: "",
      location: "",
      notes: "",
    });

    setActionError("");
    setSuccessMessage("");

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
    setSelectedApplicant(null);

    setInterviewForm({
      interviewDate: "",
      interviewType: "ONLINE",
      meetingLink: "",
      location: "",
      notes: "",
    });

    setActionError("");
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
  };

  // =========================================================
  // VALIDATE MEETING LINK
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
  // VALIDATE INTERVIEW FORM
  // =========================================================

  const validateInterviewForm = () => {
    if (!selectedApplicant) {
      return "Candidate information is missing.";
    }

    if (getStatus(selectedApplicant) !== "SHORTLISTED") {
      return "Please shortlist the candidate before scheduling an interview.";
    }

    if (!interviewForm.interviewDate) {
      return "Please select an interview date and time.";
    }

    const selectedDate = new Date(interviewForm.interviewDate);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      return "Interview date and time must be in the future.";
    }

    // =======================================================
    // ONLINE
    // =======================================================

    if (interviewForm.interviewType === "ONLINE") {
      const meetingLink = interviewForm.meetingLink.trim();

      if (!meetingLink) {
        return "Meeting link is required for an online interview.";
      }

      if (!isValidMeetingLink(meetingLink)) {
        return "Please enter a valid meeting link starting with http:// or https://.";
      }
    }

    // =======================================================
    // OFFLINE
    // =======================================================

    if (interviewForm.interviewType === "OFFLINE") {
      const location = interviewForm.location.trim();

      if (!location) {
        return "Interview location is required for an offline interview.";
      }
    }

    // =======================================================
    // PHONE
    // =======================================================

    if (interviewForm.interviewType === "PHONE") {
      /*
       * No additional field required.
       */
    }

    return "";
  };

  // =========================================================
  // BUILD INTERVIEW REQUEST
  // =========================================================

  const buildInterviewData = () => {
    return {
      applicationId: Number(selectedApplicant.applicationId),

      interviewDate: interviewForm.interviewDate,

      interviewType: interviewForm.interviewType,

      meetingLink:
        interviewForm.interviewType === "ONLINE"
          ? interviewForm.meetingLink.trim()
          : null,

      location:
        interviewForm.interviewType === "OFFLINE"
          ? interviewForm.location.trim()
          : null,

      notes: interviewForm.notes.trim() || null,

      status: "SCHEDULED",
    };
  };

  // =========================================================
  // FORMAT DATE TIME
  // =========================================================

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
  // GET INTERVIEW DATE
  // =========================================================

  const getInterviewDate = (interview) => {
    if (!interview) {
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

  // =========================================================
  // INTERVIEW NOTIFICATION
  // =========================================================

  const buildInterviewNotification = () => {
    const type =
      interviewForm.interviewType === "ONLINE"
        ? "online"
        : interviewForm.interviewType === "OFFLINE"
          ? "offline"
          : "phone";

    let message = `An ${type} interview has been scheduled for your application on ${formatDateTime(
      interviewForm.interviewDate,
    )}.`;

    if (
      interviewForm.interviewType === "ONLINE" &&
      interviewForm.meetingLink.trim()
    ) {
      message += ` Meeting link: ${interviewForm.meetingLink.trim()}`;
    }

    if (
      interviewForm.interviewType === "OFFLINE" &&
      interviewForm.location.trim()
    ) {
      message += ` Location: ${interviewForm.location.trim()}`;
    }

    if (interviewForm.notes.trim()) {
      message += ` Notes: ${interviewForm.notes.trim()}`;
    }

    return message;
  };

  // =========================================================
  // SCHEDULE INTERVIEW
  // =========================================================

  const scheduleInterview = async (event) => {
    event.preventDefault();

    setActionError("");
    setSuccessMessage("");

    const validationError = validateInterviewForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    const interviewData = buildInterviewData();

    console.log("Creating interview:", interviewData);

    try {
      setInterviewLoading(true);

      const response = await api.post("/interviews", interviewData);

      console.log("Interview created:", response.data);

      // =====================================================
      // NOTIFY SEEKER
      // =====================================================

      await sendSeekerNotification(
        selectedApplicant,
        buildInterviewNotification(),
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccessMessage(
        "Interview scheduled successfully. The job seeker has been notified.",
      );

      const applicationId = selectedApplicant.applicationId;

      // =====================================================
      // REFRESH INTERVIEWS FOR THIS APPLICATION
      // =====================================================

      try {
        const interviewResponse = await api.get(
          `/interviews/application/${applicationId}`,
        );

        let interviewDataResponse = interviewResponse.data;

        if (
          interviewDataResponse &&
          typeof interviewDataResponse === "object" &&
          Array.isArray(interviewDataResponse.content)
        ) {
          interviewDataResponse = interviewDataResponse.content;
        }

        if (!Array.isArray(interviewDataResponse)) {
          interviewDataResponse = [];
        }

        setInterviewsByApplication((previous) => ({
          ...previous,
          [applicationId]: interviewDataResponse,
        }));
      } catch (refreshError) {
        console.warn("Interview created but refresh failed:", refreshError);
      }

      // =====================================================
      // CLOSE FORM
      // =====================================================

      setShowInterviewForm(false);
      setSelectedApplicant(null);

      setInterviewForm({
        interviewDate: "",
        interviewType: "ONLINE",
        meetingLink: "",
        location: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to schedule interview:", err);

      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to schedule interview.",
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  // =========================================================
  // UPDATE INTERVIEW STATUS
  // =========================================================

  const updateInterviewStatus = async (applicant, interview, newStatus) => {
    const interviewId = interview?.interviewId ?? interview?.id;

    if (!interviewId) {
      setActionError("Interview ID is missing. Unable to update interview.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark this interview as ${newStatus}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setInterviewLoading(true);
      setActionError("");
      setSuccessMessage("");

      console.log("Updating interview:", interviewId, newStatus);

      const response = await api.put(
        `/interviews/${interviewId}/status`,
        null,
        {
          params: {
            status: newStatus,
          },
        },
      );

      console.log("Interview status response:", response.data);

      // =====================================================
      // NOTIFICATION
      // =====================================================

      if (newStatus === "COMPLETED") {
        await sendSeekerNotification(
          applicant,
          "Your interview has been marked as completed by the recruiter.",
        );
      }

      if (newStatus === "CANCELLED") {
        await sendSeekerNotification(
          applicant,
          "Your scheduled interview has been cancelled by the recruiter.",
        );
      }

      // =====================================================
      // REFRESH INTERVIEWS
      // =====================================================

      const applicationId = applicant.applicationId;

      try {
        const interviewResponse = await api.get(
          `/interviews/application/${applicationId}`,
        );

        let data = interviewResponse.data;

        if (data && typeof data === "object" && Array.isArray(data.content)) {
          data = data.content;
        }

        if (!Array.isArray(data)) {
          data = [];
        }

        setInterviewsByApplication((previous) => ({
          ...previous,
          [applicationId]: data,
        }));
      } catch (refreshError) {
        console.warn(
          "Interview status updated but refresh failed:",
          refreshError,
        );
      }

      setSuccessMessage(`Interview marked as ${newStatus.toLowerCase()}.`);
    } catch (err) {
      console.error("Failed to update interview status:", err);

      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update interview status.",
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    const value = String(status || "APPLIED").toUpperCase();

    if (value === "SELECTED") {
      return "status-selected";
    }

    if (value === "REJECTED") {
      return "status-rejected";
    }

    if (value === "SHORTLISTED") {
      return "status-shortlisted";
    }

    return "status-applied";
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
  // GET INITIALS
  // =========================================================

  const getInitials = (name, seekerId) => {
    if (!name) {
      return seekerId ? `C${seekerId}` : "C";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalApplicants = applicants.length;

  const appliedCount = applicants.filter(
    (applicant) => getStatus(applicant) === "APPLIED",
  ).length;

  const shortlistedCount = applicants.filter(
    (applicant) => getStatus(applicant) === "SHORTLISTED",
  ).length;

  const selectedCount = applicants.filter(
    (applicant) => getStatus(applicant) === "SELECTED",
  ).length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="recruiter-applicants-loading">
        <div className="recruiter-spinner"></div>

        <h3>Loading applicants</h3>

        <p>Please wait while we fetch candidate applications.</p>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="recruiter-applicants-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="recruiter-page-header">
        <div className="recruiter-header-container">
          <Link to="/recruiter/jobs" className="back-to-jobs">
            <ArrowLeft size={17} />
            Back to My Jobs
          </Link>

          <div className="recruiter-header-content">
            <div>
              <div className="recruiter-eyebrow">
                <Users size={16} />
                RECRUITER PORTAL
              </div>

              <h1>Job Applicants</h1>

              <p>
                Review candidates, evaluate applications and manage your hiring
                pipeline.
              </p>
            </div>

            <button
              type="button"
              className="header-refresh-btn"
              onClick={fetchApplicants}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="recruiter-main">
        {/* ===================================================
            GLOBAL SUCCESS
        ==================================================== */}

        {successMessage && (
          <div
            className="recruiter-success-box"
            style={{
              marginBottom: "20px",
              padding: "14px 18px",
              borderRadius: "10px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <CheckCircle size={19} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ===================================================
            GLOBAL ERROR
        ==================================================== */}

        {actionError && !showInterviewForm && (
          <div
            className="recruiter-error-box"
            style={{
              marginBottom: "20px",
            }}
          >
            <div className="error-icon">
              <XCircle size={28} />
            </div>

            <div>
              <h3>Action could not be completed</h3>
              <p>{actionError}</p>
            </div>

            <button
              type="button"
              className="retry-btn"
              onClick={() => setActionError("")}
            >
              Close
            </button>
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="recruiter-error-box">
            <div className="error-icon">
              <XCircle size={28} />
            </div>

            <div>
              <h3>Unable to load applicants</h3>

              <p>{error}</p>
            </div>

            <button
              type="button"
              className="retry-btn"
              onClick={fetchApplicants}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {!error && applicants.length === 0 && (
          <div className="recruiter-empty-state">
            <div className="empty-state-icon">
              <Users size={38} />
            </div>

            <h2>No applicants yet</h2>

            <p>Candidates who apply for this job will appear here.</p>

            <Link to="/recruiter/jobs" className="empty-back-btn">
              <ArrowLeft size={16} />
              Back to My Jobs
            </Link>
          </div>
        )}

        {/* ===================================================
            APPLICANTS
        ==================================================== */}

        {!error && applicants.length > 0 && (
          <>
            {/* =============================================
                  STATISTICS
              ============================================== */}

            <div className="applicant-stat-grid">
              <div className="applicant-stat-card">
                <div className="stat-icon stat-blue">
                  <Users size={21} />
                </div>

                <div>
                  <span>Total Applicants</span>

                  <strong>{totalApplicants}</strong>
                </div>
              </div>

              <div className="applicant-stat-card">
                <div className="stat-icon stat-purple">
                  <Clock size={21} />
                </div>

                <div>
                  <span>New Applications</span>

                  <strong>{appliedCount}</strong>
                </div>
              </div>

              <div className="applicant-stat-card">
                <div className="stat-icon stat-orange">
                  <UserCheck size={21} />
                </div>

                <div>
                  <span>Shortlisted</span>

                  <strong>{shortlistedCount}</strong>
                </div>
              </div>

              <div className="applicant-stat-card">
                <div className="stat-icon stat-green">
                  <CheckCircle size={21} />
                </div>

                <div>
                  <span>Selected</span>

                  <strong>{selectedCount}</strong>
                </div>
              </div>
            </div>

            {/* =============================================
                  TOOLBAR
              ============================================== */}

            <div className="applicants-toolbar">
              <div>
                <h2>
                  Candidates <span>{totalApplicants}</span>
                </h2>

                <p>Review and manage candidate applications.</p>
              </div>

              <button
                type="button"
                className="toolbar-refresh-btn"
                onClick={fetchApplicants}
                disabled={loading || actionLoading || interviewLoading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* =============================================
                  APPLICANT LIST
              ============================================== */}

            <div className="recruiter-applicant-list">
              {applicants.map((applicant) => {
                const applicationId = applicant.applicationId;

                const status = getStatus(applicant);

                const candidateName =
                  applicant.fullName || `Candidate #${applicant.seekerId}`;

                const interviews = getInterviews(applicationId);

                const completed = hasCompletedInterview(applicationId);

                const scheduled = hasScheduledInterview(applicationId);

                const latestInterview = getLatestInterview(applicationId);

                return (
                  <article
                    key={applicationId || applicant.id}
                    className="recruiter-candidate-card"
                  >
                    {/* ===================================
                            CANDIDATE TOP
                        ==================================== */}

                    <div className="candidate-top">
                      <div className="candidate-profile">
                        <div className="candidate-avatar">
                          {getInitials(applicant.fullName, applicant.seekerId)}
                        </div>

                        <div className="candidate-heading">
                          <div className="candidate-name-row">
                            <h3>{candidateName}</h3>

                            <span
                              className={`candidate-status ${getStatusClass(
                                applicant.status,
                              )}`}
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </div>

                          {applicant.headline && (
                            <p className="candidate-headline">
                              {applicant.headline}
                            </p>
                          )}

                          <span className="candidate-id">
                            Application ID: {applicationId || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="application-date">
                        <CalendarDays size={15} />
                        Applied {formatDate(applicant.appliedAt)}
                      </div>
                    </div>

                    {/* ===================================
                            DETAILS
                        ==================================== */}

                    <div className="candidate-details">
                      <div className="candidate-detail">
                        <span>
                          <Mail size={15} />
                          Email
                        </span>

                        <strong>{applicant.email || "Not provided"}</strong>
                      </div>

                      <div className="candidate-detail">
                        <span>
                          <Phone size={15} />
                          Phone
                        </span>

                        <strong>{applicant.phone || "Not provided"}</strong>
                      </div>

                      <div className="candidate-detail">
                        <span>
                          <MapPin size={15} />
                          Location
                        </span>

                        <strong>{applicant.location || "Not specified"}</strong>
                      </div>

                      <div className="candidate-detail">
                        <span>
                          <GraduationCap size={15} />
                          Education
                        </span>

                        <strong>
                          {applicant.education || "Not specified"}
                        </strong>
                      </div>

                      <div className="candidate-detail">
                        <span>
                          <Briefcase size={15} />
                          Experience
                        </span>

                        <strong>
                          {applicant.experienceYears != null
                            ? `${applicant.experienceYears} years`
                            : "Fresher"}
                        </strong>
                      </div>
                    </div>

                    {/* ===================================
                            ABOUT
                        ==================================== */}

                    {applicant.about && (
                      <div className="candidate-about">
                        <h4>About Candidate</h4>

                        <p>{applicant.about}</p>
                      </div>
                    )}

                    {/* ===================================
                            RESUME
                        ==================================== */}

                    <div className="candidate-resume">
                      <div className="resume-left">
                        <div className="resume-icon">
                          <FileText size={20} />
                        </div>

                        <div>
                          <strong>Resume</strong>

                          <span>
                            {applicant.resumeFileName || applicant.resumeId
                              ? applicant.resumeFileName ||
                                `Resume ID: ${applicant.resumeId}`
                              : "No resume submitted"}
                          </span>
                        </div>
                      </div>

                      {applicant.resumeId && (
                        <a
                          href={`${api.defaults.baseURL}/resumes/${applicant.resumeId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="view-resume-btn"
                        >
                          <FileText size={16} />
                          View Resume
                        </a>
                      )}
                    </div>

                    {/* ===================================
                            INTERVIEW INFORMATION
                        ==================================== */}

                    {status === "SHORTLISTED" && (
                      <div
                        style={{
                          marginTop: "18px",
                          padding: "16px",
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          background: "#fafafa",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <CalendarDays size={18} />

                          <strong>Interview</strong>
                        </div>

                        {/* NO INTERVIEW */}

                        {!scheduled && !completed && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                color: "#6b7280",
                              }}
                            >
                              No interview scheduled yet.
                            </span>

                            <button
                              type="button"
                              className="shortlist-btn"
                              onClick={() => openInterviewForm(applicant)}
                              disabled={actionLoading || interviewLoading}
                            >
                              <CalendarDays size={17} />
                              Schedule Interview
                            </button>
                          </div>
                        )}

                        {/* SCHEDULED */}

                        {scheduled && latestInterview && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginBottom: "12px",
                              }}
                            >
                              <span className="candidate-status status-shortlisted">
                                SCHEDULED
                              </span>

                              <strong>
                                {String(
                                  latestInterview.interviewType || "INTERVIEW",
                                ).toUpperCase()}
                              </strong>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <CalendarDays size={16} />

                                <span>
                                  {formatDateTime(
                                    getInterviewDate(latestInterview),
                                  )}
                                </span>
                              </div>

                              {latestInterview.meetingLink && (
                                <a
                                  href={latestInterview.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <Video size={16} />
                                  Join Meeting
                                </a>
                              )}

                              {latestInterview.location && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <MapPin size={16} />

                                  <span>{latestInterview.location}</span>
                                </div>
                              )}

                              {String(
                                latestInterview.interviewType || "",
                              ).toUpperCase() === "PHONE" && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <Phone size={16} />

                                  <span>Phone Interview</span>
                                </div>
                              )}
                            </div>

                            {latestInterview.notes && (
                              <p
                                style={{
                                  marginTop: "10px",
                                  color: "#6b7280",
                                }}
                              >
                                <strong>Notes:</strong> {latestInterview.notes}
                              </p>
                            )}

                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                marginTop: "14px",
                              }}
                            >
                              <button
                                type="button"
                                className="select-btn"
                                onClick={() =>
                                  updateInterviewStatus(
                                    applicant,
                                    latestInterview,
                                    "COMPLETED",
                                  )
                                }
                                disabled={interviewLoading || actionLoading}
                              >
                                <CheckCircle size={17} />
                                Mark Completed
                              </button>

                              <button
                                type="button"
                                className="reject-btn"
                                onClick={() =>
                                  updateInterviewStatus(
                                    applicant,
                                    latestInterview,
                                    "CANCELLED",
                                  )
                                }
                                disabled={interviewLoading || actionLoading}
                              >
                                <XCircle size={17} />
                                Cancel Interview
                              </button>
                            </div>
                          </div>
                        )}

                        {/* COMPLETED */}

                        {completed && (
                          <div
                            style={{
                              marginTop: scheduled ? "12px" : "0",
                            }}
                          >
                            {latestInterview && (
                              <>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <span className="candidate-status status-selected">
                                    COMPLETED
                                  </span>

                                  <span>Interview completed</span>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "#6b7280",
                                  }}
                                >
                                  <CalendarDays size={16} />

                                  {formatDateTime(
                                    getInterviewDate(latestInterview),
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* INTERVIEW COUNT */}

                        {interviews.length > 0 && (
                          <small
                            style={{
                              display: "block",
                              marginTop: "10px",
                              color: "#6b7280",
                            }}
                          >
                            {interviews.length} interview
                            {interviews.length !== 1 ? "s" : ""} recorded for
                            this application.
                          </small>
                        )}
                      </div>
                    )}

                    {/* ===================================
                            ACTIONS
                        ==================================== */}

                    <div className="candidate-actions">
                      {/* APPLIED */}

                      {status === "APPLIED" && (
                        <>
                          <button
                            type="button"
                            className="shortlist-btn"
                            onClick={() =>
                              updateStatus(applicant, "SHORTLISTED")
                            }
                            disabled={actionLoading}
                          >
                            <CheckCircle size={17} />
                            Shortlist
                          </button>

                          <button
                            type="button"
                            className="reject-btn"
                            onClick={() => updateStatus(applicant, "REJECTED")}
                            disabled={actionLoading}
                          >
                            <UserX size={17} />
                            Reject
                          </button>
                        </>
                      )}

                      {/* SHORTLISTED */}

                      {status === "SHORTLISTED" && (
                        <>
                          <button
                            type="button"
                            className="select-btn"
                            onClick={() => updateStatus(applicant, "SELECTED")}
                            disabled={
                              actionLoading || interviewLoading || !completed
                            }
                            title={
                              completed
                                ? "Select candidate"
                                : "Complete an interview before selecting the candidate"
                            }
                          >
                            <CheckCircle size={17} />
                            {completed
                              ? "Select Candidate"
                              : "Complete Interview First"}
                          </button>

                          <button
                            type="button"
                            className="reject-btn"
                            onClick={() => updateStatus(applicant, "REJECTED")}
                            disabled={actionLoading || interviewLoading}
                          >
                            <UserX size={17} />
                            Reject
                          </button>
                        </>
                      )}

                      {/* SELECTED */}

                      {status === "SELECTED" && (
                        <div className="final-status selected-final">
                          <CheckCircle size={17} />
                          Candidate Selected
                        </div>
                      )}

                      {/* REJECTED */}

                      {status === "REJECTED" && (
                        <div className="final-status rejected-final">
                          <XCircle size={17} />
                          Application Rejected
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* =====================================================
          SCHEDULE INTERVIEW MODAL
      ====================================================== */}

      {showInterviewForm && selectedApplicant && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.60)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              padding: "28px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* =============================================
                  MODAL HEADER
              ============================================== */}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <CalendarDays size={24} />

                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    Schedule Interview
                  </h2>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                  }}
                >
                  Schedule an interview for{" "}
                  <strong>
                    {selectedApplicant.fullName ||
                      `Candidate #${selectedApplicant.seekerId}`}
                  </strong>
                </p>

                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#9ca3af",
                  }}
                >
                  Application ID: {selectedApplicant.applicationId}
                </small>
              </div>

              <button
                type="button"
                onClick={closeInterviewForm}
                disabled={interviewLoading}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "5px",
                }}
                aria-label="Close"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* =============================================
                  ERROR
              ============================================== */}

            {actionError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  marginBottom: "18px",
                }}
              >
                <XCircle size={18} />

                <span>{actionError}</span>
              </div>
            )}

            {/* =============================================
                  FORM
              ============================================== */}

            <form onSubmit={scheduleInterview}>
              {/* DATE */}

              <div
                style={{
                  marginBottom: "18px",
                }}
              >
                <label
                  htmlFor="modalInterviewDate"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Interview Date & Time
                </label>

                <input
                  id="modalInterviewDate"
                  type="datetime-local"
                  name="interviewDate"
                  value={interviewForm.interviewDate}
                  onChange={handleInterviewChange}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "9px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* TYPE */}

              <div
                style={{
                  marginBottom: "18px",
                }}
              >
                <label
                  htmlFor="modalInterviewType"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Interview Type
                </label>

                <select
                  id="modalInterviewType"
                  name="interviewType"
                  value={interviewForm.interviewType}
                  onChange={handleInterviewChange}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "9px",
                    fontSize: "14px",
                    background: "#ffffff",
                  }}
                >
                  <option value="ONLINE">Online</option>

                  <option value="OFFLINE">Offline</option>

                  <option value="PHONE">Phone</option>
                </select>
              </div>

              {/* ONLINE */}

              {interviewForm.interviewType === "ONLINE" && (
                <div
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <label
                    htmlFor="modalMeetingLink"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "7px",
                    }}
                  >
                    Meeting Link
                  </label>

                  <input
                    id="modalMeetingLink"
                    type="url"
                    name="meetingLink"
                    value={interviewForm.meetingLink}
                    onChange={handleInterviewChange}
                    placeholder="https://meet.google.com/..."
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 13px",
                      border: "1px solid #d1d5db",
                      borderRadius: "9px",
                      fontSize: "14px",
                    }}
                  />

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                      color: "#6b7280",
                    }}
                  >
                    Enter a valid meeting URL starting with http:// or https://
                  </small>
                </div>
              )}

              {/* OFFLINE */}

              {interviewForm.interviewType === "OFFLINE" && (
                <div
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <label
                    htmlFor="modalLocation"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "7px",
                    }}
                  >
                    Interview Location
                  </label>

                  <input
                    id="modalLocation"
                    type="text"
                    name="location"
                    value={interviewForm.location}
                    onChange={handleInterviewChange}
                    placeholder="Office / Interview location"
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 13px",
                      border: "1px solid #d1d5db",
                      borderRadius: "9px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              )}

              {/* PHONE */}

              {interviewForm.interviewType === "PHONE" && (
                <div
                  style={{
                    marginBottom: "18px",
                    padding: "14px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <Phone size={19} />

                  <span>
                    The recruiter will contact the candidate at the scheduled
                    time.
                  </span>
                </div>
              )}

              {/* NOTES */}

              <div
                style={{
                  marginBottom: "22px",
                }}
              >
                <label
                  htmlFor="modalNotes"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Notes
                </label>

                <textarea
                  id="modalNotes"
                  name="notes"
                  rows="4"
                  value={interviewForm.notes}
                  onChange={handleInterviewChange}
                  placeholder="Interview instructions or notes..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "9px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* ===========================================
                    ACTIONS
                ============================================ */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeInterviewForm}
                  disabled={interviewLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="shortlist-btn"
                  disabled={interviewLoading}
                >
                  <CalendarDays size={17} />

                  {interviewLoading ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterApplicants;
