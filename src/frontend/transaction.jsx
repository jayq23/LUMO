import SectionShell from "./sectionShell.jsx";
import { ArrowLeftRight, Filter, Search, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../api/client.js";
import "../styles/section-pages.css";
import EmptyState from "./emptyState.jsx";
import { formatCurrency } from '../utils/currencyHelper.js';
import { formatDate, getLanguageCode } from '../utils/languageHelper.js';
import { useTranslation } from '../utils/translations.js';
import AddTransactionModal from './AddTransactionModal.jsx';
import { useSyncOfflineTransactions } from '../utils/useSyncOfflineTransactions.js';
import { getPendingTransactions } from '../utils/offlineStorage.js';

const CATEGORY_COLORS = {
  food:          "#f0a500",
  transport:     "#5b9cf6",
  shopping:      "#a78bfa",
  income:        "#4caf89",
  subscriptions: "#e05a5a",
  health:        "#34d399",
  utilities:     "#fb923c",
  other:         "#5e6278",
};

function getCategoryColor(category = "") {
  return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.other;
}

function QuickStat({ label, note, value, positive }) {
  return (
    <div className="summary-row">
      <div className="summary-copy">
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <span className={positive ? "amount-positive" : "amount-negative"}>
        {value}
      </span>
    </div>
  );
}

function TransactionRow({ transaction, currency, language, tFn }) {
  const color = getCategoryColor(transaction.category);
  const isIncome = transaction.type === "income";
  const amount = `${isIncome ? "+" : "-"}${formatCurrency(transaction.amount, currency)}`;
  const langCode = getLanguageCode(language);
  const formattedDate = formatDate(transaction.transaction_date || transaction.transactionDate, langCode);
  const isOffline = transaction._isOffline;

  return (
    <div 
      className="progress-item" 
      style={{ 
        alignItems: "center", 
        padding: "13px 4px", 
        borderBottom: "1px solid var(--border)",
        opacity: isOffline ? 0.7 : 1,
        backgroundColor: isOffline ? "rgba(255,255,255,0.02)" : "transparent"
      }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color, flexShrink: 0,
        border: isOffline ? "2px dashed rgba(255,255,255,0.5)" : "none"
      }} />

      <div className="progress-label" style={{ flex: 1 }}>
        <strong>{tFn(`categories.${transaction.category?.toLowerCase()}`)}</strong>
        <span>{transaction.description || "No description"}</span>
        {isOffline && <span style={{ color: '#f0a500', fontSize: '12px', marginLeft: '4px' }}>⏳ Offline</span>}
      </div>

      <div className="item-title-right">
        <span className={isIncome ? "amount-positive" : "amount-negative"}>
          {amount}
        </span>
        <span className="compact-note" style={{ marginTop: 2 }}>
          {formattedDate}
        </span>
      </div>
    </div>
  );
} 

function Transactions() {
  const { user, isInitialized, preferences } = useAuth();
  const currency = preferences.currency;
  const language = preferences.language;
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sync offline transactions when online
  useSyncOfflineTransactions(user?.id);

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
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "income"  && t.type === "income") ||
      (filter === "expense" && t.type === "expense");

    const matchesSearch =
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const incomeTotal  = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const incomeCount  = transactions.filter((t) => t.type === "income").length;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;

  return (
    <SectionShell title={t('transactions.title')} subtitle={t('transactions.subtitle')}>
      <div className="page-stack">

        {/* Add Transaction Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <AddTransactionModal 
            userId={user.id} 
            onTransactionAdded={loadTransactions}
            language={language}
            currency={currency}
          />
        </div>

        {/* ── Top panels ── */}
        <section className="panel-grid">

          {/* Filter panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('transactions.filter')}</h2>
                <small>{t('transactions.search')}</small>
              </div>
              <Filter size={18} color="var(--accent)" />
            </div>

            <div className="pill-row">
              {["all", "income", "expense"].map((f) => (
                <span
                  key={f}
                  className={`pill ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                  style={{ cursor: "pointer", textTransform: "capitalize" }}
                >
                  {f === "all" ? t('transactions.allTransactions') : f === "income" ? t('transactions.income') : t('transactions.expenses')}
                </span>
              ))}
            </div>

            <div className="setting-row">
              <input
                type="search"
                placeholder={t('transactions.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button">
                <Search size={18} color="var(--text-2)" />
              </button>
            </div>
          </div>

          {/* Quick stats panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('transactions.allTransactions')}</h2>
                <small>{t('transactions.quickStats')}</small>
              </div>
              <CreditCard size={18} color="var(--accent)" />
            </div>

            <div className="summary-list">
              <QuickStat
                label={t('transactions.income')}
                note={`${incomeCount} ${t('transactions.transactions')}`}
                value={formatCurrency(incomeTotal, currency)}
                positive
              />
              <QuickStat
                label={t('transactions.expenses')}
                note={`${expenseCount} ${t('transactions.transactions')}`}
                value={formatCurrency(expenseTotal, currency)}
                positive={false}
              />
              <QuickStat
                label={t('transactions.netBalance')}
                note={t('transactions.incomeMinusExpenses')}
                value={formatCurrency(incomeTotal - expenseTotal, currency)}
                positive={incomeTotal >= expenseTotal}
              />
            </div>
          </div>
        </section>

        {/* ── Transaction list ── */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{t('transactions.recentActivity')}</h2>
              <small>
                {filteredTransactions.length} {filteredTransactions.length === 1 ? t('transactions.transaction') : t('transactions.transactions')} found
              </small>
            </div>
            <ArrowLeftRight size={18} color="var(--accent)" />
          </div>

          {loading ? (
            <div className="empty-state">
              <strong>{t('transactions.loading')}</strong>
              <span>{t('transactions.fetchingData')}</span>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div>
              {filteredTransactions.map((txn) => (
                <TransactionRow key={txn.id} transaction={txn} currency={currency} language={language} tFn={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('transactions.noTransactions')}
              description={
                searchQuery || filter !== "all"
                  ? t('transactions.adjustFilters')
                  : t('transactions.createFirstTransaction')
              }
            />
          )}
        </section>

      </div>
    </SectionShell>
  );
}

export default Transactions;