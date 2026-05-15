import { useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import '../styles/register.css';

function Register() {
  const { user, register, loading, error } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const darkModeEnabled = savedTheme === "dark";
    setIsDarkMode(darkModeEnabled);
    document.documentElement.setAttribute("data-theme", darkModeEnabled ? "dark" : "light");
  }, []);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    const success = await register(email, password, name);
    if (success) {
      navigate('/dashboard');
    }
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

  return (
    <div className="register-page">
      <button className="Theme" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <div className="register-card">
        <h1 className='createText'>Create account</h1>

        <form className="register-form" onSubmit={handleRegister}>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          {passwordError && <div style={{ color: 'red', marginBottom: '1rem' }}>{passwordError}</div>}

          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Jay smith" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="you@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
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

          <div className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                id="confirmPassword"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="register-header">
          <p>
            Already have an account?{' '}
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;