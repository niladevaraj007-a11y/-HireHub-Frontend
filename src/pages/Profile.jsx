import { useEffect, useState } from "react";
import {
  UserCircle,
  Mail,
  Briefcase,
  Save,
  CheckCircle,
  Upload,
  FileText,
} from "lucide-react";

import api from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [seekerId, setSeekerId] = useState(null);

  // =========================================================
  // PROFILE STATES
  // =========================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    skills: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // RESUME STATES
  // =========================================================

  const [resume, setResume] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeError, setResumeError] = useState("");

  // =========================================================
  // LOAD USER WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    loadUser();
  }, []);

  // =========================================================
  // GET USER ID
  // =========================================================

  const getUserId = (currentUser) => {
    if (!currentUser) {
      return localStorage.getItem("userId") || null;
    }

    return (
      currentUser.userId ??
      currentUser.id ??
      currentUser.user_id ??
      localStorage.getItem("userId") ??
      null
    );
  };

  // =========================================================
  // GET ROLE
  // =========================================================

  const getRole = (currentUser) => {
    return String(
      currentUser?.role ||
        currentUser?.userRole ||
        localStorage.getItem("role") ||
        "",
    )
      .trim()
      .toUpperCase();
  };

  // =========================================================
  // FIND JOB SEEKER PROFILE
  //
  // users.user_id
  //       ↓
  // GET /api/job-seekers/user/{userId}
  //       ↓
  // job_seekers.seeker_id
  // =========================================================

  const loadJobSeekerProfile = async (currentUser) => {
    const userId = getUserId(currentUser);

    if (!userId) {
      console.error("User ID not found:", currentUser);
      return null;
    }

    try {
      console.log("================================");
      console.log("Finding Job Seeker profile");
      console.log("User ID:", userId);
      console.log("Endpoint:", `/job-seekers/user/${userId}`);
      console.log("================================");

      const response = await api.get(`/job-seekers/user/${userId}`);

      console.log("Job Seeker response:", response.data);

      const jobSeeker = response.data;

      if (!jobSeeker?.seekerId) {
        console.error("seekerId missing from JobSeeker response:", jobSeeker);

        return null;
      }

      const actualSeekerId = jobSeeker.seekerId;

      console.log("Actual seekerId:", actualSeekerId);

      setSeekerId(actualSeekerId);

      // -------------------------------------------------------
      // SAVE SEEKER ID
      // -------------------------------------------------------

      localStorage.setItem("seekerId", String(actualSeekerId));

      // -------------------------------------------------------
      // UPDATE USER OBJECT
      // -------------------------------------------------------

      const updatedUser = {
        ...currentUser,
        userId: currentUser?.userId ?? userId,
        seekerId: actualSeekerId,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);

      // -------------------------------------------------------
      // LOAD JOB SEEKER INFORMATION
      // -------------------------------------------------------

      setFormData((previous) => ({
        ...previous,
        location: jobSeeker.location ?? previous.location ?? "",
        bio: jobSeeker.about ?? previous.bio ?? "",
      }));

      return jobSeeker;
    } catch (err) {
      console.error("Could not load Job Seeker profile:", err);
      console.error("Status:", err.response?.status);
      console.error("Backend response:", err.response?.data);

      // -------------------------------------------------------
      // USE SAVED SEEKER ID
      // -------------------------------------------------------

      const savedSeekerId =
        currentUser?.seekerId || localStorage.getItem("seekerId");

      if (savedSeekerId) {
        console.log("Using saved seekerId:", savedSeekerId);

        setSeekerId(savedSeekerId);

        return {
          seekerId: savedSeekerId,
        };
      }

      return null;
    }
  };

  // =========================================================
  // LOAD USER
  // =========================================================

  const loadUser = async () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setError("You are not logged in.");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      console.log("Logged-in user:", parsedUser);

      const userId = getUserId(parsedUser);

      if (userId) {
        localStorage.setItem("userId", String(userId));
      }

      setUser(parsedUser);

      const role = getRole(parsedUser);

      console.log("User role:", role);
      console.log("User ID:", userId);

      // -------------------------------------------------------
      // LOAD BASIC USER INFORMATION
      // -------------------------------------------------------

      setFormData({
        name:
          parsedUser.fullName || parsedUser.name || parsedUser.username || "",

        email: parsedUser.email || "",

        phone: parsedUser.phone || "",

        location: parsedUser.location || "",

        skills: parsedUser.skills || "",

        bio: parsedUser.bio || "",
      });

      // -------------------------------------------------------
      // GET SAVED SEEKER ID
      // -------------------------------------------------------

      const savedSeekerId =
        parsedUser.seekerId || localStorage.getItem("seekerId");

      if (savedSeekerId) {
        setSeekerId(savedSeekerId);
      }

      // -------------------------------------------------------
      // JOB SEEKER
      // -------------------------------------------------------

      if (role === "JOB_SEEKER") {
        await loadJobSeekerProfile(parsedUser);
      }
    } catch (err) {
      console.error("Invalid user data:", err);

      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setError("Invalid login information. Please log in again.");
    }
  };

  // =========================================================
  // HANDLE PROFILE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const userId = getUserId(user);

      // -------------------------------------------------------
      // CHECK USER ID
      // -------------------------------------------------------

      if (!userId) {
        setError("Unable to identify your user account. Please log in again.");
        return;
      }

      console.log("================================");
      console.log("Updating User profile");
      console.log("User ID:", userId);
      console.log("================================");

      // =======================================================
      // UPDATE USERS TABLE
      // =======================================================

      const response = await api.put(`/users/${userId}`, {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      console.log("User update response:", response.data);

      // =======================================================
      // UPDATE JOB SEEKER TABLE
      // =======================================================

      const role = getRole(user);

      if (role === "JOB_SEEKER") {
        let actualSeekerId =
          seekerId || user?.seekerId || localStorage.getItem("seekerId");

        // -----------------------------------------------------
        // FIND SEEKER ID IF NOT AVAILABLE
        // -----------------------------------------------------

        if (!actualSeekerId) {
          const jobSeeker = await loadJobSeekerProfile(user);

          actualSeekerId = jobSeeker?.seekerId || null;
        }

        // -----------------------------------------------------
        // UPDATE JOB SEEKER
        // -----------------------------------------------------

        if (actualSeekerId) {
          const jobSeekerResponse = await api.put(
            `/job-seekers/${actualSeekerId}`,
            {
              userId: userId,
              location: formData.location,
              about: formData.bio,
            },
          );

          console.log("JobSeeker update response:", jobSeekerResponse.data);

          setSeekerId(actualSeekerId);
          localStorage.setItem("seekerId", String(actualSeekerId));
        }
      }

      // =======================================================
      // UPDATE LOCAL STORAGE
      // =======================================================

      const updatedUser = {
        ...user,

        ...response.data,

        userId: response.data?.userId || userId,

        name: response.data?.fullName || formData.name,

        fullName: response.data?.fullName || formData.name,

        email: response.data?.email || formData.email,

        phone: response.data?.phone || formData.phone,

        location: formData.location,

        skills: formData.skills,

        bio: formData.bio,

        seekerId:
          seekerId ||
          user?.seekerId ||
          localStorage.getItem("seekerId") ||
          null,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      localStorage.setItem("userId", String(userId));

      setUser(updatedUser);

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update failed:", err);
      console.error("Status:", err.response?.status);
      console.error("Backend response:", err.response?.data);

      const backendMessage =
        err.response?.data?.message || err.response?.data?.error;

      setError(
        backendMessage || "Unable to update your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SELECT RESUME
  // =========================================================

  const handleResumeChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setResumeMessage("");
    setResumeError("");

    if (!selectedFile) {
      setResume(null);
      return;
    }

    // -------------------------------------------------------
    // PDF ONLY
    // -------------------------------------------------------

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setResume(null);

      setResumeError("Please select a PDF resume.");

      event.target.value = "";

      return;
    }

    // -------------------------------------------------------
    // MAX 5 MB
    // -------------------------------------------------------

    if (selectedFile.size > 5 * 1024 * 1024) {
      setResume(null);

      setResumeError("Resume size must be less than 5 MB.");

      event.target.value = "";

      return;
    }

    setResume(selectedFile);

    console.log("Selected resume:", selectedFile.name);
    console.log("Resume size:", selectedFile.size);
    console.log("Resume type:", selectedFile.type);
  };

  // =========================================================
  // UPLOAD RESUME
  // =========================================================

  const handleResumeUpload = async () => {
    setResumeMessage("");
    setResumeError("");

    // =======================================================
    // CHECK FILE
    // =======================================================

    if (!resume) {
      setResumeError("Please select a resume first.");
      return;
    }

    // =======================================================
    // GET USER ID
    // =======================================================

    const actualUserId = getUserId(user);

    console.log("================================");
    console.log("Preparing resume upload");
    console.log("User ID:", actualUserId);
    console.log("Seeker ID:", seekerId);
    console.log("File:", resume.name);
    console.log("================================");

    // =======================================================
    // CHECK USER ID
    // =======================================================

    if (!actualUserId) {
      setResumeError(
        "Unable to identify your user account. Please log in again.",
      );
      return;
    }

    try {
      setResumeLoading(true);

      // =====================================================
      // CREATE MULTIPART FORM DATA
      // =====================================================

      const uploadData = new FormData();

      uploadData.append("file", resume);

      console.log("FormData created successfully.");
      console.log("Contains file:", uploadData.has("file"));

      // =====================================================
      // IMPORTANT
      //
      // BACKEND EXPECTS:
      //
      // POST /api/resumes/upload?userId=123
      //
      // NOT:
      //
      // POST /api/resumes/upload?seekerId=123
      // =====================================================

      const uploadUrl = `/resumes/upload?userId=${encodeURIComponent(
        actualUserId,
      )}`;

      console.log("Upload URL:", uploadUrl);

      // =====================================================
      // SEND RESUME
      // =====================================================

      const response = await api.post(uploadUrl, uploadData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      console.log("Resume upload response:", response.data);

      // =====================================================
      // SAVE USER ID
      // =====================================================

      localStorage.setItem("userId", String(actualUserId));

      // =====================================================
      // SAVE SEEKER ID IF AVAILABLE
      // =====================================================

      if (seekerId) {
        localStorage.setItem("seekerId", String(seekerId));
      }

      // =====================================================
      // UPDATE USER STORAGE
      // =====================================================

      const updatedUser = {
        ...user,
        userId: actualUserId,
        seekerId:
          seekerId ||
          user?.seekerId ||
          localStorage.getItem("seekerId") ||
          null,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);

      // =====================================================
      // SUCCESS
      // =====================================================

      setResumeMessage("Resume uploaded successfully.");

      setResume(null);

      // =====================================================
      // CLEAR FILE INPUT
      // =====================================================

      const fileInput = document.getElementById("resume-file");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error("Resume upload failed:", err);
      console.error("Status:", err.response?.status);
      console.error("Backend response:", err.response?.data);

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null);

      // =====================================================
      // SPECIAL ERROR HANDLING
      // =====================================================

      if (err.response?.status === 400) {
        setResumeError(backendMessage || "Invalid resume upload request.");
      } else if (err.response?.status === 401) {
        setResumeError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setResumeError("You are not authorized to upload a resume.");
      } else if (err.response?.status === 404) {
        setResumeError("Resume upload service was not found.");
      } else if (err.response?.status === 500) {
        setResumeError("Server error while uploading resume.");
      } else {
        setResumeError(
          backendMessage || "Unable to upload resume. Please try again.",
        );
      }
    } finally {
      setResumeLoading(false);
    }
  };

  // =========================================================
  // ROLE
  // =========================================================

  const displayRole =
    user?.role ||
    user?.userRole ||
    localStorage.getItem("role") ||
    "JOB_SEEKER";

  const normalizedRole = String(displayRole).trim().toUpperCase();

  const isJobSeeker = normalizedRole === "JOB_SEEKER";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="profile-page">
      {/* =====================================================
          PROFILE HEADER
      ====================================================== */}

      <section className="profile-header">
        <div className="container">
          <span className="section-label">Account Settings</span>

          <h1>My Profile</h1>

          <p>Manage your personal information, career profile and resume.</p>
        </div>
      </section>

      {/* =====================================================
          PROFILE SECTION
      ====================================================== */}

      <section className="page-section profile-section">
        <div className="container">
          <div className="profile-layout">
            {/* =================================================
                SIDEBAR
            ================================================== */}

            <aside className="profile-sidebar card">
              <div className="profile-avatar">
                <UserCircle size={55} />
              </div>

              <h2>{formData.name || "Your Name"}</h2>

              <p className="profile-email">
                {formData.email || "email@example.com"}
              </p>

              <span className="profile-role">
                {String(displayRole).replaceAll("_", " ")}
              </span>

              <div className="profile-sidebar-info">
                <div>
                  <Mail size={17} />

                  <span>{formData.email || "No email added"}</span>
                </div>

                <div>
                  <Briefcase size={17} />

                  <span>{isJobSeeker ? "Job Seeker" : "Recruiter"}</span>
                </div>
              </div>
            </aside>

            {/* =================================================
                RIGHT CONTENT
            ================================================== */}

            <div>
              {/* =================================================
                  PERSONAL INFORMATION
              ================================================== */}

              <div className="profile-content card">
                <div className="profile-content-header">
                  <div>
                    <h2>Personal Information</h2>

                    <p>Keep your profile information up to date.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="profile-form-grid">
                    {/* FULL NAME */}

                    <div className="form-group">
                      <label htmlFor="profile-name">Full Name</label>

                      <input
                        id="profile-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* EMAIL */}

                    <div className="form-group">
                      <label htmlFor="profile-email">Email Address</label>

                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* PHONE */}

                    <div className="form-group">
                      <label htmlFor="profile-phone">Phone Number</label>

                      <input
                        id="profile-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* LOCATION */}

                    <div className="form-group">
                      <label htmlFor="profile-location">Location</label>

                      <input
                        id="profile-location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Bangalore"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      SKILLS
                  ================================================== */}

                  <div className="form-group">
                    <label htmlFor="profile-skills">Skills</label>

                    <input
                      id="profile-skills"
                      name="skills"
                      type="text"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="Java, Spring Boot, MySQL, React"
                    />

                    <small className="field-hint">
                      Separate multiple skills with commas.
                    </small>
                  </div>

                  {/* =================================================
                      BIO
                  ================================================== */}

                  <div className="form-group">
                    <label htmlFor="profile-bio">About Me</label>

                    <textarea
                      id="profile-bio"
                      name="bio"
                      rows="6"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell recruiters about yourself, your experience and career goals."
                    />
                  </div>

                  {/* =================================================
                      SUCCESS
                  ================================================== */}

                  {message && (
                    <div className="profile-success">
                      <CheckCircle size={18} />

                      {message}
                    </div>
                  )}

                  {/* =================================================
                      ERROR
                  ================================================== */}

                  {error && <div className="profile-error">{error}</div>}

                  {/* =================================================
                      SAVE BUTTON
                  ================================================== */}

                  <div className="profile-form-actions">
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={loading}
                    >
                      <Save size={17} />

                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* =================================================
                  RESUME
                  ONLY JOB SEEKER
              ================================================== */}

              {isJobSeeker && (
                <div
                  className="profile-content card"
                  style={{
                    marginTop: "24px",
                  }}
                >
                  <div className="profile-content-header">
                    <div>
                      <h2>Resume</h2>

                      <p>Upload your resume before applying for jobs.</p>
                    </div>
                  </div>

                  <div className="resume-upload-box">
                    <div className="resume-upload-icon">
                      <FileText size={32} />
                    </div>

                    <h3>Upload your resume</h3>

                    <p>PDF format only. Maximum size 5 MB.</p>

                    {/* =================================================
                        CHOOSE FILE
                    ================================================== */}

                    <div className="form-group">
                      <label
                        htmlFor="resume-file"
                        className="secondary-btn"
                        style={{
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Upload size={17} />
                        Choose Resume
                      </label>

                      <input
                        id="resume-file"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleResumeChange}
                        style={{
                          display: "none",
                        }}
                      />
                    </div>

                    {/* =================================================
                        SELECTED FILE
                    ================================================== */}

                    {resume && (
                      <p className="resume-selected">
                        Selected: <strong>{resume.name}</strong>
                      </p>
                    )}

                    {/* =================================================
                        SUCCESS
                    ================================================== */}

                    {resumeMessage && (
                      <div className="profile-success">
                        <CheckCircle size={18} />

                        {resumeMessage}
                      </div>
                    )}

                    {/* =================================================
                        ERROR
                    ================================================== */}

                    {resumeError && (
                      <div className="profile-error">{resumeError}</div>
                    )}

                    {/* =================================================
                        UPLOAD BUTTON
                    ================================================== */}

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={handleResumeUpload}
                      disabled={resumeLoading || !resume}
                      style={{
                        marginTop: "12px",
                      }}
                    >
                      <Upload size={17} />

                      {resumeLoading ? "Uploading..." : "Upload Resume"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Profile;
