import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers, API_BASE_URL } from '../../services/api';
import DemoWarningBanner from '../common/DemoWarningBanner';
import DashboardMaintenanceChecklist from './DashboardMaintenanceChecklist';
import DashboardPhotoCard from './dashboard/DashboardPhotoCard';
import DashboardExpensesCard from './dashboard/DashboardExpensesCard';
import DashboardMaintenanceCard from './dashboard/DashboardMaintenanceCard';
import DashboardProjectsCard from './dashboard/DashboardProjectsCard';
import DashboardAppliancesCard from './dashboard/DashboardAppliancesCard';
import DashboardDocumentsCard from './dashboard/DashboardDocumentsCard';

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const PropertyPalDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hideSidebar, setHideSidebar] = useState(false);

  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingDashboardData, setLoadingDashboardData] = useState(true);

  const [monthlyExpenseTotal, setMonthlyExpenseTotal] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState({ underBudget: false, percentage: 0 });

  const [homePhotos, setHomePhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────

  const fetchHomePhotos = useCallback(async (propertyId) => {
    if (!propertyId) return;
    try {
      const photos = await apiHelpers.get(`property_photos/${propertyId}`);
      if (!photos?.length) { setHomePhotos([]); return; }
      setHomePhotos(photos.map(p => ({
        ...p,
        url: p.url && !p.url.startsWith('http')
          ? `${API_BASE_URL}${p.url.startsWith('/') ? '' : '/'}${p.url}`
          : p.url,
      })));
    } catch { setHomePhotos([]); }
  }, []);

  const fetchMonthlyExpenses = useCallback(async (propertyId) => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const expenses = await apiHelpers.get('finances/expenses/', { property_id: propertyId, start_date: startDate, end_date: endDate });
      const total = (expenses || []).reduce((sum, e) => sum + e.amount, 0);
      setMonthlyExpenseTotal(total);

      const budgets = await apiHelpers.get('finances/budgets/', { property_id: propertyId, year: now.getFullYear(), month: now.getMonth() + 1 });
      const totalBudget = (budgets || []).reduce((sum, b) => sum + b.amount, 0);

      if (totalBudget > 0) {
        const diff = totalBudget - total;
        setBudgetStatus({ underBudget: diff >= 0, percentage: Math.abs(Math.round((diff / totalBudget) * 100)) });
      } else {
        setBudgetStatus({ underBudget: false, percentage: 0 });
      }
    } catch { setMonthlyExpenseTotal(0); setBudgetStatus({ underBudget: false, percentage: 0 }); }
  }, []);

  const fetchDashboardData = useCallback(async (propertyId) => {
    setLoadingDashboardData(true);
    try {
      const [maint, apps, docs, projs] = await Promise.allSettled([
        apiHelpers.get('maintenance/', { status: 'pending', property_id: propertyId }),
        apiHelpers.get('appliances/', { property_id: propertyId }),
        apiHelpers.get('documents/', { property_id: propertyId }),
        apiHelpers.get('projects/', { property_id: propertyId }),
      ]);
      setMaintenanceItems(maint.status === 'fulfilled' && Array.isArray(maint.value) ? maint.value : []);
      setAppliances(apps.status === 'fulfilled' && Array.isArray(apps.value) ? apps.value : []);
      setDocuments(docs.status === 'fulfilled' && Array.isArray(docs.value) ? docs.value : []);
      setProjects(projs.status === 'fulfilled' && Array.isArray(projs.value) ? projs.value : []);
      fetchMonthlyExpenses(propertyId);
    } catch {
      setMaintenanceItems([]); setAppliances([]); setDocuments([]); setProjects([]);
    } finally {
      setLoadingDashboardData(false);
    }
  }, [fetchMonthlyExpenses]);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await apiHelpers.get('properties/');
      setProperties(fetched || []);
      if (fetched?.length > 0) {
        const savedId = localStorage.getItem('currentPropertyId');
        const prop = (savedId && fetched.find(p => p.id?.toString() === savedId)) || fetched[0];
        setCurrentProperty(prop);
        if (prop) { fetchHomePhotos(prop.id); fetchDashboardData(prop.id); }
      }
    } catch (err) {
      setError('Failed to load property information.');
    } finally {
      setLoading(false);
    }
  }, [fetchHomePhotos, fetchDashboardData]);

  useEffect(() => {
    if (location.state?.message) setMessage(location.state.message);
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (!userString || !token) { navigate('/login'); return; }
    setUser(JSON.parse(userString));
    setHideSidebar(localStorage.getItem('hideSidebar') === 'true');
    fetchProperties();
  }, [navigate, location.state, fetchProperties]);

  useEffect(() => {
    if (currentProperty?.id) {
      apiHelpers.get('appliances/', { property_id: currentProperty.id })
        .then(data => Array.isArray(data) && setAppliances(data))
        .catch(() => {});
    }
  }, [currentProperty]);

  // ── Photo actions ──────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) { setError('Please select a JPEG, PNG, or GIF'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    uploadHomePhoto(file);
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const uploadHomePhoto = async (file) => {
    if (!currentProperty?.id) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('title', 'Home Exterior');
      fd.append('is_primary', 'true'); fd.append('property_id', currentProperty.id);
      const res = await apiHelpers.upload('property_photos/', fd);
      if (res?.url) {
        const url = res.url.startsWith('http') ? res.url : `${API_BASE_URL}${res.url.startsWith('/') ? '' : '/'}${res.url}`;
        setHomePhotos([{ id: res.id, title: res.title || 'Home Exterior', url, is_primary: true, created_at: new Date().toISOString() }]);
      }
      setMessage('Home photo uploaded successfully!');
      fetchHomePhotos(currentProperty.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
      setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 1000);
    }
  };

  const setAsPrimary = async (photoId) => {
    try {
      await apiHelpers.put(`property_photos/${photoId}/set-primary`, {});
      setHomePhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === photoId })));
      setMessage('Primary photo updated!');
      fetchProperties();
    } catch { setError('Failed to update primary photo.'); }
  };

  const deletePhoto = async (photoId) => {
    try {
      await apiHelpers.delete(`property_photos/${photoId}`);
      setHomePhotos(prev => prev.filter(p => p.id !== photoId));
      setMessage('Photo deleted!');
      if (currentProperty?.id) { fetchHomePhotos(currentProperty.id); fetchProperties(); }
    } catch { setError('Failed to delete photo.'); }
  };

  const handleSelectProperty = (property) => {
    setCurrentProperty(property);
    localStorage.setItem('currentPropertyId', property.id);
    fetchHomePhotos(property.id);
    fetchDashboardData(property.id);
  };

  // ── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg t-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation user={user} hideSidebar={hideSidebar}>
        <div className="container mx-auto px-4">
          <DemoWarningBanner />

          {error && (
            <div className="alert-error p-4 rounded-md mb-6 mt-2 flex justify-between items-start">
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-4 opacity-70 hover:opacity-100">✕</button>
            </div>
          )}
          {message && (
            <div className="alert-success p-4 rounded-md mb-6 mt-2 flex justify-between items-start">
              <span>{message}</span>
              <button onClick={() => setMessage('')} className="ml-4 opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Property info bar */}
          {currentProperty && (
            <div className="card mb-6 mt-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-sky-500 bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 t-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs t-brand font-medium uppercase tracking-wider">Current Property</p>
                    <h2 className="text-lg font-semibold t-primary">{currentProperty.address}</h2>
                    <p className="text-sm t-secondary">{currentProperty.city}, {currentProperty.state} {currentProperty.zip}</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4 text-sm t-secondary">
                  {currentProperty.property_type && <span className="badge badge-neutral">{currentProperty.property_type}</span>}
                  {currentProperty.bedrooms && <span className="badge badge-neutral">{currentProperty.bedrooms} bed</span>}
                  {currentProperty.bathrooms && <span className="badge badge-neutral">{currentProperty.bathrooms} bath</span>}
                  {currentProperty.square_footage && <span className="badge badge-neutral">{currentProperty.square_footage.toLocaleString()} sqft</span>}
                </div>
              </div>
            </div>
          )}

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome back, {user?.first_name || 'User'}!</h1>
            <p className="t-secondary mt-1">Here's what's happening with your home today.</p>
          </div>

          {/* Home photo card */}
          <DashboardPhotoCard
            currentProperty={currentProperty}
            homePhotos={homePhotos}
            uploadingPhoto={uploadingPhoto}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            triggerFileInput={triggerFileInput}
            openCamera={openCamera}
            setAsPrimary={setAsPrimary}
            deletePhoto={deletePhoto}
          />

          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {currentProperty && <DashboardMaintenanceChecklist propertyId={currentProperty.id} />}
            <DashboardExpensesCard
              monthlyExpenseTotal={monthlyExpenseTotal}
              budgetStatus={budgetStatus}
              formatCurrency={formatCurrency}
            />
            <DashboardMaintenanceCard
              maintenanceItems={maintenanceItems}
              loadingDashboardData={loadingDashboardData}
            />
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <DashboardProjectsCard
              projects={projects}
              loadingDashboardData={loadingDashboardData}
              formatCurrency={formatCurrency}
            />
            <DashboardAppliancesCard
              appliances={appliances}
              loadingDashboardData={loadingDashboardData}
            />
            <DashboardDocumentsCard
              documents={documents}
              loadingDashboardData={loadingDashboardData}
            />
          </div>

          {/* No property */}
          {properties.length === 0 && (
            <div className="card p-6 text-center mb-8">
              <svg className="h-16 w-16 t-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No Property Found</h3>
              <p className="t-secondary mb-6">Set up your property to get started with propertyPal.</p>
              <Link to="/setup-property" className="btn-primary px-6 py-2 rounded-md inline-flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Set Up Property
              </Link>
            </div>
          )}
        </div>
      </Navigation>
    </div>
  );
};

export default PropertyPalDashboard;
