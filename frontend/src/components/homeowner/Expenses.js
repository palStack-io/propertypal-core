import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { apiHelpers } from '../../services/api';

const Expenses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'utilities',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recurring: false,
    recurring_interval: 'monthly',
    property_id: ''
  });
  
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState({});

  // Calculate monthly total
  const calculateMonthlyTotal = useCallback((expensesData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthExpenses = expensesData.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const total = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    setMonthlyTotal(total);
  }, []);

  // Group expenses by category
  const groupExpensesByCategory = useCallback((expensesData) => {
    const grouped = expensesData.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});
    
    setExpensesByCategory(grouped);
  }, []);

  // Fetch expenses from the API
  const fetchExpenses = useCallback(async (propertyId) => {
    try {
      setLoading(true);
      
      // Get date range based on filter
      const now = new Date();
      let startDate;
      
      if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
      } else if (dateRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else {
        startDate = new Date(now.getFullYear() - 100, 0, 1); // Get all expenses
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Use apiHelpers to fetch expenses with query parameters
      const fetchedExpenses = await apiHelpers.get('finances/expenses/', {
        property_id: propertyId,
        start_date: startDateStr
      });
      
      setExpenses(fetchedExpenses || []);
      
      // Calculate total for current month
      calculateMonthlyTotal(fetchedExpenses || []);
      
      // Group expenses by category
      groupExpensesByCategory(fetchedExpenses || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      setMonthlyTotal(0);
      setExpensesByCategory({});
      setError('Failed to load expenses. Please try again later.');
      setLoading(false);
    }
  }, [dateRange, calculateMonthlyTotal, groupExpensesByCategory]);

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
        // Use apiHelpers to fetch properties
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
          
          // Fetch expenses for the selected property
          if (propertyToUse) {
            fetchExpenses(propertyToUse.id);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [navigate, fetchExpenses]); // Now fetchExpenses is properly included in dependencies

  // Handle property selection from dropdown
  const handleSelectProperty = useCallback((property) => {
    setCurrentProperty(property);
    
    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);
    
    // Fetch expenses for the selected property
    fetchExpenses(property.id);
  }, [fetchExpenses]);

  // Handle input changes for new expense
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setNewExpense({
        ...newExpense,
        [name]: checked
      });
    } else if (name === 'amount') {
      // For amount field, store the exact value as entered (in dollars)
      // The backend will handle the conversion to cents
      const numberValue = value === '' ? '' : parseFloat(value);
      
      setNewExpense({
        ...newExpense,
        [name]: numberValue
      });
    } else {
      setNewExpense({
        ...newExpense,
        [name]: value
      });
    }
  };

  // Start editing an expense
  const handleEdit = (expense) => {
    setEditingExpenseId(expense.id);
    setNewExpense({
      title: expense.title || '',
      amount: expense.amount || '', // Backend already converts to dollars in API response
      category: expense.category || 'utilities',
      date: expense.date || new Date().toISOString().split('T')[0],
      description: expense.description || '',
      recurring: expense.recurring || false,
      recurring_interval: expense.recurring_interval || 'monthly',
      property_id: expense.property_id || currentProperty?.id || ''
    });
    setShowEditForm(true);
  };

  // Handle form submission for new expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newExpense.title || !newExpense.amount || !newExpense.category || !newExpense.date) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Add property ID to expense data
      const expenseData = {
        ...newExpense,
        property_id: currentProperty.id
      };
      
      // Use apiHelpers to create expense
      await apiHelpers.post('finances/expenses/', expenseData);
      
      // Reset form
      setNewExpense({
        title: '',
        amount: '',
        category: 'utilities',
        date: new Date().toISOString().split('T')[0],
        description: '',
        recurring: false,
        recurring_interval: 'monthly',
        property_id: ''
      });
      
      setShowAddForm(false);
      setMessage('Expense added successfully!');
      
      // Reload expenses
      if (currentProperty) {
        fetchExpenses(currentProperty.id);
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again later.');
      setLoading(false);
    }
  };

  // Handle updating an existing expense
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newExpense.title || !newExpense.amount || !newExpense.category || !newExpense.date) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Add property ID to expense data
      const expenseData = {
        ...newExpense,
        property_id: currentProperty.id
      };
      
      // Use apiHelpers to update expense
      await apiHelpers.put(`finances/expenses/${editingExpenseId}`, expenseData);
      
      // Reset form
      setNewExpense({
        title: '',
        amount: '',
        category: 'utilities',
        date: new Date().toISOString().split('T')[0],
        description: '',
        recurring: false,
        recurring_interval: 'monthly',
        property_id: ''
      });
      
      setShowEditForm(false);
      setEditingExpenseId(null);
      setMessage('Expense updated successfully!');
      
      // Reload expenses
      if (currentProperty) {
        fetchExpenses(currentProperty.id);
      }
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again later.');
      setLoading(false);
    }
  };

  // Handle delete expense
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        setLoading(true);
        // Use apiHelpers to delete expense
        await apiHelpers.delete(`finances/expenses/${id}`);
        
        setMessage('Expense deleted successfully!');
        
        // Reload expenses
        if (currentProperty) {
          fetchExpenses(currentProperty.id);
        }
      } catch (err) {
        console.error('Error deleting expense:', err);
        setError('Failed to delete expense. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Filter expenses based on selected filter
  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'all') return true;
    return expense.category === filter;
  });

  // Search expenses
  const searchedExpenses = filteredExpenses.filter(expense => {
    if (!searchTerm) return true;
    return (
      expense.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort expenses by date (most recent first)
  const sortedExpenses = [...searchedExpenses].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // Format date string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Home Expenses</h1>
            <p className="text-gray-400 mt-1">Track and manage your home-related expenses</p>
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
        
        {/* Expense Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly Total Card */}
          <div className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Monthly Expenses</p>
                <h3 className="text-xl font-bold mt-1">
                  {formatCurrency(monthlyTotal)}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-green-900 bg-opacity-30">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-400">
                Current Month
              </span>
              <button className="ml-auto text-sky-400 hover:text-sky-300">
                View Budget
              </button>
            </div>
          </div>
          
          {/* Largest Category Card */}
          <div className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Top Expense Category</p>
                <h3 className="text-xl font-bold mt-1">
                  {Object.keys(expensesByCategory).length > 0 ? (
                    Object.entries(expensesByCategory)
                      .sort((a, b) => b[1] - a[1])[0][0]
                      .charAt(0).toUpperCase() + 
                      Object.entries(expensesByCategory)
                        .sort((a, b) => b[1] - a[1])[0][0]
                        .slice(1)
                  ) : 'None'}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-blue-900 bg-opacity-30">
                {Object.keys(expensesByCategory).length > 0 ? (
                  getCategoryIcon(Object.entries(expensesByCategory)
                    .sort((a, b) => b[1] - a[1])[0][0])
                ) : (
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                )}
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-400">
                {Object.keys(expensesByCategory).length > 0 ? (
                  formatCurrency(Object.entries(expensesByCategory)
                    .sort((a, b) => b[1] - a[1])[0][1])
                ) : '$0.00'}
              </span>
              <button className="ml-auto text-sky-400 hover:text-sky-300">
                View Report
              </button>
            </div>
          </div>
          
          {/* Recent Expenses Card */}
          <div className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Recent Expenses</p>
                <h3 className="text-xl font-bold mt-1">
                  {expenses.length} Items
                </h3>
              </div>
              <div className="p-3 rounded-full bg-orange-900 bg-opacity-30">
                <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-400">
                {dateRange === 'month' ? 'This Month' : 
                 dateRange === 'quarter' ? 'This Quarter' : 
                 dateRange === 'year' ? 'This Year' : 'All Time'}
              </span>
              <button 
                className="ml-auto text-sky-400 hover:text-sky-300"
                onClick={() => setShowAddForm(true)}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters and Add Button */}
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="flex overflow-x-auto pb-2 mb-4 md:mb-0">
            {/* Category filters */}
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All Expenses
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'utilities' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('utilities')}
            >
              Utilities
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'mortgage' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('mortgage')}
            >
              Mortgage
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'insurance' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('insurance')}
            >
              Insurance
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'maintenance' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('maintenance')}
            >
              Maintenance
            </button>
            <button 
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'taxes' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('taxes')}
            >
              Taxes
            </button>
          </div>
          
          <div className="flex items-center">
            {/* Date range selector */}
            <select
              className="form-input w-32 py-1 px-2 mr-2 text-sm"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                if (currentProperty) {
                  fetchExpenses(currentProperty.id);
                }
              }}
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            
            {/* Search box */}
            <div className="relative flex items-center mr-2">
              <input
                type="text"
                className="form-input w-40 md:w-64 py-2 pl-10 text-sm"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            {/* Add expense button */}
            <button 
              className="btn-secondary text-sm px-4 py-1 rounded-md flex items-center"
              onClick={() => setShowAddForm(true)}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Expense
            </button>
          </div>
        </div>
        
        {/* Add Expense Form */}
        {showAddForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Expense Title*</label>
                  <input 
                    type="text" 
                    name="title" 
                    className="form-input" 
                    value={newExpense.title} 
                    onChange={handleInputChange}
                    placeholder="e.g. Electricity Bill"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Amount ($)*</label>
                  <input 
                    type="number" 
                    name="amount" 
                    className="form-input" 
                    value={newExpense.amount} 
                    onChange={handleInputChange}
                    placeholder="e.g. 150 for $150"
                    step="0.01"
                    min="0"
                    required
                  />
                  <small className="text-gray-400 mt-1 block">
                    Enter the exact dollar amount (e.g. 150 for $150)
                  </small>
                </div>
                
                <div>
                  <label className="form-label">Category*</label>
                  <select 
                    name="category" 
                    className="form-input" 
                    value={newExpense.category} 
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
                  <label className="form-label">Date*</label>
                  <input 
                    type="date" 
                    name="date" 
                    className="form-input" 
                    value={newExpense.date} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="form-label">Recurring Expense</label>
                  <div className="flex items-center mt-2">
                    <input 
                      type="checkbox" 
                      name="recurring" 
                      id="recurring" 
                      className="form-checkbox h-5 w-5 text-sky-400 rounded bg-gray-700 border-gray-600" 
                      checked={newExpense.recurring}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="recurring" className="ml-2 text-gray-300">This is a recurring expense</label>
                  </div>
                </div>
                
                {newExpense.recurring && (
                  <div>
                    <label className="form-label">Recurring Interval</label>
                    <select 
                      name="recurring_interval" 
                      className="form-input" 
                      value={newExpense.recurring_interval} 
                      onChange={handleInputChange}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annual">Semi-Annual</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-input" 
                    value={newExpense.description} 
                    onChange={handleInputChange}
                    placeholder="Additional details about this expense..."
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
                  disabled={loading || !newExpense.title || !newExpense.amount}
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit Expense Form */}
        {showEditForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Edit Expense</h2>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Expense Title*</label>
                  <input 
                    type="text" 
                    name="title" 
                    className="form-input" 
                    value={newExpense.title} 
                    onChange={handleInputChange}
                    placeholder="e.g. Electricity Bill"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Amount ($)*</label>
                  <input 
                    type="number" 
                    name="amount" 
                    className="form-input" 
                    value={newExpense.amount} 
                    onChange={handleInputChange}
                    placeholder="e.g. 150 for $150"
                    step="0.01"
                    min="0"
                    required
                  />
                  <small className="text-gray-400 mt-1 block">
                    Enter the exact dollar amount (e.g. 150 for $150)
                  </small>
                </div>
                
                <div>
                  <label className="form-label">Category*</label>
                  <select 
                    name="category" 
                    className="form-input" 
                    value={newExpense.category} 
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
                  <label className="form-label">Date*</label>
                  <input 
                    type="date" 
                    name="date" 
                    className="form-input" 
                    value={newExpense.date} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="form-label">Recurring Expense</label>
                  <div className="flex items-center mt-2">
                    <input 
                      type="checkbox" 
                      name="recurring" 
                      id="edit-recurring" 
                      className="form-checkbox h-5 w-5 text-sky-400 rounded bg-gray-700 border-gray-600" 
                      checked={newExpense.recurring}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="edit-recurring" className="ml-2 text-gray-300">This is a recurring expense</label>
                  </div>
                </div>
                
                {newExpense.recurring && (
                  <div>
                    <label className="form-label">Recurring Interval</label>
                    <select 
                      name="recurring_interval" 
                      className="form-input" 
                      value={newExpense.recurring_interval} 
                      onChange={handleInputChange}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annual">Semi-Annual</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-input" 
                    value={newExpense.description} 
                    onChange={handleInputChange}
                    placeholder="Additional details about this expense..."
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
                    setEditingExpenseId(null);
                    setNewExpense({
                      title: '',
                      amount: '',
                      category: 'utilities',
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      recurring: false,
                      recurring_interval: 'monthly',
                      property_id: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={loading || !newExpense.title || !newExpense.amount}
                >
                  {loading ? 'Updating...' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Expenses List */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Loading expenses...</p>
          </div>
        ) : sortedExpenses.length === 0 ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No expenses found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? `No results for "${searchTerm}"` : filter !== 'all' ? `No ${filter} expenses found` : 'You have not added any expenses for this period'}
            </p>
            <button 
              className="btn-secondary px-4 py-2 rounded-md"
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Expense
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 bg-opacity-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Title</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Category</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Amount</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Recurring</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-700 hover:bg-opacity-30">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-gray-700 mr-3">
                            {getCategoryIcon(expense.category)}
                          </div>
                          <div>
                            <div className="font-medium">{expense.title}</div>
                            {expense.description && (
                              <div className="text-xs text-gray-400 truncate max-w-xs">{expense.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-700">
                          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(expense.date)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {expense.recurring ? (
                          <span className="text-green-500 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {expense.recurring_interval.charAt(0).toUpperCase() + expense.recurring_interval.slice(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          className="text-gray-400 hover:text-gray-300 p-1 rounded mr-1" 
                          title="Edit"
                          onClick={() => handleEdit(expense)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-400 p-1 rounded" 
                          title="Delete"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
};

export default Expenses;