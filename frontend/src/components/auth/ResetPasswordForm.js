// ResetPasswordForm.js
import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiHelpers } from '../../services/api';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams(); // URL parameter containing reset token
  
  // Get token from URL query parameter if not in params
  const queryParams = new URLSearchParams(location.search);
  const queryToken = queryParams.get('token');
  
  const resetToken = token || queryToken;
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

    // Password validation - match minimum requirements
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Confirm passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (!resetToken) {
        setError('Invalid or missing reset token');
        setLoading(false);
        return;
      }
      
      // Call API to reset password using apiHelpers and correct path without leading slash
      const response = await apiHelpers.post('auth/reset-password', { 
        token: resetToken,
        password: formData.password
      });
      
      setLoading(false);
      setFormData({ password: '', confirmPassword: '' });
      navigate('/login', {
        state: { message: 'Password reset successfully. You can now log in with your new password.' }
      });
    } catch (err) {
      setLoading(false);
      console.error('Password reset error:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred during password reset. The token may be invalid or expired.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/propertyPal.png" alt="propertyPal" className="h-16 w-16 mb-3" />
          <div className="text-3xl font-bold">
            <span className="property-text">property</span><span className="text-white">Pal</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6 text-center">Set New Password</h2>
        
        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}
        
        {message && (
          <div className="alert-success mb-4">
            {message}
          </div>
        )}
        
        {!resetToken ? (
          <div className="alert-error mb-4">
            Invalid or missing reset token. Please request a new password reset link.
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-secondary hover:text-secondary-light">
                Request New Reset Link
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="form-label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-primary">
                  {showPassword
                    ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <p className="text-xs t-secondary mt-1">Password must be at least 8 characters</p>
            </div>

            <div className="mt-4">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-primary">
                  {showConfirm
                    ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn-primary w-full py-3 rounded-md"
                disabled={loading}
              >
                {loading ? 'Setting New Password...' : 'Reset Password'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="t-secondary">
                <Link to="/login" className="text-secondary hover:text-secondary-light">
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;