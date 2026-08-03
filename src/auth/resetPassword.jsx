import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import "../styles/login.css";
import api from "../api/client.js";

function ResetPassword() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [success, setSuccess] = useState(false);
  const { token } = useParams();
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

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.resetPassword(token, newPassword);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err) {
      setError(err.message || "This reset link is invalid or has expired.");
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
        {success ? (
          <div className="login-header">
            <h1 style={{ marginBottom: '10px' }}>Password updated ✓</h1>
            <p>Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <div className="login-header">
              <h1 style={{ marginBottom: '10px' }}>Set a new password</h1>
              <p>Choose a new password for your account.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="newPassword">NEW PASSWORD</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    placeholder="••••••••"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <div className="login-header" style={{ marginBottom: 0, marginTop: '20px' }}>
              <p>
                Remembered your password?{" "}
                <Link to="/login">Back to Login</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;