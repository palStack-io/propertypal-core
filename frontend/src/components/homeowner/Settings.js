import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers } from '../../services/api'; 

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('account');
  
  // Form data states
  const [accountFormData, setAccountFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  
  const [passwordFormData, setPasswordFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    maintenance_reminders: true,
    payment_reminders: true,
    project_updates: true,
    document_updates: false
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark',
    dashboard_layout: 'default'
  });

  // New state for timezone
  const [timezone, setTimezone] = useState('UTC');
  
  // New state for properties and primary residence
  const [properties, setProperties] = useState([]);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [primaryResidenceId, setPrimaryResidenceId] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [newKeyFormData, setNewKeyFormData] = useState({
    name: '',
    scopes: ['read:maintenance', 'write:maintenance'],
    expires_days: ''
  });

  // Fetch user when component mounts
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!userString || !token) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(userString);
    setUser(userData);
    
    // Pre-fill form data with user information
    setAccountFormData({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      phone: userData.phone || ''
    });
    
    // Fetch notification and appearance settings
    fetchSettings();
    
    // Fetch properties for the user
    fetchProperties();
    
    setLoading(false);
  }, [navigate]);
  
  // Fetch user settings from API
  const fetchSettings = async () => {
    try {
      const response = await apiHelpers.get('settings');
      
      // If API returns notification settings, update state
      if (response && response.notifications) {
        setNotificationSettings(response.notifications);
      }
      
      // If API returns appearance settings, update state
      if (response && response.appearance) {
        setAppearanceSettings(response.appearance);
      }

      // If API returns timezone, update state
      if (response && response.timezone) {
        setTimezone(response.timezone);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Continue with default settings if fetch fails
    }
  };

  // Fetch properties for the user
  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await apiHelpers.get('properties/');
      
      if (response && Array.isArray(response)) {
        setProperties(response);
        
        // Find and set primary residence
        const primaryProperty = response.find(property => property.is_primary_residence);
        if (primaryProperty) {
          setPrimaryResidenceId(primaryProperty.id.toString());
          setCurrentProperty(primaryProperty);
        } else if (response.length > 0) {
          // If no primary residence, set the first property as current
          setCurrentProperty(response[0]);
        }
      }
      
      setLoadingProperties(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setLoadingProperties(false);
    }
  };
  
  // Handle account form input changes
  const handleAccountInputChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData({
      ...accountFormData,
      [name]: value
    });
  };
  
  // Handle password form input changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData({
      ...passwordFormData,
      [name]: value
    });
  };
  
  // Handle notification toggle changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  // Handle appearance setting changes
  const handleAppearanceChange = (e) => {
    const { name, value } = e.target;
    setAppearanceSettings({
      ...appearanceSettings,
      [name]: value
    });
  };

  // Handle timezone change
  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
  };

  // API Keys functions
  const fetchApiKeys = async () => {
    try {
      setLoadingApiKeys(true);
      const response = await apiHelpers.get('integrations/api-keys');
      setApiKeys(response.api_keys || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await apiHelpers.post('integrations/api-keys', newKeyFormData);
      setNewApiKey(response.api_key);
      setShowNewKeyModal(true);
      setNewKeyFormData({ name: '', scopes: ['read:maintenance', 'write:maintenance'], expires_days: '' });
      await fetchApiKeys();
      setMessage('API key created successfully!');
    } catch (err) {
      console.error('Error creating API key:', err);
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    try {
      await apiHelpers.delete(`integrations/api-keys/${keyId}`);
      setMessage('API key deleted successfully');
      await fetchApiKeys();
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key');
    }
  };

  const handleToggleApiKey = async (keyId) => {
    try {
      await apiHelpers.put(`integrations/api-keys/${keyId}/toggle`);
      setMessage('API key status updated');
      await fetchApiKeys();
    } catch (err) {
      console.error('Error toggling API key:', err);
      setError('Failed to update API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  // Handle primary residence change
  const handlePrimaryResidenceChange = async (e) => {
    const propertyId = e.target.value;
    
    if (!propertyId) return;
    
    try {
      setLoading(true);
      
      await apiHelpers.post(`properties/${propertyId}/set-primary`, {});
      
      setPrimaryResidenceId(propertyId);
      setMessage('Primary residence updated successfully!');
      
      // Refresh properties to reflect the change
      fetchProperties();
      setLoading(false);
    } catch (err) {
      console.error('Error updating primary residence:', err);
      setError('Failed to update primary residence. Please try again.');
      setLoading(false);
    }
  };
  
  // Update account information
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await apiHelpers.put('users/profile', accountFormData);
      
      // Update local user data
      const updatedUser = { ...user, ...accountFormData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setMessage('Account information updated successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error updating account:', err);
      setError('Failed to update account information. Please try again.');
      setLoading(false);
    }
  };
  
  // Update password
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate password match
    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    
    try {
      setLoading(true);
      
      await apiHelpers.put('users/password', {
        current_password: passwordFormData.current_password,
        new_password: passwordFormData.new_password
      });
      
      // Reset password form
      setPasswordFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setMessage('Password updated successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error updating password:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Current password is incorrect.');
      } else {
        setError('Failed to update password. Please try again.');
      }
      
      setLoading(false);
    }
  };
  
  // Update notification settings
  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await apiHelpers.put('settings/notifications', notificationSettings);
      
      setMessage('Notification settings updated successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings. Please try again.');
      setLoading(false);
    }
  };
  
  // Update appearance settings
  const handleAppearanceUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await apiHelpers.put('settings/appearance', appearanceSettings);
      
      setMessage('Appearance settings updated successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error updating appearance settings:', err);
      setError('Failed to update appearance settings. Please try again.');
      setLoading(false);
    }
  };

  // Update timezone
  const handleTimezoneUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await apiHelpers.put('settings/timezone', { timezone });
      
      setMessage('Timezone updated successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error updating timezone:', err);
      setError('Failed to update timezone. Please try again.');
      setLoading(false);
    }
  };

  // Timezone options based on major regions
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'Auckland' },
    { value: 'UTC', label: 'UTC' }
  ];

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and application preferences</p>
          </div>
        </div>
        
        {/* Error and message display */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6">
            {error}
            <button 
              className="float-right text-red-400 hover:text-red-300"
              onClick={() => setError('')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
        
        {message && (
          <div className="bg-green-900 bg-opacity-30 text-green-400 p-4 rounded-md mb-6">
            {message}
            <button 
              className="float-right text-green-400 hover:text-green-300"
              onClick={() => setMessage('')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
        
        {/* Settings Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="md:w-1/4">
            <div className="card p-4">
              <nav className="flex flex-col space-y-1">
                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'account' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('account')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Account Information
                </button>
                
                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'password' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('password')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Password
                </button>

                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'property' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('property')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  Property Settings
                </button>

                
                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'notifications' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  Notifications
                </button>
                
                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'appearance' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('appearance')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                  </svg>
                  Appearance
                </button>

                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'timezone' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('timezone')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Time Zone
                </button>
                
                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'data' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('data')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                  </svg>
                  Data & Privacy
                </button>

                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'api-keys' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => { setActiveTab('api-keys'); fetchApiKeys(); }}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  API Keys
                </button>

                <button
                  className={`px-4 py-2 rounded-md text-left flex items-center ${
                    activeTab === 'about' ? 'bg-sky-900 bg-opacity-20 text-sky-400' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('about')}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  About
                </button>
              </nav>
            </div>
          </div>
          
          {/* Settings Content */}
          <div className="md:w-3/4">
            <div className="card p-6">
              {/* Account Information Tab */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Account Information</h2>
                  <form onSubmit={handleAccountUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          name="first_name"
                          className="form-input"
                          value={accountFormData.first_name}
                          onChange={handleAccountInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          name="last_name"
                          className="form-input"
                          value={accountFormData.last_name}
                          onChange={handleAccountInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          className="form-input"
                          value={accountFormData.email}
                          onChange={handleAccountInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          className="form-input"
                          value={accountFormData.phone}
                          onChange={handleAccountInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        className="btn-secondary px-4 py-2 rounded-md"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Update Password</h2>
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Current Password</label>
                        <input
                          type="password"
                          name="current_password"
                          className="form-input"
                          value={passwordFormData.current_password}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">New Password</label>
                        <input
                          type="password"
                          name="new_password"
                          className="form-input"
                          value={passwordFormData.new_password}
                          onChange={handlePasswordInputChange}
                          minLength="8"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirm_password"
                          className="form-input"
                          value={passwordFormData.confirm_password}
                          onChange={handlePasswordInputChange}
                          minLength="8"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-400">
                      <p>Password must be at least 8 characters long and include:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        className="btn-secondary px-4 py-2 rounded-md"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Property Settings Tab */}
              {activeTab === 'property' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Property Settings</h2>
                  <form>
                    <div className="space-y-6">
                      <div>
                        <label className="form-label">Primary Residence</label>
                        <p className="text-sm text-gray-400 mb-2">
                          Select which property is your primary residence. This affects seasonal maintenance recommendations 
                          and location-based features.
                        </p>
                        
                        {loadingProperties ? (
                          <div className="flex items-center mt-2">
                            <svg className="animate-spin h-5 w-5 text-sky-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading properties...</span>
                          </div>
                        ) : properties.length === 0 ? (
                          <div className="bg-gray-700 p-4 rounded-md text-center">
                            <p className="text-gray-300">No property found. Please complete your property setup.</p>
                            <button
                              type="button"
                              className="btn-secondary mt-3 text-sm px-4 py-2 rounded-md"
                              onClick={() => navigate('/setup-property')}
                            >
                              Set Up Property
                            </button>
                          </div>
                        ) : (
                          <select
                            className="form-input"
                            value={primaryResidenceId}
                            onChange={handlePrimaryResidenceChange}
                          >
                            <option value="">Select Primary Residence</option>
                            {properties.map(property => (
                              <option key={property.id} value={property.id.toString()}>
                                {property.address}, {property.city}, {property.state} {property.zip}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {properties.length > 0 && primaryResidenceId && (
                          <div className="mt-2 flex items-center text-sm text-sky-400">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Primary residence is set!
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  <form onSubmit={handleNotificationUpdate}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-700">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-gray-400">Receive notifications via email</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              name="email_notifications" 
                              checked={notificationSettings.email_notifications} 
                              onChange={handleNotificationChange}
                              className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full ${notificationSettings.email_notifications ? 'bg-sky-400' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${notificationSettings.email_notifications ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                      
                      {/* Other notification settings... */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-700">
                        <div>
                          <h3 className="font-medium">Maintenance Reminders</h3>
                          <p className="text-sm text-gray-400">Get reminders about upcoming maintenance tasks</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              name="maintenance_reminders" 
                              checked={notificationSettings.maintenance_reminders} 
                              onChange={handleNotificationChange}
                              className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full ${notificationSettings.maintenance_reminders ? 'bg-sky-400' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${notificationSettings.maintenance_reminders ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-700">
                        <div>
                          <h3 className="font-medium">Payment Reminders</h3>
                          <p className="text-sm text-gray-400">Get reminders about upcoming payments</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              name="payment_reminders" 
                              checked={notificationSettings.payment_reminders} 
                              onChange={handleNotificationChange}
                              className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full ${notificationSettings.payment_reminders ? 'bg-sky-400' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${notificationSettings.payment_reminders ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-700">
                        <div>
                          <h3 className="font-medium">Project Updates</h3>
                          <p className="text-sm text-gray-400">Get notifications about project status changes</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              name="project_updates" 
                              checked={notificationSettings.project_updates} 
                              onChange={handleNotificationChange}
                              className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full ${notificationSettings.project_updates ? 'bg-sky-400' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${notificationSettings.project_updates ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h3 className="font-medium">Document Updates</h3>
                          <p className="text-sm text-gray-400">Get notifications when documents are added or updated</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              name="document_updates" 
                              checked={notificationSettings.document_updates} 
                              onChange={handleNotificationChange}
                              className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full ${notificationSettings.document_updates ? 'bg-sky-400' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${notificationSettings.document_updates ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        className="btn-secondary px-4 py-2 rounded-md"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>
                  <form onSubmit={handleAppearanceUpdate}>
                    <div className="space-y-6">
                      <div>
                        <label className="form-label">Theme</label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <label className={`flex flex-col items-center border rounded-md p-4 cursor-pointer transition ${
                            appearanceSettings.theme === 'dark' ? 'border-sky-400 bg-sky-900 bg-opacity-10' : 'border-gray-700 hover:border-gray-600'
                          }`}>
                            <input 
                              type="radio" 
                              name="theme" 
                              value="dark" 
                              checked={appearanceSettings.theme === 'dark'} 
                              onChange={handleAppearanceChange}
                              className="sr-only" 
                            />
                            <svg className="h-10 w-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                            </svg>
                            <span className="font-medium">Dark Theme</span>
                          </label>
                          
                          <label className={`flex flex-col items-center border rounded-md p-4 cursor-pointer transition ${
                            appearanceSettings.theme === 'light' ? 'border-sky-400 bg-sky-900 bg-opacity-10' : 'border-gray-700 hover:border-gray-600'
                          }`}>
                            <input 
                              type="radio" 
                              name="theme" 
                              value="light" 
                              checked={appearanceSettings.theme === 'light'} 
                              onChange={handleAppearanceChange}
                              className="sr-only" 
                            />
                            <svg className="h-10 w-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            <span className="font-medium">Light Theme</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="form-label">Dashboard Layout</label>
                        <select 
                          name="dashboard_layout" 
                          className="form-input mt-2" 
                          value={appearanceSettings.dashboard_layout} 
                          onChange={handleAppearanceChange}
                        >
                          <option value="default">Default Layout</option>
                          <option value="compact">Compact Layout</option>
                          <option value="expanded">Expanded Layout</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        className="btn-secondary px-4 py-2 rounded-md"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Timezone Tab */}
              {activeTab === 'timezone' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Time Zone Settings</h2>
                  <form onSubmit={handleTimezoneUpdate}>
                    <div className="space-y-6">
                      <div>
                        <label className="form-label">Time Zone</label>
                        <p className="text-sm text-gray-400 mb-2">
                          Select your time zone to ensure maintenance reminders, notifications, and other time-sensitive 
                          features are accurate for your location.
                        </p>
                        <select 
                          className="form-input" 
                          value={timezone}
                          onChange={handleTimezoneChange}
                        >
                          {timezoneOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} ({option.value})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        className="btn-secondary px-4 py-2 rounded-md"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Time Zone'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Data & Privacy</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Data Export</h3>
                      <p className="text-gray-400 mb-4">Download a copy of your propertyPal data</p>
                      <button className="btn-secondary text-sm px-4 py-2 rounded-md">
                        <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path>
                        </svg>
                        Export Data
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                      <h3 className="text-lg font-medium mb-2">Delete Account</h3>
                      <p className="text-gray-400 mb-4">Permanently delete your account and all associated data</p>
                      <button className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md">
                        <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === 'api-keys' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">API Keys</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Manage API keys for integrations like Home Assistant
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewKeyModal(!showNewKeyModal)}
                      className="btn-primary px-4 py-2 rounded-md text-sm"
                    >
                      + Create New Key
                    </button>
                  </div>

                  {/* Create New Key Form */}
                  {showNewKeyModal && newApiKey && (
                    <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Save Your API Key</h3>
                      <p className="text-sm text-gray-300 mb-3">
                        This is the only time you'll see this key. Copy it now and store it securely!
                      </p>
                      <div className="bg-gray-900 p-3 rounded font-mono text-sm break-all flex justify-between items-center">
                        <span>{newApiKey}</span>
                        <button
                          onClick={() => copyToClipboard(newApiKey)}
                          className="ml-2 text-sky-400 hover:text-sky-300"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => { setShowNewKeyModal(false); setNewApiKey(null); }}
                        className="mt-3 text-sm text-gray-400 hover:text-gray-300"
                      >
                        I've saved my key, close this
                      </button>
                    </div>
                  )}

                  {!newApiKey && showNewKeyModal && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
                      <form onSubmit={handleCreateApiKey} className="space-y-4">
                        <div>
                          <label className="form-label">Key Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Home Assistant"
                            value={newKeyFormData.name}
                            onChange={(e) => setNewKeyFormData({...newKeyFormData, name: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <label className="form-label">Permissions</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={newKeyFormData.scopes.includes('read:maintenance')}
                                onChange={(e) => {
                                  const scopes = e.target.checked
                                    ? [...newKeyFormData.scopes, 'read:maintenance']
                                    : newKeyFormData.scopes.filter(s => s !== 'read:maintenance');
                                  setNewKeyFormData({...newKeyFormData, scopes});
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">Read Maintenance Tasks</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={newKeyFormData.scopes.includes('write:maintenance')}
                                onChange={(e) => {
                                  const scopes = e.target.checked
                                    ? [...newKeyFormData.scopes, 'write:maintenance']
                                    : newKeyFormData.scopes.filter(s => s !== 'write:maintenance');
                                  setNewKeyFormData({...newKeyFormData, scopes});
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">Create/Update Maintenance Tasks</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="form-label">Expiration (Optional)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Days until expiration (leave empty for no expiration)"
                            value={newKeyFormData.expires_days}
                            onChange={(e) => setNewKeyFormData({...newKeyFormData, expires_days: e.target.value})}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary px-4 py-2 rounded-md">
                            Create API Key
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNewKeyModal(false)}
                            className="btn-secondary px-4 py-2 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* API Keys List */}
                  {loadingApiKeys ? (
                    <div className="text-center py-8 text-gray-400">Loading API keys...</div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <p>No API keys yet</p>
                      <p className="text-sm mt-1">Create your first API key to integrate with Home Assistant</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{key.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${key.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                {key.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              <span className="font-mono">{key.key_prefix}...</span>
                              {key.last_used_at && (
                                <span className="ml-3">Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                              )}
                              {key.expires_at && (
                                <span className="ml-3">Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Scopes: {key.scopes.join(', ')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleApiKey(key.id)}
                              className="text-sm px-3 py-1 rounded hover:bg-gray-700"
                              title={key.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {key.is_active ? '⏸ Disable' : '▶️ Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteApiKey(key.id)}
                              className="text-sm px-3 py-1 rounded bg-red-900 bg-opacity-20 text-red-400 hover:bg-opacity-30"
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documentation Link */}
                  <div className="mt-6 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">📚 Integration Guide</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Learn how to integrate propertyPal with Home Assistant using API keys
                    </p>
                    <a
                      href="https://github.com/palStack-io/propertypal-core/blob/main/HOME_ASSISTANT_INTEGRATION.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 text-sm"
                    >
                      View Documentation →
                    </a>
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">About propertyPal</h2>

                  <div className="space-y-6">
                    {/* Logo and Version */}
                    <div className="flex items-center space-x-4">
                      <img src="/propertyPal.png" alt="propertyPal" className="h-16 w-16" />
                      <div>
                        <h3 className="text-2xl font-bold">
                          <span className="text-sky-400">property</span><span className="text-white">Pal</span>
                        </h3>
                        <p className="text-gray-400 text-sm">Open Source Property Management</p>
                        <p className="text-gray-500 text-xs mt-1">Version 1.0.0 (Core)</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-300">
                        propertyPal is a comprehensive property management tool designed for homeowners.
                        Track maintenance, manage documents, monitor expenses, and stay on top of your property's needs.
                      </p>
                    </div>

                    {/* palStack Ecosystem */}
                    <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-lg font-medium mb-4">Part of the palStack Ecosystem</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        propertyPal is part of the palStack family of open-source tools designed to help you manage your life.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                          href="https://palstack.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">🏠</div>
                            <div>
                              <div className="font-medium text-white">palStack.io</div>
                              <div className="text-sm text-gray-400">Explore the ecosystem</div>
                            </div>
                          </div>
                        </a>
                        <a
                          href="https://propertyPal.palstack.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">📘</div>
                            <div>
                              <div className="font-medium text-white">propertyPal Docs</div>
                              <div className="text-sm text-gray-400">Documentation & guides</div>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Open Source */}
                    <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-lg font-medium mb-4">Open Source</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        propertyPal Core is open source and available on GitHub. Contributions are welcome!
                      </p>
                      <a
                        href="https://github.com/palStack-io/propertypal-core"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2 transition-colors"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        View on GitHub
                      </a>
                    </div>

                    {/* Credits */}
                    <div className="border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
                      <p>Made with ❤️ by the palStack team</p>
                      <p className="mt-1">© 2024 palStack. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
};

export default Settings;