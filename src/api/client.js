const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const apiClient = async (path, opts = {}) => {
  const token = localStorage.getItem('authToken');
  console.log('DEBUG apiClient call:', { 
    path, 
    hasToken: !!token, 
    tokenValue: token ? token.substring(0, 30) + '...' : 'NO TOKEN',
  });
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${API_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
    ...opts,
    headers,
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.error('DEBUG API error:', res.status, res.statusText, data);
  }
  return data;
};

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
      fetch(`${API_URL}/auth/profile/${id}`, {
        headers: getAuthHeaders()
      }).then(r => r.json()),

    updateProfile: (id, name, email) =>
      fetch(`${API_URL}/auth/profile/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
      fetch(`${API_URL}/transactions/user/${userId}`, {
        headers: getAuthHeaders()
      }).then(r => r.json()),

    create: (userId, category, amount, description, transactionDate, type) =>
      fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      }).then(r => r.json()),

    delete: (id) =>
      fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(r => r.json()),
  },

  // Budgets
  budgets: {
    getAll: (userId) =>
      fetch(`${API_URL}/budgets/user/${userId}`, {
        headers: getAuthHeaders()
      }).then(r => r.json()),

    create: (userId, category, limitAmount, month, year) =>
      fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ limitAmount }),
      }).then(r => r.json()),

    delete: (id) =>
      fetch(`${API_URL}/budgets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(r => r.json()),
  },

  // OAuth / Social Login
  oauth: {
    socialLogin: (idToken, provider) =>
      fetch(`${API_URL}/oauth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider }),
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || 'Social login failed');
        }
        return data;
      }),
  },
};

export default api;
