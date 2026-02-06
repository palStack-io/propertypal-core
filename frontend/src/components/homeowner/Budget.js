import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers } from '../../services/api';

const Budget = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [newBudget, setNewBudget] = useState({
    category: 'utilities',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    property_id: ''
  });
  
  // Summary statistics
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [percentageUsed, setPercentageUsed] = useState(0);

  // Define fetchBudgets as a useCallback function to avoid the circular dependency
  const fetchBudgets = useCallback(async (propertyId, year, month) => {
    try {
      setLoading(true);
      
      // Call API with property ID and date filter
      const fetchedBudgets = await apiHelpers.get('finances/budgets/', {
        property_id: propertyId,
        year: year,
        month: month
      });
      
      // Process budget data - check if conversion is needed
      const processedBudgets = (fetchedBudgets || []).map(budget => {
        // If the amount appears to be in cents (>1000), convert it to dollars
        const isDollarAmount = budget.amount < 1000; // Heuristic to detect if already converted
        const displayAmount = isDollarAmount ? budget.amount : budget.amount / 100;
        
        return {
          ...budget,
          amount: displayAmount, // Store as dollars for display
          originalAmount: budget.amount // Keep original for reference
        };
      });
      
      console.log('Fetched budgets (converted to dollars):', processedBudgets);
      setBudgets(processedBudgets);
      
      // Calculate total budget (in dollars)
      const total = processedBudgets.reduce((sum, budget) => sum + budget.amount, 0);
      setTotalBudget(total);
      
      // Calculate percentage used if totalSpent is already set
      if (total > 0 && totalSpent > 0) {
        setPercentageUsed(Math.min(Math.round((totalSpent / total) * 100), 100));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setBudgets([]);
      setTotalBudget(0);
      setError('Failed to load budget data. Please try again later.');
      setLoading(false);
    }
  }, [totalSpent]);

  // Define fetchExpenses as a useCallback function to avoid the circular dependency
  const fetchExpenses = useCallback(async (propertyId, year, month) => {
    try {
      // Construct start and end date for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Call API with property ID and date filter
      const fetchedExpenses = await apiHelpers.get('finances/expenses/', {
        property_id: propertyId,
        start_date: startDateStr,
        end_date: endDateStr
      });
      
      // Process expense data - check if conversion is needed
      const processedExpenses = (fetchedExpenses || []).map(expense => {
        // If the amount appears to be in cents (>1000), convert it to dollars
        const isDollarAmount = expense.amount < 1000; // Heuristic to detect if already converted
        const displayAmount = isDollarAmount ? expense.amount : expense.amount / 100;
        
        return {
          ...expense,
          amount: displayAmount, // Store as dollars for display
          originalAmount: expense.amount // Keep original for reference
        };
      });
      
      console.log('Fetched expenses (converted to dollars):', processedExpenses);
      setExpenses(processedExpenses);
      
      // Calculate total spent (in dollars now)
      const total = processedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalSpent(total);
      
      // Calculate percentage used if totalBudget is already set
      if (totalBudget > 0 && total > 0) {
        setPercentageUsed(Math.min(Math.round((total / totalBudget) * 100), 100));
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      setTotalSpent(0);
      setError('Failed to load expense data. Please try again later.');
    }
  }, [totalBudget]);

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
          
          // Fetch budgets and expenses for the selected property
          if (propertyToUse) {
            fetchBudgets(propertyToUse.id, currentYear, currentMonth + 1);
            fetchExpenses(propertyToUse.id, currentYear, currentMonth + 1);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [navigate, currentYear, currentMonth, fetchBudgets, fetchExpenses]);

  // Handle property selection from dropdown
  const handleSelectProperty = (property) => {
    setCurrentProperty(property);
    
    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);
    
    // Fetch budgets and expenses for the selected property
    fetchBudgets(property.id, currentYear, currentMonth + 1);
    fetchExpenses(property.id, currentYear, currentMonth + 1);
  };

  // Handle input changes for new budget
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Store as regular dollar amount
      // We'll multiply by 100 when sending to API to convert to cents
      const numberValue = value === '' ? '' : parseFloat(value);
      
      setNewBudget({
        ...newBudget,
        [name]: numberValue
      });
    } else {
      setNewBudget({
        ...newBudget,
        [name]: value
      });
    }
  };

  // Handle editing a budget
  const handleEdit = (budget) => {
    setEditingBudgetId(budget.id);
    
    // When editing, check if the amount needs conversion from cents to dollars
    // If the amount is large (like 20000), it's likely already in cents and needs conversion
    // If the amount is small (like 200), it's probably already in dollars
    const isDollarAmount = budget.amount < 1000; // Heuristic to detect if already converted
    const dollarAmount = isDollarAmount ? budget.amount : budget.amount / 100;
    
    console.log('Editing budget:', budget);
    console.log('Converting amount:', budget.amount, 'to dollars:', dollarAmount);
    
    setNewBudget({
      category: budget.category || 'utilities',
      amount: dollarAmount, // Ensure we're editing in dollars
      month: budget.month || (currentMonth + 1),
      year: budget.year || currentYear,
      property_id: budget.property_id || ''
    });
    setShowEditForm(true);
  };

  // Handle form submission for new budget
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newBudget.category || !newBudget.amount) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Add property ID to budget data and convert amount to cents
      const budgetData = {
        ...newBudget,
        amount: newBudget.amount * 100, // Convert dollars to cents for API
        property_id: currentProperty.id
      };
      
      console.log('Sending to API:', budgetData); // Debug log
      
      // API call to add budget
      await apiHelpers.post('finances/budgets/', budgetData);
      
      // Reset form
      setNewBudget({
        category: 'utilities',
        amount: '',
        month: currentMonth + 1,
        year: currentYear,
        property_id: ''
      });
      
      setShowAddForm(false);
      setMessage('Budget added successfully!');
      
      // Reload budgets
      if (currentProperty) {
        fetchBudgets(currentProperty.id, currentYear, currentMonth + 1);
      }
    } catch (err) {
      console.error('Error adding budget:', err);
      setError('Failed to add budget. Please try again later.');
      setLoading(false);
    }
  };

  // Handle update form submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newBudget.category || !newBudget.amount) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Add property ID to budget data and convert amount to cents
      const budgetData = {
        ...newBudget,
        amount: newBudget.amount * 100, // Convert dollars to cents for API
        property_id: currentProperty.id
      };
      
      console.log('Sending update to API:', budgetData); // Debug log
      
      // API call to update budget
      await apiHelpers.put(`finances/budgets/${editingBudgetId}`, budgetData);
      
      // Reset form
      setNewBudget({
        category: 'utilities',
        amount: '',
        month: currentMonth + 1,
        year: currentYear,
        property_id: ''
      });
      
      setShowEditForm(false);
      setEditingBudgetId(null);
      setMessage('Budget updated successfully!');
      
      // Reload budgets
      if (currentProperty) {
        fetchBudgets(currentProperty.id, currentYear, currentMonth + 1);
      }
    } catch (err) {
      console.error('Error updating budget:', err);
      setError('Failed to update budget. Please try again later.');
      setLoading(false);
    }
  };

  // Handle delete budget
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        setLoading(true);
        // API call to delete budget
        await apiHelpers.delete(`finances/budgets/${id}`);
        
        setMessage('Budget deleted successfully!');
        
        // Reload budgets
        if (currentProperty) {
          fetchBudgets(currentProperty.id, currentYear, currentMonth + 1);
        }
      } catch (err) {
        console.error('Error deleting budget:', err);
        setError('Failed to delete budget. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get month name
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month];
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'utilities':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'mortgage':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'insurance':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'renovation':
        return (
          <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'taxes':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get the amount spent in each category
  const getSpentByCategory = (category) => {
    return expenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate percentage spent for a category
  const getPercentageSpent = (budget) => {
    const spent = getSpentByCategory(budget.category);
    if (budget.amount > 0) {
      return Math.min(Math.round((spent / budget.amount) * 100), 100);
    }
    return 0;
  };

  // Check if over budget
  const isOverBudget = (budget) => {
    const spent = getSpentByCategory(budget.category);
    return spent > budget.amount;
  };

  // Get status color based on percentage spent
  const getStatusColor = (percentage, isOver) => {
    if (isOver) {
      return 'bg-red-500';
    } else if (percentage >= 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Budget Planner</h1>
            <p className="text-gray-400 mt-1">Plan and track your home expenses</p>
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
        
        {/* Month selector and summary */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              className="text-gray-400 hover:text-gray-300"
              onClick={goToPreviousMonth}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h2 className="text-xl font-semibold">
              {getMonthName(currentMonth)} {currentYear}
            </h2>
            <button
              className="text-gray-400 hover:text-gray-300"
              onClick={goToNextMonth}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Budget Card */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1">Total Budget</h3>
              <div className="text-xl font-bold">{formatCurrency(totalBudget)}</div>
            </div>
            
            {/* Total Spent Card */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1">Total Spent</h3>
              <div className={`text-xl font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(totalSpent)}
              </div>
            </div>
            
            {/* Percentage Used Card */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1">Percentage Used</h3>
              <div className="flex items-center">
                <div className="text-xl font-bold mr-2">
                  {percentageUsed}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      percentageUsed > 100 ? 'bg-red-500' :
                      percentageUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentageUsed}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add Budget Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Category Budgets</h2>
          <button 
            className="btn-secondary text-sm px-4 py-2 rounded-md flex items-center"
            onClick={() => setShowAddForm(true)}
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Budget
          </button>
        </div>
        
        {/* Add Budget Form */}
        {showAddForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add Category Budget</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Category*</label>
                  <select 
                    name="category" 
                    className="form-input" 
                    value={newBudget.category} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="utilities">Utilities</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="insurance">Insurance</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="renovation">Renovation</option>
                    <option value="taxes">Taxes</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Amount ($)*</label>
                  <input 
                    type="number" 
                    name="amount" 
                    className="form-input" 
                    value={newBudget.amount} 
                    onChange={handleInputChange}
                    placeholder="e.g. 100"
                    step="0.01"
                    min="0"
                    required
                  />
                  <small className="text-gray-400 mt-1 block">
                    Enter the dollar amount directly (e.g. 100 for $100)
                  </small>
                </div>
                
                <div>
                  <label className="form-label">Month & Year</label>
                  <div className="flex space-x-2">
                    <select 
                      name="month" 
                      className="form-input" 
                      value={newBudget.month} 
                      onChange={handleInputChange}
                      required
                    >
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select 
                      name="year" 
                      className="form-input" 
                      value={newBudget.year} 
                      onChange={handleInputChange}
                      required
                    >
                      {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
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
                  disabled={loading || !newBudget.amount || !newBudget.category}
                >
                  {loading ? 'Adding...' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit Budget Form */}
        {showEditForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Edit Category Budget</h2>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Category*</label>
                  <select 
                    name="category" 
                    className="form-input" 
                    value={newBudget.category} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="utilities">Utilities</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="insurance">Insurance</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="renovation">Renovation</option>
                    <option value="taxes">Taxes</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Amount ($)*</label>
                  <input 
                    type="number" 
                    name="amount" 
                    className="form-input" 
                    value={newBudget.amount} 
                    onChange={handleInputChange}
                    placeholder="e.g. 100"
                    step="0.01"
                    min="0"
                    required
                  />
                  <small className="text-gray-400 mt-1 block">
                    Enter the dollar amount directly (e.g. 100 for $100)
                  </small>
                </div>
                
                <div>
                  <label className="form-label">Month & Year</label>
                  <div className="flex space-x-2">
                    <select 
                      name="month" 
                      className="form-input" 
                      value={newBudget.month} 
                      onChange={handleInputChange}
                      required
                    >
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select 
                      name="year" 
                      className="form-input" 
                      value={newBudget.year} 
                      onChange={handleInputChange}
                      required
                    >
                      {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingBudgetId(null);
                    setNewBudget({
                      category: 'utilities',
                      amount: '',
                      month: currentMonth + 1,
                      year: currentYear,
                      property_id: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={loading || !newBudget.amount || !newBudget.category}
                >
                  {loading ? 'Updating...' : 'Update Budget'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Budget Categories */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Loading budget data...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No budgets found</h3>
            <p className="text-gray-400 mb-6">
              You have not set any budgets for {getMonthName(currentMonth)} {currentYear}
            </p>
            <button 
              className="btn-secondary px-4 py-2 rounded-md"
              onClick={() => setShowAddForm(true)}
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {budgets.map(budget => {
              const spentAmount = getSpentByCategory(budget.category);
              const percentageSpent = getPercentageSpent(budget);
              const overBudget = isOverBudget(budget);
              
              return (
                <div key={budget.id} className="card p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-gray-700 mr-3">
                        {getCategoryIcon(budget.category)}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                        </h3>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Budget</div>
                      <div className="font-medium">{formatCurrency(budget.amount)}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Spent</div>
                      <div className={`font-medium ${overBudget ? 'text-red-500' : ''}`}>
                        {formatCurrency(spentAmount)}
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center">
                        <div className="text-xs mr-2 w-10">
                          {percentageSpent}%
                        </div>
                        <div className="flex-grow">
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${getStatusColor(percentageSpent, overBudget)}`}
                              style={{ width: `${percentageSpent}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex ml-4">
                          <button 
                            className="text-gray-400 hover:text-gray-300 p-1 rounded mr-1" 
                            title="Edit"
                            onClick={() => handleEdit(budget)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-400 p-1 rounded" 
                            title="Delete"
                            onClick={() => handleDelete(budget.id)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Monthly Breakdown */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-6">Monthly Comparison</h2>
          
          <div className="card p-6">
            <div className="text-center text-gray-400 mb-4">
              Monthly budget vs. spending breakdown
            </div>
            
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <p>Chart functionality coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  View your budget history and spending trends
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
};

export default Budget;