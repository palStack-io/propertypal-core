import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiHelpers } from '../../services/api'; // Import apiHelpers instead of API_BASE_URL

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(''); // Stored for resending verification

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
      // Use apiHelpers instead of direct axios call
      console.log("Attempting to register with data:", formData);
      
      const response = await apiHelpers.post('auth/register', formData);
      
      setLoading(false);
      console.log("Registration successful:", response);
      
      // Updated to handle email verification flow
      setMessage(response.message || 
        'Registration successful! Please check your email to verify your account before logging in.');
      
      // Store email for potential resending of verification
      setRegisteredEmail(formData.email);
      
      // Clear form fields after successful registration
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: ''
      });
      
      setRegistrationSuccess(true);

      // Check if this is the first user (requires property setup)
      if (response.is_first_user && response.requires_property_setup) {
        // Store the tokens if they were returned (auto-login)
        if (response.access_token) {
          localStorage.setItem('accessToken', response.access_token);
          localStorage.setItem('refreshToken', response.refresh_token);
        }

        // Redirect to property setup wizard immediately
        setTimeout(() => {
          navigate('/setup-property');
        }, 2000);
      } else {
        // Navigate to login page after a delay
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Registration successful! Please verify your email before logging in.'
            }
          });
        }, 5000);
      }
    } catch (err) {
      setLoading(false);
      console.error('Registration error:', err);
      
      if (err.message === 'Network Error') {
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
        setError('An error occurred during registration. Please try again.');
      }
    }
  };

  // For development purposes
  const handleDevelopmentSignup = () => {
    setLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      setMessage('Development registration successful! Please check your email for verification instructions.');
      
      // Set the registered email for dev mode too
      setRegisteredEmail('dev@example.com');
      setRegistrationSuccess(true);
      
      // Clear form fields
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: ''
      });
      
      // Navigate to login page after a delay (uses the navigate function)
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Development registration successful! Please verify your email before logging in.' 
          } 
        });
      }, 2000);
    }, 1000);
  };

  // Function to handle resend verification email
  const handleResendVerification = async () => {
    // Use the stored email if available, otherwise use the current form email
    const emailToUse = registeredEmail || formData.email;
    
    if (!emailToUse) {
      setError('Please enter your email address to resend verification');
      return;
    }
    
    // Navigate to the dedicated resend verification page
    navigate('/resend-verification', { 
      state: { 
        email: emailToUse 
      } 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/propertyPal.png" alt="propertyPal" className="h-16 w-16 mb-3" />
          <div className="text-3xl font-bold">
            <span className="property-text">property</span><span className="text-white">Pal</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Part of the <a href="https://palstack.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">palStack</a> ecosystem
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6 text-center">Create an Account</h2>
        
        {error && (
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-900 bg-opacity-30 text-green-400 p-3 rounded-md mb-4">
            {message}
            
            {/* Show resend verification option if registration was successful */}
            {registrationSuccess && (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-sky-300 hover:text-sky-200 underline"
                  onClick={handleResendVerification}
                >
                  Resend verification email
                </button>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="form-label">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="form-label">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="mt-4">
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
            <label htmlFor="phone" className="form-label">Phone Number (optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="mt-4">
            <label htmlFor="password" className="form-label">Password</label>
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
          
          <div className="mt-6">
            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-md"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
        
        {/* For development/debugging purposes */}
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-xs text-gray-400 underline"
            onClick={handleDevelopmentSignup}
          >
            Use Development Mode
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary hover:text-secondary-light">
              Log in
            </Link>
          </p>
        </div>
        
        {/* Resend verification link */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
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
      </div>
    </div>
  );
};

export default SignupForm;