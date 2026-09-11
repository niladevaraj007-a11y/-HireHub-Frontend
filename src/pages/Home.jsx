import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import api from "../services/api";

function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await api.get("/jobs");
        setJobs(response.data || []);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const featuredJob = jobs.length > 0 ? jobs[0] : null;

  const formatSalary = (min, max) => {
    if (!min && !max) return "Salary not disclosed";

    const minLpa = min ? min / 100000 : null;
    const maxLpa = max ? max / 100000 : null;

    if (minLpa && maxLpa) {
      return `₹${minLpa.toFixed(1)} LPA – ₹${maxLpa.toFixed(1)} LPA`;
    }

    if (minLpa) {
      return `From ₹${minLpa.toFixed(1)} LPA`;
    }

    return `Up to ₹${maxLpa.toFixed(1)} LPA`;
  };

  const formatJobType = (type) => {
    if (!type) return "Not specified";

    return type
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">
              <CheckCircle size={16} />
              Your career starts here
            </span>

            <h1>
              Find the right job.
              <br />
              <span>Build your future.</span>
            </h1>

            <p>
              HireHub connects talented professionals with companies looking for
              their next great hire.
            </p>

            <div className="hero-buttons">
              <Link to="/jobs" className="primary-btn hero-btn">
                Find Jobs
                <ArrowRight size={18} />
              </Link>

              <Link to="/register" className="secondary-btn hero-btn">
                Create Account
              </Link>
            </div>
          </div>

          {/* Featured Job */}
          <div className="hero-card">
            {loading ? (
              <p>Loading featured opportunity...</p>
            ) : featuredJob ? (
              <>
                <div className="hero-card-header">
                  <div>
                    <span>Featured Opportunity</span>

                    <h3>{featuredJob.title}</h3>
                  </div>

                  <div className="hero-job-icon">
                    <Briefcase size={24} />
                  </div>
                </div>

                <p className="hero-company">
                  Company ID: {featuredJob.companyId}
                </p>

                <div className="hero-job-info">
                  <span>
                    <MapPin size={16} />
                    {featuredJob.location || "Location not specified"}
                  </span>

                  <span>
                    <Briefcase size={16} />
                    {formatJobType(featuredJob.jobType)}
                  </span>
                </div>

                <div className="hero-salary">
                  {formatSalary(featuredJob.minSalary, featuredJob.maxSalary)}
                </div>

                <Link
                  to={`/jobs/${featuredJob.jobId}`}
                  className="primary-btn hero-card-btn"
                >
                  View Opportunity
                </Link>
              </>
            ) : (
              <>
                <div className="hero-card-header">
                  <div>
                    <span>Featured Opportunity</span>
                    <h3>No jobs available</h3>
                  </div>

                  <div className="hero-job-icon">
                    <Briefcase size={24} />
                  </div>
                </div>

                <p className="hero-company">
                  Check back soon for new opportunities.
                </p>

                <Link to="/jobs" className="primary-btn hero-card-btn">
                  Browse Jobs
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="home-search-section">
        <div className="container">
          <div className="home-search">
            <div className="search-field">
              <Search size={20} />

              <input type="text" placeholder="Job title, skills or keywords" />
            </div>

            <div className="search-field">
              <MapPin size={20} />

              <input type="text" placeholder="Location" />
            </div>

            <Link to="/jobs" className="primary-btn search-btn">
              Search Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="page-section stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Briefcase size={24} />
              </div>

              <strong>{jobs.length}+</strong>
              <span>Job Opportunities</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Building2 size={24} />
              </div>

              <strong>Companies</strong>
              <span>Hiring on HireHub</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>

              <strong>Job Seekers</strong>
              <span>Growing Community</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>

              <strong>Active</strong>
              <span>Career Opportunities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-section features-section">
        <div className="container">
          <div className="section-heading">
            <span className="section-label">Why HireHub?</span>

            <h2 className="section-title">
              Everything you need to move your career forward
            </h2>

            <p className="section-subtitle">
              A simple and professional platform designed for both job seekers
              and recruiters.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon blue">
                <Search size={25} />
              </div>

              <h3>Find Your Perfect Job</h3>

              <p>
                Search opportunities using job titles, skills, locations and
                other filters.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon orange">
                <Building2 size={25} />
              </div>

              <h3>Connect With Companies</h3>

              <p>
                Discover companies and apply directly to positions that match
                your skills and career goals.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon green">
                <Users size={25} />
              </div>

              <h3>Manage Your Career</h3>

              <p>
                Track applications, manage your profile and stay updated with
                your interview opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-content">
          <div>
            <h2>Ready to take the next step?</h2>

            <p>
              Create your HireHub account and start discovering better career
              opportunities today.
            </p>
          </div>

          <Link to="/register" className="primary-btn cta-btn">
            Get Started
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
