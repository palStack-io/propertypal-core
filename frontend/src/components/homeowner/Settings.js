import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers } from '../../services/api';
import SettingsAccount      from './settings/SettingsAccount';
import SettingsPassword     from './settings/SettingsPassword';
import SettingsProperty     from './settings/SettingsProperty';
import SettingsNotifications from './settings/SettingsNotifications';
import SettingsAppearance   from './settings/SettingsAppearance';
import SettingsTimezone     from './settings/SettingsTimezone';
import SettingsData         from './settings/SettingsData';
import SettingsApiKeys      from './settings/SettingsApiKeys';
import SettingsAbout        from './settings/SettingsAbout';

const NAV_ITEMS = [
  { id: 'account',       label: 'Account Information', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'password',      label: 'Password',             icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'property',      label: 'Property Settings',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'notifications', label: 'Notifications',         icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'appearance',    label: 'Appearance',            icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { id: 'timezone',      label: 'Time Zone',             icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'data',          label: 'Data & Privacy',        icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  { id: 'api-keys',      label: 'API Keys',              icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { id: 'about',         label: 'About',                 icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [message, setMessage]     = useState('');
  const [activeTab, setActiveTab] = useState('account');

  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [notifications, setNotifications] = useState({ email_notifications: true, maintenance_reminders: true, payment_reminders: true, project_updates: true, document_updates: false });
  const [appearance, setAppearance] = useState({ theme: 'dark', dashboard_layout: 'default' });
  const [timezone, setTimezone]   = useState('UTC');
  const [properties, setProperties]   = useState([]);
  const [primaryResidenceId, setPrimaryResidenceId] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (!userString || !token) { navigate('/login'); return; }
    const u = JSON.parse(userString);
    setUser(u);
    setAccountForm({ first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '', phone: u.phone || '' });

    apiHelpers.get('settings').then(res => {
      if (res?.notifications) setNotifications(res.notifications);
      if (res?.appearance)    setAppearance(res.appearance);
      if (res?.timezone)      setTimezone(res.timezone);
    }).catch(() => {});

    setLoadingProperties(true);
    apiHelpers.get('properties/').then(res => {
      if (Array.isArray(res)) {
        setProperties(res);
        const primary = res.find(p => p.is_primary_residence) || res[0];
        if (primary) setPrimaryResidenceId(primary.id.toString());
      }
    }).catch(() => {}).finally(() => setLoadingProperties(false));
  }, [navigate]);

  const withLoading = async (fn) => { setLoading(true); setError(''); try { await fn(); } catch (e) { setError(e.response?.data?.error || 'Something went wrong.'); } finally { setLoading(false); } };

  const handleAccountUpdate = (e) => { e.preventDefault(); withLoading(async () => { await apiHelpers.put('users/profile', accountForm); const updated = { ...user, ...accountForm }; localStorage.setItem('user', JSON.stringify(updated)); setUser(updated); setMessage('Account updated!'); }); };
  const handlePasswordUpdate = (e) => { e.preventDefault(); if (passwordForm.new_password !== passwordForm.confirm_password) { setError('Passwords do not match.'); return; } withLoading(async () => { await apiHelpers.put('users/password', { current_password: passwordForm.current_password, new_password: passwordForm.new_password }); setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); setMessage('Password updated!'); }); };
  const handleNotificationUpdate = (e) => { e.preventDefault(); withLoading(async () => { await apiHelpers.put('settings/notifications', notifications); setMessage('Notification preferences saved!'); }); };
  const handleAppearanceUpdate = (e) => { e.preventDefault(); withLoading(async () => { await apiHelpers.put('settings/appearance', appearance); setMessage('Appearance saved!'); }); };
  const handleTimezoneUpdate = (e) => { e.preventDefault(); withLoading(async () => { await apiHelpers.put('settings/timezone', { timezone }); setMessage('Time zone saved!'); }); };
  const handlePrimaryResidenceChange = async (e) => { const id = e.target.value; if (!id) return; withLoading(async () => { await apiHelpers.post(`properties/${id}/set-primary`, {}); setPrimaryResidenceId(id); setMessage('Primary residence updated!'); }); };

  const fieldChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="t-secondary mt-1">Manage your account and application preferences</p>
        </div>

        {error && (
          <div className="alert-error mb-6 flex justify-between items-start">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-4 opacity-70 hover:opacity-100">✕</button>
          </div>
        )}
        {message && (
          <div className="alert-success mb-6 flex justify-between items-start">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="ml-4 opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Nav */}
          <div className="md:w-1/4">
            <div className="card p-4">
              <nav className="flex flex-col space-y-1">
                {NAV_ITEMS.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    className="px-4 py-2 rounded-md text-left flex items-center transition-colors sidebar-link"
                    style={{
                      background: activeTab === id ? 'var(--bg-card-hover)' : 'transparent',
                      color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                    onClick={() => setActiveTab(id)}
                  >
                    <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                    </svg>
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:w-3/4">
            <div className="card p-6">
              {activeTab === 'account'       && <SettingsAccount formData={accountForm} onChange={fieldChange(setAccountForm)} onSubmit={handleAccountUpdate} loading={loading} />}
              {activeTab === 'password'      && <SettingsPassword formData={passwordForm} onChange={fieldChange(setPasswordForm)} onSubmit={handlePasswordUpdate} loading={loading} />}
              {activeTab === 'property'      && <SettingsProperty properties={properties} primaryResidenceId={primaryResidenceId} loadingProperties={loadingProperties} onPrimaryChange={handlePrimaryResidenceChange} />}
              {activeTab === 'notifications' && <SettingsNotifications settings={notifications} onChange={fieldChange(setNotifications)} onSubmit={handleNotificationUpdate} loading={loading} />}
              {activeTab === 'appearance'    && <SettingsAppearance settings={appearance} onChange={fieldChange(setAppearance)} onSubmit={handleAppearanceUpdate} loading={loading} />}
              {activeTab === 'timezone'      && <SettingsTimezone timezone={timezone} onChange={(e) => setTimezone(e.target.value)} onSubmit={handleTimezoneUpdate} loading={loading} />}
              {activeTab === 'data'          && <SettingsData />}
              {activeTab === 'api-keys'      && <SettingsApiKeys setMessage={setMessage} setError={setError} />}
              {activeTab === 'about'         && <SettingsAbout />}
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
};

export default Settings;
