import SectionShell from "./sectionShell.jsx";
import { BarChart2, TrendingUp, PieChart, LineChart, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../api/client.js";
import { formatCurrency, getCurrencySymbol } from "../utils/currencyHelper.js";
import { formatDate, getLanguageCode } from "../utils/languageHelper.js";
import "../styles/section-pages.css";
import EmptyState from "./emptyState.jsx";
import { useTranslation } from "../utils/translations.js";
import { useSyncOfflineTransactions } from "../utils/useSyncOfflineTransactions.js";
import { getPendingTransactions } from "../utils/offlineStorage.js";

function ReportMetricCard({ label, value, note }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function Report() {
  const { user, isInitialized, preferences } = useAuth();
  const currency = preferences.currency;
  const language = preferences.language;
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useSyncOfflineTransactions(user?.id);

  useEffect(() => {
    if (user && isInitialized) {
      loadData();
    }
  }, [user, isInitialized]);

  useEffect(() => {
    const handleOnline = () => {
      if (user) loadData();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txnData, budgetData] = await Promise.all([
        api.transactions.getAll(user.id),
        api.budgets.getAll(user.id)
      ]);
      const serverTransactions = Array.isArray(txnData) ? txnData : [];
      if (Array.isArray(budgetData)) setBudgets(budgetData);
      
      const offlineTxns = await getPendingTransactions();
      
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
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const calculateMetrics = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate.getMonth() + 1 === currentMonth && tDate.getFullYear() === currentYear;
    });

    if (monthTransactions.length === 0) return null;

    const totalSpent = monthTransactions.reduce((sum, t) => {
      const isExpense = (t.type?.toLowerCase().trim() || 'expense') === 'expense';
      const amount = parseFloat(t.amount) || 0;
      return isExpense ? sum + amount : sum;
    }, 0);
    
    const categoryTotals = {};
    monthTransactions.forEach(t => {
    const isExpense = (t.type?.toLowerCase().trim() || 'expense') === 'expense';
    if (isExpense) {
      // Clean the category name: lowercase and trim whitespace
      const cleanCat = (t.category || 'uncategorized').toLowerCase().trim();
      categoryTotals[cleanCat] = (categoryTotals[cleanCat] || 0) + (parseFloat(t.amount) || 0);
    }
  });

    const topCategoryEntry = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    //  divide by expense-only count, not all transactions (which included income)
    const expenseTransactions = monthTransactions.filter(t => 
    (t.type?.toLowerCase().trim() || 'expense') === 'expense'
    );
    const avgSpend = expenseTransactions.length > 0 ? (totalSpent / expenseTransactions.length).toFixed(2) : 0;
    
    const currentMonthBudgets = budgets.filter(b => {
      return parseInt(b.month) === currentMonth && parseInt(b.year) === currentYear;
    });
    
    let savingsRate;
    if (currentMonthBudgets.length === 0) {
      savingsRate = null;
    } else {
      let totalBudgeted = 0;
      let totalRemaining = 0;
      
      currentMonthBudgets.forEach(budget => {
        const budgetLimit = parseFloat(budget.limit_amount);
        const categorySpent = categoryTotals[budget.category] || 0;
        const remaining = budgetLimit - categorySpent;
        
        totalBudgeted += budgetLimit;
        totalRemaining += remaining;
      });
      
      if (totalBudgeted > 0) {
        const remainingPercent = parseFloat(((totalRemaining / totalBudgeted) * 100).toFixed(0));
        savingsRate = Math.max(-100, remainingPercent);
      } else {
        savingsRate = null;
      }
    }

    return {
      monthlySpent: totalSpent.toFixed(2),
      topCategory: topCategoryEntry ? topCategoryEntry[0] : null,
      topCategoryAmount: topCategoryEntry ? topCategoryEntry[1].toFixed(2) : 0,
      avgSpend,
      savingsRate,
      categoryTotals
    };
  };

  const generateTrendData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString(langCode, { month: 'short', year: '2-digit' });
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      
      // only count expenses in trend chart, not income
      const monthTotal = transactions
        .filter(t => {
          const tDate = new Date(t.transaction_date);
          return tDate.getMonth() + 1 === monthNum &&
                 tDate.getFullYear() === yearNum &&
                 (t.type || 'expense') === 'expense';
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      months.push({ month, amount: monthTotal });
    }
    
    return months;
  };

  const generateInsights = (metrics) => {
    if (!metrics) return [];
    
    const insights = [];
    
    if (typeof metrics.savingsRate === 'number') {
      if (metrics.savingsRate >= 20) {
        insights.push(t(`reports.insightGreatBudget`, { amount: metrics.savingsRate }));
      } else if (metrics.savingsRate >= 0) {
        insights.push(t(`reports.insightSavingsRate`, { amount: metrics.savingsRate }));
      } else {
        insights.push(t(`reports.insightOverspend`, { amount: Math.abs(metrics.savingsRate) }));
      }
    } else if (metrics.savingsRate === null) {
      insights.push(t(`reports.insightCreateBudget`));
    }
    
    if (metrics.monthlySpent > 0 && metrics.topCategory && metrics.categoryTotals[metrics.topCategory] > metrics.monthlySpent * 0.4) {
      insights.push(t(`reports.insightTopCategory`, { 
        category: metrics.topCategory, 
        amount: (metrics.categoryTotals[metrics.topCategory] / metrics.monthlySpent * 100).toFixed(0) 
      }));
    }

    if (insights.length === 0 && metrics.monthlySpent > 0) {
      insights.push(t('reports.insightPositive'));
    }
    
    return insights;
  };

  const exportPDF = () => {
    const metrics = calculateMetrics();
    if (!metrics) {
      alert('No data to export');
      return;
    }
    
    const doc = `
Expense Report - ${formatDate(new Date().toISOString(), langCode)}
================================================

METRICS:
--------
Monthly Spending: ${formatCurrency(metrics.monthlySpent, currency)}
Top Category: ${metrics.topCategory ? metrics.topCategory + ' (' + formatCurrency(metrics.topCategoryAmount, currency) + ')' : 'No expenses yet'}
Average per Transaction: ${formatCurrency(metrics.avgSpend, currency)}
Budget Status: ${metrics.savingsRate === null ? 'No budget set' : (metrics.savingsRate > 0 ? metrics.savingsRate + '% remaining' : 'Over by ' + Math.abs(metrics.savingsRate) + '%')}

TRANSACTIONS:
--------
${transactions.filter(t => {
  const tDate = new Date(t.transaction_date);
  const now = new Date();
  return tDate.getMonth() + 1 === now.getMonth() + 1 && tDate.getFullYear() === now.getFullYear();
}).map(t => 
  `${formatDate(t.transaction_date, langCode)} | ${t.category.padEnd(15)} | ${formatCurrency(parseFloat(t.amount), currency).padStart(8)} | ${t.description}`
).join('\n')}
    `;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(doc));
    element.setAttribute('download', `expense-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    
    const headers = ['Date', 'Category', 'Amount', 'Description', 'Type'];
    const rows = transactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString(),
      t.category,
      parseFloat(t.amount).toFixed(2),
      t.description,
      t.type
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const metrics = calculateMetrics();
  const trendData = generateTrendData();
  const insights = metrics ? generateInsights(metrics) : [];

  return (
    <SectionShell title={t('reports.title')} subtitle={t('reports.subtitle')}>
      <div className="page-stack">
        <section className="metric-grid">
          <ReportMetricCard 
            label={t('reports.monthlySpending')} 
            value={metrics ? formatCurrency(metrics.monthlySpent, currency) : "—"} 
            note={metrics ? t('reports.totalExpensethisMonth') : t('reports.loading')} 
          />
          <ReportMetricCard 
            label={t('reports.topCategory')} 
            value={metrics ? (metrics.topCategory ? metrics.topCategory : "—") : "—"} 
            note={metrics ? (metrics.topCategory ? formatCurrency(metrics.topCategoryAmount, currency) : t('reports.topCategoryNote')) : t('reports.loading')} 
          />
          <ReportMetricCard 
            label={t('reports.averageTransaction')}
            value={metrics ? formatCurrency(metrics.avgSpend, currency) : "—"} 
            note={metrics ? t('reports.averageTransactionNote') : t('reports.loading')} 
          />
          <ReportMetricCard 
            label={t('reports.budgetHealth')} 
            value={metrics ? (metrics.savingsRate === null ? '—' : (metrics.savingsRate > 0 ? `${metrics.savingsRate}%` : `−${Math.abs(metrics.savingsRate)}%`)) : "—"} 
            note={metrics ? (metrics.savingsRate === null ? t('reports.budgetRemainingNote') : metrics.savingsRate > 0 ? t('reports.budgetRemainingNote') : t('reports.budgetOverNote')) : t('reports.loading')} 
          />
        </section>

        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('reports.monthlyTrend')}</h2>
                <small>{t('reports.monthlyTrendDescription')}</small>
              </div>
              <LineChart size={18} color="var(--accent)" />
            </div>

            {loading ? (
              <p style={{ padding: '1rem' }}>Loading trend data...</p>
            ) : trendData.length > 0 ? (
              <div style={{ padding: '1rem' }}>
                {trendData.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>{item.month}</span>
                      <strong>{formatCurrency(item.amount, currency)}</strong>
                    </div>
                    <div style={{ 
                      background: 'var(--bg-2)', 
                      height: '6px', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: 'var(--accent)',
                        height: '100%',
                        width: `${Math.min((item.amount / 1000) * 100, 100)}%`
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('reports.trendDataPending')}
                description={t('reports.trendDataDescription')}
              />
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('reports.insights')}</h2>
                <small>{t('reports.insightsDescription')}</small>
              </div>
              <TrendingUp size={18} color="var(--accent)" />
            </div>

            {loading ? (
              <p style={{ padding: '1rem' }}>Loading insights...</p>
            ) : insights.length > 0 ? (
              <div style={{ padding: '1rem' }}>
                {insights.map((insight, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', marginBottom: '0.75rem', background: 'var(--bg-2)', borderRadius: '4px', borderLeft: '3px solid var(--accent)' }}>
                    {insight}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('reports.insightsPending')}
                description={t('reports.insightsDescription')}
              />
            )}
          </div>
        </section>

        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('reports.categoryBreakdown')}</h2>
                <small>{t('reports.categoryBreakdownDescription')}</small>
              </div>
              <PieChart size={18} color="var(--accent)" />
            </div>

            {loading ? (
              <p style={{ padding: '1rem' }}>Loading breakdown...</p>
            ) : metrics && Object.keys(metrics.categoryTotals).length > 0 ? (
              <div style={{ padding: '1rem' }}>
                {Object.entries(metrics.categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = (amount / metrics.monthlySpent * 100).toFixed(0);
                    return (
                      <div key={category} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span>{category}</span>
                          <span>{formatCurrency(amount, currency)} ({percentage}%)</span>
                        </div>
                        <div style={{ 
                          background: 'var(--bg-2)', 
                          height: '8px', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: percentage > 40 ? '#ff6b6b' : percentage > 20 ? '#ffa94d' : '#51cf66',
                            height: '100%',
                            width: `${percentage}%`
                          }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState
                title={t('reports.categoryBreakdownPending')}
                description={t('reports.categoryBreakdownDescription')}
              />
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('reports.exportOptions')}</h2>
                <small>{t('reports.exportOptionsDescription')}</small>
              </div>
              <BarChart2 size={18} color="var(--accent)" />
            </div>

            <div className="setting-column">
              <div className="setting-row">
                <div className="setting-copy">
                  <strong>{t('reports.monthlySummary')}</strong>
                  <span>{t('reports.monthlySummaryDescription')}</span>
                </div>
                <button 
                  className="ghost-btn" 
                  type="button"
                  onClick={exportPDF}
                  disabled={loading || !metrics}
                  style={{ opacity: (loading || !metrics) ? 0.5 : 1, cursor: (loading || !metrics) ? 'not-allowed' : 'pointer' }}
                >
                  <Download size={16} style={{ marginRight: '0.5rem' }} />
                  {t('reports.export')}
                </button>
              </div>

              <div className="setting-row">
                <div className="setting-copy">
                  <strong>{t('reports.csvTransactions')}</strong>
                  <span>{t('reports.csvTransactionsDescription')}</span>
                </div>
                <button 
                  className="ghost-btn" 
                  type="button"
                  onClick={exportCSV}
                  disabled={loading || transactions.length === 0}
                  style={{ opacity: (loading || transactions.length === 0) ? 0.5 : 1, cursor: (loading || transactions.length === 0) ? 'not-allowed' : 'pointer' }}
                >
                  <Download size={16} style={{ marginRight: '0.5rem' }} />
                  {t('reports.export')}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}

export default Report;