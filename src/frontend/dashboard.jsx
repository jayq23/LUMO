import lumoLogo from '../assets/lumo.png';
import {
  LayoutDashboard, ArrowLeftRight, PieChart,
  BarChart2, Settings, TrendingDown, TrendingUp, Wallet, Menu
} from "lucide-react";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import api from '../api/client.js';
import { formatCurrency } from '../utils/currencyHelper.js';
import { formatDate, getLanguageCode } from '../utils/languageHelper.js';
import { useTranslation } from '../utils/translations.js';
import { useSyncOfflineTransactions } from '../utils/useSyncOfflineTransactions.js';
import { getPendingTransactions } from '../utils/offlineStorage.js';
import '../styles/dashboard.css';
import EmptyState from './emptyState.jsx';

const NAV_ITEMS = [
  { keyLabel: 'nav.dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { keyLabel: 'nav.transactions', href: '/transactions', icon: ArrowLeftRight },
  { keyLabel: 'nav.budgets',      href: '/budgets',      icon: PieChart },
  { keyLabel: 'nav.reports',      href: '/reports',      icon: BarChart2 },
  { keyLabel: 'nav.settings',     href: '/settings',     icon: Settings },
];

const CATEGORY_COLORS = {
  food:          '#f0a500',
  transport:     '#5b9cf6',
  shopping:      '#a78bfa',
  income:        '#4caf89',
  subscriptions: '#e05a5a',
  health:        '#34d399',
  utilities:     '#fb923c',
  other:         '#5e6278',
};

function getCategoryColor(category = '') {
  return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.other;
}

// ── Sub-components ─────────────────────────────────────────────

function StatCard({ label, value, note, up, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">
          <Icon size={16} />
        </div>
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      {note && (
        <div className={`stat-change ${up ? 'up' : 'down'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {note}
        </div>
      )}
    </div>
  );
}

function TransactionRow({ t, currency, language }) {
  const isIncome = t.type === 'income';
  const color  = getCategoryColor(t.category);
  const amount = `${isIncome ? '+' : '-'}${formatCurrency(t.amount, currency)}`;
  const langCode = getLanguageCode(language);
  const formattedDate = formatDate(t.transaction_date || t.transactionDate, langCode);
  const isOffline = t._isOffline;

  return (
    <div className="transaction-row" style={{ opacity: isOffline ? 0.7 : 1 }}>
      <div className="txn-dot" style={{ background: color, border: isOffline ? '2px dashed rgba(255,255,255,0.5)' : 'none' }} />
      <div className="txn-info">
        <span className="txn-name">{t.category}</span>
        <span className="txn-category">{t.description || 'No description'}{isOffline && ' ⏳'}</span>
      </div>
      <div className="txn-right">
        <span className={`txn-amount ${isIncome ? 'income' : 'expense'}`}>{amount}</span>
        <span className="txn-date">{formattedDate}</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

function Dashboard() {
  const { user, isInitialized, preferences } = useAuth();
  const currency = preferences.currency;
  const language = preferences.language;
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Enable offline transaction syncing
  useSyncOfflineTransactions(user?.id);

  // Refresh transactions when "lumo:refresh" event is dispatched
  useEffect(() => {
    const handleRefresh = () => {
      if (user) loadTransactions();
    };
    window.addEventListener('lumo:refresh', handleRefresh);
    return () => window.removeEventListener('lumo:refresh', handleRefresh);
  }, [user]);
  useEffect(() => {
    if (user && isInitialized) loadTransactions();
  }, [user, isInitialized]);

  // Refresh transactions when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (user) loadTransactions();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Get server transactions
      const data = await api.transactions.getAll(user.id);
      const serverTransactions = Array.isArray(data) ? data : [];

      // Get offline transactions
      const offlineTxns = await getPendingTransactions();

      // Combine: offline first, then server
      const allTransactions = [
        ...offlineTxns.map(t => ({
          ...t,
          synced: false,
          _isOffline: true
        })),
        ...serverTransactions
      ];

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) return <div className="loading-screen">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;

  // ── Compute stats from real data ──
  const now          = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncome  = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const monthlyExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalBalance   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
                       - transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 5);

  return (
    <div className="dashboard">

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-area">
          <div className="logo-box">
            <img src={lumoLogo} alt="Lumo logo" />
          </div>
          <span className="app-name">Lumo</span>
        </div>

        <nav className="nav-menu">
          {NAV_ITEMS.map(({ keyLabel, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={`nav-item ${location.pathname === href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {t(keyLabel)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <main className="main">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="page-title">{t('dashboard.title')}</h1>
              <p className="page-sub">{t('dashboard.subtitle', { name: user?.name })}</p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="stats-grid">
          <StatCard
            label={t('dashboard.totalBalance')}
            value={formatCurrency(totalBalance, currency)}
            note={totalBalance >= 0 ? t('dashboard.positiveBalance') : t('dashboard.negativeBalance')}
            up={totalBalance >= 0}
            icon={Wallet}
          />
          <StatCard
            label={t('dashboard.monthlySpend')}
            value={formatCurrency(monthlyExpense, currency)}
            note={t('dashboard.thisMonthExpenses')}
            up={false}
            icon={TrendingDown}
          />
          <StatCard
            label={t('dashboard.monthlyIncome')}
            value={formatCurrency(monthlyIncome, currency)}
            note={t('dashboard.thisMonthIncome')}
            up={true}
            icon={TrendingUp}
          />
        </section>

        {/* Recent Transactions */}
        <section className="section">
          <div className="section-header">
            <h2>{t('dashboard.recentTransactions')}</h2>
            <a href="/transactions" className="see-all">{t('dashboard.seeAll')}</a>
          </div>

          {loading ? (
            <p className="page-sub" style={{ padding: '12px 0' }}>{t('dashboard.loadingTransactions')}</p>
          ) : recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map((txn) => (
                <TransactionRow key={txn.id} t={txn} currency={currency} language={language} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('dashboard.noTransactions')}
              description={t('dashboard.createFirst')}
            />
          )}
        </section>

      </main>
    </div>
  );
}

export default Dashboard;