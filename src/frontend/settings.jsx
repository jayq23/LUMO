import SectionShell from "./sectionShell.jsx";
import { ShieldCheck, Palette, RefreshCcw, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTranslation } from "../utils/translations.js";
import { getLanguageCode } from "../utils/languageHelper.js";
import "../styles/section-pages.css";

function SettingRow({ title, description, action, chip, select, onSelect, switchOn, onToggle, onAction }) {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {select ? (
        <select
          className="setting-select"
          value={chip}
          onChange={(e) => onSelect(e.target.value)}
          style={{ background: 'var(--accent-glow)' }}
        >
          {select.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : chip ? (
        <span className="setting-chip">{chip}</span>
      ) : action ? (
        <button 
          className="ghost-btn" 
          type="button"
          onClick={onAction}
        >
          {action}
        </button>
      ) : (
        <div 
          className={`switch ${switchOn ? "switch-on" : ""}`}
          onClick={onToggle}
          style={{ cursor: 'pointer' }}
          role="switch"
          aria-checked={switchOn}
        >
          <span className="switch-knob" />
        </div>
      )}
    </div>
  );
}

function Settings() {
  const { user, isInitialized, logout, updateProfile, changePassword, deleteAccount, preferences, savePreferences, error: contextError } = useAuth();
  const language = preferences.language;
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') === 'dark' ? 'Dark' : 'Light');
  
  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

  // Preferences state (synced from context)
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Currency and Language options
const currencyOptions = [
  'USD', 
//  'MXN', 
  'EUR', 
 // 'CNY',
 // 'JPY', 
 // 'KRW', 
 // 'RUB', 
 // 'SAR', 
//  'BRL',
  'PHP',
];
const languageOptions = [
  'English',
  'Spanish',
 // 'French',
 // 'German',
 // 'Mandarin',
 // 'Chinese',
 // 'Japanese',
 // 'Korean',
 // 'Russian',
 // 'Arabic',
 // 'Portuguese'
];
const themeOptions = ['Light', 'Dark'];


  // Update local preferences when context changes
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  // Update edit form when user data changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleEditProfile = async () => {
    setError('');
    setSuccess('');
    
    if (!editName.trim() || !editEmail.trim()) {
      setError('Name and email are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const success = await updateProfile(editName, editEmail);
      if (success) {
        setSuccess(t('settings.profileUpdated'));
        setShowEditProfile(false);
        setEditName('');
        setEditEmail('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(contextError || t('settings.profileError'));
      }
    } catch (err) {
      setError('An error occurred while updating profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');
    
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setError('All fields are required');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (passwordForm.current === passwordForm.newPass) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const success = await changePassword(passwordForm.current, passwordForm.newPass);
      if (success) {
        setSuccess('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({ current: '', newPass: '', confirm: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(contextError || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred while changing password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    const updated = {
      ...localPreferences,
      [key]: !localPreferences[key]
    };
    setLocalPreferences(updated);
    savePreferences(updated);
  };

  const changeCurrency = (currency) => {
    const updated = {
      ...localPreferences,
      currency
    };
    setLocalPreferences(updated);
    savePreferences(updated);
  };

  const changeLanguage = (language) => {
    const updated = {
      ...localPreferences,
      language
    };
    setLocalPreferences(updated);
    savePreferences(updated);
  };

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    const isDark = theme === 'Dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.')) {
      if (window.confirm('Type "DELETE" in your mind to confirm final deletion.')) {
        setLoading(true);
        try {
          const success = await deleteAccount();
          if (success) {
            setSuccess('Account deleted successfully. Redirecting to login...');
            setTimeout(() => {
              // The logout in deleteAccount context function will handle redirect
            }, 2000);
          } else {
            setError(contextError || 'Failed to delete account');
          }
        } catch (err) {
          setError('An error occurred while deleting account');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <SectionShell title={t('settings.title')} subtitle={t('settings.subtitle')}>
      {showEditProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{t('settings.updateProfile')}</h3>
              <button 
                onClick={() => {
                  setShowEditProfile(false);
                  setError('');
                  setSuccess('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ 
                padding: '0.75rem', 
                background: '#ff6b6b', 
                color: 'white', 
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                padding: '0.75rem', 
                background: '#51cf66', 
                color: 'white', 
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {success}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleEditProfile(); }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('settings.name')}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text-1)',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('settings.email')}
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text-1)',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="ghost-btn"
                  style={{ padding: '0.5rem 1rem', opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{t('settings.changePassword')}</h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setError('');
                  setSuccess('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ 
                padding: '0.75rem', 
                background: '#ff6b6b', 
                color: 'white', 
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                padding: '0.75rem', 
                background: '#51cf66', 
                color: 'white', 
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {success}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('settings.currentPassword')}
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text-1)',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('settings.newPassword')}
                </label>
                <input
                  type="password"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text-1)',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('settings.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text-1)',
                    boxSizing: 'border-box',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="ghost-btn"
                  style={{ padding: '0.5rem 1rem', opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? t('settings.updating') : t('settings.updatePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-stack">
        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('settings.profile')}</h2>
                <small>{t('settings.profileSubtitle')}</small>
              </div>
              <span className="setting-chip">Active</span>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <div className="summary-copy">
                  <strong>{t('settings.name')}</strong>
                  <span>{t('settings.nameDescription')}</span>
                </div>
                <span className="summary-value">{user.name}</span>
              </div>
              <div className="summary-row">
                <div className="summary-copy">
                  <strong>{t('settings.email')}</strong>
                  <span>{t('settings.emailDescription')}</span>
                </div>
                <span className="summary-value">{user.email}</span>
              </div>
            </div>

            <div className="action-row">
              <button 
                className="accent-btn" 
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setShowEditProfile(true);
                }}
              >
                {t('settings.updateProfile')}
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('settings.account')}</h2>
                <small>{t('settings.accountSubtitle')}</small>
              </div>
              <ShieldCheck size={18} color="var(--accent)" />
            </div>

            <div className="setting-column">
              <SettingRow
                title="Password reset"
                description="Update your password and recovery options."
                action={t('settings.updatePassword')}
                onAction={() => setShowPasswordModal(true)}
              />
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>{t('settings.preferences')}</h2>
                <small>{t('settings.preferencesSubtitle')}</small>
              </div>
              <Palette size={18} color="var(--accent)" />
            </div>

            <div className="setting-column">
              <SettingRow
                title="Weekly summary email"
                description="Receive a summary of your spending every Sunday."
                switchOn={localPreferences.weeklyEmail}
                onToggle={() => togglePreference('weeklyEmail')}
              />
              <SettingRow
                title="Auto-categorize transactions"
                description="Automatically assign categories based on merchant."
                switchOn={localPreferences.autoCategories}
                onToggle={() => togglePreference('autoCategories')}
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Appearance</h2>
                <small>Customize how Lumo looks</small>
              </div>
              <Palette size={18} color="var(--accent)" />
            </div>

            <div className="setting-column">
              <SettingRow
                title="Currency"
                description="Display all amounts in your preferred currency."
                chip={localPreferences.currency}
                select={currencyOptions}
                onSelect={changeCurrency}
              />
              <SettingRow
                title="Theme"
                description="Choose between light and dark theme."
                chip={currentTheme}
                select={themeOptions}
                onSelect={changeTheme}
              />
              <SettingRow
                title={t('settings.language')}
                description={t('settings.selectLanguage')}
                chip={localPreferences.language}
                select={languageOptions}
                onSelect={changeLanguage}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{t('settings.profile')}</h2>
              <small>{t('settings.profileSubtitle')}</small>
            </div>
          </div>

          <div className="setting-column">
            <div className="setting-row">
              <div className="setting-copy">
                <strong>{t('settings.signOut')}</strong>
                <span>{t('settings.signOutDescription')}</span>
              </div>
              <button 
                className="ghost-btn" 
                type="button"
                onClick={handleLogout}
              >
                {t('settings.logOut')}
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-copy">
                <strong>{t('settings.deleteAccount')}</strong>
                <span>{t('settings.deleteAccountDescription')}</span>
              </div>
              <button 
                className="ghost-btn" 
                type="button"
                style={{ color: '#ff6b6b', opacity: loading ? 0.6 : 1 }}
                disabled={loading}
                onClick={handleDeleteAccount}
              >
                {loading ? t('settings.deleting') : t('settings.delete')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}

export default Settings;