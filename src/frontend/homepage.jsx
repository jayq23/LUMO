import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";
import lumoLogo from "../assets/lumo.png";
import { Sun, Moon } from "lucide-react";

function Homepage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const darkModeEnabled = savedTheme === "dark";
    setIsDarkMode(darkModeEnabled);
    document.documentElement.setAttribute("data-theme", darkModeEnabled ? "dark" : "light");
  }, []);

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/register");

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
    <div className="homepage">
      <button className="Theme" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <div className="card">
        <div className="logo-area">
          <div className="logo-box">
            <img src={lumoLogo} alt="Lumo logo" />
          </div>
          <span className="app-name">Lumo</span>
        </div>

        <div className="divider" />

        <h1 className="headline">
          Track your expenses,<br />
          <em>own your money.</em>
        </h1>
        <p className="sub">Simple, smart expense tracking<br />built for real life.</p>

        <div className="loginMethod">
          <button className="loginBtn" onClick={handleLogin}>Login</button>
          <button className="registerBtn" onClick={handleRegister}>Create an account</button>
        </div>
      </div>

      <span className="card-footer">Lumo · Your money, illuminated.</span>
    </div>
  );
}

export default Homepage;