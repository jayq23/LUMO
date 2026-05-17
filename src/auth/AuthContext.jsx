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
    try {
      const savedUser = localStorage.getItem('user');
      const savedPreferences = localStorage.getItem('preferences');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (err) {
      console.error('Failed to parse saved data:', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await api.auth.register(email, password, name);
      if (response.error) {
        setError(response.error);
        return false;
      }
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
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
      // eslint-disable-next-line no-unused-vars
      const response = await api.auth.login(email, password);
      console.log('DEBUG login response:', response);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      if (response.token) {
        console.log('DEBUG saving token:', response.token.substring(0, 20) + '...');
        localStorage.setItem('authToken', response.token);
        const checkToken = localStorage.getItem('authToken');
        console.log('DEBUG token saved and retrieved:', !!checkToken, checkToken?.substring(0, 20) + '...');
      } else {
        console.warn('WARNING: No token in login response');
      }
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
    localStorage.removeItem('authToken');
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
      // eslint-disable-next-line no-unused-vars
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
      // eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
