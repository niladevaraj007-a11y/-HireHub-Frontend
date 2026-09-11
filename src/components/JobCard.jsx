import { Link } from "react-router-dom";

import "./JobCard.css";

function JobCard({ job }) {
  if (!job) {
    return null;
  }

  const jobId = job.id || job.jobId;

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div>
          <h3>{job.title || job.jobTitle || "Job Position"}</h3>

          <p className="company-name">
            {job.company || job.companyName || "Company"}
          </p>
        </div>
      </div>

      <div className="job-card-info">
        {job.location && <span>📍 {job.location}</span>}

        {job.jobType && <span>💼 {job.jobType}</span>}

        {job.salary && <span>💰 {job.salary}</span>}
      </div>

      {job.description && (
        <p className="job-description">
          {job.description.length > 120
            ? `${job.description.substring(0, 120)}...`
            : job.description}
        </p>
      )}

      <Link to={`/jobs/${jobId}`} className="view-job-button">
        View Job
      </Link>
    </div>
  );
}

export default JobCard;
