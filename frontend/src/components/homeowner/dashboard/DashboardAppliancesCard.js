import React from 'react';
import { Link } from 'react-router-dom';

function getWarrantyStatus(expirationDate) {
  if (!expirationDate) return { text: 'No warranty', className: 't-secondary' };

  const expDate = new Date(expirationDate);
  if (isNaN(expDate.getTime())) return { text: 'Invalid date', className: 'text-red-500' };

  const monthsDiff = (expDate - new Date()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsDiff < 0) return { text: `Expired ${Math.abs(Math.round(monthsDiff))}mo ago`, className: 'text-red-500' };
  if (monthsDiff < 3) return { text: `Expires in ${Math.round(monthsDiff)}mo`, className: 'text-orange-500' };
  return { text: `${Math.round(monthsDiff)}mo remaining`, className: 'text-green-500' };
}

export default function DashboardAppliancesCard({ appliances, loadingDashboardData }) {
  const Spinner = () => (
    <div className="text-center py-4">
      <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Appliance &amp; Warranty</h2>
        <Link to="/appliances" className="btn-secondary text-sm px-3 py-1 rounded-md">
          <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </Link>
      </div>

      {loadingDashboardData ? <Spinner /> : appliances?.length > 0 ? (
        <div className="divide-y divide-gray-700">
          {appliances.slice(0, 2).map((appliance, index) => {
            const warranty = getWarrantyStatus(appliance.warranty_expiration);
            return (
              <div key={appliance.id || index} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-900 bg-opacity-30 mr-3">
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{appliance.name || 'Unnamed Appliance'}</h4>
                    <p className="text-xs t-secondary">
                      {appliance.brand} {appliance.model ? `Model #${appliance.model}` : ''}
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
              <Link to="/appliances" className="t-brand hover:opacity-80 text-sm">
                View all {appliances.length} appliances
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="t-secondary mb-4">No appliances added yet</p>
          <Link to="/appliances" className="t-brand hover:opacity-80">Add your first appliance</Link>
        </div>
      )}
    </div>
  );
}
