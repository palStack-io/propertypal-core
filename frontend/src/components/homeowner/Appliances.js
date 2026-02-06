import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers } from '../../services/api';

const Appliances = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingApplianceId, setEditingApplianceId] = useState(null);
  const [newAppliance, setNewAppliance] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    location: '',
    purchase_date: '',
    warranty_expiration: '',
    notes: '',
    category: 'kitchen',
    property_id: ''
  });

  // Fetch user and appliance data
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!userString || !token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userString));

    // Get current property from localStorage or fetch first property
    const fetchProperties = async () => {
      try {
        const fetchedProperties = await apiHelpers.get('properties/');
        
        if (fetchedProperties.length > 0) {
          // Get current property from localStorage or use the first one
          const savedPropertyId = localStorage.getItem('currentPropertyId');
          let propertyToUse;
          
          if (savedPropertyId) {
            propertyToUse = fetchedProperties.find(p => p.id.toString() === savedPropertyId);
          }
          
          // If no saved property or saved property not found, use first property
          if (!propertyToUse) {
            propertyToUse = fetchedProperties[0];
          }
          
          setCurrentProperty(propertyToUse);
          
          // Fetch appliances for the selected property
          if (propertyToUse) {
            fetchAppliances(propertyToUse.id);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [navigate]);

  // Handle property selection from dropdown
  const handleSelectProperty = (property) => {
    setCurrentProperty(property);
    
    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);
    
    // Fetch appliances for the selected property
    fetchAppliances(property.id);
  };

  // Fetch appliances from the API
  const fetchAppliances = async (propertyId) => {
    try {
      setLoading(true);
      console.log(`Fetching appliances for property ID: ${propertyId}`);
      
      const data = await apiHelpers.get('appliances/', { property_id: propertyId });
      
      console.log('Appliances response:', data);
      
      // Always use the response data, even if it's an empty array
      setAppliances(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching appliances:', err);
      // In case of error, set empty array
      setAppliances([]);
      setLoading(false);
      setError('Failed to load appliances. Please try again later.');
    }
  };

  // Handle input changes for new appliance
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppliance({
      ...newAppliance,
      [name]: value
    });
  };

  // Handle form submission for new appliance
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Add property ID to the appliance data
      const applianceData = {
        ...newAppliance,
        property_id: currentProperty.id
      };
      
      console.log('Submitting appliance data:', applianceData);
      
      // API call to add appliance
      await apiHelpers.post('appliances/', applianceData);
      
      // Reset form
      setNewAppliance({
        name: '',
        brand: '',
        model: '',
        serial_number: '',
        location: '',
        purchase_date: '',
        warranty_expiration: '',
        notes: '',
        category: 'kitchen'
      });
      
      setShowAddForm(false);
      setMessage('Appliance added successfully!');
      
      // Reload appliances
      if (currentProperty) {
        fetchAppliances(currentProperty.id);
      }
    } catch (err) {
      console.error('Error adding appliance:', err);
      setError('Failed to add appliance. Please try again later.');
      setLoading(false);
    }
  };

  // Handle edit appliance
  const handleEdit = (appliance) => {
    setEditingApplianceId(appliance.id);
    setNewAppliance({
      name: appliance.name || '',
      brand: appliance.brand || '',
      model: appliance.model || '',
      serial_number: appliance.serial_number || '',
      location: appliance.location || '',
      purchase_date: appliance.purchase_date || '',
      warranty_expiration: appliance.warranty_expiration || '',
      notes: appliance.notes || '',
      category: appliance.category || 'kitchen',
      property_id: appliance.property_id || currentProperty?.id || ''
    });
    setShowEditForm(true);
  };

  // Handle update form submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Ensure property ID is set
      const applianceData = {
        ...newAppliance,
        property_id: currentProperty.id
      };
      
      // API call to update appliance
      await apiHelpers.put(`appliances/${editingApplianceId}`, applianceData);
      
      // Reset form
      setNewAppliance({
        name: '',
        brand: '',
        model: '',
        serial_number: '',
        location: '',
        purchase_date: '',
        warranty_expiration: '',
        notes: '',
        category: 'kitchen'
      });
      
      setShowEditForm(false);
      setEditingApplianceId(null);
      setMessage('Appliance updated successfully!');
      
      // Reload appliances
      if (currentProperty) {
        fetchAppliances(currentProperty.id);
      }
    } catch (err) {
      console.error('Error updating appliance:', err);
      setError('Failed to update appliance. Please try again later.');
      setLoading(false);
    }
  };

  // Handle delete appliance
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appliance?')) {
      try {
        setLoading(true);
        // API call to delete appliance
        await apiHelpers.delete(`appliances/${id}`);
        
        setMessage('Appliance deleted successfully!');
        
        // Reload appliances
        if (currentProperty) {
          fetchAppliances(currentProperty.id);
        }
      } catch (err) {
        console.error('Error deleting appliance:', err);
        setError('Failed to delete appliance. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Filter appliances based on selected filter
  const filteredAppliances = appliances.filter(appliance => {
    if (filter === 'all') return true;
    return appliance.category === filter;
  });

  // Search appliances
  const searchedAppliances = filteredAppliances.filter(appliance => {
    if (!searchTerm) return true;
    return (
      appliance.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appliance.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appliance.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get warranty status and styling
  const getWarrantyStatus = (expirationDate) => {
    if (!expirationDate) return { text: 'No warranty', className: 'text-gray-400' };
    
    const today = new Date();
    const expiration = new Date(expirationDate);
    const monthsDiff = (expiration - today) / (1000 * 60 * 60 * 24 * 30);
    
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

  // Calculate age of appliance
  const getApplianceAge = (purchaseDate) => {
    if (!purchaseDate) return 'Unknown';
    
    const today = new Date();
    const purchase = new Date(purchaseDate);
    const yearsDiff = today.getFullYear() - purchase.getFullYear();
    const monthsDiff = today.getMonth() - purchase.getMonth();
    
    if (yearsDiff === 0) {
      return `${monthsDiff} months old`;
    } else if (yearsDiff === 1 && monthsDiff < 0) {
      return `${12 + monthsDiff} months old`;
    } else if (monthsDiff < 0) {
      return `${yearsDiff - 1} years, ${12 + monthsDiff} months old`;
    } else {
      return `${yearsDiff} years, ${monthsDiff} months old`;
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'kitchen':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        );
      case 'laundry':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        );
      case 'hvac':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        );
      case 'electronics':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        );
    }
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Appliances & Warranty Tracking</h1>
            <p className="text-gray-400 mt-1">Track warranties and maintenance for all your home appliances</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <button 
              className="btn-secondary text-sm px-4 py-2 rounded-md flex items-center"
              onClick={() => setShowAddForm(true)}
              disabled={!currentProperty}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Appliance
            </button>
          </div>
        </div>
        
        {/* Error and message display */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-900 bg-opacity-30 text-green-400 p-4 rounded-md mb-6">
            {message}
          </div>
        )}
        
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="flex overflow-x-auto pb-2 mb-4 md:mb-0">
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All Appliances
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'kitchen' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('kitchen')}
            >
              Kitchen
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'laundry' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('laundry')}
            >
              Laundry
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'hvac' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('hvac')}
            >
              HVAC
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'electronics' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('electronics')}
            >
              Electronics
            </button>
          </div>
          
          <div className="relative flex items-center">
            <input
              type="text"
              className="form-input w-full md:w-64 py-2 pl-10"
              placeholder="Search appliances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        {/* Add Appliance Form */}
        {showAddForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Appliance</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Appliance Name*</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    value={newAppliance.name} 
                    onChange={handleInputChange}
                    placeholder="e.g. Refrigerator"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Category*</label>
                  <select 
                    name="category" 
                    className="form-input" 
                    value={newAppliance.category} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="laundry">Laundry</option>
                    <option value="hvac">HVAC</option>
                    <option value="electronics">Electronics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    name="brand" 
                    className="form-input" 
                    value={newAppliance.brand} 
                    onChange={handleInputChange}
                    placeholder="e.g. Samsung"
                  />
                </div>
                
                <div>
                  <label className="form-label">Model</label>
                  <input 
                    type="text" 
                    name="model" 
                    className="form-input" 
                    value={newAppliance.model} 
                    onChange={handleInputChange}
                    placeholder="e.g. RF28R7351SR"
                  />
                </div>
                
                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    className="form-input"
                    value={newAppliance.serial_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-input"
                    value={newAppliance.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Kitchen, Master Bedroom, Basement"
                  />
                </div>

                <div>
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    className="form-input"
                    value={newAppliance.purchase_date}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="form-label">Warranty Expiration</label>
                  <input 
                    type="date" 
                    name="warranty_expiration" 
                    className="form-input" 
                    value={newAppliance.warranty_expiration} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea 
                    name="notes" 
                    className="form-input" 
                    value={newAppliance.notes} 
                    onChange={handleInputChange}
                    placeholder="Any additional information, maintenance history, etc."
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={loading || !newAppliance.name || !newAppliance.category || !currentProperty}
                >
                  {loading ? 'Adding...' : 'Add Appliance'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit Appliance Form */}
        {showEditForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Edit Appliance</h2>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Appliance Name*</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    value={newAppliance.name} 
                    onChange={handleInputChange}
                    placeholder="e.g. Refrigerator"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Category*</label>
                  <select 
                    name="category" 
                    className="form-input" 
                    value={newAppliance.category} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="laundry">Laundry</option>
                    <option value="hvac">HVAC</option>
                    <option value="electronics">Electronics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    name="brand" 
                    className="form-input" 
                    value={newAppliance.brand} 
                    onChange={handleInputChange}
                    placeholder="e.g. Samsung"
                  />
                </div>
                
                <div>
                  <label className="form-label">Model</label>
                  <input 
                    type="text" 
                    name="model" 
                    className="form-input" 
                    value={newAppliance.model} 
                    onChange={handleInputChange}
                    placeholder="e.g. RF28R7351SR"
                  />
                </div>
                
                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    className="form-input"
                    value={newAppliance.serial_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-input"
                    value={newAppliance.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Kitchen, Master Bedroom, Basement"
                  />
                </div>

                <div>
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    className="form-input"
                    value={newAppliance.purchase_date}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="form-label">Warranty Expiration</label>
                  <input 
                    type="date" 
                    name="warranty_expiration" 
                    className="form-input" 
                    value={newAppliance.warranty_expiration} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea 
                    name="notes" 
                    className="form-input" 
                    value={newAppliance.notes} 
                    onChange={handleInputChange}
                    placeholder="Any additional information, maintenance history, etc."
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingApplianceId(null);
                    setNewAppliance({
                      name: '',
                      brand: '',
                      model: '',
                      serial_number: '',
                      purchase_date: '',
                      warranty_expiration: '',
                      notes: '',
                      category: 'kitchen'
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={loading || !newAppliance.name || !newAppliance.category}
                >
                  {loading ? 'Updating...' : 'Update Appliance'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Appliances List */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Loading appliances...</p>
          </div>
        ) : !currentProperty ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
            <p className="text-gray-400 mb-6">Please select a property to view its appliances</p>
          </div>
        ) : searchedAppliances.length === 0 ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No appliances found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? `No results for "${searchTerm}"` : 
               filter !== 'all' ? `No ${filter} appliances found` : 
               `No appliances have been added for ${currentProperty.address} yet`}
            </p>
            <button 
              className="btn-secondary px-4 py-2 rounded-md"
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Appliance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchedAppliances.map(appliance => (
              <div key={appliance.id} className="card overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-900 bg-opacity-30 mr-3">
                        {getCategoryIcon(appliance.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{appliance.name}</h4>
                        <p className="text-xs text-gray-400">{appliance.brand} {appliance.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Warranty</div>
                      <p className={`text-xs ${getWarrantyStatus(appliance.warranty_expiration).className}`}>
                        {getWarrantyStatus(appliance.warranty_expiration).text}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Serial: {appliance.serial_number || 'N/A'}</span>
                      <span>Age: {getApplianceAge(appliance.purchase_date)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Category: {appliance.category}</span>
                      <span>Location: {appliance.location || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-4">
                      <span>Purchased: {appliance.purchase_date ? new Date(appliance.purchase_date).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between">
                      <button 
                        className="text-secondary hover:text-secondary-light text-sm"
                        onClick={() => handleEdit(appliance)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-400 text-sm"
                        onClick={() => handleDelete(appliance.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Navigation>
  );
};

export default Appliances;