import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, PieChart, BarChart2, Settings, Menu, MessageCircle } from "lucide-react";
import lumoLogo from "../assets/lumo.png";
import "../styles/dashboard.css";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTranslation } from "../utils/translations.js";
import { getLanguageCode } from "../utils/languageHelper.js";

function SectionShell({ title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { preferences } = useAuth();
  const languageCode = getLanguageCode(preferences.language);
  const t = useTranslation(languageCode);

  const getNavItems = () => [
    { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.transactions"), href: "/transactions", icon: ArrowLeftRight },
    { label: t("nav.budgets"), href: "/budgets", icon: PieChart },
    { label: t("nav.reports"), href: "/reports", icon: BarChart2 },
    { label: "AI Assistant", href: "/assistant", icon: MessageCircle },
    { label: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  useEffect(() => {
    // Initialize theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme");
    const dark = savedTheme === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  return (
    <div className="dashboard">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logo-area">
          <div className="logo-box">
            <img src={lumoLogo} alt="Lumo logo" />
          </div>
          <span className="app-name">Lumo</span>
        </div>

        <nav className="nav-menu">
          {getNavItems().map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="mobile-brand" aria-hidden="true">
              <div className="logo-box mobile-logo-box">
                <img src={lumoLogo} alt="" />
              </div>
            </div>
            <button className="menu-btn" onClick={() => setSidebarOpen(true)} type="button" aria-label={t('common.menu')}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-sub">{subtitle}</p>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

export default SectionShell;