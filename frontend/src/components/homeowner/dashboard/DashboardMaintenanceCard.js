import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardMaintenanceCard({ maintenanceItems, loadingDashboardData }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="t-secondary text-sm">Upcoming Maintenance</p>
          <h3 className="text-xl font-bold mt-1">{maintenanceItems.length} items due</h3>
        </div>
        <div className="p-3 rounded-full bg-orange-900 bg-opacity-30">
          <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 text-sm">
        {loadingDashboardData ? (
          <div className="text-center py-2">
            <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : maintenanceItems.length > 0 ? (
          <div>
            {maintenanceItems.slice(0, 2).map((item, index) => (
              <div key={item.id || index} className="flex justify-between items-center mb-2">
                <span className="t-primary">{item.title}</span>
                <span className="text-orange-500">
                  {item.due_date
                    ? new Date(item.due_date) > new Date()
                      ? `${Math.ceil((new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days`
                      : 'Overdue'
                    : 'No date'}
                </span>
              </div>
            ))}
            <Link to="/maintenance" className="block mt-3 t-brand hover:opacity-80">
              Schedule now
            </Link>
          </div>
        ) : (
          <div>
            <p className="t-secondary">No maintenance items due</p>
            <Link to="/maintenance" className="block mt-3 t-brand hover:opacity-80">
              Add maintenance tasks
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
