import React from 'react';

export default function SettingsData() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Data &amp; Privacy</h2>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-2">Data Export</h3>
          <p className="t-secondary mb-4">Download a copy of your propertyPal data</p>
          <button className="btn-secondary text-sm px-4 py-2 rounded-md">
            <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            Export Data
          </button>
        </div>
        <div className="pt-4 border-t border-themed">
          <h3 className="text-lg font-medium mb-2">Delete Account</h3>
          <p className="t-secondary mb-4">Permanently delete your account and all associated data</p>
          <button className="alert-error text-sm px-4 py-2 rounded-md inline-flex items-center">
            <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
