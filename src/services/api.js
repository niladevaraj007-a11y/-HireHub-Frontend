import axios from "axios";

// =========================================================
// API BASE URL
// =========================================================
//
// Local development:
//   http://localhost:8080/api
//
// Production:
//   Set VITE_API_URL in your frontend hosting environment:
//
//   VITE_API_URL=https://hirehub-backend-1-qg2a.onrender.com/api
//
// =========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

// =========================================================
// REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use(
  (config) => {
    // -------------------------------------------------------
    // JWT TOKEN
    // -------------------------------------------------------

    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // -------------------------------------------------------
    // FORM DATA
    // -------------------------------------------------------
    //
    // For FormData, DO NOT manually set Content-Type.
    // The browser must generate the multipart boundary.
    //
    // -------------------------------------------------------

    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    config.headers = config.headers || {};

    if (isFormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    // -------------------------------------------------------
    // 401 UNAUTHORIZED
    // -------------------------------------------------------
    //
    // Only clear authentication when the server explicitly
    // says the token/session is unauthorized.
    //
    // -------------------------------------------------------

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("seekerId");

      window.dispatchEvent(new Event("authChanged"));
    }

    return Promise.reject(error);
  },
);

export default api;
