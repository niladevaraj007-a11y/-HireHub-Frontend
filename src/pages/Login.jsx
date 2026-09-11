import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";

import api from "../services/api";
import "./Login.css";

/* =========================================================
   GET USER
========================================================= */
function getUser(data) {
  return data?.user || data?.userData || data?.account || data;
}

/* =========================================================
   GET TOKEN
========================================================= */
function getToken(data) {
  return (
    data?.token || data?.accessToken || data?.jwt || data?.access_token || null
  );
}

/* =========================================================
   GET USER ID
========================================================= */
function getUserId(data, user) {
  return (
    data?.userId ??
    data?.user_id ??
    data?.id ??
    data?.user?.userId ??
    data?.user?.user_id ??
    data?.user?.id ??
    user?.userId ??
    user?.user_id ??
    user?.id ??
    null
  );
}

/* =========================================================
   GET SEEKER ID
========================================================= */
function getSeekerId(data, user) {
  return (
    // Direct seekerId
    data?.seekerId ??
    data?.seeker_id ??
    // IMPORTANT:
    // Backend UserResponse contains JobSeeker separately
    data?.jobSeeker?.seekerId ??
    data?.jobSeeker?.seeker_id ??
    data?.jobSeeker?.id ??
    // Sometimes backend may return jobseeker
    // using a different capitalization/name
    data?.jobseeker?.seekerId ??
    data?.jobseeker?.seeker_id ??
    data?.jobseeker?.id ??
    // Nested inside user
    data?.user?.seekerId ??
    data?.user?.seeker_id ??
    // Existing user object
    user?.seekerId ??
    user?.seeker_id ??
    null
  );
}

/* =========================================================
   GET ROLE
========================================================= */
function getRole(data, user) {
  return (
    data?.role ||
    data?.userRole ||
    data?.user?.role ||
    data?.user?.userRole ||
    user?.role ||
    user?.userRole ||
    ""
  );
}

/* =========================================================
   SAVE USER
========================================================= */
function saveUser(user, userId, seekerId, role) {
  if (!user || typeof user !== "object") {
    return;
  }

  const updatedUser = {
    ...user,
  };

  if (userId !== null && userId !== undefined) {
    updatedUser.userId = userId;
  }

  if (seekerId !== null && seekerId !== undefined) {
    updatedUser.seekerId = seekerId;
  }

  if (role) {
    updatedUser.role = role;
  }

  localStorage.setItem("user", JSON.stringify(updatedUser));
}

/* =========================================================
   SAVE OPTIONAL ITEM
========================================================= */
function saveOptionalItem(key, value) {
  if (value !== null && value !== undefined && value !== "") {
    localStorage.setItem(key, String(value));
  } else {
    localStorage.removeItem(key);
  }
}

/* =========================================================
   SAVE NULLABLE ITEM
========================================================= */
function saveNullableItem(key, value) {
  if (value !== null && value !== undefined) {
    localStorage.setItem(key, String(value));
  } else {
    localStorage.removeItem(key);
  }
}

/* =========================================================
   SAVE LOGIN DATA
========================================================= */
function saveLoginData(data) {
  const user = getUser(data);

  const token = getToken(data);

  const userId = getUserId(data, user);

  const seekerId = getSeekerId(data, user);

  const role = getRole(data, user);

  console.log("========== LOGIN DATA ==========");

  console.log("Complete backend response:", data);

  console.log("User:", user);

  console.log("User ID:", userId);

  console.log("Job Seeker ID:", seekerId);

  console.log("Role:", role);

  console.log("JobSeeker object:", data?.jobSeeker);

  console.log("================================");

  /* -------------------------------------------------------
     Validate user
  ------------------------------------------------------- */

  if (!user || typeof user !== "object") {
    console.error("Invalid user returned from backend.");

    return false;
  }

  /* -------------------------------------------------------
     Save complete user
  ------------------------------------------------------- */

  saveUser(user, userId, seekerId, role);

  /* -------------------------------------------------------
     Save token
  ------------------------------------------------------- */

  saveOptionalItem("token", token);

  /* -------------------------------------------------------
     Save IDs separately
  ------------------------------------------------------- */

  saveNullableItem("userId", userId);

  saveNullableItem("seekerId", seekerId);

  /* -------------------------------------------------------
     Save role
  ------------------------------------------------------- */

  saveOptionalItem("role", role);

  /* -------------------------------------------------------
     Login marker
  ------------------------------------------------------- */

  localStorage.setItem("isLoggedIn", "true");

  return true;
}

/* =========================================================
   VALIDATE LOGIN
========================================================= */
function validateLogin(formData) {
  if (!formData.email.trim()) {
    return "Please enter your email.";
  }

  if (!formData.password) {
    return "Please enter your password.";
  }

  return "";
}

/* =========================================================
   ERROR MESSAGE
========================================================= */
function getErrorMessage(error) {
  const status = error.response?.status;

  const backendMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.detail;

  if (status === 400) {
    return backendMessage || "Please check your email and password.";
  }

  if (status === 401) {
    return "Invalid email or password.";
  }

  if (status === 403) {
    return "You are not authorized to login.";
  }

  if (status === 404) {
    return "Login service was not found.";
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return backendMessage || "Unable to login. Please try again.";
}

/* =========================================================
   LOGIN COMPONENT
========================================================= */
function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     HANDLE INPUT
  ======================================================= */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  /* =======================================================
     HANDLE LOGIN
  ======================================================= */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validateLogin(formData);

    if (validationError) {
      setError(validationError);

      return;
    }

    setLoading(true);

    try {
      /* ---------------------------------------------------
         LOGIN API
      --------------------------------------------------- */

      const response = await api.post("/auth/login", {
        email: formData.email.trim(),

        password: formData.password,
      });

      console.log("========== BACKEND LOGIN RESPONSE ==========");

      console.log(response.data);

      console.log("=============================================");

      /* ---------------------------------------------------
         SAVE LOGIN DATA
      --------------------------------------------------- */

      const saved = saveLoginData(response.data);

      if (!saved) {
        setError("Login response was not valid.");

        return;
      }

      /* ---------------------------------------------------
         READ USER
      --------------------------------------------------- */

      const loggedInUser = getUser(response.data);

      const userId = getUserId(response.data, loggedInUser);

      const seekerId = getSeekerId(response.data, loggedInUser);

      const role = getRole(response.data, loggedInUser);

      /* ---------------------------------------------------
         IMPORTANT DEBUG
      --------------------------------------------------- */

      console.log("========== LOGIN SUCCESS ==========");

      console.log("User:", loggedInUser);

      console.log("User ID:", userId);

      console.log("Seeker ID:", seekerId);

      console.log("Role:", role);

      console.log("Stored localStorage user:", localStorage.getItem("user"));

      console.log(
        "Stored localStorage userId:",
        localStorage.getItem("userId"),
      );

      console.log(
        "Stored localStorage seekerId:",
        localStorage.getItem("seekerId"),
      );

      console.log("==================================");

      /* ---------------------------------------------------
         JOB SEEKER VALIDATION
      --------------------------------------------------- */

      if (role === "JOB_SEEKER" && !seekerId) {
        console.error(
          "ERROR: Login succeeded but JobSeeker ID was not returned.",
        );

        console.error("Backend response:", response.data);

        /*
         * Do not block login.
         * But this tells us backend UserResponse
         * still needs checking.
         */
      }

      /* ---------------------------------------------------
         NOTIFY OTHER COMPONENTS
      --------------------------------------------------- */

      window.dispatchEvent(new Event("authChanged"));

      /* ---------------------------------------------------
         REDIRECT
      --------------------------------------------------- */

      if (role === "RECRUITER") {
        navigate("/recruiter/jobs", {
          replace: true,
        });
      } else {
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (loginError) {
      console.error("Login failed:", loginError);

      console.error("Status:", loginError.response?.status);

      console.error("Backend response:", loginError.response?.data);

      setError(getErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* HEADER */}

          <div className="login-header">
            <div className="login-icon">
              <LogIn size={28} />
            </div>

            <h1>Welcome Back</h1>

            <p>Login to your HireHub account</p>
          </div>

          {/* ERROR */}

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          {/* FORM */}

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            {/* PASSWORD */}

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* LOGIN */}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* REGISTER */}

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
