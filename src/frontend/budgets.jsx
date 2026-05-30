import SectionShell from "./sectionShell.jsx";
import { Wallet, PiggyBank, ClipboardList, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../api/client.js";
import { formatCurrency } from "../utils/currencyHelper.js";
import { getLanguageCode } from "../utils/languageHelper.js";
import "../styles/section-pages.css";
import EmptyState from "./emptyState.jsx";
import { useTranslation } from "../utils/translations.js";
import { useSyncOfflineTransactions } from "../utils/useSyncOfflineTransactions.js";
import { getPendingTransactions } from "../utils/offlineStorage.js";

function BudgetSummaryCard({ label, value, note }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

// Normalize category names to handle plural/singular/alias mismatches
const normalizeCategory = (cat) => {
  const map = {
    // plural fixes
    foods: 'food',
    transports: 'transport',
    shoppings: 'shopping',
    healths: 'health',
    others: 'other',
    // subscription variations
    subscription: 'subscriptions',
    // food aliases
    grocery: 'food',
    groceries: 'food',
    dining: 'food',
    restaurant: 'food',
    restaurants: 'food',
    fastfood: 'food',
    // transport aliases
    taxi: 'transport',
    bus: 'transport',
    grab: 'transport',
    fuel: 'transport',
    uber: 'transport',
    train: 'transport',
    // subscription aliases
    netflix: 'subscriptions',
    spotify: 'subscriptions',
    streaming: 'subscriptions',
    // health aliases
    pharmacy: 'health',
    medicine: 'health',
    doctor: 'health',
    gym: 'health',
    // utilities aliases
    electric: 'utilities',
    electricity: 'utilities',
    water: 'utilities',
    internet: 'utilities',
    meralco: 'utilities',
    // shopping aliases
    clothing: 'shopping',
    clothes: 'shopping',
    mall: 'shopping',
  };
  const clean = (cat || 'other').toLowerCase().trim();
  return map[clean] ?? clean;
};

function Budgets() {
  const { user, isInitialized, preferences } = useAuth();
  const currency = preferences.currency;
  const language = preferences.language;
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limitAmount: '',
  });
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState({});

  useSyncOfflineTransactions(user?.id);

  useEffect(() => {
    const refreshData = async (isInitial = false) => {
      if (user && isInitialized) {
        await Promise.all([loadBudgets(isInitial), loadTransactions()]);
      }
    };
    refreshData(true);
    const interval = setInterval(() => refreshData(false), 5000);
    return () => clearInterval(interval);
  }, [user, isInitialized]);

  useEffect(() => {
    const handleOnline = () => {
      if (user) loadTransactions();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const loadBudgets = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const data = await api.budgets.getAll(user.id);
      if (Array.isArray(data)) setBudgets(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setError('Failed to load budgets');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const serverData = await api.transactions.getAll(user.id);
      const serverTransactions = Array.isArray(serverData) ? serverData : [];
      const offlineTxns = await getPendingTransactions();
      const allTransactions = [
        ...offlineTxns.map(t => ({ ...t, synced: false, _isOffline: true })),
        ...serverTransactions
      ];
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setError('');
    if (!newBudget.category.trim() || !newBudget.limitAmount) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const now = new Date();
      await api.budgets.create(
        user.id,
        newBudget.category,
        parseFloat(newBudget.limitAmount),
        now.getMonth() + 1,
        now.getFullYear()
      );
      setNewBudget({ category: '', limitAmount: '' });
      setShowCreateModal(false);
      await loadBudgets();
      await loadTransactions();
    } catch (err) {
      console.error('Failed to create budget:', err);
      setError('Failed to create budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Delete this budget?')) return;
    setDeleteLoading({ ...deleteLoading, [budgetId]: true });
    try {
      await api.budgets.delete(budgetId);
      await loadBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
      setError('Failed to delete budget');
    } finally {
      setDeleteLoading({ ...deleteLoading, [budgetId]: false });
    }
  };

  const calculateSpendingOutlook = () => {
    if (budgets.length === 0 || transactions.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysPassed = now.getDate();
    const projectedDaysRemaining = daysInMonth - daysPassed;

    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate.getMonth() + 1 === currentMonth &&
             tDate.getFullYear() === currentYear &&
             t.type === 'expense';
    });

    if (monthTransactions.length === 0) return null;

    const currentSpending = monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const avgDailySpend = currentSpending / daysPassed;
    const projectedFinalSpending = currentSpending + (avgDailySpend * projectedDaysRemaining);
    const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);
    const projectedOverspend = projectedFinalSpending - totalBudgeted;

    return {
      avgDailySpend: avgDailySpend.toFixed(2),
      projectedFinalSpending: projectedFinalSpending.toFixed(2),
      projectedOverspend: projectedOverspend > 0 ? projectedOverspend.toFixed(2) : 0,
      onTrack: projectedOverspend <= 0,
    };
  };

  const outlook = calculateSpendingOutlook();

  if (!isInitialized) return <div>{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;

  const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate.getMonth() + 1 === currentMonth &&
           tDate.getFullYear() === currentYear &&
           t.type === 'expense';
  });

  // Build spentByCategory using normalizeCategory on transaction side
  const spentByCategory = {};
  monthTransactions.forEach(t => {
    const cleanKey = normalizeCategory(t.category);
    spentByCategory[cleanKey] = (spentByCategory[cleanKey] || 0) + parseFloat(t.amount);
  });

  const totalSpent = monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalRemaining = totalBudgeted - totalSpent;

  // Compute per-budget percentages using normalizeCategory on budget side too
  const budgetPercentages = budgets.map(b => {
    const budgetKey = normalizeCategory(b.category);
    const categorySpent = spentByCategory[budgetKey] || 0;
    const limit = parseFloat(b.limit_amount) || 0;
    const percentage = limit > 0 ? Math.round((categorySpent / limit) * 100) : 0;
    return { ...b, categorySpent, percentage };
  });

  // Categories that have hit or exceeded the alert threshold
  const alertingBudgets = budgetPercentages.filter(b => b.percentage >= alertThreshold);

  return (
    <SectionShell title={t('budgets.title')} subtitle={t('budgets.subtitle')}>
      {error && (
        <div style={{ padding: '1rem', background: '#ff6b6b', color: 'white', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* ── Overspend Alert Banner ── */}
      {alertingBudgets.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem 1.25rem',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.4)',
          borderLeft: '4px solid #ff6b6b',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <strong style={{ color: '#ff6b6b', fontSize: 14 }}>
            ⚠ Budget Alert — {alertThreshold}% threshold reached
          </strong>
          {alertingBudgets.map(b => (
            <span key={b.id} style={{ fontSize: 13, color: 'var(--text-1)' }}>
              <strong>{b.category}</strong>: {b.percentage}% used
              ({formatCurrency(b.categorySpent, currency)} of {formatCurrency(parseFloat(b.limit_amount), currency)})
              {b.percentage >= 100 && <span style={{ color: '#ff6b6b', fontWeight: 700 }}> — OVER BUDGET</span>}
            </span>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{t('budgets.createBudget')}</h3>
              <button onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBudget}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('budgets.category')}
                </label>
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  placeholder={t('budgets.categoryPlaceholder')}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-2)', color: 'var(--text-1)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('budgets.limit')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.limitAmount}
                  onChange={(e) => setNewBudget({ ...newBudget, limitAmount: e.target.value })}
                  placeholder={t('budgets.limitPlaceholder')}
                  min="0"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-2)', color: 'var(--text-1)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="ghost-btn" style={{ padding: '0.5rem 1rem' }}>
                  {t('common.cancel')}
                </button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                  {t('budgets.createBudget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-stack">
        <section className="metric-grid">
          <BudgetSummaryCard label={t('budgets.totalBudgeted')} value={formatCurrency(totalBudgeted, currency)} note={t('budgets.allactiveBudgets')} />
          <BudgetSummaryCard label={t('budgets.spent')} value={formatCurrency(totalSpent, currency)} note={t('budgets.amountUsed')} />
          <BudgetSummaryCard label={t('budgets.remaining')} value={formatCurrency(totalRemaining, currency)} note={t('budgets.amountLeft')} />
          <BudgetSummaryCard label={t('budgets.title')} value={budgets.length} note={t('budgets.activeCategories')} />
        </section>

        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('budgets.categoryBudgets')}</h2>
                <small>{t('budgets.progressUpdates')}</small>
              </div>
              <PiggyBank size={18} color="var(--accent)" />
            </div>

            {(loading && budgets.length === 0) ? (
              <p>{t('common.loading')}</p>
            ) : budgets.length > 0 ? (
              <div>
                {budgetPercentages.map(b => {
                  const isAlerting = b.percentage >= alertThreshold;
                  const isOver = b.percentage >= 100;
                  const barColor = isOver
                    ? '#ff6b6b'
                    : isAlerting
                    ? '#ffa94d'
                    : b.percentage > alertThreshold * 0.6
                    ? '#ffa94d'
                    : '#51cf66';

                  return (
                    <div key={b.id} style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      background: isAlerting ? 'rgba(255, 107, 107, 0.04)' : 'transparent',
                      borderLeft: isAlerting ? '3px solid #ff6b6b' : '3px solid transparent',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                          <strong>
                            {b.category}
                            {isAlerting && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: '#ff6b6b' }}>
                                {isOver ? '🔴 Over' : '⚠ Alert'}
                              </span>
                            )}
                          </strong>
                          <span>{formatCurrency(b.categorySpent, currency)} / {formatCurrency(parseFloat(b.limit_amount), currency)}</span>
                        </div>
                        <div style={{ background: 'var(--bg-2)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            background: barColor,
                            height: '100%',
                            width: `${Math.min(b.percentage, 100)}%`,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <small style={{ color: isAlerting ? '#ff6b6b' : 'var(--text-3)' }}>
                          {b.percentage}% {t('budgets.spent')}
                        </small>
                      </div>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        disabled={deleteLoading[b.id]}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', padding: '0.5rem', opacity: deleteLoading[b.id] ? 0.5 : 1 }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title={t('budgets.noBudgets')} description={t('budgets.createFirst')} />
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('budgets.budgetActions')}</h2>
                <small>{t('budgets.quickControls')}</small>
              </div>
              <ClipboardList size={18} color="var(--accent)" />
            </div>

            <div className="setting-column">
              {/* Auto Roll - Coming Soon */}
              <div className="setting-row">
                <div className="setting-copy">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t('budgets.autoRollUnused')}
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: 'var(--accent)',
                      color: 'white', borderRadius: 20, padding: '2px 8px',
                      letterSpacing: '0.5px', opacity: 0.8
                    }}>COMING SOON</span>
                  </strong>
                  <span>{t('budgets.moveExtraMoney')}</span>
                </div>
                <div className="switch" style={{ cursor: 'not-allowed', opacity: 0.4 }} role="switch" aria-checked={false}>
                  <span className="switch-knob" />
                </div>
              </div>

              {/* Overspend Alert - working */}
              <div className="setting-row">
                <div className="setting-copy">
                  <strong>{t('budgets.overspendAlert')}</strong>
                  <span>{t('budgets.warnWhenCategoryHits', { threshold: alertThreshold })}</span>
                </div>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text-1)',
                    cursor: 'pointer'
                  }}
                >
                  <option value={50}>50%</option>
                  <option value={75}>75%</option>
                  <option value={80}>80%</option>
                  <option value={90}>90%</option>
                </select>
              </div>

              <div className="setting-row">
                <div className="setting-copy">
                  <strong>{t('budgets.createBudget')}</strong>
                  <span>{t('budgets.startFreshBudget')}</span>
                </div>
                <button className="ghost-btn" type="button" onClick={() => setShowCreateModal(true)}>
                  {t('budgets.addBudget')}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{t('budgets.spendingOutlook')}</h2>
              <small>{t('budgets.currentPace')}</small>
            </div>
            <Wallet size={18} color="var(--accent)" />
          </div>

          {outlook ? (
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <small style={{ color: 'var(--text-3)' }}>{t('budgets.averageDailySpend')}</small>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
                    {formatCurrency(outlook.avgDailySpend, currency)}
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--text-3)' }}>{t('budgets.projectedFinalSpend')}</small>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
                    {formatCurrency(outlook.projectedFinalSpending, currency)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '4px', background: outlook.onTrack ? 'rgba(81, 207, 102, 0.1)' : 'rgba(255, 107, 107, 0.1)' }}>
                <strong style={{ color: outlook.onTrack ? '#51cf66' : '#ff6b6b' }}>
                  {outlook.onTrack ? '✓ On track' : `⚠ Projected overspend: ${formatCurrency(outlook.projectedOverspend, currency)}`}
                </strong>
              </div>
            </div>
          ) : (
            <EmptyState title={t('budgets.outlookPending')} description={t('budgets.monthEndProjection')} />
          )}
        </section>
      </div>
    </SectionShell>
  );
}

export default Budgets;