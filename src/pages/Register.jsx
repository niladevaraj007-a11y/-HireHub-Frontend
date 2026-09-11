
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "JOB_SEEKER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/register",
        formData
      );

      console.log("Registration response:", response.data);

      setSuccess(
        "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Registration failed:", err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">

        <div className="auth-brand">
          <div className="auth-logo">
            <Briefcase size={25} />
          </div>

          <h1>Create your account</h1>

          <p>
            Join HireHub and take the next step in your career.
          </p>
        </div>

        <div className="auth-card card">

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">
                <User size={18} />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Account Type */}
            <div className="form-group">
              <label htmlFor="role">
                Account Type
              </label>

              <div className="role-options">

                {/* Job Seeker */}
                <label
                  className={
                    formData.role === "JOB_SEEKER"
                      ? "role-option selected"
                      : "role-option"
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value="JOB_SEEKER"
                    checked={
                      formData.role === "JOB_SEEKER"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>Job Seeker</strong>
                    <small>
                      Find jobs and manage applications
                    </small>
                  </span>
                </label>

                {/* Recruiter */}
                <label
                  className={
                    formData.role === "RECRUITER"
                      ? "role-option selected"
                      : "role-option"
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value="RECRUITER"
                    checked={
                      formData.role === "RECRUITER"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>Recruiter</strong>
                    <small>
                      Post jobs and find candidates
                    </small>
                  </span>
                </label>

              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="primary-btn auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}

              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link
            to="/login"
            className="secondary-btn auth-register"
          >
            Sign In
          </Link>

        </div>

        <p className="auth-footer">
          By creating an account, you agree to HireHub's terms
          and privacy policy.
        </p>

      </div>
    </div>
  );
}

export default Register;

