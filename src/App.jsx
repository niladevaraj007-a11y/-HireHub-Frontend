import { BrowserRouter, Routes, Route } from "react-router-dom";

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

        {/* =====================================================
            JOB DETAILS
            IMPORTANT:
            JobDetails.jsx uses useParams().jobId
        ====================================================== */}

        <Route path="/jobs/:jobId" element={<JobDetails />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* =====================================================
            JOB SEEKER
        ====================================================== */}

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/applications" element={<Applications />} />

        <Route path="/interviews" element={<Interviews />} />

        <Route path="/profile" element={<Profile />} />

        {/* =====================================================
            RECRUITER
        ====================================================== */}

        {/* Recruiter's jobs */}

        <Route path="/recruiter/jobs" element={<RecruiterJobs />} />

        {/* Applicants for a particular job */}

        <Route
          path="/recruiter/jobs/:jobId/applicants"
          element={<RecruiterApplicants />}
        />

        {/* Edit particular job */}

        <Route
          path="/recruiter/jobs/:jobId/edit"
          element={<RecruiterJobEdit />}
        />

        {/* Create job */}

        <Route path="/recruiter/jobs/create" element={<RecruiterCreateJob />} />

        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
