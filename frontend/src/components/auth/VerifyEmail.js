// VerifyEmail.js - Component to handle email verification
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiHelpers } from '../../services/api'; // Changed to apiHelpers

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyUserEmail = async () => {
      // Get token from URL query parameters
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token');
      
      if (!token) {
        setVerifying(false);
        setError('No verification token found. Please check the link in your email.');
        return;
      }
      
      try {
        // Call API to verify email with the token - using apiHelpers and fixed path
        const response = await apiHelpers.post('auth/verify-email', { token });
        
        setVerifying(false);
        setMessage(response.message || 'Email verified successfully. You can now log in to your account.');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Email verified successfully! You can now log in to your account.' } 
          });
        }, 3000);
      } catch (err) {
        setVerifying(false);
        console.error('Email verification error:', err);
        
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('An error occurred during email verification. The token may be invalid or expired.');
        }
      }
    };
    
    verifyUserEmail();
  }, [navigate, location.search]);

  // Function to handle resending verification email
  const handleResendVerification = () => {
    navigate('/resend-verification');
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
        
        <h2 className="text-2xl font-semibold mb-6 text-center">Email Verification</h2>
        
        {verifying ? (
          <div className="text-center py-8">
            <div className="animate-spin h-10 w-10 border-4 border-sky-400 border-opacity-50 rounded-full border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-400">Verifying your email address...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6">
                {error}
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sky-300 hover:text-sky-200 underline text-sm"
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </button>
                </div>
              </div>
            )}
            
            {message && (
              <div className="bg-green-900 bg-opacity-30 text-green-400 p-4 rounded-md mb-6">
                {message}
                <p className="mt-2 text-sm">Redirecting to login page in a few seconds...</p>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Link to="/login" className="btn-primary px-4 py-2 rounded-md">
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;