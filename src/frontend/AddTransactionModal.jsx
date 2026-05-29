import { X, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useTranslation } from '../utils/translations.js';
import { getLanguageCode } from '../utils/languageHelper.js';
import { addOfflineTransaction } from '../utils/offlineStorage.js';

function AddTransactionModal({ userId, onTransactionAdded, language, currency }) {
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);

  // Use internal keys that match your translation files
  const CATEGORIES = ['food', 'transport', 'shopping', 'subscriptions', 'health', 'utilities', 'other'];
  const CATEGORIES_INCOME = ['salary', 'freelance', 'investments', 'gifts', 'other'];

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [formData, setFormData] = useState({
    type: 'expense',
    category: 'food',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (newType) => {
    const defaultCategory = newType === 'expense' ? CATEGORIES[0] : CATEGORIES_INCOME[0];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: defaultCategory,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      const payload = {
        userId,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transactionDate: formData.transactionDate,
        type: formData.type
      };

      if (isOnline) {
        const response = await api.transactions.create(
          payload.userId,
          payload.category,
          payload.amount,
          payload.description,
          payload.transactionDate,
          payload.type
        );
        if (response.error) throw new Error(response.error);
      } else {
        await addOfflineTransaction(payload);
      }

      // Success logic
      setFormData({
        type: 'expense',
        category: 'food',
        amount: '',
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      setIsOpen(false);
      onTransactionAdded();

    } catch (err) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="add-transaction-btn">
        <Plus size={18} />
        {t('transactions.addTransaction')}
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('transactions.addTransaction')}</h2>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="error-message">{error}</div>}

              {!isOnline && (
                <div className="offline-badge">
                  <span>📱 {t('common.offlineMode') || 'Offline Mode'}</span>
                </div>
              )}

              <div className="form-group">
                <label>{t('transactions.type')}</label>
                <div className="type-buttons">
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'expense' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('expense')}
                  >
                    {t('transactions.expense')}
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'income' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('income')}
                  >
                    {t('transactions.income')}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="amount">{t('transactions.amount')}</label>
                <div className="amount-input">
                  <span className="currency-symbol">{currency}</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category">{t('transactions.category')}</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange}>
                  {(formData.type === 'expense' ? CATEGORIES : CATEGORIES_INCOME).map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`transactions.${cat}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">{t('transactions.date')}</label>
                <input
                  type="date"
                  id="date"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('transactions.description')}</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder={t('transactions.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? '...' : t('transactions.addTransaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddTransactionModal;