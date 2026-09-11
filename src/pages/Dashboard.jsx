import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Briefcase,
  FileText,
  CalendarDays,
  UserCircle,
  ArrowRight,
  Search,
  Clock,
} from "lucide-react";

import api from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // GET JOB ID
  // =========================================================

  const getJobId = (job) => {
    if (!job) return null;

    return job.jobId ?? job.id ?? null;
  };

  // =========================================================
  // GET APPLICATION ID
  // =========================================================

  const getApplicationId = (application) => {
    if (!application) return null;

    return application.applicationId ?? application.id ?? null;
  };

  // =========================================================
  // NORMALIZE ARRAY
  // =========================================================

  const normalizeArray = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object" && Array.isArray(data.content)) {
      return data.content;
    }

    return [];
  };

  // =========================================================
  // LOAD LOGGED-IN USER
  // =========================================================

  const loadUser = async () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.error("No user found in localStorage");
      return null;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      console.log("Stored login user:", parsedUser);

      /*
       * Backend currently gives:
       *
       * userId: 22
       * seekerId: null
       *
       * So if seekerId is missing, get it from:
       *
       * GET /api/job-seekers/user/22
       */

      let currentUser = parsedUser;

      if (
        currentUser.role === "JOB_SEEKER" &&
        !currentUser.seekerId &&
        currentUser.userId
      ) {
        try {
          const seekerResponse = await api.get(
            `/job-seekers/user/${currentUser.userId}`,
          );

          console.log("Job seeker response:", seekerResponse.data);

          currentUser = {
            ...currentUser,
            seekerId: seekerResponse.data.seekerId,
          };

          // Save corrected user information
          localStorage.setItem("user", JSON.stringify(currentUser));

          console.log("Updated logged-in user:", currentUser);
        } catch (error) {
          console.error("Failed to load job seeker profile:", error);
        }
      }

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error("Invalid user in localStorage:", error);

      localStorage.removeItem("user");

      return null;
    }
  };

  // =========================================================
  // LOAD JOBS
  // =========================================================

  const loadJobs = async () => {
    try {
      const response = await api.get("/jobs");

      console.log("Jobs response:", response.data);

      const jobsData = normalizeArray(response.data);

      setJobs(jobsData);

      console.log("Jobs loaded:", jobsData);
    } catch (error) {
      console.error("Failed to load jobs:", error);

      setJobs([]);
    }
  };

  // =========================================================
  // LOAD APPLICATIONS
  // =========================================================

  const loadApplications = async (currentUser) => {
    if (!currentUser) {
      setApplications([]);
      return;
    }

    const seekerId = currentUser.seekerId ?? currentUser.jobSeekerId ?? null;

    console.log("Application seekerId:", seekerId);

    if (!seekerId) {
      console.error("No seekerId available for user:", currentUser);

      setApplications([]);
      return;
    }

    try {
      const response = await api.get(`/applications/seeker/${seekerId}`);

      console.log("Applications response:", response.data);

      const applicationsData = normalizeArray(response.data);

      setApplications(applicationsData);

      console.log("Applications loaded:", applicationsData);
    } catch (error) {
      console.error("Failed to load applications:", error);

      console.error("Status:", error.response?.status);

      console.error("Backend response:", error.response?.data);

      setApplications([]);
    }
  };

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const currentUser = await loadUser();

        if (!mounted) return;

        await loadJobs();

        if (!mounted) return;

        await loadApplications(currentUser);
      } catch (error) {
        console.error("Dashboard loading failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // DISPLAY NAME
  // =========================================================

  const displayName =
    user?.fullName || user?.name || user?.username || "Job Seeker";

  // =========================================================
  // RECENT DATA
  // =========================================================

  const recentJobs = jobs.slice(0, 3);

  const recentApplications = applications.slice(0, 3);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dashboard-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="dashboard-header">
        <div className="container">
          <div className="dashboard-welcome">
            <div>
              <span className="section-label">Dashboard</span>

              <h1>Welcome back, {displayName} 👋</h1>

              <p>
                Manage your career, applications and interview opportunities
                from one place.
              </p>
            </div>

            <Link to="/jobs" className="primary-btn">
              <Search size={18} />
              Find Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          DASHBOARD CONTENT
      ====================================================== */}

      <section className="page-section dashboard-section">
        <div className="container">
          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="dashboard-stats">
            <div className="dashboard-stat card">
              <div className="dashboard-stat-icon blue">
                <Briefcase size={22} />
              </div>

              <div>
                <span>Available Jobs</span>

                <strong>{loading ? "—" : jobs.length}</strong>
              </div>
            </div>

            <div className="dashboard-stat card">
              <div className="dashboard-stat-icon orange">
                <FileText size={22} />
              </div>

              <div>
                <span>Applications</span>

                <strong>{loading ? "—" : applications.length}</strong>
              </div>
            </div>

            <div className="dashboard-stat card">
              <div className="dashboard-stat-icon green">
                <CalendarDays size={22} />
              </div>

              <div>
                <span>Interviews</span>

                <strong>0</strong>
              </div>
            </div>

            <div className="dashboard-stat card">
              <div className="dashboard-stat-icon purple">
                <UserCircle size={22} />
              </div>

              <div>
                <span>Profile</span>

                <strong>100%</strong>
              </div>
            </div>
          </div>

          {/* =================================================
              GRID
          ================================================= */}

          <div className="dashboard-grid">
            {/* =================================================
                JOBS
            ================================================= */}

            <section className="dashboard-card card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Recommended Jobs</h2>

                  <p>Explore the latest opportunities.</p>
                </div>

                <Link to="/jobs">
                  View All
                  <ArrowRight size={16} />
                </Link>
              </div>

              {loading ? (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="dashboard-empty">
                  <Briefcase size={35} />

                  <p>No jobs available right now.</p>
                </div>
              ) : (
                <div className="dashboard-job-list">
                  {recentJobs.map((job, index) => {
                    const jobId = getJobId(job);

                    const jobKey =
                      jobId !== null ? `job-${jobId}` : `job-${index}`;

                    return (
                      <div className="dashboard-job" key={jobKey}>
                        <div className="dashboard-job-icon">
                          <Briefcase size={20} />
                        </div>

                        <div className="dashboard-job-info">
                          <h3>{job.title || "Job Position"}</h3>

                          <p>
                            {job.company?.name || job.companyName || "Company"}
                          </p>

                          <span>
                            {job.location || "Location not specified"}
                          </span>
                        </div>

                        {jobId !== null ? (
                          <Link
                            to={`/jobs/${jobId}`}
                            className="dashboard-view"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="dashboard-view">View</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="dashboard-card card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Quick Actions</h2>

                  <p>Manage your HireHub account.</p>
                </div>
              </div>

              <div className="quick-actions">
                <Link to="/jobs" className="quick-action">
                  <div className="quick-action-icon blue">
                    <Search size={20} />
                  </div>

                  <div>
                    <strong>Find Jobs</strong>

                    <span>Browse available opportunities</span>
                  </div>

                  <ArrowRight size={17} />
                </Link>

                <Link to="/applications" className="quick-action">
                  <div className="quick-action-icon orange">
                    <FileText size={20} />
                  </div>

                  <div>
                    <strong>My Applications</strong>

                    <span>Track your job applications</span>
                  </div>

                  <ArrowRight size={17} />
                </Link>

                <Link to="/interviews" className="quick-action">
                  <div className="quick-action-icon green">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <strong>Interviews</strong>

                    <span>View your scheduled interviews</span>
                  </div>

                  <ArrowRight size={17} />
                </Link>

                <Link to="/profile" className="quick-action">
                  <div className="quick-action-icon purple">
                    <UserCircle size={20} />
                  </div>

                  <div>
                    <strong>My Profile</strong>

                    <span>Update your personal information</span>
                  </div>

                  <ArrowRight size={17} />
                </Link>
              </div>
            </section>
          </div>

          {/* =================================================
              RECENT APPLICATIONS
          ================================================= */}

          <section className="dashboard-card card applications-preview">
            <div className="dashboard-card-header">
              <div>
                <h2>Recent Applications</h2>

                <p>Keep track of your latest applications.</p>
              </div>

              <Link to="/applications">
                View All
                <ArrowRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-loading">
                <div className="spinner"></div>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="dashboard-empty">
                <Clock size={35} />

                <h3>No applications yet</h3>

                <p>Apply for a job to see your applications here.</p>

                <Link to="/jobs" className="primary-btn">
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="application-list">
                {recentApplications.map((application, index) => {
                  const applicationId = getApplicationId(application);

                  const applicationKey =
                    applicationId !== null
                      ? `application-${applicationId}`
                      : `application-${index}`;

                  return (
                    <div className="application-row" key={applicationKey}>
                      <div>
                        <strong>
                          {application.job?.title ||
                            application.jobTitle ||
                            application.job?.name ||
                            "Job Application"}
                        </strong>

                        <span>
                          Application #
                          {applicationId !== null ? applicationId : "N/A"}
                        </span>
                      </div>

                      <span className="application-status">
                        {application.status || "APPLIED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
