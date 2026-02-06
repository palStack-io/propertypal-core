import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import MaintenanceChecklist from './MaintenanceChecklist';
import { apiHelpers } from '../../services/api';

const Maintenance = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'checklists'
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    property_id: ''
  });

  // Get current season for the checklist
  const getCurrentSeason = () => {
    const now = new Date();
    const month = now.getMonth();
    
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  // Fetch maintenance items from the API
  const fetchMaintenanceItems = useCallback(async (propertyId) => {
    try {
      setLoading(true);
      const items = await apiHelpers.get('maintenance/', { property_id: propertyId });
      setMaintenanceItems(items);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching maintenance items:', err);
      setError('Failed to load maintenance items. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Break the circular dependency by combining the functions
  const initializeProperties = useCallback(async () => {
    try {
      const properties = await apiHelpers.get('properties/');
      
      if (properties && properties.length > 0) {
        // Get current property from localStorage or use the first one
        const savedPropertyId = localStorage.getItem('currentPropertyId');
        let propertyToUse;
        
        if (savedPropertyId) {
          try {
            const property = await apiHelpers.get(`properties/${savedPropertyId}`);
            propertyToUse = property;
          } catch (error) {
            console.error('Error fetching saved property:', error);
            propertyToUse = properties[0];
          }
        } else {
          propertyToUse = properties[0];
        }
        
        setCurrentProperty(propertyToUse);
        
        // Save to localStorage
        localStorage.setItem('currentPropertyId', propertyToUse.id);
        
        // Fetch maintenance items for this property
        fetchMaintenanceItems(propertyToUse.id);
      } else {
        setLoading(false);
        setError('No property found. Please set up your property first.');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again later.');
      setLoading(false);
    }
  }, [fetchMaintenanceItems]);

  // Fetch user and maintenance items
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const authToken = localStorage.getItem('accessToken');
    
    if (!userString || !authToken) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(userString);
    setUser(userData);
    
    // Initialize properties and maintenance items
    initializeProperties();
  }, [navigate, initializeProperties]);

  // These functions are now defined above using useCallback

  // Handle property selection from dropdown
  const handleSelectProperty = useCallback((property) => {
    setCurrentProperty(property);
    
    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);
    
    // Fetch maintenance items for the selected property
    fetchMaintenanceItems(property.id);
  }, [fetchMaintenanceItems]);

  // This function is now defined above using useCallback

  // Handle input changes for new maintenance item
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  // Handle form submission for new maintenance item
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Add property ID to the maintenance item
      const itemData = {
        ...newItem,
        property_id: currentProperty.id
      };
      
      await apiHelpers.post('maintenance/', itemData);
      
      // Reset form
      setNewItem({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        property_id: ''
      });
      
      setShowAddForm(false);
      setMessage('Maintenance request added successfully!');
      
      // Reload maintenance items
      fetchMaintenanceItems(currentProperty.id);
    } catch (err) {
      console.error('Error adding maintenance item:', err);
      setError('Failed to add maintenance request. Please try again later.');
      setLoading(false);
    }
  };

  // Handle status change for maintenance item
  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      await apiHelpers.put(`maintenance/${id}`, { status: newStatus });
      
      setMessage(`Maintenance request status updated to ${newStatus}!`);
      
      // Reload maintenance items
      fetchMaintenanceItems(currentProperty.id);
    } catch (err) {
      console.error('Error updating maintenance item:', err);
      setError('Failed to update maintenance request. Please try again later.');
      setLoading(false);
    }
  };

  // Handle delete maintenance item
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance request?')) {
      try {
        setLoading(true);
        await apiHelpers.delete(`maintenance/${id}`);
        
        setMessage('Maintenance request deleted successfully!');
        
        // Reload maintenance items
        fetchMaintenanceItems(currentProperty.id);
      } catch (err) {
        console.error('Error deleting maintenance item:', err);
        setError('Failed to delete maintenance request. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Filter maintenance items based on selected filter
  const filteredItems = maintenanceItems.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  // Search maintenance items
  const searchedItems = filteredItems.filter(item => {
    if (!searchTerm) return true;
    return (
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get priority badge color
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900 bg-opacity-30 text-red-400';
      case 'medium':
        return 'bg-yellow-900 bg-opacity-30 text-yellow-400';
      case 'low':
        return 'bg-green-900 bg-opacity-30 text-green-400';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900 bg-opacity-30 text-yellow-400';
      case 'in-progress':
        return 'bg-blue-900 bg-opacity-30 text-blue-400';
      case 'completed':
        return 'bg-green-900 bg-opacity-30 text-green-400';
      case 'cancelled':
        return 'bg-red-900 bg-opacity-30 text-red-400';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        {/* Header and Tab Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Maintenance</h1>
            <p className="text-gray-400 mt-1">Keep track of home maintenance tasks and seasonal checklists</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            {activeTab === 'items' && (
              <button 
                className="btn-secondary text-sm px-4 py-2 rounded-md flex items-center"
                onClick={() => setShowAddForm(true)}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                New Maintenance Request
              </button>
            )}
          </div>
        </div>
        
        {/* Error and message display */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6">
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
          <div className="bg-green-900 bg-opacity-30 text-green-400 p-4 rounded-md mb-6">
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
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 transition-colors ${activeTab === 'items' ? 'border-sky-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('items')}
            >
              Maintenance Requests
            </button>
            <button
              className={`py-2 px-1 border-b-2 transition-colors ${activeTab === 'checklists' ? 'border-sky-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('checklists')}
            >
              Seasonal Checklists
            </button>
          </div>
        </div>
        
        {/* Only show selected tab content */}
        {activeTab === 'items' ? (
          <>
            {/* Add Maintenance Form */}
            {showAddForm && (
              <div className="card p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">New Maintenance Request</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="form-label">Title*</label>
                      <input 
                        type="text" 
                        name="title" 
                        className="form-input" 
                        value={newItem.title} 
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="form-label">Description</label>
                      <textarea 
                        name="description" 
                        className="form-input" 
                        value={newItem.description} 
                        onChange={handleInputChange}
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="form-label">Priority*</label>
                      <select 
                        name="priority" 
                        className="form-input" 
                        value={newItem.priority} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">Due Date</label>
                      <input 
                        type="date" 
                        name="due_date" 
                        className="form-input" 
                        value={newItem.due_date} 
                        onChange={handleInputChange}
                      />
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
                      disabled={loading || !newItem.title}
                    >
                      {loading ? 'Adding...' : 'Add Maintenance Request'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Filters and search */}
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="flex overflow-x-auto pb-2 mb-4 md:mb-0">
                <button 
                  className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setFilter('all')}
                >
                  All Items
                </button>
                <button 
                  className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'pending' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'in-progress' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setFilter('in-progress')}
                >
                  In Progress
                </button>
                <button 
                  className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'completed' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
              </div>
              
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="form-input w-full md:w-64 py-2 pl-10"
                  placeholder="Search maintenance..."
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
            
            {/* Maintenance Items List */}
            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-3 text-gray-400">Loading maintenance items...</p>
              </div>
            ) : searchedItems.length === 0 ? (
              <div className="text-center py-16 card">
                <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <h3 className="text-lg font-medium mb-2">No maintenance items found</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm ? `No results for "${searchTerm}"` : filter !== 'all' ? `No ${filter} maintenance items found` : 'You have not added any maintenance requests yet'}
                </p>
                <button 
                  className="btn-secondary px-4 py-2 rounded-md"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Your First Maintenance Request
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchedItems.map(item => (
                  <div key={item.id} className="card overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-4">{item.description}</p>
                      
                      <div className="flex justify-between text-xs text-gray-400 mb-4">
                        <span className={`px-2 py-1 rounded-full ${getPriorityBadge(item.priority)}`}>
                          {item.priority} priority
                        </span>
                        {item.due_date && (
                          <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between">
                          <div className="flex space-x-2">
                            {item.status !== 'completed' && (
                              <button 
                                className="text-green-500 hover:text-green-400 text-sm"
                                onClick={() => handleStatusChange(item.id, 'completed')}
                              >
                                Complete
                              </button>
                            )}
                            {item.status === 'pending' && (
                              <button 
                                className="text-blue-500 hover:text-blue-400 text-sm"
                                onClick={() => handleStatusChange(item.id, 'in-progress')}
                              >
                                Start
                              </button>
                            )}
                          </div>
                          <button 
                            className="text-red-500 hover:text-red-400 text-sm"
                            onClick={() => handleDelete(item.id)}
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
          </>
        ) : (
          // Show the MaintenanceChecklist component when on the "checklists" tab
          currentProperty ? (
            <MaintenanceChecklist 
              propertyId={currentProperty.id} 
              season={getCurrentSeason()} 
            />
          ) : (
            <div className="text-center py-12 card">
              <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <h3 className="text-lg font-medium mb-2">No Property Found</h3>
              <p className="text-gray-400 mb-6">Please set up your property to start using maintenance checklists.</p>
            </div>
          )
        )}
      </div>
    </Navigation>
  );
};

export default Maintenance;