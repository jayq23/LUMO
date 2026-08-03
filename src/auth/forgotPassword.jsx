import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import "../styles/login.css";
import api from "../api/client.js";

function ForgotPassword() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const darkModeEnabled = savedTheme === "dark";
    document.documentElement.setAttribute("data-theme", darkModeEnabled ? "dark" : "light");
    setIsDarkMode(darkModeEnabled);
  }, []);

  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
      const timer = setTimeout(() => setShowErrorAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const toggleTheme = () => {
    setIsDarkMode((currentValue) => {
      const nextValue = !currentValue;
      const nextTheme = nextValue ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
      return nextValue;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.forgotPassword(email);
      if (response.error) {
        setError(response.error);
      } else {
        // Always show the "check your email" state, even if the email
        // doesn't exist — prevents leaking which emails are registered.
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="Theme" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {showErrorAlert && error && (
        <div className="error-alert">
          <div className="error-alert-content">
            <span className="error-text">{error}</span>
            <button className="error-close" onClick={() => setShowErrorAlert(false)} type="button">✕</button>
          </div>
        </div>
      )}

      <div className="login-card">
        {submitted ? (
          <>
            <div className="login-header">
              <h1 style={{ marginBottom: '10px' }}>Check your email</h1>
              <p>
                If an account exists for <strong>{email}</strong>, we've sent a link to reset
                your password. The link expires in 1 hour.
              </p>
            </div>
            <button type="button" className="login-btn" onClick={() => navigate("/login")}>
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="login-header">
              <Link to="/login" className="forgot-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '18px' }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
              <h1 style={{ marginBottom: '10px' }}>Forgot your password?</h1>
              <p>Enter your email and we'll send you a link to reset it.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">EMAIL</label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;