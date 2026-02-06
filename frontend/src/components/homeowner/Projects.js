import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers } from '../../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning',
    budget: '',
    spent: '',
    start_date: '',
    projected_end_date: '',
    property_id: ''
  });

  // Get current user from local storage
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
        
        if (fetchedProperties && fetchedProperties.length > 0) {
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
          
          // Fetch projects for the selected property
          if (propertyToUse) {
            fetchProjectsForProperty(propertyToUse.id);
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
    
    // Fetch projects for the selected property
    fetchProjectsForProperty(property.id);
  };

  // Fetch projects for a specific property
  const fetchProjectsForProperty = async (propertyId) => {
    try {
      setLoading(true);
      console.log(`Fetching projects for property ID: ${propertyId}`);
      
      const response = await apiHelpers.get('projects/', { property_id: propertyId });
      
      console.log('Projects API response:', response);
      
      // Always use the API response data
      setProjects(response || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching projects:', err);
      // For errors, set an empty array instead of mock data
      setProjects([]);
      setError('Failed to load projects. Please try again later.');
      setLoading(false);
    }
  };

  // Handle input changes for project form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric values to numbers
    if (name === 'budget' || name === 'spent') {
      setNewProject({
        ...newProject,
        [name]: value === '' ? '' : parseFloat(value)
      });
    } else {
      setNewProject({
        ...newProject,
        [name]: value
      });
    }
  };

  // Handle form submission for new project
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Add current property ID to the project data
      const projectData = {
        ...newProject,
        property_id: currentProperty.id
      };
      
      console.log('Sending project data:', projectData);
      
      // API call to add project
      await apiHelpers.post('projects/', projectData);
      
      // Reset form
      setNewProject({
        name: '',
        description: '',
        status: 'planning',
        budget: '',
        spent: '',
        start_date: '',
        projected_end_date: '',
        property_id: ''
      });
      
      setShowAddForm(false);
      setMessage('Project added successfully!');
      
      // Reload projects
      if (currentProperty) {
        fetchProjectsForProperty(currentProperty.id);
      }
    } catch (err) {
      console.error('Error adding project:', err);
      setError('Failed to add project. Please try again later.');
      setLoading(false);
    }
  };

  // Handle edit project
  const handleEdit = (project) => {
    setEditingProjectId(project.id);
    setNewProject({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'planning',
      budget: project.budget || '',
      spent: project.spent || '',
      start_date: project.start_date || '',
      projected_end_date: project.projected_end_date || '',
      property_id: project.property_id || currentProperty?.id || ''
    });
    setShowEditForm(true);
  };

  // Handle update form submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Ensure property_id is set
      const projectData = {
        ...newProject,
        property_id: currentProperty.id
      };
      
      // API call to update project
      await apiHelpers.put(`projects/${editingProjectId}`, projectData);
      
      // Reset form
      setNewProject({
        name: '',
        description: '',
        status: 'planning',
        budget: '',
        spent: '',
        start_date: '',
        projected_end_date: '',
        property_id: ''
      });
      
      setShowEditForm(false);
      setEditingProjectId(null);
      setMessage('Project updated successfully!');
      
      // Reload projects
      if (currentProperty) {
        fetchProjectsForProperty(currentProperty.id);
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again later.');
      setLoading(false);
    }
  };

  // Handle delete project
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        setLoading(true);
        // API call to delete project
        await apiHelpers.delete(`projects/${id}`);
        
        setMessage('Project deleted successfully!');
        
        // Reload projects
        if (currentProperty) {
          fetchProjectsForProperty(currentProperty.id);
        }
      } catch (err) {
        console.error('Error deleting project:', err);
        setError('Failed to delete project. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Handle update project status
  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      // API call to update project status
      await apiHelpers.put(`projects/${id}`, { status: newStatus });
      
      setMessage(`Project status updated to ${newStatus}!`);
      
      // Reload projects
      if (currentProperty) {
        fetchProjectsForProperty(currentProperty.id);
      }
    } catch (err) {
      console.error('Error updating project status:', err);
      setError('Failed to update project status. Please try again later.');
      setLoading(false);
    }
  };

  // Filter projects based on selected filter
  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  // Search projects
  const searchedProjects = filteredProjects.filter(project => {
    if (!searchTerm) return true;
    return (
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get progress percentage
  const getProgressPercentage = (project) => {
    if (project.status === 'completed') return 100;
    if (!project.budget || project.budget === 0) return 0;
    
    // Calculate based on spent vs budget
    const percentage = (project.spent / project.budget) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Format currency with commas and dollar sign
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-900 text-blue-300 bg-opacity-30';
      case 'in-progress':
        return 'bg-sky-900 text-sky-200 bg-opacity-30';
      case 'on-hold':
        return 'bg-yellow-900 text-yellow-300 bg-opacity-30';
      case 'completed':
        return 'bg-gray-700 text-gray-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get progress bar color
  const getProgressBarColor = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-500';
      case 'in-progress':
        return 'bg-sky-400';
      case 'on-hold':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status action buttons
  const getStatusActions = (project) => {
    const actions = [];
    
    // Edit button is always available
    actions.push(
      <button 
        key="edit" 
        className="text-blue-500 hover:text-blue-400 text-sm"
        onClick={() => handleEdit(project)}
      >
        Edit
      </button>
    );

    // Add conditional status change buttons
    if (project.status === 'planning') {
      actions.push(
        <button 
          key="start" 
          className="text-sky-400 hover:text-sky-300 text-sm ml-2"
          onClick={() => handleStatusChange(project.id, 'in-progress')}
        >
          Start
        </button>
      );
    } else if (project.status === 'in-progress') {
      actions.push(
        <button 
          key="complete" 
          className="text-green-500 hover:text-green-400 text-sm ml-2"
          onClick={() => handleStatusChange(project.id, 'completed')}
        >
          Complete
        </button>
      );
      actions.push(
        <button 
          key="hold" 
          className="text-yellow-500 hover:text-yellow-400 text-sm ml-2"
          onClick={() => handleStatusChange(project.id, 'on-hold')}
        >
          Pause
        </button>
      );
    } else if (project.status === 'on-hold') {
      actions.push(
        <button 
          key="resume" 
          className="text-sky-400 hover:text-sky-300 text-sm ml-2"
          onClick={() => handleStatusChange(project.id, 'in-progress')}
        >
          Resume
        </button>
      );
    }
    
    return actions;
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Home Projects</h1>
            <p className="text-gray-400 mt-1">Manage your home improvement projects</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <button 
              className="btn-secondary text-sm px-4 py-2 rounded-md flex items-center"
              onClick={() => setShowAddForm(true)}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              New Project
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
              All Projects
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'planning' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('planning')}
            >
              Planning
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'in-progress' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('in-progress')}
            >
              In Progress
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'on-hold' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('on-hold')}
            >
              On Hold
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
              placeholder="Search projects..."
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
        
        {/* Add Project Form */}
        {showAddForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">New Project</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Project Name*</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    value={newProject.name} 
                    onChange={handleInputChange}
                    placeholder="e.g. Kitchen Remodel"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-input" 
                    value={newProject.description} 
                    onChange={handleInputChange}
                    placeholder="Describe your project, goals, and details"
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="form-label">Status*</label>
                  <select 
                    name="status" 
                    className="form-input" 
                    value={newProject.status} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Budget ($)</label>
                  <input 
                    type="number" 
                    name="budget" 
                    className="form-input" 
                    value={newProject.budget} 
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    min="0"
                    step="1"
                  />
                </div>
                
                <div>
                  <label className="form-label">Spent So Far ($)</label>
                  <input 
                    type="number" 
                    name="spent" 
                    className="form-input" 
                    value={newProject.spent} 
                    onChange={handleInputChange}
                    placeholder="e.g. 1000"
                    min="0"
                    step="1"
                  />
                </div>
                
                <div>
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    className="form-input" 
                    value={newProject.start_date} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="form-label">Projected End Date</label>
                  <input 
                    type="date" 
                    name="projected_end_date" 
                    className="form-input" 
                    value={newProject.projected_end_date} 
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
                  disabled={loading || !newProject.name || !currentProperty}
                >
                  {loading ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit Project Form */}
        {showEditForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Project Name*</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    value={newProject.name} 
                    onChange={handleInputChange}
                    placeholder="e.g. Kitchen Remodel"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-input" 
                    value={newProject.description} 
                    onChange={handleInputChange}
                    placeholder="Describe your project, goals, and details"
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="form-label">Status*</label>
                  <select 
                    name="status" 
                    className="form-input" 
                    value={newProject.status} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Budget ($)</label>
                  <input 
                    type="number" 
                    name="budget" 
                    className="form-input" 
                    value={newProject.budget} 
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    min="0"
                    step="1"
                  />
                </div>
                
                <div>
                  <label className="form-label">Spent So Far ($)</label>
                  <input 
                    type="number" 
                    name="spent" 
                    className="form-input" 
                    value={newProject.spent} 
                    onChange={handleInputChange}
                    placeholder="e.g. 1000"
                    min="0"
                    step="1"
                  />
                </div>
                
                <div>
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    className="form-input" 
                    value={newProject.start_date} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="form-label">Projected End Date</label>
                  <input 
                    type="date" 
                    name="projected_end_date" 
                    className="form-input" 
                    value={newProject.projected_end_date} 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProjectId(null);
                    setNewProject({
                      name: '',
                      description: '',
                      status: 'planning',
                      budget: '',
                      spent: '',
                      start_date: '',
                      projected_end_date: '',
                      property_id: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={loading || !newProject.name}
                >
                  {loading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Loading projects...</p>
          </div>
        ) : !currentProperty ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
            <p className="text-gray-400 mb-6">Please select a property to view its projects</p>
          </div>
        ) : searchedProjects.length === 0 ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? `No results for "${searchTerm}"` : 
               filter !== 'all' ? `No ${filter} projects found` : 
               `You have not added any projects for ${currentProperty.address} yet`}
            </p>
            <button 
              className="btn-secondary px-4 py-2 rounded-md"
              onClick={() => setShowAddForm(true)}
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {searchedProjects.map(project => (
              <div key={project.id} className="card p-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-medium">{project.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(project.status)}`}>
                    {project.status === 'in-progress' ? 'In Progress' : 
                     project.status === 'on-hold' ? 'On Hold' : 
                     project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {project.description}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className={`${getProgressBarColor(project.status)} h-2 rounded-full`} 
                    style={{ width: `${getProgressPercentage(project)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Budget: {formatCurrency(project.budget)}</span>
                  <span>Spent: {formatCurrency(project.spent)}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    <span>
                      {project.start_date ? `Start: ${new Date(project.start_date).toLocaleDateString()}` : 'Not started'}
                    </span>
                    <span>
                      {project.status === 'completed' && project.projected_end_date 
                        ? `Completed: ${new Date(project.projected_end_date).toLocaleDateString()}`
                        : project.projected_end_date
                          ? `End: ${new Date(project.projected_end_date).toLocaleDateString()}`
                          : 'No end date set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      {getStatusActions(project)}
                    </div>
                    <button 
                      className="text-red-500 hover:text-red-400 text-sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Project Ideas Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Home Project Ideas</h2>
          
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">Energy Efficiency Upgrades</h3>
                <p className="text-sm text-gray-400">Install energy-efficient windows, add insulation, or update HVAC system to reduce utility bills.</p>
                <button 
                  className="mt-4 text-sky-400 hover:text-sky-300 text-sm"
                  onClick={() => {
                    setNewProject({
                      ...newProject,
                      name: 'Energy Efficiency Upgrades',
                      description: 'Install energy-efficient windows, add insulation, or update HVAC system to reduce utility bills.',
                      status: 'planning'
                    });
                    setShowAddForm(true);
                  }}
                >
                  Create Project
                </button>
              </div>
              
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">Home Office Renovation</h3>
                <p className="text-sm text-gray-400">Transform a spare room into a functional work-from-home space with proper lighting and storage.</p>
                <button 
                  className="mt-4 text-sky-400 hover:text-sky-300 text-sm"
                  onClick={() => {
                    setNewProject({
                      ...newProject,
                      name: 'Home Office Renovation',
                      description: 'Transform a spare room into a functional work-from-home space with proper lighting and storage.',
                      status: 'planning'
                    });
                    setShowAddForm(true);
                  }}
                >
                  Create Project
                </button>
              </div>
              
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">Smart Home Upgrades</h3>
                <p className="text-sm text-gray-400">Install smart thermostats, lighting, security cameras, and home automation systems.</p>
                <button 
                  className="mt-4 text-sky-400 hover:text-sky-300 text-sm"
                  onClick={() => {
                    setNewProject({
                      ...newProject,
                      name: 'Smart Home Upgrades',
                      description: 'Install smart thermostats, lighting, security cameras, and home automation systems.',
                      status: 'planning'
                    });
                    setShowAddForm(true);
                  }}
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
};

export default Projects;