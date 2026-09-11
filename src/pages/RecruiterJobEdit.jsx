import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Briefcase,
  MapPin,
  IndianRupee,
  Users,
  Save,
  X,
  FileText,
  Code2,
} from "lucide-react";

import api from "../services/api";

function RecruiterJobEdit() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    location: "",
    jobType: "FULL_TIME",
    experienceRequired: "",
    minSalary: "",
    maxSalary: "",
    vacancies: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD JOB
  // =========================================================

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/jobs/${jobId}`);

        const job = response.data;

        console.log("Loaded job:", job);

        setForm({
          title: job.title || "",
          description: job.description || "",
          requiredSkills: job.requiredSkills || "",
          location: job.location || "",
          jobType: job.jobType || "FULL_TIME",

          experienceRequired:
            job.experienceRequired !== null &&
            job.experienceRequired !== undefined
              ? job.experienceRequired
              : "",

          minSalary:
            job.minSalary !== null && job.minSalary !== undefined
              ? job.minSalary
              : "",

          maxSalary:
            job.maxSalary !== null && job.maxSalary !== undefined
              ? job.maxSalary
              : "",

          vacancies:
            job.vacancies !== null && job.vacancies !== undefined
              ? job.vacancies
              : "",
        });
      } catch (err) {
        console.error("Failed to load job:", err);

        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load job details.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    } else {
      setError("Job ID is missing.");
      setLoading(false);
    }
  }, [jobId]);

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================================
  // GET LOGGED-IN RECRUITER USER ID
  // =========================================================

  const getRecruiterUserIdFromObject = (user) => {
    const recruiterUserId =
      user?.userId ?? user?.user_id ?? user?.id ?? user?.UserId ?? user?.ID;

    if (
      recruiterUserId === null ||
      recruiterUserId === undefined ||
      recruiterUserId === ""
    ) {
      return null;
    }

    return Number(recruiterUserId);
  };

  const getRecruiterUserIdFromValue = (value) => {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value);

      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      return getRecruiterUserIdFromObject(parsed);
    } catch {
      return null;
    }
  };

  const getRecruiterUserId = () => {
    try {
      const directRecruiterId = localStorage.getItem("recruiterUserId");

      if (directRecruiterId) {
        console.log("Recruiter ID found directly:", directRecruiterId);
        return Number(directRecruiterId);
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
        const recruiterUserId = getRecruiterUserIdFromValue(storedUser);

        if (recruiterUserId !== null) {
          console.log(`User found in localStorage key "${key}":`, JSON.parse(storedUser));
          console.log("Recruiter User ID:", recruiterUserId);
          return recruiterUserId;
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key) {
          continue;
        }

        const value = localStorage.getItem(key);
        const recruiterUserId = getRecruiterUserIdFromValue(value);

        if (recruiterUserId !== null) {
          console.log(`Recruiter ID found in "${key}":`, recruiterUserId);
          return recruiterUserId;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting recruiter user ID:", error);
      return null;
    }
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Please enter a job title.";
    }

    if (!form.description.trim()) {
      return "Please enter a job description.";
    }

    if (!form.location.trim()) {
      return "Please enter a job location.";
    }

    if (form.experienceRequired !== "" && Number(form.experienceRequired) < 0) {
      return "Experience cannot be negative.";
    }

    if (form.minSalary !== "" && Number(form.minSalary) < 0) {
      return "Minimum salary cannot be negative.";
    }

    if (form.maxSalary !== "" && Number(form.maxSalary) < 0) {
      return "Maximum salary cannot be negative.";
    }

    if (
      form.minSalary !== "" &&
      form.maxSalary !== "" &&
      Number(form.minSalary) > Number(form.maxSalary)
    ) {
      return "Minimum salary cannot be greater than maximum salary.";
    }

    if (form.vacancies !== "" && Number(form.vacancies) < 1) {
      return "Number of vacancies must be at least 1.";
    }

    return "";
  };

  // =========================================================
  // UPDATE JOB
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // -------------------------------------------------------
    // Validate form
    // -------------------------------------------------------

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // -----------------------------------------------------
      // Get recruiter user ID
      // -----------------------------------------------------

      const recruiterUserId = getRecruiterUserId();

      console.log("Final recruiterUserId:", recruiterUserId);

      if (recruiterUserId === null || Number.isNaN(recruiterUserId)) {
        setError("Recruiter user ID not found. Please logout and login again.");

        return;
      }

      // -----------------------------------------------------
      // Prepare request body
      // -----------------------------------------------------

      const payload = {
        title: form.title.trim(),

        description: form.description.trim(),

        requiredSkills: form.requiredSkills.trim(),

        location: form.location.trim(),

        jobType: form.jobType,

        experienceRequired:
          form.experienceRequired === ""
            ? null
            : Number(form.experienceRequired),

        minSalary: form.minSalary === "" ? null : Number(form.minSalary),

        maxSalary: form.maxSalary === "" ? null : Number(form.maxSalary),

        vacancies: form.vacancies === "" ? null : Number(form.vacancies),
      };

      console.log("====================================");

      console.log("UPDATING JOB");

      console.log("Job ID:", jobId);

      console.log("Recruiter User ID:", recruiterUserId);

      console.log("Payload:", payload);

      console.log("====================================");

      // -----------------------------------------------------
      // IMPORTANT:
      // Send recruiterUserId as a query parameter.
      //
      // Final request:
      //
      // PUT /api/jobs/{jobId}?recruiterUserId=1
      // -----------------------------------------------------

      const response = await api.put(`/jobs/${jobId}`, payload, {
        params: {
          recruiterUserId: recruiterUserId,
        },
      });

      console.log("Update response:", response.data);

      // -----------------------------------------------------
      // Success
      // -----------------------------------------------------

      setSuccess("Job updated successfully!");

      // -----------------------------------------------------
      // Redirect after successful update
      // -----------------------------------------------------

      setTimeout(() => {
        navigate("/recruiter/jobs");
      }, 1200);
    } catch (err) {
      console.error("Failed to update job:", err);

      console.error("Backend response:", err.response?.data);

      console.error("HTTP status:", err.response?.status);

      // -----------------------------------------------------
      // Handle backend error
      // -----------------------------------------------------

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update job. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="recruiter-edit-loading">
        <div className="edit-spinner"></div>

        <p>Loading job details...</p>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="recruiter-edit-page">
      <div className="recruiter-edit-container">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="edit-page-header">
          <Link to="/recruiter/jobs" className="edit-back-link">
            <ArrowLeft size={18} />

            <span>Back to My Jobs</span>
          </Link>

          <div className="edit-heading">
            <div className="edit-heading-icon">
              <Briefcase size={26} />
            </div>

            <div>
              <span className="edit-eyebrow">JOB MANAGEMENT</span>

              <h1>Edit Job</h1>

              <p>
                Update your job posting and keep the information accurate for
                candidates.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form className="recruiter-edit-form-card" onSubmit={handleSubmit}>
          {/* =================================================
              JOB INFORMATION
          ================================================= */}

          <div className="edit-section">
            <div className="edit-section-header">
              <div className="edit-section-icon">
                <Briefcase size={20} />
              </div>

              <div>
                <h2>Job Information</h2>

                <p>Provide the basic information about this position.</p>
              </div>
            </div>

            {/* JOB TITLE */}

            <div className="edit-form-group full-width">
              <label htmlFor="title">Job Title</label>

              <div className="edit-input-wrapper">
                <Briefcase size={18} />

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Java Backend Developer"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="edit-form-group full-width">
              <label htmlFor="description">Job Description</label>

              <div className="edit-textarea-wrapper">
                <FileText size={18} />

                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe the role, responsibilities and expectations..."
                  value={form.description}
                  onChange={handleChange}
                  rows={7}
                />
              </div>
            </div>

            {/* REQUIRED SKILLS */}

            <div className="edit-form-group full-width">
              <label htmlFor="requiredSkills">Required Skills</label>

              <div className="edit-input-wrapper">
                <Code2 size={18} />

                <input
                  id="requiredSkills"
                  name="requiredSkills"
                  type="text"
                  placeholder="Java, Spring Boot, SQL, Git"
                  value={form.requiredSkills}
                  onChange={handleChange}
                />
              </div>

              <small>Separate multiple skills with commas.</small>
            </div>
          </div>

          {/* =================================================
              JOB DETAILS
          ================================================= */}

          <div className="edit-section">
            <div className="edit-section-header">
              <div className="edit-section-icon">
                <MapPin size={20} />
              </div>

              <div>
                <h2>Job Details</h2>

                <p>
                  Specify the location, employment type and experience
                  requirements.
                </p>
              </div>
            </div>

            <div className="edit-form-grid">
              {/* LOCATION */}

              <div className="edit-form-group">
                <label htmlFor="location">Location</label>

                <div className="edit-input-wrapper">
                  <MapPin size={18} />

                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Bangalore"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* EMPLOYMENT TYPE */}

              <div className="edit-form-group">
                <label htmlFor="jobType">Employment Type</label>

                <div className="edit-select-wrapper">
                  <Briefcase size={18} />

                  <select
                    id="jobType"
                    name="jobType"
                    value={form.jobType}
                    onChange={handleChange}
                  >
                    <option value="FULL_TIME">Full Time</option>

                    <option value="PART_TIME">Part Time</option>

                    <option value="INTERNSHIP">Internship</option>

                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
              </div>

              {/* EXPERIENCE */}

              <div className="edit-form-group">
                <label htmlFor="experienceRequired">Experience Required</label>

                <div className="edit-number-wrapper">
                  <input
                    id="experienceRequired"
                    name="experienceRequired"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.experienceRequired}
                    onChange={handleChange}
                  />

                  <span>years</span>
                </div>
              </div>

              {/* VACANCIES */}

              <div className="edit-form-group">
                <label htmlFor="vacancies">Number of Vacancies</label>

                <div className="edit-input-wrapper">
                  <Users size={18} />

                  <input
                    id="vacancies"
                    name="vacancies"
                    type="number"
                    min="1"
                    placeholder="3"
                    value={form.vacancies}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              SALARY
          ================================================= */}

          <div className="edit-section">
            <div className="edit-section-header">
              <div className="edit-section-icon">
                <IndianRupee size={20} />
              </div>

              <div>
                <h2>Salary Range</h2>

                <p>Add the expected salary range for this position.</p>
              </div>
            </div>

            <div className="edit-form-grid">
              {/* MINIMUM SALARY */}

              <div className="edit-form-group">
                <label htmlFor="minSalary">Minimum Salary</label>

                <div className="salary-input-wrapper">
                  <span>₹</span>

                  <input
                    id="minSalary"
                    name="minSalary"
                    type="number"
                    min="0"
                    placeholder="300000"
                    value={form.minSalary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* MAXIMUM SALARY */}

              <div className="edit-form-group">
                <label htmlFor="maxSalary">Maximum Salary</label>

                <div className="salary-input-wrapper">
                  <span>₹</span>

                  <input
                    id="maxSalary"
                    name="maxSalary"
                    type="number"
                    min="0"
                    placeholder="600000"
                    value={form.maxSalary}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              ERROR / SUCCESS
          ================================================= */}

          {error && <div className="edit-error">{error}</div>}

          {success && <div className="edit-success">{success}</div>}

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="edit-form-actions">
            <Link to="/recruiter/jobs" className="edit-cancel-btn">
              <X size={18} />

              <span>Cancel</span>
            </Link>

            <button type="submit" className="edit-save-btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="edit-button-spinner"></span>

                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={18} />

                  <span>Update Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecruiterJobEdit;
