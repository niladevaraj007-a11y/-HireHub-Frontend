import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  FileText,
  Code,
  GraduationCap,
  IndianRupee,
  Users,
  CheckCircle,
  AlertCircle,
  Building2,
} from "lucide-react";

import api from "../services/api";
import "./RecruiterCreateJob.css";

function RecruiterCreateJob() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    location: "",
    experienceRequired: "",
    minSalary: "",
    maxSalary: "",
    jobType: "FULL_TIME",
    vacancies: 1,
    status: "OPEN",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // GET LOGGED-IN USER ID
  // =========================================================

  const getUserId = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser);

      return user?.userId ?? user?.id ?? user?.recruiterUserId ?? null;
    } catch (err) {
      console.error("Invalid user data:", err);
      return null;
    }
  };

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Job title is required.";
    }

    if (!formData.description.trim()) {
      return "Job description is required.";
    }

    if (!formData.location.trim()) {
      return "Job location is required.";
    }

    if (
      formData.experienceRequired !== "" &&
      Number(formData.experienceRequired) < 0
    ) {
      return "Experience cannot be negative.";
    }

    if (formData.minSalary !== "" && Number(formData.minSalary) < 0) {
      return "Minimum salary cannot be negative.";
    }

    if (formData.maxSalary !== "" && Number(formData.maxSalary) < 0) {
      return "Maximum salary cannot be negative.";
    }

    if (
      formData.minSalary !== "" &&
      formData.maxSalary !== "" &&
      Number(formData.minSalary) > Number(formData.maxSalary)
    ) {
      return "Minimum salary cannot be greater than maximum salary.";
    }

    if (Number(formData.vacancies) <= 0) {
      return "Vacancies must be greater than zero.";
    }

    return "";
  };

  // =========================================================
  // SUBMIT JOB
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const recruiterUserId = getUserId();

    if (!recruiterUserId) {
      setError(
        "Unable to identify your recruiter account. Please login again.",
      );
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const jobData = {
        title: formData.title.trim(),

        description: formData.description.trim(),

        requiredSkills: formData.requiredSkills.trim(),

        location: formData.location.trim(),

        experienceRequired:
          formData.experienceRequired === ""
            ? null
            : Number(formData.experienceRequired),

        minSalary:
          formData.minSalary === "" ? null : Number(formData.minSalary),

        maxSalary:
          formData.maxSalary === "" ? null : Number(formData.maxSalary),

        jobType: formData.jobType,

        status: formData.status,

        vacancies: Number(formData.vacancies),
      };

      console.log("Creating job...");
      console.log("Recruiter User ID:", recruiterUserId);
      console.log("Job data:", jobData);

      const response = await api.post(
        `/jobs?recruiterUserId=${recruiterUserId}`,
        jobData,
      );

      console.log("Job created:", response.data);

      alert("Job posted successfully!");

      navigate("/recruiter/jobs");
    } catch (err) {
      console.error("Failed to create job:", err);
      console.error("Backend response:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to post job. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-job-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="create-job-header">
        <div className="create-job-header-inner">
          <Link to="/recruiter/jobs" className="create-job-back-link">
            <ArrowLeft size={17} />
            Back to My Jobs
          </Link>

          <div className="create-job-header-content">
            <div className="create-job-eyebrow">
              <Briefcase size={14} />
              Recruiter Portal
            </div>

            <h1>Post a New Job</h1>

            <p>
              Create a professional job listing and attract qualified candidates
              to your organization.
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="create-job-main">
        <div className="create-job-layout">
          {/* =================================================
              FORM CARD
          ================================================= */}

          <section className="job-form-card">
            <div className="job-form-card-header">
              <div className="job-form-header-icon">
                <Building2 size={21} />
              </div>

              <div>
                <h2>Job Details</h2>

                <p>
                  Fill in the information below to publish your job opening.
                </p>
              </div>
            </div>

            <form className="job-form" onSubmit={handleSubmit}>
              {/* ERROR */}

              {error && (
                <div className="create-job-error">
                  <AlertCircle size={18} />

                  <span>{error}</span>
                </div>
              )}

              {/* =================================================
                  JOB INFORMATION
              ================================================= */}

              <div className="create-job-section-title">
                <Briefcase size={18} />
                Job Information
              </div>

              {/* TITLE */}

              <div className="create-job-input-group">
                <label>
                  <Briefcase size={15} />
                  Job Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Java Backend Developer"
                  required
                />

                <span className="create-job-helper">
                  Use a clear and specific job title.
                </span>
              </div>

              {/* DESCRIPTION */}

              <div className="create-job-input-group">
                <label>
                  <FileText size={15} />
                  Job Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the role, responsibilities, qualifications and expectations..."
                  rows={6}
                  required
                />
              </div>

              {/* SKILLS */}

              <div className="create-job-input-group">
                <label>
                  <Code size={15} />
                  Required Skills
                </label>

                <input
                  type="text"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleChange}
                  placeholder="Java, Spring Boot, MySQL, REST API"
                />

                <span className="create-job-helper">
                  Separate multiple skills with commas.
                </span>
              </div>

              {/* LOCATION */}

              <div className="create-job-input-group">
                <label>
                  <MapPin size={15} />
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Bangalore, Chennai or Remote"
                  required
                />
              </div>

              {/* =================================================
                  JOB DETAILS
              ================================================= */}

              <div className="create-job-section-title">
                <GraduationCap size={18} />
                Job Details
              </div>

              <div className="create-job-input-grid">
                {/* EXPERIENCE */}

                <div className="create-job-input-group">
                  <label>
                    <GraduationCap size={15} />
                    Experience Required
                  </label>

                  <input
                    type="number"
                    name="experienceRequired"
                    value={formData.experienceRequired}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />

                  <span className="create-job-helper">
                    Enter 0 for freshers.
                  </span>
                </div>

                {/* VACANCIES */}

                <div className="create-job-input-group">
                  <label>
                    <Users size={15} />
                    Number of Vacancies
                  </label>

                  <input
                    type="number"
                    name="vacancies"
                    value={formData.vacancies}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* =================================================
                  COMPENSATION
              ================================================= */}

              <div className="create-job-section-title">
                <IndianRupee size={18} />
                Compensation
              </div>

              <div className="create-job-input-grid">
                {/* MINIMUM */}

                <div className="create-job-input-group">
                  <label>
                    <IndianRupee size={15} />
                    Minimum Salary
                  </label>

                  <input
                    type="number"
                    name="minSalary"
                    value={formData.minSalary}
                    onChange={handleChange}
                    placeholder="300000"
                    min="0"
                  />
                </div>

                {/* MAXIMUM */}

                <div className="create-job-input-group">
                  <label>
                    <IndianRupee size={15} />
                    Maximum Salary
                  </label>

                  <input
                    type="number"
                    name="maxSalary"
                    value={formData.maxSalary}
                    onChange={handleChange}
                    placeholder="600000"
                    min="0"
                  />
                </div>
              </div>

              {/* =================================================
                  EMPLOYMENT TYPE
              ================================================= */}

              <div className="create-job-section-title">
                <Briefcase size={18} />
                Employment Type
              </div>

              <div className="create-job-input-group">
                <label>
                  <Briefcase size={15} />
                  Job Type
                </label>

                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                >
                  <option value="FULL_TIME">Full Time</option>

                  <option value="PART_TIME">Part Time</option>

                  <option value="INTERNSHIP">Internship</option>

                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="create-job-form-actions">
                <Link to="/recruiter/jobs" className="create-job-cancel-button">
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="create-job-post-button"
                  disabled={loading}
                >
                  {loading ? (
                    "Posting..."
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      Post Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* =================================================
              SIDE INFORMATION
          ================================================= */}

          <aside className="create-job-side-card">
            <div className="create-job-side-icon">
              <Briefcase size={21} />
            </div>

            <h3>Create a Great Job Post</h3>

            <p>
              A clear and detailed job posting helps you attract better
              candidates.
            </p>

            <div className="create-job-side-point">
              <div className="create-job-side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Clear job title</strong>

                <span>
                  Use a specific role name candidates can easily understand.
                </span>
              </div>
            </div>

            <div className="create-job-side-point">
              <div className="create-job-side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Relevant skills</strong>

                <span>
                  Add technologies and skills required for the position.
                </span>
              </div>
            </div>

            <div className="create-job-side-point">
              <div className="create-job-side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Accurate details</strong>

                <span>
                  Provide location, salary and vacancy information clearly.
                </span>
              </div>
            </div>

            <div className="create-job-side-point">
              <div className="create-job-side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Freshers welcome</strong>

                <span>
                  Enter 0 years experience when hiring fresh graduates.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default RecruiterCreateJob;
