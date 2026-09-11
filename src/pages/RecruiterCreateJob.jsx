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
  Sparkles,
} from "lucide-react";

import api from "../services/api";

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
          STYLE
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: #f4f7fb;
        }

        .create-job-page {
          min-height: 100vh;
          background:
            linear-gradient(
              180deg,
              #f7faff 0%,
              #f4f7fb 100%
            );
          color: #172033;
          padding-bottom: 70px;
        }

        /* =====================================================
           HEADER
        ====================================================== */

        .create-job-header {
          background:
            linear-gradient(
              120deg,
              #061b4f 0%,
              #0b3d91 45%,
              #1268df 100%
            );

          color: white;
          padding: 26px 20px 115px;

          position: relative;
          overflow: hidden;
        }

        .create-job-header::before {
          content: "";

          position: absolute;

          width: 430px;
          height: 430px;

          border-radius: 50%;

          background: rgba(255,255,255,0.055);

          right: -160px;
          top: -230px;
        }

        .create-job-header::after {
          content: "";

          position: absolute;

          width: 280px;
          height: 280px;

          border-radius: 50%;

          background: rgba(255,255,255,0.035);

          left: -160px;
          bottom: -210px;
        }

        .header-inner {
          width: min(1100px, 94%);
          margin: auto;

          position: relative;
          z-index: 2;
        }

        .back-link {
          display: inline-flex;

          align-items: center;
          gap: 8px;

          color: rgba(255,255,255,0.9);

          text-decoration: none;

          font-size: 14px;
          font-weight: 600;

          padding: 9px 13px;

          border-radius: 8px;

          border: 1px solid rgba(255,255,255,0.18);

          background: rgba(255,255,255,0.07);

          transition: 0.2s ease;
        }

        .back-link:hover {
          background: rgba(255,255,255,0.14);
          transform: translateX(-2px);
        }

        .header-main {
          margin-top: 38px;
        }

        .header-badge {
          display: inline-flex;

          align-items: center;
          gap: 7px;

          padding: 7px 12px;

          border-radius: 30px;

          background: rgba(255,255,255,0.1);

          border: 1px solid rgba(255,255,255,0.16);

          font-size: 11px;
          font-weight: 700;

          letter-spacing: 0.8px;

          text-transform: uppercase;
        }

        .header-main h1 {
          margin: 17px 0 9px;

          font-size: clamp(32px, 4vw, 46px);

          line-height: 1.1;

          letter-spacing: -1.5px;

          font-weight: 750;
        }

        .header-main p {
          margin: 0;

          max-width: 650px;

          color: rgba(255,255,255,0.75);

          font-size: 15px;

          line-height: 1.6;
        }

        /* =====================================================
           MAIN
        ====================================================== */

        .create-job-main {
          width: min(1100px, 94%);

          margin: -65px auto 0;

          position: relative;
          z-index: 5;
        }

        .create-job-layout {
          display: grid;

          grid-template-columns: minmax(0, 1fr) 290px;

          gap: 24px;

          align-items: start;
        }

        /* =====================================================
           FORM CARD
        ====================================================== */

        .job-form-card {
          background: white;

          border: 1px solid #e2e8f0;

          border-radius: 18px;

          box-shadow:
            0 15px 45px rgba(15, 42, 78, 0.09);

          overflow: hidden;
        }

        .form-card-header {
          padding: 25px 30px;

          border-bottom: 1px solid #edf1f6;

          display: flex;

          align-items: center;

          gap: 14px;
        }

        .form-header-icon {
          width: 44px;
          height: 44px;

          border-radius: 11px;

          display: flex;

          align-items: center;
          justify-content: center;

          background: #eaf2ff;

          color: #1268df;
        }

        .form-card-header h2 {
          margin: 0 0 3px;

          font-size: 17px;

          color: #15233a;
        }

        .form-card-header p {
          margin: 0;

          font-size: 12px;

          color: #8491a5;
        }

        .job-form {
          padding: 30px;
        }

        /* =====================================================
           ERROR
        ====================================================== */

        .error-box {
          display: flex;

          align-items: flex-start;

          gap: 10px;

          padding: 14px 15px;

          margin-bottom: 25px;

          border-radius: 10px;

          background: #fff5f5;

          border: 1px solid #ffd5d5;

          color: #b4232f;

          font-size: 13px;

          line-height: 1.5;
        }

        .error-box svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* =====================================================
           SECTION
        ====================================================== */

        .form-section {
          display: flex;

          align-items: center;

          gap: 9px;

          margin: 30px 0 20px;

          padding-bottom: 12px;

          border-bottom: 1px solid #edf1f6;

          color: #172b4d;

          font-size: 14px;

          font-weight: 750;
        }

        .form-section:first-of-type {
          margin-top: 0;
        }

        .form-section svg {
          color: #1268df;
        }

        /* =====================================================
           INPUT GROUP
        ====================================================== */

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-bottom: 8px;

          color: #344054;

          font-size: 13px;

          font-weight: 700;
        }

        .input-group label svg {
          color: #1268df;
        }

        .input-group input,
        .input-group textarea,
        .input-group select {
          width: 100%;

          border: 1px solid #d9e1eb;

          border-radius: 9px;

          background: #fff;

          color: #172033;

          font-family: inherit;

          font-size: 14px;

          outline: none;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .input-group input,
        .input-group select {
          height: 47px;

          padding: 0 14px;
        }

        .input-group textarea {
          min-height: 145px;

          padding: 13px 14px;

          resize: vertical;

          line-height: 1.6;
        }

        .input-group input::placeholder,
        .input-group textarea::placeholder {
          color: #a0aabd;
        }

        .input-group input:hover,
        .input-group textarea:hover,
        .input-group select:hover {
          border-color: #b8c5d5;
        }

        .input-group input:focus,
        .input-group textarea:focus,
        .input-group select:focus {
          border-color: #1268df;

          box-shadow:
            0 0 0 3px rgba(18,104,223,0.1);
        }

        .helper {
          margin-top: 6px;

          font-size: 11px;

          color: #8b98aa;
        }

        /* =====================================================
           GRID
        ====================================================== */

        .input-grid {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 18px;
        }

        /* =====================================================
           BUTTONS
        ====================================================== */

        .form-actions {
          display: flex;

          justify-content: flex-end;

          gap: 11px;

          padding-top: 25px;

          margin-top: 30px;

          border-top: 1px solid #edf1f6;
        }

        .cancel-button,
        .post-button {
          min-height: 45px;

          padding: 0 20px;

          border-radius: 9px;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          font-size: 13px;

          font-weight: 700;

          text-decoration: none;

          cursor: pointer;

          transition: all 0.2s ease;
        }

        .cancel-button {
          color: #475467;

          background: white;

          border: 1px solid #d0d7e2;
        }

        .cancel-button:hover {
          background: #f8fafc;
        }

        .post-button {
          border: 1px solid #1268df;

          background:
            linear-gradient(
              135deg,
              #1268df,
              #0757c8
            );

          color: white;

          box-shadow:
            0 5px 15px rgba(18,104,223,0.22);
        }

        .post-button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 8px 20px rgba(18,104,223,0.28);
        }

        .post-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;

          transform: none;
        }

        /* =====================================================
           SIDE INFO
        ====================================================== */

        .job-side-card {
          background: white;

          border: 1px solid #e2e8f0;

          border-radius: 16px;

          padding: 24px;

          box-shadow:
            0 10px 30px rgba(15,42,78,0.06);

          position: sticky;

          top: 20px;
        }

        .side-icon {
          width: 43px;
          height: 43px;

          border-radius: 11px;

          display: flex;

          align-items: center;
          justify-content: center;

          background: #eef5ff;

          color: #1268df;

          margin-bottom: 16px;
        }

        .job-side-card h3 {
          margin: 0 0 8px;

          font-size: 16px;

          color: #172033;
        }

        .job-side-card > p {
          margin: 0 0 20px;

          font-size: 12px;

          color: #7c899b;

          line-height: 1.6;
        }

        .side-point {
          display: flex;

          gap: 10px;

          margin-bottom: 16px;
        }

        .side-point-icon {
          width: 26px;
          height: 26px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 7px;

          background: #f0f6ff;

          color: #1268df;
        }

        .side-point strong {
          display: block;

          margin-bottom: 2px;

          color: #344054;

          font-size: 12px;
        }

        .side-point span {
          display: block;

          color: #8b98aa;

          font-size: 11px;

          line-height: 1.4;
        }

        /* =====================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 850px) {

          .create-job-layout {
            grid-template-columns: 1fr;
          }

          .job-side-card {
            position: static;
          }

        }

        @media (max-width: 650px) {

          .create-job-header {
            padding: 22px 16px 100px;
          }

          .header-main {
            margin-top: 28px;
          }

          .create-job-main {
            width: 94%;
          }

          .job-form {
            padding: 22px 18px;
          }

          .form-card-header {
            padding: 21px 18px;
          }

          .input-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .cancel-button,
          .post-button {
            width: 100%;
          }

        }

      `}</style>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="create-job-header">
        <div className="header-inner">
          <Link to="/recruiter/jobs" className="back-link">
            <ArrowLeft size={16} />
            Back to My Jobs
          </Link>

          <div className="header-main">
            <div className="header-badge">
              <Sparkles size={13} />
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
              FORM
          ================================================= */}

          <div className="job-form-card">
            <div className="form-card-header">
              <div className="form-header-icon">
                <Building2 size={22} />
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
                <div className="error-box">
                  <AlertCircle size={18} />

                  <span>{error}</span>
                </div>
              )}

              {/* =================================================
                  JOB INFORMATION
              ================================================= */}

              <div className="form-section">
                <Briefcase size={18} />
                Job Information
              </div>

              {/* TITLE */}

              <div className="input-group">
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

                <div className="helper">
                  Use a clear and specific job title.
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="input-group">
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

              <div className="input-group">
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

                <div className="helper">
                  Separate multiple skills with commas.
                </div>
              </div>

              {/* LOCATION */}

              <div className="input-group">
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

              <div className="form-section">
                <GraduationCap size={18} />
                Job Details
              </div>

              <div className="input-grid">
                {/* EXPERIENCE */}

                <div className="input-group">
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

                  <div className="helper">Enter 0 for freshers.</div>
                </div>

                {/* VACANCIES */}

                <div className="input-group">
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

              <div className="form-section">
                <IndianRupee size={18} />
                Compensation
              </div>

              <div className="input-grid">
                {/* MIN */}

                <div className="input-group">
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

                {/* MAX */}

                <div className="input-group">
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

              <div className="form-section">
                <Briefcase size={18} />
                Employment Type
              </div>

              <div className="input-group">
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

              <div className="form-actions">
                <Link to="/recruiter/jobs" className="cancel-button">
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="post-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>Posting...</>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      Post Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* =================================================
              SIDE INFORMATION
          ================================================= */}

          <aside className="job-side-card">
            <div className="side-icon">
              <Briefcase size={21} />
            </div>

            <h3>Create a Great Job Post</h3>

            <p>
              A clear and detailed job posting helps you attract better
              candidates.
            </p>

            <div className="side-point">
              <div className="side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Clear job title</strong>

                <span>
                  Use a specific role name candidates can easily understand.
                </span>
              </div>
            </div>

            <div className="side-point">
              <div className="side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Relevant skills</strong>

                <span>
                  Add technologies and skills required for the position.
                </span>
              </div>
            </div>

            <div className="side-point">
              <div className="side-point-icon">
                <CheckCircle size={15} />
              </div>

              <div>
                <strong>Accurate details</strong>

                <span>
                  Provide location, salary and vacancy information clearly.
                </span>
              </div>
            </div>

            <div className="side-point">
              <div className="side-point-icon">
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
