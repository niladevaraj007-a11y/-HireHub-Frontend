import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import Interviews from "./pages/Interviews";
import Profile from "./pages/Profile";

import RecruiterJobs from "./pages/RecruiterJobs";
import RecruiterApplicants from "./pages/RecruiterApplicants";
import RecruiterJobEdit from "./pages/RecruiterJobEdit";
import RecruiterCreateJob from "./pages/RecruiterCreateJob";
import CreateCompany from "./pages/CreateCompany";
import ManageCompany from "./pages/ManageCompany";
/* =========================================================
   GET STORED USER
========================================================= */

function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);

    if (parsedUser && typeof parsedUser === "object") {
      return parsedUser;
    }

    return null;
  } catch (error) {
    console.error("Unable to read stored user:", error);
    return null;
  }
}

/* =========================================================
   GET USER ROLE
========================================================= */

function getUserRole() {
  const user = getStoredUser();

  const role =
    localStorage.getItem("role") || user?.role || user?.userRole || "";

  return String(role).trim().toUpperCase();
}

/* =========================================================
   LOGIN CHECK
========================================================= */

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children, allowedRole }) {
  const loggedIn = isLoggedIn();
  const role = getUserRole();

  /* -------------------------------------------------------
     NOT LOGGED IN
  ------------------------------------------------------- */

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  /* -------------------------------------------------------
     WRONG ROLE
  ------------------------------------------------------- */

  if (allowedRole && role !== allowedRole) {
    if (role === "RECRUITER") {
      return <Navigate to="/recruiter/jobs" replace />;
    }

    if (role === "JOB_SEEKER") {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* =====================================================
            PUBLIC
        ====================================================== */}

        <Route path="/" element={<Home />} />

        <Route path="/jobs" element={<Jobs />} />

        <Route path="/jobs/:jobId" element={<JobDetails />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* =====================================================
            JOB SEEKER
        ====================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="JOB_SEEKER">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRole="JOB_SEEKER">
              <Applications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews"
          element={
            <ProtectedRoute allowedRole="JOB_SEEKER">
              <Interviews />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PROFILE
            Both recruiter and candidate can access profile.
        ====================================================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            RECRUITER
        ====================================================== */}

        {/* -----------------------------------------------------
            CREATE COMPANY
        ----------------------------------------------------- */}

        <Route
          path="/recruiter/company/create"
          element={
            <ProtectedRoute allowedRole="RECRUITER">
              <CreateCompany />
            </ProtectedRoute>
          }
        />

        {/* -----------------------------------------------------
            RECRUITER JOBS
        ----------------------------------------------------- */}

        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute allowedRole="RECRUITER">
              <RecruiterJobs />
            </ProtectedRoute>
          }
        />

        {/* -----------------------------------------------------
            CREATE JOB
        ----------------------------------------------------- */}

        <Route
          path="/recruiter/jobs/create"
          element={
            <ProtectedRoute allowedRole="RECRUITER">
              <RecruiterCreateJob />
            </ProtectedRoute>
          }
        />

        {/* -----------------------------------------------------
            JOB APPLICANTS
        ----------------------------------------------------- */}

        <Route
          path="/recruiter/jobs/:jobId/applicants"
          element={
            <ProtectedRoute allowedRole="RECRUITER">
              <RecruiterApplicants />
            </ProtectedRoute>
          }
        />

        {/* -----------------------------------------------------
            EDIT JOB
        ----------------------------------------------------- */}

        <Route
          path="/recruiter/jobs/:jobId/edit"
          element={
            <ProtectedRoute allowedRole="RECRUITER">
              <RecruiterJobEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/company"
          element={
            <ProtectedRoute allowedRole="RECRUITER">
              <ManageCompany />
            </ProtectedRoute>
          }
        />
        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
