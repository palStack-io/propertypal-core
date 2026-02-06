import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignupForm from './components/auth/SignupForm';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/layout/Dashboard';
import PropertyPalDashboard from './components/homeowner/PropertyPalDashboard';
import Documents from './components/homeowner/Documents';
import Maintenance from './components/homeowner/Maintenance';
import Appliances from './components/homeowner/Appliances';
import Projects from './components/homeowner/Projects';
import PropertySetupWizard from './components/property/PropertySetupWizard';
import Settings from './components/homeowner/Settings';
import Budget from './components/homeowner/Budget';
import Expenses from './components/homeowner/Expenses';
import Reports from './components/homeowner/Reports';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import VerifyEmail from './components/auth/VerifyEmail';
import ResendVerificationEmail from './components/auth/ResendVerificationEmail';
import './components/homeowner/PropertyPal.css';

// Import apiHelpers instead of using direct axios
import { apiHelpers } from './services/api';

// Landing component - redirects based on whether user has a property
const Landing = () => {
  const [loading, setLoading] = useState(true);
  const [hasProperty, setHasProperty] = useState(false);

  useEffect(() => {
    const checkUserProperty = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        // In single-property mode, API returns array with 0 or 1 property
        const properties = await apiHelpers.get('properties/');
        setHasProperty(properties.length > 0);

        // Store property ID if exists
        if (properties.length > 0) {
          localStorage.setItem('currentPropertyId', properties[0].id);
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
        setHasProperty(false);
      }
    };

    checkUserProperty();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Redirect to setup if no property, otherwise to dashboard
  return hasProperty ? <Navigate to="/dashboard" /> : <Navigate to="/setup-property" />;
};

// Auth guard component to redirect if not logged in
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('accessToken') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />

        {/* Password Reset Routes */}
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />

        {/* Email Verification Routes */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerificationEmail />} />

        {/* Property Setup Wizard - for first-time property creation */}
        <Route
          path="/setup-property"
          element={
            <ProtectedRoute>
              <PropertySetupWizard />
            </ProtectedRoute>
          }
        />

        {/* Landing route that redirects based on user property */}
        <Route
          path="/landing"
          element={
            <ProtectedRoute>
              <Landing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PropertyPalDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect old routes to dashboard */}
        <Route path="/property-hub" element={<Navigate to="/dashboard" />} />
        <Route path="/properties" element={<Navigate to="/dashboard" />} />
        <Route path="/properties/:propertyId" element={<Navigate to="/dashboard" />} />
        <Route path="/homie-dashboard" element={<Navigate to="/dashboard" />} />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appliances"
          element={
            <ProtectedRoute>
              <Appliances />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <Budget />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
