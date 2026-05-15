import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/client.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState({
    twoFactorAuth: false,
    sessionAlerts: false,
    weeklyEmail: true,
    autoCategories: true,
    cloudBackup: true,
    currency: 'USD',
    language: 'English'
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedPreferences = localStorage.getItem('preferences');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
      }
    }
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (err) {
        console.error('Failed to parse saved preferences:', err);
      }
    }
    setIsInitialized(true);
  }, []);

  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.register(email, password, name);
      if (response.error) {
        setError(response.error);
        return false;
      }
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.login(email, password);
      if (response.error) {
        setError(response.error);
        return false;
      }
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (name, email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.updateProfile(user.id, name, email);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.changePassword(user.id, currentPassword, newPassword);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.deleteAccount(user.id);
      logout();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('preferences', JSON.stringify(newPreferences));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      register, 
      login, 
      logout, 
      updateProfile,
      changePassword,
      deleteAccount,
      isInitialized,
      preferences,
      savePreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
