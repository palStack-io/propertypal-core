// ForgotPasswordForm.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../../services/api'; // Changed to apiHelpers

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      // Call API to request password reset, using apiHelpers and correct path
      const response = await apiHelpers.post('auth/forgot-password', { email });
      
      // API returns a generic success message for security purposes
      setMessage(response.message || 'If an account with that email exists, a password reset link has been sent.');
      setLoading(false);
      
      // Clear email field
      setEmail('');
      
      // Navigate back to login after a delay
      setTimeout(() => {
        navigate('/login', { state: { message: 'Please check your email for password reset instructions.' } });
      }, 3000);
    } catch (err) {
      setLoading(false);
      console.error('Password reset request error:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred. Please try again later.');
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
        
        <h2 className="text-2xl font-semibold mb-6 text-center">Reset Password</h2>
        
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
        
        <p className="text-gray-400 mb-6 text-center">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-md"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Remembered your password?{' '}
              <Link to="/login" className="text-secondary hover:text-secondary-light">
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;