import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH JOBS
  // =========================================================

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching all jobs...");

      const response = await api.get("/jobs");

      console.log("Jobs API response:", response.data);

      const data = Array.isArray(response.data) ? response.data : [];

      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);

      console.error("Status:", err.response?.status);
      console.error("Backend response:", err.response?.data);

      setJobs([]);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load jobs. Please make sure the HireHub backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD JOBS
  // =========================================================

  useEffect(() => {
    fetchJobs();
  }, []);

  // =========================================================
  // FORMAT JOB TYPE
  // =========================================================

  const formatJobType = (type) => {
    if (!type) {
      return "Not specified";
    }

    return String(type)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // =========================================================
  // FORMAT SALARY
  // =========================================================

  const formatSalary = (min, max) => {
    const hasMin = min !== null && min !== undefined && Number(min) > 0;

    const hasMax = max !== null && max !== undefined && Number(max) > 0;

    if (!hasMin && !hasMax) {
      return "Salary not disclosed";
    }

    if (hasMin && hasMax) {
      return `₹${Number(min).toLocaleString("en-IN")} – ₹${Number(
        max,
      ).toLocaleString("en-IN")}`;
    }

    if (hasMin) {
      return `From ₹${Number(min).toLocaleString("en-IN")}`;
    }

    return `Up to ₹${Number(max).toLocaleString("en-IN")}`;
  };

  // =========================================================
  // FILTER JOBS
  // =========================================================

  const filteredJobs = jobs.filter((job) => {
    const searchText = search.toLowerCase().trim();

    const locationText = location.toLowerCase().trim();

    const title = String(job.title || "").toLowerCase();

    const skills = String(job.requiredSkills || "").toLowerCase();

    const company = String(
      job.company?.name || job.companyName || `Company ${job.companyId || ""}`,
    ).toLowerCase();

    const jobLocation = String(job.location || "").toLowerCase();

    const matchesSearch =
      !searchText ||
      title.includes(searchText) ||
      skills.includes(searchText) ||
      company.includes(searchText);

    const matchesLocation = !locationText || jobLocation.includes(locationText);

    return matchesSearch && matchesLocation;
  });

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="jobs-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="jobs-header">
        <div className="container">
          <span className="section-label">Career Opportunities</span>

          <h1>Find your next opportunity</h1>

          <p>
            Explore jobs that match your skills, experience and career goals.
          </p>

          {/* SEARCH */}

          <div className="jobs-search">
            <div className="jobs-search-field">
              <Search size={20} />

              <input
                type="text"
                placeholder="Search job title, skills or company"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="jobs-search-field">
              <MapPin size={20} />

              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>

            <button type="button" className="primary-btn" onClick={fetchJobs}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          JOBS SECTION
      ====================================================== */}

      <section className="page-section jobs-section">
        <div className="container">
          {/* TOOLBAR */}

          <div className="jobs-toolbar">
            <div>
              <h2>Available Jobs</h2>

              {!loading && !error && (
                <p>
                  {filteredJobs.length}{" "}
                  {filteredJobs.length === 1 ? "job" : "jobs"} found
                </p>
              )}
            </div>

            <button
              type="button"
              className="secondary-btn refresh-btn"
              onClick={fetchJobs}
              disabled={loading}
            >
              <RefreshCw size={17} />

              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="jobs-state">
              <div className="spinner"></div>

              <p>Loading available jobs...</p>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================== */}

          {!loading && error && (
            <div className="jobs-state error-state">
              <Briefcase size={45} />

              <h3>Unable to load jobs</h3>

              <p>{error}</p>

              <button type="button" className="primary-btn" onClick={fetchJobs}>
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              NO JOBS
          ================================================== */}

          {!loading && !error && filteredJobs.length === 0 && (
            <div className="jobs-state">
              <Search size={45} />

              <h3>No jobs found</h3>

              <p>Try changing your search keywords or location.</p>
            </div>
          )}

          {/* =================================================
              JOB CARDS
          ================================================== */}

          {!loading && !error && filteredJobs.length > 0 && (
            <div className="jobs-grid">
              {filteredJobs.map((job) => {
                const jobId = job.jobId ?? job.id;

                const companyName =
                  job.company?.name ||
                  job.companyName ||
                  `Company ${job.companyId || ""}`;

                return (
                  <article className="job-card card" key={jobId}>
                    {/* TOP */}

                    <div className="job-card-top">
                      <div className="job-company-icon">
                        <Building2 size={24} />
                      </div>

                      <span className="job-status">{job.status || "OPEN"}</span>
                    </div>

                    {/* TITLE */}

                    <h3>{job.title || "Untitled Position"}</h3>

                    {/* COMPANY */}

                    <p className="job-company">{companyName}</p>

                    {/* META */}

                    <div className="job-meta">
                      <span>
                        <MapPin size={16} />

                        {job.location || "Not specified"}
                      </span>

                      <span>
                        <Briefcase size={16} />

                        {formatJobType(job.jobType)}
                      </span>

                      <span>
                        <Clock size={16} />

                        {String(job.status || "OPEN").toUpperCase() === "OPEN"
                          ? "Currently Hiring"
                          : job.status || "Not specified"}
                      </span>
                    </div>

                    {/* SKILLS */}

                    {job.requiredSkills && (
                      <div className="job-skills">
                        {String(job.requiredSkills)
                          .split(",")
                          .map((skill, index) => (
                            <span key={`${skill}-${index}`}>
                              {skill.trim()}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* SALARY */}

                    <div className="job-salary">
                      {formatSalary(job.minSalary, job.maxSalary)}
                    </div>

                    {/* VIEW JOB */}

                    {jobId ? (
                      <Link to={`/jobs/${jobId}`} className="job-view-link">
                        View Job
                        <ArrowRight size={17} />
                      </Link>
                    ) : (
                      <span className="job-view-link">Job ID unavailable</span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Jobs;
