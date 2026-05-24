import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardExpensesCard({ monthlyExpenseTotal, budgetStatus, formatCurrency }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="t-secondary text-sm">Home Expenses</p>
          <h3 className="text-xl font-bold mt-1">
            {formatCurrency(monthlyExpenseTotal)}
            <span className="text-sm font-normal t-secondary"> this month</span>
          </h3>
        </div>
        <div className="p-3 rounded-full bg-green-900 bg-opacity-30">
          <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="flex items-center mt-4 text-sm">
        {budgetStatus.underBudget ? (
          <span className="text-green-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {budgetStatus.percentage}% under budget
          </span>
        ) : (
          <span className="text-red-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {budgetStatus.percentage}% over budget
          </span>
        )}
        <Link to="/expenses" className="ml-auto t-brand hover:opacity-80">
          View details
        </Link>
      </div>
    </div>
  );
}
