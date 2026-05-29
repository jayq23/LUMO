import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";
import lumoLogo from "../assets/lumo.png";

function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const darkModeEnabled = savedTheme === "dark";
    document.documentElement.setAttribute("data-theme", darkModeEnabled ? "dark" : "light");
  }, []);

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/register");

  return (
    <div className="homepage">

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