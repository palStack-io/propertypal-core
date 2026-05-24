import React, { useState, useEffect, useCallback } from 'react';
import { apiHelpers } from '../../services/api';

const MaintenanceChecklist = ({ propertyId, season }) => {
  const [checklist, setChecklist] = useState({
    items: [],
    stats: {
      totalItems: 0,
      completedItems: 0,
      completionPercentage: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    task: '',
    description: '',
    season: season || 'Spring',
    is_default: false,
    property_id: propertyId
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [seasons] = useState(['Spring', 'Summer', 'Fall', 'Winter']);
  const [currentSeason, setCurrentSeason] = useState(season || 'Spring');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Fetch checklist from API
  const fetchChecklist = useCallback(async (seasonValue) => {
    setLoading(true);
    try {
      console.log(`Fetching checklist for season: ${seasonValue}, property: ${propertyId}`);
      
      // Get checklist items for the selected season
      const response = await apiHelpers.get(
        `maintenance/checklist/${seasonValue}`,
        { property_id: propertyId }
      );
      
      console.log('Checklist response:', response);
      
      // Process the data
      let items = [];
      
      // Check if response data is an array (directly from API) or has an items property
      if (Array.isArray(response)) {
        items = response;
      } else if (response && Array.isArray(response.items)) {
        items = response.items;
      } else {
        console.warn('Unexpected response format:', response);
        items = [];
      }
      
      // Calculate statistics if not provided by API
      const totalItems = items.length;
      const completedItems = items.filter(item => item.is_completed).length;
      const completionPercentage = totalItems > 0 
        ? Math.round((completedItems / totalItems) * 100) 
        : 0;
      
      setChecklist({
        items,
        stats: { 
          totalItems,
          completedItems,
          completionPercentage
        }
      });
      
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${seasonValue} checklist:`, err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError(`Failed to load ${seasonValue} checklist. Please try again later.`);
      setLoading(false);
      
      // Set empty checklist as fallback
      setChecklist({
        items: [],
        stats: {
          totalItems: 0,
          completedItems: 0,
          completionPercentage: 0
        }
      });
    }
  }, [propertyId]);

  // Fetch checklist items when component mounts or when season/property changes
  useEffect(() => {
    if (propertyId) {
      fetchChecklist(currentSeason);
    }
  }, [propertyId, currentSeason, fetchChecklist]);

  // Toggle item completion status
  const toggleItemCompletion = async (item) => {
    try {
      console.log('Toggling item completion:', item);
      
      // Optimistically update UI
      const updatedItems = checklist.items.map(i => 
        i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
      );
      
      const completedItems = updatedItems.filter(i => i.is_completed).length;
      const totalItems = updatedItems.length;
      const completionPercentage = totalItems > 0 
        ? Math.round((completedItems / totalItems) * 100) 
        : 0;
        
      setChecklist({
        items: updatedItems,
        stats: {
          totalItems,
          completedItems,
          completionPercentage
        }
      });
      
      // Call API to update the item
      await apiHelpers.put(
        `maintenance/checklist/${item.id}/toggle`,
        {}
      );
    } catch (err) {
      console.error('Error toggling item completion:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError('Failed to update item status. Please try again.');
      
      // Revert to original state
      fetchChecklist(currentSeason);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        [name]: value
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };
  
  // Add new checklist item
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.task) {
      setError('Item task is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data with property ID
      const itemData = {
        ...newItem,
        property_id: propertyId,
        season: currentSeason
      };
      
      console.log('Adding checklist item:', itemData);
      
      // Call API to create the item
      const response = await apiHelpers.post(
        'maintenance/checklist/',
        itemData
      );
      
      console.log('Add item response:', response);
      
      // Reset form and fetch updated checklist
      setNewItem({
        task: '',
        description: '',
        season: currentSeason,
        is_default: false,
        property_id: propertyId
      });
      
      setShowAddForm(false);
      setMessage('Checklist item added successfully!');
      fetchChecklist(currentSeason);
    } catch (err) {
      console.error('Error adding checklist item:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError('Failed to add checklist item. Please try again.');
      setLoading(false);
    }
  };
  
  // Update existing checklist item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    if (!editingItem.task) {
      setError('Item task is required');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Updating checklist item:', editingItem);
      
      // Call API to update the item
      await apiHelpers.put(
        `maintenance/checklist/${editingItem.id}`,
        editingItem
      );
      
      // Reset editing state and fetch updated checklist
      setEditingItem(null);
      setMessage('Checklist item updated successfully!');
      fetchChecklist(currentSeason);
    } catch (err) {
      console.error('Error updating checklist item:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError('Failed to update checklist item. Please try again.');
      setLoading(false);
    }
  };
  
  // Delete checklist item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this checklist item?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to delete the item
      await apiHelpers.delete(
        `maintenance/checklist/${itemId}`
      );
      
      setMessage('Checklist item deleted successfully!');
      fetchChecklist(currentSeason);
    } catch (err) {
      console.error('Error deleting checklist item:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError('Failed to delete checklist item. Please try again.');
      setLoading(false);
    }
  };
  
  // Reset checklist to defaults
  const handleResetChecklist = async () => {
    try {
      setLoading(true);
      setShowResetConfirmation(false);
      
      // Call API to reset the checklist
      await apiHelpers.post(
        `maintenance/checklist/reset/${currentSeason}`,
        {},
        { property_id: propertyId }
      );
      
      setMessage(`${currentSeason} checklist has been reset to defaults.`);
      fetchChecklist(currentSeason);
    } catch (err) {
      console.error('Error resetting checklist:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError('Failed to reset checklist. Please try again.');
      setLoading(false);
    }
  };
  
  // Change current season
  const handleSeasonChange = (newSeason) => {
    setCurrentSeason(newSeason);
    setEditingItem(null);
    setShowAddForm(false);
  };

  // Start editing an item
  const startEditing = (item) => {
    setEditingItem({ ...item });
    setShowAddForm(false);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
  };
  
  // Start adding a new item
  const startAddingItem = () => {
    setShowAddForm(true);
    setEditingItem(null);
    // Make sure the newItem has the current season and property
    setNewItem({
      ...newItem,
      season: currentSeason,
      property_id: propertyId
    });
  };
  
  // Cancel adding a new item
  const cancelAddingItem = () => {
    setShowAddForm(false);
    setNewItem({
      task: '',
      description: '',
      season: currentSeason,
      is_default: false,
      property_id: propertyId
    });
  };

  return (
    <div className="mt-8">
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
      
      {/* Season selector and checklist header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">{currentSeason} Maintenance Checklist</h2>
            <p className="text-gray-400 text-sm mt-1">
              Seasonal tasks to keep your home in top condition
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="relative mr-4">
              <select 
                className="form-input py-2 pr-8"
                value={currentSeason}
                onChange={(e) => handleSeasonChange(e.target.value)}
              >
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
            
            <div className="flex">
              <button
                className="btn-secondary text-sm px-3 py-1.5 rounded-md mr-2 flex items-center"
                onClick={startAddingItem}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Task
              </button>
              
              <button
                className="t-secondary btn-secondary text-sm px-3 py-1.5 rounded-md flex items-center transition-colors"
                onClick={() => setShowResetConfirmation(true)}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-medium">
              {checklist.stats.completedItems} of {checklist.stats.totalItems} tasks completed ({checklist.stats.completionPercentage}%)
            </span>
          </div>
          <div className="w-full rounded-full h-2.5" style={{ background: 'var(--bg-card-hover)' }}>
            <div 
              className="bg-sky-400 h-2.5 rounded-full" 
              style={{ width: `${checklist.stats.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Forms */}
      {showAddForm && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
          <form onSubmit={handleAddItem}>
            <div className="mb-4">
              <label className="form-label">Task Title*</label>
              <input 
                type="text"
                name="task"
                className="form-input"
                value={newItem.task}
                onChange={handleInputChange}
                placeholder="e.g. Clean gutters and downspouts"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                value={newItem.description || ''}
                onChange={handleInputChange}
                placeholder="Add detailed instructions or tips..."
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                onClick={cancelAddingItem}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-secondary px-4 py-2 rounded-md"
                disabled={loading || !newItem.task}
              >
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {editingItem && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
          <form onSubmit={handleUpdateItem}>
            <div className="mb-4">
              <label className="form-label">Task Title*</label>
              <input 
                type="text"
                name="task"
                className="form-input"
                value={editingItem.task}
                onChange={handleInputChange}
                placeholder="e.g. Clean gutters and downspouts"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                value={editingItem.description || ''}
                onChange={handleInputChange}
                placeholder="Add detailed instructions or tips..."
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-secondary px-4 py-2 rounded-md"
                disabled={loading || !editingItem.task}
              >
                {loading ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Checklist Items */}
      <div className="card p-6">
        {loading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Loading checklist items...</p>
          </div>
        ) : checklist.items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No checklist items found</h3>
            <p className="text-gray-400 mb-6">
              Add tasks to your {currentSeason} maintenance checklist to stay organized
            </p>
            <button 
              className="btn-secondary px-4 py-2 rounded-md"
              onClick={startAddingItem}
            >
              Add Your First Task
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--border)' }}>
            {checklist.items.map(item => (
              <div key={item.id} className="py-3 flex items-start group">
                <div className="flex-shrink-0 mr-3 mt-1">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleItemCompletion(item)}
                    className="form-checkbox h-5 w-5 text-sky-400 rounded"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className={item.is_completed ? 't-muted line-through' : 't-primary'}>
                      <span className="font-medium">{item.task}</span>

                      {item.description && (
                        <p className="text-sm mt-1 t-secondary">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center ml-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="t-secondary hover:opacity-100 p-1 rounded"
                        onClick={() => startEditing(item)}
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                      
                      <button 
                        className="text-red-500 hover:text-red-400 p-1 rounded"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {item.completed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed {new Date(item.completed_at).toLocaleDateString()}
                    </p>
                  )}
                  
                  {item.is_default && (
                    <span className="badge badge-brand text-xs mt-1">Default task</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reset Checklist?</h3>
            <p className="text-gray-300 mb-6">
              This will reset your {currentSeason} checklist to default items. Any custom items will be removed, and completion status will be reset. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="text-gray-400 hover:text-gray-300 px-4 py-2"
                onClick={() => setShowResetConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                onClick={handleResetChecklist}
              >
                Reset Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceChecklist;