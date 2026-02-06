import axios from 'axios';

// Get runtime config from global `window` object
// Look for window.REACT_APP_API_URL first, then the placeholder which will be replaced at runtime
const runtimeApiUrl = window?.REACT_APP_API_URL || '__API_URL_PLACEHOLDER__' || '';
console.log('Runtime API URL:', runtimeApiUrl);

// Determine the base URL for the API
let rawBaseUrl;
if (runtimeApiUrl.includes('web:')) {
  // Replace 'web' hostname with 'localhost' for browser environment
  rawBaseUrl = runtimeApiUrl.replace('web:', 'localhost:');
  console.log('Converted Docker service name to localhost:', rawBaseUrl);
} else if (runtimeApiUrl) {
  // Use the runtime API URL if provided
  rawBaseUrl = runtimeApiUrl;
} else {
  // Use a relative URL as fallback - this will work with Cloudflare tunnels
  rawBaseUrl = '/api';
}

// IMPORTANT: Keep the API_BASE_URL export for backward compatibility
// This should match how it was originally calculated
export const API_BASE_URL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl.slice(0, -4)
  : rawBaseUrl;

// Use the runtime API URL or fallback to empty (root)
// Note: formatApiUrl will add /api prefix, so baseURL should NOT include /api
const BASE_URL = rawBaseUrl === '/api' ? '' : (rawBaseUrl || '');

console.log('API Base URL:', BASE_URL);

// Create an axios instance with default settings
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in cross-origin requests if needed
  timeout: 60000, // Increased to 60 second timeout
});

// Helper function to ensure proper URL formatting for API requests
const formatApiUrl = (url) => {
  // All API calls should be prefixed with /api
  if (url && !url.startsWith('/api/')) {
    return `/api/${url.startsWith('/') ? url.substring(1) : url}`;
  }
  return url;
};

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Format API URL with prefix
    config.url = formatApiUrl(config.url);

    // Log every request for debugging
    console.log('Making API request to:', config.url);

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.message, error.response?.status);
    
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper methods for common operations
const apiHelpers = {
  get: (url, params = {}) => {
    return api.get(url, { params })
      .then(response => {
        console.log('GET response for:', url, response.data);
        return response.data;
      });
  },
  
  post: (url, data = {}) => {
    // Log URL for debugging
    console.log('API POST request to:', url);
    
    return api.post(url, data)
      .then(response => {
        console.log('POST response for:', url, response.data);
        return response.data;
      });
  },
  
  put: (url, data = {}) => {
    return api.put(url, data)
      .then(response => {
        console.log('PUT response for:', url, response.data);
        return response.data;
      });
  },
  
  delete: (url) => {
    return api.delete(url)
      .then(response => {
        console.log('DELETE response for:', url, response.data);
        return response.data;
      });
  },
  
  upload: (url, formData) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => {
      console.log('UPLOAD response for:', url, response.data);
      return response.data;
    });
  },
  
  download: (url) => {
    return api.get(url, {
      responseType: 'blob'
    }).then(response => {
      console.log('DOWNLOAD response for:', url);
      return response.data;
    });
  }
};

export { api, apiHelpers };
export default apiHelpers;