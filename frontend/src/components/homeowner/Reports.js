import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { apiHelpers } from '../../services/api';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Report parameters
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportCategory, setReportCategory] = useState('all');
  
  // Report data
  const [categoryTotals, setCategoryTotals] = useState({});
  const [savingsRate, setSavingsRate] = useState(0);
  const [expenseGrowthRate, setExpenseGrowthRate] = useState(0);
  
  // Chart colors for different categories
  const COLORS = {
    utilities: '#3182CE', // blue
    mortgage: '#38A169', // green
    insurance: '#9F7AEA', // purple
    maintenance: '#ECC94B', // yellow
    renovation: '#ED8936', // orange
    taxes: '#E53E3E', // red
    other: '#718096', // gray
  };

  // Fetch expenses from the API
  const fetchExpenses = useCallback(async (propertyId) => {
    try {
      setLoading(true);

      // Get start and end date based on report type
      let start, end;
      const now = new Date();

      if (reportType === 'monthly') {
        // Last 12 months
        start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (reportType === 'yearly') {
        // Last 3 years
        start = new Date(now.getFullYear() - 3, 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
      } else {
        // Custom date range
        start = new Date(startDate);
        end = new Date(endDate);
      }

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      // Use apiHelpers for the API call with query parameters
      const params = {
        property_id: propertyId,
        start_date: startDateStr,
        end_date: endDateStr
      };

      try {
        const response = await apiHelpers.get('finances/expenses/', params);

        // If the backend isn't implemented yet, use sample data
        const fetchedExpenses = response || getSampleExpenses();
        setExpenses(fetchedExpenses);

        // Process report data
        processReportData(fetchedExpenses, getBudgetsForDateRange(startDateStr, endDateStr));
      } catch (err) {
        console.error('API Error fetching expenses:', err);
        // For development - if endpoint not implemented, use sample data
        const sampleData = getSampleExpenses();
        setExpenses(sampleData);

        // Process report data
        processReportData(sampleData, getBudgetsForDateRange(startDate, endDate));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchExpenses:', err);
      // For development - if endpoint not implemented, use sample data
      const sampleData = getSampleExpenses();
      setExpenses(sampleData);

      // Process report data
      processReportData(sampleData, getBudgetsForDateRange(startDate, endDate));

      setLoading(false);
    }
  }, [reportType, startDate, endDate]);

  // Fetch budgets from the API
  const fetchBudgets = useCallback(async (propertyId) => {
    try {
      // Use apiHelpers for the API call with query parameters
      const params = { property_id: propertyId };

      try {
        const response = await apiHelpers.get('finances/budgets/', params);

        // If the backend isn't implemented yet, use sample data
        const fetchedBudgets = response || getSampleBudgets();
        setBudgets(fetchedBudgets);
      } catch (err) {
        console.error('API Error fetching budgets:', err);
        // For development - if endpoint not implemented, use sample data
        setBudgets(getSampleBudgets());
      }
    } catch (err) {
      console.error('Error in fetchBudgets:', err);
      // For development - if endpoint not implemented, use sample data
      setBudgets(getSampleBudgets());
    }
  }, []);

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
          
          // Fetch expenses and budgets for the selected property
          if (propertyToUse) {
            fetchExpenses(propertyToUse.id);
            fetchBudgets(propertyToUse.id);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property information. Please try again later.');
        setLoading(false);
      }
    };

    fetchProperties();
  }, [navigate, fetchExpenses, fetchBudgets]);

  // Handle property selection from dropdown
  const handleSelectProperty = (property) => {
    setCurrentProperty(property);
    
    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);
    
    // Fetch expenses for the selected property
    fetchExpenses(property.id);
    fetchBudgets(property.id);
  };

  // Process report data
  const processReportData = (expensesData, budgetsData) => {
    // Calculate monthly totals
    const monthlyData = calculateMonthlyTotals(expensesData);

    // Calculate category totals
    const categoryData = calculateCategoryTotals(expensesData);
    setCategoryTotals(categoryData);
    
    // Calculate savings rate
    const totalBudget = budgetsData.reduce((sum, budget) => sum + budget.amount, 0);
    const totalExpense = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
    
    if (totalBudget > 0) {
      const savings = totalBudget - totalExpense;
      const savingsRateValue = (savings / totalBudget) * 100;
      setSavingsRate(savingsRateValue);
    } else {
      setSavingsRate(0);
    }
    
    // Calculate expense growth rate
    if (monthlyData.length > 1) {
      const firstMonth = monthlyData[0].total;
      const lastMonth = monthlyData[monthlyData.length - 1].total;
      
      if (firstMonth > 0) {
        const growth = ((lastMonth - firstMonth) / firstMonth) * 100;
        setExpenseGrowthRate(growth);
      } else {
        setExpenseGrowthRate(0);
      }
    } else {
      setExpenseGrowthRate(0);
    }
  };

  // Calculate monthly totals
  const calculateMonthlyTotals = (expensesData) => {
    const monthlyMap = {};
    
    expensesData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          label: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total: 0
        };
      }
      
      monthlyMap[monthKey].total += expense.amount;
    });
    
    // Convert to array and sort by month
    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  };

  // Calculate category totals
  const calculateCategoryTotals = (expensesData) => {
    const categoryMap = {};
    
    expensesData.forEach(expense => {
      if (!categoryMap[expense.category]) {
        categoryMap[expense.category] = 0;
      }
      
      categoryMap[expense.category] += expense.amount;
    });
    
    return categoryMap;
  };

  // Get budgets for date range
  const getBudgetsForDateRange = (startDateStr, endDateStr) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    return budgets.filter(budget => {
      const budgetDate = new Date(budget.year, budget.month - 1, 1);
      return budgetDate >= start && budgetDate <= end;
    });
  };

  // Generate report
  const generateReport = () => {
    setLoading(true);
    
    // Fetch expenses with the selected parameters
    if (currentProperty) {
      fetchExpenses(currentProperty.id);
    } else {
      setLoading(false);
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

  // Get icon for report type
  const getReportIcon = (type) => {
    switch (type) {
      case 'monthly':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'yearly':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'custom':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
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

  // Export to CSV
  const exportToCSV = () => {
    if (expenses.length === 0) return;

    // Create CSV rows
    const headers = ['Date', 'Title', 'Category', 'Amount'];
    const rows = expenses
      .filter(expense => reportCategory === 'all' || expense.category === reportCategory)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.title,
        expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
        expense.amount.toFixed(2)
      ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create a downloadable link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set attributes
    const reportDate = format(new Date(), 'yyyy-MM-dd');
    const propertyName = currentProperty ? currentProperty.address.replace(/\s+/g, '_') : 'property';
    const fileName = `${propertyName}_expenses_${reportDate}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage('CSV file downloaded successfully!');
  };

  // Export to PDF
  const exportToPDF = () => {
    if (expenses.length === 0) return;

    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title and header info
    const reportDate = format(new Date(), 'MMMM d, yyyy');
    const propertyName = currentProperty ? currentProperty.address : 'Property';
    
    doc.setFontSize(20);
    doc.text('Expense Report', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Property: ${propertyName}`, 14, 25);
    doc.text(`Date: ${reportDate}`, 14, 32);
    doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 14, 39);
    
    // Add financial summary
    doc.setFontSize(14);
    doc.text('Financial Summary', 14, 50);
    
    doc.setFontSize(10);
    doc.text(`Total Expenses: ${formatCurrency(calculateTotalExpenses())}`, 20, 60);
    doc.text(`Top Category: ${getTopExpenseCategory().category.charAt(0).toUpperCase() + getTopExpenseCategory().category.slice(1)} (${formatCurrency(getTopExpenseCategory().amount)})`, 20, 67);
    doc.text(`Savings Rate: ${savingsRate.toFixed(1)}%`, 20, 74);
    doc.text(`Expense Growth: ${expenseGrowthRate > 0 ? '+' : ''}${expenseGrowthRate.toFixed(1)}%`, 20, 81);
    
    // Add expense details table
    doc.setFontSize(14);
    doc.text('Expense Details', 14, 95);
    
    const filteredExpenses = expenses
      .filter(expense => reportCategory === 'all' || expense.category === reportCategory)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableData = filteredExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.title,
      expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
      formatCurrency(expense.amount)
    ]);
    
    // Add table
    doc.autoTable({
      startY: 100,
      head: [['Date', 'Title', 'Category', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [44, 82, 130] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Save the PDF
    const fileName = `${propertyName.replace(/\s+/g, '_')}_expenses_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    
    setMessage('PDF file downloaded successfully!');
  };

  // Sample expenses data for development
  const getSampleExpenses = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Generate expenses for the last 12 months
    const sampleExpenses = [];
    
    for (let i = 0; i < 12; i++) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      // Utilities (monthly)
      sampleExpenses.push({
        id: sampleExpenses.length + 1,
        title: 'Electricity Bill',
        amount: 125 + Math.random() * 50, // Vary between $125-$175
        category: 'utilities',
        date: new Date(year, month, 15).toISOString().split('T')[0],
        description: 'Monthly electricity bill',
        property_id: 1
      });
      
      // Water bill (monthly)
      sampleExpenses.push({
        id: sampleExpenses.length + 1,
        title: 'Water Bill',
        amount: 50 + Math.random() * 20, // Vary between $50-$70
        category: 'utilities',
        date: new Date(year, month, 10).toISOString().split('T')[0],
        description: 'Monthly water bill',
        property_id: 1
      });
      
      // Mortgage (monthly)
      sampleExpenses.push({
        id: sampleExpenses.length + 1,
        title: 'Mortgage Payment',
        amount: 1250, // Fixed
        category: 'mortgage',
        date: new Date(year, month, 1).toISOString().split('T')[0],
        description: 'Monthly mortgage payment',
        property_id: 1
      });
      
      // Maintenance (occasional)
      if (Math.random() > 0.7) {
        sampleExpenses.push({
          id: sampleExpenses.length + 1,
          title: 'Home Maintenance',
          amount: 50 + Math.random() * 200, // Vary between $50-$250
          category: 'maintenance',
          date: new Date(year, month, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          description: 'Various home maintenance tasks',
          property_id: 1
        });
      }
    }
    
    // Insurance (quarterly)
    for (let i = 0; i < 4; i++) {
      const month = ((currentMonth - i * 3) % 12 + 12) % 12;
      const year = (currentMonth - i * 3) < 0 ? currentYear - Math.ceil(Math.abs(currentMonth - i * 3) / 12) : currentYear;
      
      sampleExpenses.push({
        id: sampleExpenses.length + 1,
        title: 'Home Insurance',
        amount: 350,
        category: 'insurance',
        date: new Date(year, month, 20).toISOString().split('T')[0],
        description: 'Quarterly home insurance premium',
        property_id: 1
      });
    }
    
    // Property tax (semi-annual)
    for (let i = 0; i < 2; i++) {
      const month = ((currentMonth - i * 6) % 12 + 12) % 12;
      const year = (currentMonth - i * 6) < 0 ? currentYear - 1 : currentYear;
      
      sampleExpenses.push({
        id: sampleExpenses.length + 1,
        title: 'Property Tax',
        amount: 950,
        category: 'taxes',
        date: new Date(year, month, 15).toISOString().split('T')[0],
        description: 'Semi-annual property tax payment',
        property_id: 1
      });
    }
    
    // Renovation (once per year)
    sampleExpenses.push({
      id: sampleExpenses.length + 1,
      title: 'Home Improvement Project',
      amount: 2500,
      category: 'renovation',
      date: new Date(currentYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      description: 'Annual home improvement project',
      property_id: 1
    });
    
    return sampleExpenses;
  };

  // Sample budgets data for development
  const getSampleBudgets = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Generate budgets for the current year
    const sampleBudgets = [];
    
    // Monthly budgets for the entire year
    for (let month = 1; month <= 12; month++) {
      sampleBudgets.push({
        id: sampleBudgets.length + 1,
        category: 'utilities',
        amount: 250,
        month,
        year: currentYear,
        property_id: 1
      });
      
      sampleBudgets.push({
        id: sampleBudgets.length + 1,
        category: 'mortgage',
        amount: 1250,
        month,
        year: currentYear,
        property_id: 1
      });
      
      sampleBudgets.push({
        id: sampleBudgets.length + 1,
        category: 'maintenance',
        amount: 150,
        month,
        year: currentYear,
        property_id: 1
      });
    }
    
    // Quarterly budgets for insurance
    for (let quarter = 0; quarter < 4; quarter++) {
      const month = quarter * 3 + 1;
      
      sampleBudgets.push({
        id: sampleBudgets.length + 1,
        category: 'insurance',
        amount: 350,
        month,
        year: currentYear,
        property_id: 1
      });
    }
    
    // Semi-annual budgets for taxes
    for (let half = 0; half < 2; half++) {
      const month = half * 6 + 1;
      
      sampleBudgets.push({
        id: sampleBudgets.length + 1,
        category: 'taxes',
        amount: 950,
        month,
        year: currentYear,
        property_id: 1
      });
    }
    
    // Annual budget for renovation
    sampleBudgets.push({
      id: sampleBudgets.length + 1,
      category: 'renovation',
      amount: 3000,
      month: 1,
      year: currentYear,
      property_id: 1
    });
    
    return sampleBudgets;
  };

  // Calculate total expenses
  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Get top expense category
  const getTopExpenseCategory = () => {
    if (Object.keys(categoryTotals).length === 0) {
      return { category: 'none', amount: 0 };
    }
    
    const topCategory = Object.keys(categoryTotals)
      .reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
    
    return {
      category: topCategory,
      amount: categoryTotals[topCategory]
    };
  };

  // Convert category totals to chart data
  const categoryChartData = () => {
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount,
        category
      }));
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 0.8;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <p className="text-gray-400 mt-1">Analyze your home expenses and budget</p>
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
        
        {/* Report Options */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Report Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Report Type</label>
              <select 
                className="form-input" 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            
            {reportType === 'custom' && (
              <>
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="form-label">Category</label>
              <select 
                className="form-input" 
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="utilities">Utilities</option>
                <option value="mortgage">Mortgage</option>
                <option value="insurance">Insurance</option>
                <option value="maintenance">Maintenance</option>
                <option value="renovation">Renovation</option>
                <option value="taxes">Taxes</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="md:col-span-4 flex justify-end">
              <button 
                className="btn-secondary px-4 py-2 rounded-md flex items-center"
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Report Summary */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Generating report...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No expense data found</h3>
            <p className="text-gray-400 mb-6">
              There are no expenses for the selected parameters
            </p>
          </div>
        ) : (
          <>
            {/* Report Header */}
            <div className="card p-6 mb-8">
              <div className="flex items-center mb-4">
                {getReportIcon(reportType)}
                <h2 className="text-lg font-semibold ml-2">
                  {reportType === 'monthly' 
                    ? 'Monthly Expense Report' 
                    : reportType === 'yearly' 
                      ? 'Yearly Expense Report' 
                      : 'Custom Expense Report'}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-1">Total Expenses</h3>
                  <div className="text-xl font-bold">{formatCurrency(calculateTotalExpenses())}</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-1">Top Category</h3>
                  <div className="flex items-center">
                    {getCategoryIcon(getTopExpenseCategory().category)}
                    <div className="text-xl font-bold ml-2">
                      {getTopExpenseCategory().category.charAt(0).toUpperCase() + 
                       getTopExpenseCategory().category.slice(1)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {formatCurrency(getTopExpenseCategory().amount)}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-1">Savings Rate</h3>
                  <div className={`text-xl font-bold ${savingsRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {savingsRate.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-1">Expense Growth</h3>
                  <div className={`text-xl font-bold ${expenseGrowthRate <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {expenseGrowthRate > 0 ? '+' : ''}{expenseGrowthRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly Breakdown Chart */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Expense Breakdown by Category</h2>
              
              {Object.keys(categoryTotals).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category distribution chart - UPDATED WITH ACTUAL CHART */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400 mb-4">Category Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#718096'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(name) => name}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Category breakdown table */}
                  <div>
                    <h3 className="text-sm text-gray-400 mb-4">Category Details</h3>
                    <div className="overflow-hidden rounded-lg bg-gray-800">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(categoryTotals)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, amount]) => {
                              const percentage = (amount / calculateTotalExpenses()) * 100;
                              
                              return (
                                <tr key={category} className="border-b border-gray-700">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {getCategoryIcon(category)}
                                      <span className="ml-2">
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    {formatCurrency(amount)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    {percentage.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No category data available
                </div>
              )}
            </div>
            
            {/* Expense Details */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Expense Details</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-700 bg-opacity-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {expenses
                      .filter(expense => reportCategory === 'all' || expense.category === reportCategory)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-700 hover:bg-opacity-30">
                          <td className="py-3 px-4 text-sm whitespace-nowrap">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
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
                          <td className="py-3 px-4 text-sm whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-700">
                              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Export buttons - UPDATED FOR FUNCTIONALITY */}
              <div className="flex justify-end mt-6">
                <button 
                  className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2 flex items-center"
                  onClick={exportToCSV}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Export CSV
                </button>
                <button 
                  className="text-gray-400 hover:text-gray-300 px-4 py-2 flex items-center"
                  onClick={exportToPDF}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Navigation>
  );
};

export default Reports;