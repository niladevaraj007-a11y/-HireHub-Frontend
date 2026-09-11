import { Link } from "react-router-dom";
import {
  Briefcase,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="brand-icon">
              <Briefcase size={21} />
            </span>

            <strong>HireHub</strong>
          </div>

          <p>
            Connect Talent. Build Careers.
            <br />
            A smarter way to find your next opportunity.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/jobs">Find Jobs</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

        {/* Job Seekers */}
        <div className="footer-column">
          <h3>For Job Seekers</h3>

          <Link to="/jobs">Browse Jobs</Link>
          <Link to="/applications">My Applications</Link>
          <Link to="/interviews">Interviews</Link>
          <Link to="/profile">My Profile</Link>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3>Contact</h3>

          <span>
            <Mail size={16} />
            support@hirehub.com
          </span>

          <span>
            <Phone size={16} />
            +91 98765 43210
          </span>

          <span>
            <MapPin size={16} />
            Bangalore, India
          </span>
        </div>
      </div>

      {/* Bottom */}
      <div className="container footer-bottom">
        <p>© 2026 HireHub. All rights reserved.</p>

        <div className="footer-social">

          <a href="#" aria-label="LinkedIn">
            LinkedIn
          </a>

          <a href="#" aria-label="GitHub">
            GitHub
          </a>

        </div>
      </div>
    </footer>
  );
}

export default Footer;