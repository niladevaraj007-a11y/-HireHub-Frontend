import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// =========================================================
// REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Add JWT token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // =======================================================
    // FORM DATA REQUEST
    // =======================================================

    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData) {
      // IMPORTANT:
      // Never force Content-Type for FormData.
      // The browser/Axios adds:
      //
      // multipart/form-data; boundary=...
      //

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
