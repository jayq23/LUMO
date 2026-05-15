const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = {
  // Health
  health: () => fetch(`${API_URL}/health`).then(r => r.json()),

  // Auth
  auth: {
    register: (email, password, name) =>
      fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      }).then(r => r.json()),

    login: (email, password) =>
      fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json()),

    profile: (id) =>
      fetch(`${API_URL}/auth/profile/${id}`).then(r => r.json()),

    updateProfile: (id, name, email) =>
      fetch(`${API_URL}/auth/profile/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || 'Failed to update profile');
        }
        return data;
      }),

    changePassword: (id, currentPassword, newPassword) =>
      fetch(`${API_URL}/auth/password/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || 'Failed to change password');
        }
        return data;
      }),

    deleteAccount: (id) =>
      fetch(`${API_URL}/auth/account/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || 'Failed to delete account');
        }
        return data;
      }),
  },

  // Transactions
  transactions: {
    getAll: (userId) =>
      fetch(`${API_URL}/transactions/user/${userId}`).then(r => r.json()),

    create: (userId, category, amount, description, transactionDate, type) =>
      fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          category,
          amount,
          description,
          transactionDate,
          type,
        }),
      }).then(r => r.json()),

    update: (id, updates) =>
      fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(r => r.json()),

    delete: (id) =>
      fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
      }).then(r => r.json()),
  },

  // Budgets
  budgets: {
    getAll: (userId) =>
      fetch(`${API_URL}/budgets/user/${userId}`).then(r => r.json()),

    create: (userId, category, limitAmount, month, year) =>
      fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          category,
          limitAmount,
          month,
          year,
        }),
      }).then(r => r.json()),

    update: (id, limitAmount) =>
      fetch(`${API_URL}/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limitAmount }),
      }).then(r => r.json()),

    delete: (id) =>
      fetch(`${API_URL}/budgets/${id}`, {
        method: 'DELETE',
      }).then(r => r.json()),
  },
};

export default api;
