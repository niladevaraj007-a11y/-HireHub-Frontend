import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import "./ManageCompany.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ManageCompany() {
  const navigate = useNavigate();

  const [recruiter, setRecruiter] = useState(null);
  const [company, setCompany] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    website: "",
    location: "",
    companySize: "",
  });

  // =========================================================
  // LOAD USER + COMPANY
  // =========================================================

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        navigate("/login");
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== "RECRUITER") {
        navigate("/dashboard");
        return;
      }

      const userId = parsedUser.userId || parsedUser.id;

      if (!userId) {
        throw new Error("User ID not found");
      }

      // -------------------------------------------------------
      // Get recruiter
      // -------------------------------------------------------

      const recruiterResponse = await axios.get(
        `${API_BASE_URL}/recruiters/user/${userId}`,
      );

      const recruiterData = recruiterResponse.data;

      setRecruiter(recruiterData);

      // -------------------------------------------------------
      // Check company
      // -------------------------------------------------------

      if (!recruiterData.companyId) {
        setCompany(null);
        return;
      }

      // -------------------------------------------------------
      // Get company
      // -------------------------------------------------------

      const companyResponse = await axios.get(
        `${API_BASE_URL}/companies/${recruiterData.companyId}`,
      );

      const companyData = companyResponse.data;

      setCompany(companyData);

      setFormData({
        companyName: companyData.companyName || "",
        description: companyData.description || "",
        website: companyData.website || "",
        location: companyData.location || "",
        companySize: companyData.companySize || "",
      });
    } catch (error) {
      console.error("Error loading company:", error);

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to load company details.",
      );
    } finally {
      setLoading(false);
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

    setSuccessMessage("");
    setErrorMessage("");
  };

  // =========================================================
  // SAVE COMPANY
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!recruiter || !company) {
      return;
    }

    if (!formData.companyName.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      const response = await axios.put(
        `${API_BASE_URL}/companies/recruiter/${recruiter.recruiterId}/${company.companyId}`,
        formData,
      );

      setCompany(response.data);

      setFormData({
        companyName: response.data.companyName || "",
        description: response.data.description || "",
        website: response.data.website || "",
        location: response.data.location || "",
        companySize: response.data.companySize || "",
      });

      setSuccessMessage("Company details updated successfully.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error updating company:", error);

      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Unable to update company details.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="manage-company-loading">
        <Loader2 className="manage-company-spinner" size={32} />

        <p>Loading company details...</p>
      </div>
    );
  }

  // =========================================================
  // NO COMPANY
  // =========================================================

  if (!company) {
    return (
      <div className="manage-company-page">
        <div className="manage-company-empty">
          <div className="manage-company-empty-icon">
            <Building2 size={32} />
          </div>

          <h2>No Company Found</h2>

          <p>
            You have not created a company yet. Create your company profile
            before posting jobs.
          </p>

          <button
            className="manage-company-primary-button"
            onClick={() => navigate("/recruiter/company/create")}
          >
            <Building2 size={18} />
            Create Company
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="manage-company-page">
      <div className="manage-company-container">
        {/* HEADER */}

        <div className="manage-company-header">
          <div>
            <button
              className="manage-company-back-button"
              onClick={() => navigate("/recruiter/jobs")}
            >
              <ArrowLeft size={17} />
              Back to My Jobs
            </button>

            <div className="manage-company-title-row">
              <div className="manage-company-title-icon">
                <Building2 size={28} />
              </div>

              <div>
                <h1>Manage Company</h1>

                <p>Update your company information and profile details.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS */}

        {successMessage && (
          <div className="manage-company-alert success">
            <CheckCircle size={20} />

            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="manage-company-alert error">
            <AlertCircle size={20} />

            <span>{errorMessage}</span>
          </div>
        )}

        {/* CONTENT */}

        <div className="manage-company-grid">
          {/* FORM */}

          <div className="manage-company-card">
            <div className="manage-company-card-header">
              <div>
                <h2>Company Information</h2>

                <p>Keep your company profile accurate for candidates.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* COMPANY NAME */}

              <div className="manage-company-field">
                <label htmlFor="companyName">Company Name</label>

                <div className="manage-company-input-wrapper">
                  <Building2 size={18} />

                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="manage-company-field">
                <label htmlFor="description">Company Description</label>

                <div className="manage-company-textarea-wrapper">
                  <FileText size={18} />

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your company..."
                    rows="6"
                  />
                </div>
              </div>

              {/* WEBSITE */}

              <div className="manage-company-field">
                <label htmlFor="website">Website</label>

                <div className="manage-company-input-wrapper">
                  <Globe size={18} />

                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* LOCATION */}

              <div className="manage-company-field">
                <label htmlFor="location">Location</label>

                <div className="manage-company-input-wrapper">
                  <MapPin size={18} />

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Bangalore, Karnataka"
                  />
                </div>
              </div>

              {/* COMPANY SIZE */}

              <div className="manage-company-field">
                <label htmlFor="companySize">Company Size</label>

                <div className="manage-company-input-wrapper">
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

                    <option value="1001-5000">1001-5000 employees</option>

                    <option value="5000+">5000+ employees</option>
                  </select>
                </div>
              </div>

              {/* BUTTON */}

              <div className="manage-company-actions">
                <button
                  type="button"
                  className="manage-company-cancel-button"
                  onClick={() => navigate("/recruiter/jobs")}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="manage-company-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="manage-company-button-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* PREVIEW */}

          <div className="manage-company-preview-card">
            <div className="manage-company-preview-icon">
              <Building2 size={34} />
            </div>

            <h2>{formData.companyName || "Your Company"}</h2>

            <p className="manage-company-preview-description">
              {formData.description ||
                "Your company description will appear here."}
            </p>

            <div className="manage-company-preview-details">
              {formData.location && (
                <div>
                  <MapPin size={17} />
                  <span>{formData.location}</span>
                </div>
              )}

              {formData.website && (
                <div>
                  <Globe size={17} />
                  <span>{formData.website}</span>
                </div>
              )}

              {formData.companySize && (
                <div>
                  <Users size={17} />
                  <span>{formData.companySize} employees</span>
                </div>
              )}
            </div>

            <div className="manage-company-preview-note">
              <CheckCircle size={17} />

              <span>This company belongs to your recruiter account.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageCompany;
