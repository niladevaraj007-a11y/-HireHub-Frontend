import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";
import "./CreateCompany.css";

function CreateCompany() {
  const navigate = useNavigate();

  const [recruiter, setRecruiter] = useState(null);

  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    website: "",
    location: "",
    companySize: "",
  });

  const [loadingRecruiter, setLoadingRecruiter] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD RECRUITER
  // =========================================================

  useEffect(() => {
    const loadRecruiter = async () => {
      try {
        setLoadingRecruiter(true);
        setError("");

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(storedUser);

        if (user.role !== "RECRUITER") {
          setError("Only recruiters can create a company.");
          return;
        }

        const userId = user.userId || user.id;

        if (!userId) {
          setError("User ID not found. Please login again.");
          return;
        }

        console.log("Loading recruiter for user:", userId);

        const response = await api.get(`/recruiters/user/${userId}`);

        console.log("Recruiter:", response.data);

        setRecruiter(response.data);
      } catch (err) {
        console.error("Failed to load recruiter:", err);

        setError(
          err.response?.data?.message || "Unable to load recruiter profile.",
        );
      } finally {
        setLoadingRecruiter(false);
      }
    };

    loadRecruiter();
  }, [navigate]);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!recruiter?.recruiterId) {
      setError("Recruiter profile was not found.");
      return;
    }

    if (!formData.companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    try {
      setSaving(true);

      const companyData = {
        companyName: formData.companyName.trim(),
        description: formData.description.trim(),
        website: formData.website.trim(),
        location: formData.location.trim(),
        companySize: formData.companySize,
      };

      console.log("Creating company:", companyData);

      const response = await api.post(
        `/companies/recruiter/${recruiter.recruiterId}`,
        companyData,
      );

      console.log("Company created:", response.data);

      setSuccess("Company created successfully!");

      setTimeout(() => {
        navigate("/recruiter/jobs");
      }, 1200);
    } catch (err) {
      console.error("Company creation failed:", err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create company.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingRecruiter) {
    return (
      <div className="create-company-loading">
        <div className="create-company-loading-card">
          <div className="loading-spinner"></div>
          <p>Loading recruiter profile...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="create-company-page">
      {/* =====================================================
          TOP BAR
          ===================================================== */}

      <div className="create-company-topbar">
        <button
          type="button"
          className="create-company-back"
          onClick={() => navigate("/recruiter/jobs")}
        >
          <ArrowLeft size={18} />
          <span>Back to My Jobs</span>
        </button>
      </div>

      {/* =====================================================
          MAIN CONTAINER
          ===================================================== */}

      <div className="create-company-container">
        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="create-company-heading">
          <div className="create-company-heading-icon">
            <Building2 size={28} strokeWidth={2} />
          </div>

          <div>
            <div className="create-company-eyebrow">RECRUITER PROFILE</div>

            <h1>Create Your Company</h1>

            <p>
              Add your company information to start posting jobs and connecting
              with talented candidates.
            </p>
          </div>
        </div>

        {/* ===================================================
            FORM CARD
            =================================================== */}

        <div className="create-company-card">
          <div className="create-company-card-header">
            <div>
              <h2>Company Information</h2>

              <p>Tell candidates about your organization.</p>
            </div>

            <div className="required-note">
              <span>*</span> Required
            </div>
          </div>

          <div className="create-company-divider"></div>

          <form className="create-company-form" onSubmit={handleSubmit}>
            {/* =================================================
                COMPANY NAME
                ================================================= */}

            <div className="create-company-field">
              <label htmlFor="companyName">
                Company Name <span>*</span>
              </label>

              <div className="create-company-input">
                <Building2 size={18} />

                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="e.g. TechNova Solutions"
                  value={formData.companyName}
                  onChange={handleChange}
                  autoComplete="organization"
                />
              </div>

              <small>Enter the official name of your company.</small>
            </div>

            {/* =================================================
                DESCRIPTION
                ================================================= */}

            <div className="create-company-field">
              <label htmlFor="description">Company Description</label>

              <div className="create-company-input textarea-input">
                <FileText size={18} />

                <textarea
                  id="description"
                  name="description"
                  placeholder="Tell candidates about your company, culture, products and services..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              <small>
                A short description helps candidates understand your
                organization.
              </small>
            </div>

            {/* =================================================
                WEBSITE + LOCATION
                ================================================= */}

            <div className="create-company-row">
              <div className="create-company-field">
                <label htmlFor="website">Company Website</label>

                <div className="create-company-input">
                  <Globe size={18} />

                  <input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleChange}
                    autoComplete="url"
                  />
                </div>
              </div>

              <div className="create-company-field">
                <label htmlFor="location">Location</label>

                <div className="create-company-input">
                  <MapPin size={18} />

                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={formData.location}
                    onChange={handleChange}
                    autoComplete="address-level2"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                COMPANY SIZE
                ================================================= */}

            <div className="create-company-field">
              <label htmlFor="companySize">Company Size</label>

              <div className="create-company-input">
                <Users size={18} />

                <select
                  id="companySize"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                >
                  <option value="">Select company size</option>

                  <option value="1-10">1-10 employees</option>

                  <option value="11-50">11-50 employees</option>

                  <option value="51-200">51-200 employees</option>

                  <option value="201-500">201-500 employees</option>

                  <option value="501-1000">501-1000 employees</option>

                  <option value="1001+">1001+ employees</option>
                </select>
              </div>
            </div>

            {/* =================================================
                ERROR
                ================================================= */}

            {error && (
              <div className="create-company-error">
                <AlertCircle size={19} />

                <span>{error}</span>
              </div>
            )}

            {/* =================================================
                SUCCESS
                ================================================= */}

            {success && (
              <div className="create-company-success">
                <CheckCircle size={19} />

                <span>{success}</span>
              </div>
            )}

            {/* =================================================
                ACTIONS
                ================================================= */}

            <div className="create-company-actions">
              <button
                type="button"
                className="create-company-cancel"
                onClick={() => navigate("/recruiter/jobs")}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-company-submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    {' '}
                    Creating Company...
                  </>
                ) : (
                  <>
                    <Building2 size={18} />
                    Create Company
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ===================================================
            FOOTER NOTE
            =================================================== */}

        <div className="create-company-footer">
          <CheckCircle size={16} />

          <span>
            Once your company is created, you can start posting job
            opportunities from your recruiter dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}

export default CreateCompany;
