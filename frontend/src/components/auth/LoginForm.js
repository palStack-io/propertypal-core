// Updated LoginForm.js with prominent resend verification option and no dev mode button
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiHelpers } from '../../services/api'; // Changed to apiHelpers

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    // Check if there's a message from the signup page or password reset
    if (location.state && location.state.message) {
      setMessage(location.state.message);
    }

    // Check if demo mode is enabled
    const checkDemoMode = async () => {
      try {
        const response = await apiHelpers.get('auth/demo-status');
        if (response && response.demo_mode) {
          setDemoMode(true);
          setDemoAccounts(response.demo_accounts || []);
        }
      } catch (err) {
        // Demo mode check failed, just continue without it
        console.log('Demo mode check failed:', err);
      }
    };
    checkDemoMode();
  }, [location]);

  // Handle demo account click - auto-populate form
  const handleDemoAccountClick = (email) => {
    setFormData({
      email: email,
      password: 'Demo123!'
    });
    setError('');
    setMessage('Demo credentials filled. Click "Log In" to continue.');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Use apiHelpers instead of direct api call
      const response = await apiHelpers.post('auth/login', formData);

      setLoading(false);

      if (response && response.access_token) {
        // Store the tokens in localStorage
        localStorage.setItem('accessToken', response.access_token);

        if (response.refresh_token) {
          localStorage.setItem('refreshToken', response.refresh_token);
        }

        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));

          // Check if this is a demo account and store login time
          const isDemoAccount = response.user.email &&
                               response.user.email.startsWith('demo') &&
                               response.user.email.endsWith('@propertypal.com');

          if (isDemoAccount) {
            localStorage.setItem('demoLoginTime', Date.now().toString());
          }
        }

        // Redirect to landing route which will determine where to go next
        navigate('/landing');
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      console.error('Login error:', err);

      // Check if the error indicates email verification is needed
      const errorMessage = err.response?.data?.error || '';
      const needsVerification =
        errorMessage.toLowerCase().includes('verify') ||
        errorMessage.toLowerCase().includes('verification') ||
        errorMessage.toLowerCase().includes('verified');

      if (needsVerification) {
        setError('Please verify your email address before logging in.');
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to the server. Please check if the backend server is running and properly configured for CORS.');
      } else if (err.response) {
        // The server responded with a status code outside the 2xx range
        if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError(`Server error: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again later.');
      } else {
        // Something else happened while setting up the request
        setError('An error occurred during login. Please try again.');
      }
    }
  };

  // Handle resend verification email
  const handleResendVerification = () => {
    navigate('/resend-verification', {
      state: { email: formData.email }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/propertyPal.png" alt="propertyPal" className="h-16 w-16 mb-3" />
          <div className="text-3xl font-bold">
            <span className="property-text">property</span><span className="t-primary">Pal</span>
          </div>
          <div className="text-xs t-muted mt-1">
            Part of the <a href="https://palstack.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">palStack</a> ecosystem
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">Log In to Your Account</h2>

        {error && (
          <div className="alert-error mb-4">
            {error}
            {error.toLowerCase().includes('verify') && (
              <div className="mt-2">
                <button
                  type="button"
                  className="bg-sky-400 hover:bg-sky-500 text-white px-3 py-1 rounded-md text-sm"
                  onClick={handleResendVerification}
                >
                  Resend verification email
                </button>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="alert-success mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-4">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input pr-10"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-primary">
                {showPassword
                  ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>

            {/* Add Forgot Password link */}
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-sm text-secondary hover:text-secondary-light">
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-md"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="t-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-secondary hover:text-secondary-light">
              Sign up
            </Link>
          </p>
        </div>

        {/* Only show resend option when there's a verification error */}
        {error && error.toLowerCase().includes('verify') && (
          <div className="mt-4 text-center border-t border-themed pt-4">
            <p className="t-secondary text-sm">
              Didn't receive verification email?{' '}
              <button
                type="button"
                className="text-secondary hover:text-secondary-light text-sm"
                onClick={handleResendVerification}
              >
                Resend verification
              </button>
            </p>
          </div>
        )}

        {/* Demo Accounts Section - Only shown when demo mode is enabled */}
        {demoMode && demoAccounts.length > 0 && (
          <div className="mt-6 border-t border-themed pt-6">
            <div className="alert-info p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Try Demo Accounts
              </h3>
              <p className="t-secondary text-sm mb-3">
                Click an account below to auto-fill credentials. Sessions expire after 10 minutes.
              </p>
              <div className="space-y-2">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDemoAccountClick(account.email)}
                    className="card p-3 text-left w-full group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="t-primary font-medium transition-colors">
                          {account.name}
                        </div>
                        <div className="t-secondary text-sm">{account.email}</div>
                      </div>
                      <svg className="w-5 h-5 t-muted transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
