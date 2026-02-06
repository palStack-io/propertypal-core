// ResetPasswordForm.js
import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiHelpers } from '../../services/api'; // Import apiHelpers instead of api

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
      
      // Set success message from API response
      setMessage(response.message || 'Password has been reset successfully. You can now log in with your new password.');
      setFormData({
        password: '',
        confirmPassword: ''
      });
      setLoading(false);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Your password has been reset successfully. You can now log in with your new password.' } 
        });
      }, 3000);
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
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-900 bg-opacity-30 text-green-400 p-3 rounded-md mb-4">
            {message}
          </div>
        )}
        
        {!resetToken ? (
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-3 rounded-md mb-4">
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
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
              />
              <p className="text-xs text-gray-400 mt-1">Password must be at least 8 characters</p>
            </div>
            
            <div className="mt-4">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
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
              <p className="text-gray-400">
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