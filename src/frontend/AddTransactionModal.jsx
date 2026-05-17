import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import api from '../api/client.js';
import { formatCurrency } from '../utils/currencyHelper.js';
import { useTranslation } from '../utils/translations.js';
import { getLanguageCode } from '../utils/languageHelper.js';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Subscriptions', 'Health', 'Utilities', 'Other'];
const categoryIncome= ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

function AddTransactionModal({ userId, onTransactionAdded, language, currency }) {
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'expense',
    category: 'Food',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (newType) => {
    const defaultCategory = newType === 'expense' ? CATEGORIES[0] : categoryIncome[0];
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

      const response = await api.transactions.create(
        userId,
        formData.category.toLowerCase(),
        parseFloat(formData.amount),
        formData.description,
        formData.transactionDate,
        formData.type
      );

      if (response.error) {
        setError(response.error);
      } else {
        setFormData({
          type: 'expense',
          category: 'Food',
          amount: '',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0],
        });
        setIsOpen(false);
        onTransactionAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="add-transaction-btn"
        aria-label="Add transaction"
      >
        <Plus size={18} />
        Add Transaction
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Transaction</h2>
              <button
                className="modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="error-message">{error}</div>}

              {/* Type Selection */}
              <div className="form-group">
                <label>Type</label>
                <div className="type-buttons">
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'expense' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('expense')}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'income' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('income')}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <div className="amount-input">
                  <span className="currency-symbol">{currency}</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {formData.type === 'expense'
                    ? CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    : categoryIncome.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder="Add notes..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
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
