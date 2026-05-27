import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import facebook from "../assets/facebook.png";
import google from "../assets/google.png";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import "../styles/login.css";
import { auth } from '../../firebase'
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import api from "../api/client.js";

function Login() {
  const { user, login, loading, error, socialLoginSuccess } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const darkModeEnabled = savedTheme === "dark";
    document.documentElement.setAttribute("data-theme", darkModeEnabled ? "dark" : "light");
    setIsDarkMode(darkModeEnabled);
    // Wake up Render
    fetch('https://lumo-5f41.onrender.com/api/health').catch(() => {})
  }, []);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  const toggleTheme = () => {
    setIsDarkMode((currentValue) => {
      const nextValue = !currentValue;
      const nextTheme = nextValue ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
      return nextValue;
    });
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      console.log('📡 Sending token to backend...')
      const response = await api.oauth.socialLogin(idToken, 'google')
      console.log('✅ Backend response:', JSON.stringify(response))
      if (response.user && response.token) {
        socialLoginSuccess(response.user, response.token)
        navigate('/dashboard')
      } else {
        alert('Failed to complete login. Please try again.')
      }
    } catch (error) {
      console.error('❌ Google login error:', error)
      alert('Google login failed: ' + error.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setFacebookLoading(true)
    try {
      const provider = new FacebookAuthProvider()
      provider.addScope('email')
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      console.log('📡 Sending token to backend...')
      const response = await api.oauth.socialLogin(idToken, 'facebook')
      console.log('✅ Backend response:', JSON.stringify(response))
      if (response.user && response.token) {
        socialLoginSuccess(response.user, response.token)
        navigate('/dashboard')
      } else {
        alert('Failed to complete login. Please try again.')
      }
    } catch (error) {
      console.error('❌ Facebook login error:', error)
      alert('Facebook login failed: ' + error.message)
    } finally {
      setFacebookLoading(false)
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate("/forgot-password");
  };

  return (
    <div className="login-page">
      <button className="Theme" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <div className="login-card">
        <form className="login-form" onSubmit={handleLogin}>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          
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

          <div className="field">
            <div className="field-row">
              <label htmlFor="password">PASSWORD</label>
              <a href="/forgot-password" className="forgot-link">Forgot password?</a>
            </div>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="login-header">
          <p>
            Don't have an account?{" "}
            <a href="/register" onClick={handleRegister}>Register here</a>
          </p>
        </div>

        <div className="or-divider">
          <span>or continue with</span>
        </div>

        <div className="social-btns">
          <button className="social-btn google-btn" type="button" onClick={handleGoogleLogin} disabled={googleLoading}>
            <img src={google} alt="Google logo" />
            {googleLoading ? 'Connecting... (may take 30s)' : 'Continue with Google'}
          </button>
          <button className="social-btn facebook-btn" type="button" onClick={handleFacebookLogin} disabled={facebookLoading}>
            <img src={facebook} alt="Facebook logo" />
            {facebookLoading ? 'Connecting... (may take 30s)' : 'Continue with Facebook'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;