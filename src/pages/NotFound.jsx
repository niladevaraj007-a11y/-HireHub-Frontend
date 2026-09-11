import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home, Search } from "lucide-react";

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <div className="not-found-icon">
            <AlertCircle size={42} />
          </div>

          <span className="not-found-code">404</span>

          <h1>Page not found</h1>

          <p>
            Sorry, the page you're looking for doesn't exist
            or may have been moved.
          </p>

          <div className="not-found-actions">
            <Link to="/" className="primary-btn">
              <Home size={17} />
              Go Home
            </Link>

            <Link to="/jobs" className="secondary-btn">
              <Search size={17} />
              Browse Jobs
            </Link>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;