import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers, API_BASE_URL } from '../../services/api';
import DashboardMaintenanceChecklist from './DashboardMaintenanceChecklist';
import DemoWarningBanner from '../common/DemoWarningBanner';

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
  
  // Dashboard data states
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingDashboardData, setLoadingDashboardData] = useState(true);
  
  // Budget and expense data
  const [monthlyExpenseTotal, setMonthlyExpenseTotal] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState({
    underBudget: false,
    percentage: 0
  });
  
  // Home photo states
  const [homePhotos, setHomePhotos] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch home photos
  const fetchHomePhotos = useCallback(async (propertyId) => {
    try {
      if (!propertyId) return;

      console.log(`Fetching photos for property ID: ${propertyId}`);

      const photos = await apiHelpers.get(`property_photos/${propertyId}`);

      console.log('Photo API response:', photos);

      // Check if we got any photos back
      if (!photos || photos.length === 0) {
        console.log('No photos returned from API');
        setHomePhotos([]);
        return;
      }

      // Process photos and add full URLs
      const photosWithFullUrl = photos.map(photo => {
        let fullUrl = photo.url;

        // If the URL doesn't start with http, prepend the API base URL
        if (fullUrl && !fullUrl.startsWith('http')) {
          // Remove leading slash if present to avoid double slashes
          if (fullUrl.startsWith('/')) {
            fullUrl = fullUrl.substring(1);
          }

          fullUrl = API_BASE_URL + fullUrl;
        }

        console.log(`Original URL: ${photo.url}, Full URL: ${fullUrl}`);

        return {
          ...photo,
          url: fullUrl
        };
      });

      console.log('Photos with full URLs:', photosWithFullUrl);
      setHomePhotos(photosWithFullUrl);
    } catch (err) {
      console.error('Error fetching home photos:', err);
      console.error('Error details:', err.response ? err.response.data : err.message);
      setHomePhotos([]);
    }
  }, []);

  // Fetch dashboard data from all services
  const fetchDashboardData = useCallback(async (propertyId) => {
    setLoadingDashboardData(true);
    console.log(`Fetching dashboard data for property ID: ${propertyId}`);

    try {
      // Fetch maintenance items (limited to pending items)
      try {
        console.log('Fetching maintenance items...');
        const maintenanceItems = await apiHelpers.get('maintenance/', {
          status: 'pending',
          property_id: propertyId
        });

        console.log('Maintenance response:', maintenanceItems);

        if (maintenanceItems && Array.isArray(maintenanceItems)) {
          setMaintenanceItems(maintenanceItems);
        } else {
          // API returned unexpected format
          console.error('Unexpected maintenance data format:', maintenanceItems);
          setMaintenanceItems([]);
        }
      } catch (err) {
        console.error('Error fetching maintenance items:', err);
        setMaintenanceItems([]);
      }

      // Fetch appliances
      try {
        console.log('Fetching appliances...');
        const appliances = await apiHelpers.get('appliances/', { property_id: propertyId });
        console.log('Appliances response:', appliances);

        if (appliances && Array.isArray(appliances)) {
          setAppliances(appliances);
        } else {
          console.error('Unexpected appliances data format:', appliances);
          setAppliances([]);
        }
      } catch (err) {
        console.error('Error fetching appliances:', err);
        setAppliances([]);
      }

      // Fetch documents
      try {
        console.log('Fetching documents...');
        const documents = await apiHelpers.get('documents/', { property_id: propertyId });
        console.log('Documents response:', documents);

        if (documents && Array.isArray(documents)) {
          setDocuments(documents);
        } else {
          console.error('Unexpected documents data format:', documents);
          setDocuments([]);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setDocuments([]);
      }

      // Fetch projects
      try {
        console.log('Fetching projects...');
        const projects = await apiHelpers.get('projects/', { property_id: propertyId });
        console.log('Projects response:', projects);

        if (projects && Array.isArray(projects)) {
          setProjects(projects);
        } else {
          console.error('Unexpected projects data format:', projects);
          setProjects([]);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([]);
      }

      // Fetch monthly expenses
      fetchMonthlyExpenses(propertyId);

      setLoadingDashboardData(false);
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
      setMaintenanceItems([]);
      setAppliances([]);
      setDocuments([]);
      setProjects([]);
      setMonthlyExpenseTotal(0);
      setBudgetStatus({
        underBudget: false,
        percentage: 0
      });
    }
  }, []);

  // Fetch all properties and set the current one
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedProperties = await apiHelpers.get('properties/');

      setProperties(fetchedProperties || []);

      if (fetchedProperties && fetchedProperties.length > 0) {
        // Get current property from localStorage or use the first one
        const savedPropertyId = localStorage.getItem('currentPropertyId');
        let propertyToUse;

        if (savedPropertyId) {
          propertyToUse = fetchedProperties.find(p => p.id?.toString() === savedPropertyId);
        }

        // If no saved property or saved property not found, use first property
        if (!propertyToUse) {
          propertyToUse = fetchedProperties[0];
        }

        setCurrentProperty(propertyToUse);

        // Fetch photos and dashboard data for the selected property
        if (propertyToUse) {
          fetchHomePhotos(propertyToUse.id);
          fetchDashboardData(propertyToUse.id);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load property information. Please try again later.');
      setLoading(false);
    }
  }, [fetchHomePhotos, fetchDashboardData]);

  useEffect(() => {
    // Check if there's a message from another page
    if (location.state && location.state.message) {
      setMessage(location.state.message);
    }

    // Check if user is logged in
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!userString || !token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userString));
    
    // Check localStorage for sidebar preference
    const sidebarPreference = localStorage.getItem('hideSidebar');
    if (sidebarPreference !== null) {
      setHideSidebar(sidebarPreference === 'true');
    }
    
    // Display debug information
    console.log('PropertyPal- Initial load');
    console.log('User:', userString);
    console.log('Token available:', !!token);
    
    // Fetch properties
    fetchProperties();
    
    // Add event listener for image errors to show the fallback
    const handleImgError = () => {
      console.log('Global image error handler triggered');
      const fallbackHouses = document.querySelectorAll('.fallback-house');
      fallbackHouses.forEach(house => {
        house.style.display = 'flex';
      });
      
      const mainImgs = document.querySelectorAll('.home-image-main');
      mainImgs.forEach(img => {
        img.style.display = 'none';
      });
    };
    
    window.addEventListener('error', handleImgError, true);
    
    return () => {
      window.removeEventListener('error', handleImgError, true);
    };
  }, [navigate, location.state, fetchProperties]);

  const fetchAppliancesData = async (propertyId) => {
    console.log(`Fetching appliances for property ID: ${propertyId}`);
    
    try {
      const appliances = await apiHelpers.get(`appliances/`, { property_id: propertyId });
      if (appliances) {
        // Set appliances state with the data
        setAppliances(appliances);
      } else {
        console.error('No appliance data returned from API');
        setAppliances([]);
      }
    } catch (error) {
      console.error('Error fetching appliances:', error);
      setAppliances([]);
    }
  };

  // Call this function when property changes
  useEffect(() => {
    if (currentProperty && currentProperty.id) {
      fetchAppliancesData(currentProperty.id);
    }
  }, [currentProperty]);

  // Handle property selection from dropdown
  const handleSelectProperty = (property) => {
    setCurrentProperty(property);
    
    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);
    
    // Fetch photos and data for the selected property
    fetchHomePhotos(property.id);
    fetchDashboardData(property.id);
  };

  // Fetch monthly expenses
  const fetchMonthlyExpenses = async (propertyId) => {
    try {
      // Get current month range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch expenses
      const expenses = await apiHelpers.get('finances/expenses/', {
        property_id: propertyId,
        start_date: startDateStr,
        end_date: endDateStr
      });
      
      // Calculate total expenses for the month
      const total = (expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
      setMonthlyExpenseTotal(total);
      
      // Fetch budget for comparison
      const budgets = await apiHelpers.get('finances/budgets/', {
        property_id: propertyId,
        year: now.getFullYear(),
        month: now.getMonth() + 1
      });
      
      const totalBudget = (budgets || []).reduce((sum, budget) => sum + budget.amount, 0);
      
      // Calculate budget status
      if (totalBudget > 0) {
        const difference = totalBudget - total;
        const percentage = Math.round((difference / totalBudget) * 100);
        
        setBudgetStatus({
          underBudget: difference >= 0,
          percentage: Math.abs(percentage)
        });
      } else {
        setBudgetStatus({
          underBudget: false,
          percentage: 0
        });
      }
    } catch (err) {
      console.error('Error fetching monthly expenses:', err);
      setMonthlyExpenseTotal(0);
      setBudgetStatus({
        underBudget: false,
        percentage: 0
      });
    }
  };


  // PHOTO HANDLING FUNCTIONS
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    uploadHomePhoto(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Upload home photo
  const uploadHomePhoto = async (file) => {
    setUploadingPhoto(true);
    setError('');

    try {
      if (!currentProperty || !currentProperty.id) {
        throw new Error('No property selected');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', 'Home Exterior');
      formData.append('is_primary', 'true'); // Set as primary by default
      formData.append('property_id', currentProperty.id);

      console.log('Uploading photo for property:', currentProperty.id);
      console.log('Form data keys:', [...formData.keys()]);
      
      const response = await apiHelpers.upload('property_photos/', formData);
      
      console.log('Photo upload response:', response);

      // Fetch the latest property data to get the updated image_url
      try {
        const updatedProperty = await apiHelpers.get(`properties/${currentProperty.id}`);
        
        if (updatedProperty) {
          // Update the current property with the new data
          setCurrentProperty(updatedProperty);
        }
      } catch (propertyErr) {
        console.error('Error fetching updated property:', propertyErr);
      }

      // Refresh photos
      if (currentProperty && currentProperty.id) {
        fetchHomePhotos(currentProperty.id);
      }
      
      setMessage('Home photo uploaded successfully!');
      
      // Force display the home image if we received a URL back
      if (response && response.url) {
        // Create an array with just this one photo to display
        const newPhoto = {
          id: response.id,
          title: response.title || 'Home Exterior',
          url: response.url.startsWith('http') 
            ? response.url 
            : `${API_BASE_URL}${response.url.startsWith('/') ? '' : '/'}${response.url}`,
          is_primary: true,
          created_at: new Date().toISOString()
        };
        
        setHomePhotos([newPhoto]);
        
        // Manually update the image if needed
        setTimeout(() => {
          const houseImg = document.querySelector('.fallback-house');
          if (houseImg) {
            houseImg.style.display = 'flex';
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error uploading home photo:', err);
      console.error('Error details:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || 'Failed to upload photo. Please try again later.');
      
      // Show the fallback house image since upload failed
      setTimeout(() => {
        const houseImg = document.querySelector('.fallback-house');
        if (houseImg) {
          houseImg.style.display = 'flex';
        }
      }, 500);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Open camera (mobile devices)
  const openCamera = () => {
    // Change file input to accept camera input
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
      // Reset after click
      setTimeout(() => {
        fileInputRef.current.removeAttribute('capture');
      }, 1000);
    }
  };

  // Set a photo as primary
  const setAsPrimary = async (photoId) => {
    try {
      await apiHelpers.put(`property_photos/${photoId}/set-primary`, {});
      
      // Update the local state
      const updatedPhotos = homePhotos.map(photo => ({
        ...photo,
        is_primary: photo.id === photoId
      }));
      setHomePhotos(updatedPhotos);
      setMessage('Primary photo updated successfully!');
      
      // Fetch properties again to update currentProperty with new image_url
      fetchProperties();
    } catch (err) {
      console.error('Error setting primary photo:', err);
      setError('Failed to update primary photo. Please try again later.');
    }
  };

  // Delete a photo
  const deletePhoto = async (photoId) => {
    try {
      await apiHelpers.delete(`property_photos/${photoId}`);
      
      // Remove from local state
      const updatedPhotos = homePhotos.filter(photo => photo.id !== photoId);
      setHomePhotos(updatedPhotos);
      setMessage('Photo deleted successfully!');
      
      // Refresh photos
      if (currentProperty && currentProperty.id) {
        fetchHomePhotos(currentProperty.id);
        fetchProperties(); // Also refresh properties to update image_url
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again later.');
    }
  };

  // Format currency with commas and dollar sign
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-400">Loading...</div>
      </div>
    );
  }

  // Get file icon (simplified version)
  const getFileIcon = (fileType) => {
    let iconClass = "text-blue-500";
    if (fileType && fileType.includes('pdf')) {
      iconClass = "text-red-500";
    } else if (fileType && fileType.includes('image')) {
      iconClass = "text-purple-500";
    } else if (fileType && (fileType.includes('excel') || fileType.includes('spreadsheet'))) {
      iconClass = "text-green-500";
    }
    
    return (
      <svg className={`h-5 w-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        user={user}
        hideSidebar={hideSidebar}
      >
        <div className="container mx-auto px-4">
          {/* Demo Mode Warning Banner */}
          <DemoWarningBanner />

          {/* Error and message notifications */}
          {error && (
            <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6 mt-2">
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
            <div className="bg-green-900 bg-opacity-30 text-green-400 p-4 rounded-md mb-6 mt-2">
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

          {/* Current Property Info Bar */}
          {currentProperty && (
            <div className="bg-sky-900 bg-opacity-20 border border-sky-800 rounded-lg p-4 mb-6 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-sky-500 bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-sky-400 font-medium uppercase tracking-wider">Current Property</p>
                    <h2 className="text-lg font-semibold text-white">{currentProperty.address}</h2>
                    <p className="text-sm text-gray-400">{currentProperty.city}, {currentProperty.state} {currentProperty.zip}</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-400">
                  {currentProperty.property_type && (
                    <span className="bg-gray-800 px-3 py-1 rounded-full">{currentProperty.property_type}</span>
                  )}
                  {currentProperty.bedrooms && (
                    <span className="bg-gray-800 px-3 py-1 rounded-full">{currentProperty.bedrooms} bed</span>
                  )}
                  {currentProperty.bathrooms && (
                    <span className="bg-gray-800 px-3 py-1 rounded-full">{currentProperty.bathrooms} bath</span>
                  )}
                  {currentProperty.square_footage && (
                    <span className="bg-gray-800 px-3 py-1 rounded-full">{currentProperty.square_footage.toLocaleString()} sqft</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Welcome & Property Overview */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user ? user.first_name : 'User'}!</h1>
              <p className="text-gray-400 mt-1">Here's what's happening with your home today.</p>
            </div>
            
          </div>

          {/* Home Image Card */}
          <div className="card mb-8 overflow-hidden">
            <div className="relative">
              <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                {homePhotos.length > 0 ? (
                  <div className="relative w-full h-full">
                    {/* Display static placeholder house instead of trying to load from API */}
                    <div className="fallback-house absolute inset-0 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
                      <svg className="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <p className="mt-4 text-white text-lg font-medium">
                        {currentProperty?.address || "Your Home"}
                      </p>
                      {currentProperty && (
                        <p className="text-gray-300 text-sm">
                          {currentProperty.city}, {currentProperty.state}
                        </p>
                      )}
                    </div>
                    
                    {/* Hidden real image that we'll try to load, but it's likely to fail */}
                    <img 
                      src={homePhotos.find(p => p.is_primary)?.url || homePhotos[0].url} 
                      alt="Home Exterior" 
                      className="home-image-main w-full h-full object-cover hidden"
                      onLoad={(e) => {
                        console.log("Image loaded successfully:", e.target.src);
                        e.target.classList.remove("hidden");
                        const fallback = e.target.parentNode.querySelector('.fallback-house');
                        if (fallback) {
                          fallback.style.display = 'none';
                        }
                      }}
                      onError={(e) => {
                        console.error("Image failed to load:", e.target.src);
                        e.target.onerror = null;
                        // Keep the fallback visible
                      }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <button 
                      className="btn-secondary text-sm px-6 py-2 rounded-md flex items-center"
                      onClick={triggerFileInput}
                      disabled={uploadingPhoto || !currentProperty}
                    >
                      {uploadingPhoto ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path>
                          </svg>
                          Upload Home Photo
                        </>
                      )}
                    </button>
                    {!currentProperty && (
                      <p className="text-sm text-red-400 mt-2">Please set up your property first</p>
                    )}
                    {currentProperty && (
                      <p className="text-sm text-gray-400 mt-2">Upload an image of your home (JPEG, PNG, max 5MB)</p>
                    )}
                    
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg, image/png, image/gif"
                      onChange={handleFileSelect}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-card-bg rounded-b-lg flex justify-between items-center">
              <div>
                <h3 className="font-medium">Home Exterior</h3>
                <p className="text-sm text-gray-400">
                  {homePhotos.length > 0 
                    ? `Last updated: ${new Date(homePhotos[0].created_at).toLocaleDateString()}`
                    : 'Last updated: Never'}
                </p>
              </div>
              <div>
                <button 
                  className={`text-sky-400 text-sm hover:text-sky-300 mr-4 ${homePhotos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setShowGallery(true)}
                  disabled={homePhotos.length === 0}
                >
                  View Gallery
                </button>
                <button 
                  className="btn-accent text-sm px-3 py-1 rounded-md"
                  onClick={openCamera}
                  disabled={!currentProperty}
                >
                  <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Take Photo
                </button>
              </div>
            </div>
          </div>
          
          {/* Photo Gallery Modal */}
          {showGallery && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowGallery(false)}></div>
                <div className="card w-full max-w-4xl p-6 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Home Photo Gallery</h2>
                    <button 
                      className="text-gray-400 hover:text-gray-300 rounded-full p-1"
                      onClick={() => setShowGallery(false)}
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  {homePhotos.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No photos available.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {homePhotos.map(photo => (
                        <div key={photo.id} className="relative group">
                          <img 
                            src={photo.url} 
                            alt={photo.title || "Home"} 
                            className={`w-full h-48 object-cover rounded-md ${photo.is_primary ? 'ring-2 ring-sky-400' : ''}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "";
                              e.target.classList.add("bg-gray-700", "flex", "items-center", "justify-center");
                              e.target.innerHTML = '<p class="text-gray-400">Image not available</p>';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center space-x-2">
                            {!photo.is_primary && (
                              <button 
                                className="text-white p-2 bg-sky-500 rounded-full"
                                onClick={() => setAsPrimary(photo.id)}
                                title="Set as primary photo"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                            )}
                            <button 
                              className="text-white p-2 bg-red-600 rounded-full"
                              onClick={() => deletePhoto(photo.id)}
                              title="Delete photo"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                          {photo.is_primary && (
                            <div className="absolute top-2 right-2 bg-sky-400 text-white text-xs px-2 py-1 rounded-full">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <label className="btn-secondary px-4 py-2 rounded-md flex items-center mx-auto cursor-pointer">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add More Photos
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif"
                        onChange={handleFileSelect}
                        disabled={!currentProperty}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
)}
            
            {/* Home Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Maintenance Checklist Card - Using DashboardMaintenanceChecklist component */}
            {currentProperty && <DashboardMaintenanceChecklist propertyId={currentProperty.id} />}
            
            {/* Home Expenses Card */}
            <div className="card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Home Expenses</p>
                  <h3 className="text-xl font-bold mt-1">
                    {formatCurrency(monthlyExpenseTotal)}
                    <span className="text-sm font-normal text-gray-400"> this month</span>
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-green-900 bg-opacity-30">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {budgetStatus.underBudget ? (
                  <span className="text-green-500 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                    </svg>
                    {budgetStatus.percentage}% under budget
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                    {budgetStatus.percentage}% over budget
                  </span>
                )}
                <Link to="/expenses" className="ml-auto text-sky-400 hover:text-sky-300">
                  View details
                </Link>
              </div>
            </div>
            
            {/* Upcoming Maintenance Card */}
            <div className="card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Upcoming Maintenance</p>
                  <h3 className="text-xl font-bold mt-1">
                    {maintenanceItems.length} items due
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-orange-900 bg-opacity-30">
                  <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm">
                {loadingDashboardData ? (
                  <div className="text-center py-2">
                    <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : maintenanceItems.length > 0 ? (
                  <div>
                    {maintenanceItems.slice(0, 2).map((item, index) => (
                      <div key={item.id || index} className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">{item.title}</span>
                        <span className="text-orange-500">
                          {item.due_date ? (
                            new Date(item.due_date) > new Date() ? 
                              `${Math.ceil((new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days` : 
                              'Overdue'
                          ) : 'No date'}
                        </span>
                      </div>
                    ))}
                    <Link to="/maintenance" className="block mt-3 text-sky-400 hover:text-sky-300">
                      Schedule now
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400">No maintenance items due</p>
                    <Link to="/maintenance" className="block mt-3 text-sky-400 hover:text-sky-300">
                      Add maintenance tasks
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Second row with projects, appliances, and documents in a grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Projects Card */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Current Projects</h2>
                <Link to="/projects" className="btn-secondary text-sm px-3 py-1 rounded-md">
                  <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Project
                </Link>
              </div>
              
              {loadingDashboardData ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : projects.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {projects.slice(0, 2).map(project => {
                    // Calculate progress
                    let progress = 0;
                    if (project.status === 'completed') {
                      progress = 100;
                    } else if (project.budget && project.spent) {
                      progress = Math.min(Math.round((project.spent / project.budget) * 100), 100);
                    } else {
                      // Default progress based on status
                      switch (project.status) {
                        case 'planning': progress = 15; break;
                        case 'in-progress': progress = 50; break;
                        case 'on-hold': progress = 30; break;
                        default: progress = 0;
                      }
                    }
                    
                    // Determine status styles
                    let statusStyles = {
                      bg: 'bg-sky-400',
                      badge: 'bg-gray-700 text-gray-300'
                    };
                    
                    switch(project.status) {
                      case 'planning':
                        statusStyles = {
                          bg: 'bg-blue-500',
                          badge: 'bg-blue-900 text-blue-300 bg-opacity-30'
                        };
                        break;
                      case 'in-progress':
                        statusStyles = {
                          bg: 'bg-sky-400',
                          badge: 'bg-sky-900 text-sky-200 bg-opacity-30'
                        };
                        break;
                      case 'on-hold':
                        statusStyles = {
                          bg: 'bg-yellow-500',
                          badge: 'bg-yellow-900 text-yellow-300 bg-opacity-30'
                        };
                        break;
                      case 'completed':
                        statusStyles = {
                          bg: 'bg-gray-500',
                          badge: 'bg-gray-700 text-gray-300'
                        };
                        break;
                      default:
                        // Use default styles defined above
                        break;
                    }
                    
                    return (
                      <div key={project.id} className="py-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-md font-medium">{project.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${statusStyles.badge}`}>
                            {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1).replace(/-/g, ' ') : 'In Progress'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div 
                            className={`${statusStyles.bg} h-2 rounded-full`} 
                            style={{width: `${progress}%`}}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Budget: {formatCurrency(project.budget || 0)}</span>
                          <span>Spent: {formatCurrency(project.spent || 0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4">No active projects</p>
                  <Link to="/projects" className="text-sky-400 hover:text-sky-300">
                    Create your first project
                  </Link>
                </div>
              )}
            </div>

            {/* Appliance & Warranty Tracking */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Appliance & Warranty</h2>
                <Link to="/appliances" className="btn-secondary text-sm px-3 py-1 rounded-md">
                  <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Item
                </Link>
              </div>
              
              {loadingDashboardData ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : appliances && appliances.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {appliances.slice(0, 2).map((appliance, index) => {
                    // Safely extract data with defaults
                    const name = appliance.name || 'Unnamed Appliance';
                    const brand = appliance.brand || '';
                    const model = appliance.model || '';
                    const warranty_expiration = appliance.warranty_expiration || null;
                    
                    // Calculate warranty status
                    const getWarrantyStatus = (expirationDate) => {
                      if (!expirationDate) return { text: 'No warranty', className: 'text-gray-400' };
                      
                      // Check if date is valid
                      const expDate = new Date(expirationDate);
                      if (isNaN(expDate.getTime())) {
                        return { text: 'Invalid warranty date', className: 'text-red-500' };
                      }
                      
                      const today = new Date();
                      const monthsDiff = (expDate - today) / (1000 * 60 * 60 * 24 * 30);
                      
                      if (monthsDiff < 0) {
                        return { 
                          text: `Expired ${Math.abs(Math.round(monthsDiff))} months ago`,
                          className: 'text-red-500'
                        };
                      } else if (monthsDiff < 3) {
                        return { 
                          text: `Expires in ${Math.round(monthsDiff)} months`,
                          className: 'text-orange-500'
                        };
                      } else {
                        return { 
                          text: `${Math.round(monthsDiff)} months remaining`,
                          className: 'text-green-500'
                        };
                      }
                    };
                    
                    const warranty = getWarrantyStatus(warranty_expiration);
                    
                    return (
                      <div key={appliance.id || index} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-blue-900 bg-opacity-30 mr-3">
                            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{name}</h4>
                            <p className="text-xs text-gray-400">
                              {brand} {model ? `Model #${model}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Warranty</div>
                          <p className={`text-xs ${warranty.className}`}>{warranty.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {appliances.length > 2 && (
                    <div className="pt-3 text-center">
                      <Link to="/appliances" className="text-sky-400 hover:text-sky-300 text-sm">
                        View all {appliances.length} appliances
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4">No appliances added yet</p>
                  <Link to="/appliances" className="text-sky-400 hover:text-sky-300">
                    Add your first appliance
                  </Link>
                </div>
              )}
            </div>
            
                {/* Documents Section */}
                <div className="card p-6">
                  <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Recent Documents</h2>
                    <Link to="/documents" className="btn-secondary text-sm px-3 py-1 rounded-md">
                      <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Upload
                    </Link>
                  </div>
              
              {loadingDashboardData ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-gray-400">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {documents.map(doc => (
                    <div key={doc.id} className="py-3 flex items-center">
                      <div className="p-2 rounded bg-gray-700 mr-3">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{doc.title}</h4>
                        <p className="text-xs text-gray-400">
                          {doc.file_type ? doc.file_type.split('/')[1].toUpperCase() : 'DOC'} • 
                          {doc.created_at ? ` Added ${new Date(doc.created_at).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <button className="ml-auto p-1.5 text-gray-400 hover:text-gray-300 rounded-full hover:bg-gray-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <svg className="h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-gray-400 mb-2">No documents added yet</p>
                  <Link to="/documents" className="text-sky-400 hover:text-sky-300">Upload your first document</Link>
                </div>
              )}
            </div>
          </div>  
          {/* No Property Message (redirect to setup if none exists) */}
          {properties.length === 0 && (
            <div className="card p-6 text-center mb-8">
              <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <h3 className="text-lg font-medium mb-2">No Property Found</h3>
              <p className="text-gray-400 mb-6">Set up your property to get started with propertyPal.</p>
              <Link to="/setup-property" className="btn-primary px-6 py-2 rounded-md inline-flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
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