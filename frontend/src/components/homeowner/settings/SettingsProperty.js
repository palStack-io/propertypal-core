import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsProperty({ properties, primaryResidenceId, loadingProperties, onPrimaryChange }) {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Property Settings</h2>
      <div>
        <label className="form-label">Primary Residence</label>
        <p className="text-sm t-secondary mb-2">
          Select which property is your primary residence. This affects seasonal maintenance recommendations.
        </p>

        {loadingProperties ? (
          <div className="flex items-center mt-2 t-secondary">
            <svg className="animate-spin h-5 w-5 t-brand mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading properties...
          </div>
        ) : properties.length === 0 ? (
          <div className="card p-4 text-center">
            <p className="t-primary mb-3">No property found. Please complete your property setup.</p>
            <button type="button" className="btn-secondary text-sm px-4 py-2 rounded-md" onClick={() => navigate('/setup-property')}>
              Set Up Property
            </button>
          </div>
        ) : (
          <>
            <select className="form-input" value={primaryResidenceId} onChange={onPrimaryChange}>
              <option value="">Select Primary Residence</option>
              {properties.map(p => (
                <option key={p.id} value={p.id.toString()}>
                  {p.address}, {p.city}, {p.state} {p.zip}
                </option>
              ))}
            </select>
            {primaryResidenceId && (
              <div className="mt-2 flex items-center text-sm t-brand">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Primary residence is set!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
