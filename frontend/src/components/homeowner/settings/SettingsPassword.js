import React from 'react';

export default function SettingsPassword({ formData, onChange, onSubmit, loading }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Update Password</h2>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          {[
            { label: 'Current Password',     name: 'current_password' },
            { label: 'New Password',         name: 'new_password',     minLength: 8 },
            { label: 'Confirm New Password', name: 'confirm_password', minLength: 8 },
          ].map(({ label, name, minLength }) => (
            <div key={name}>
              <label className="form-label">{label}</label>
              <input
                type="password"
                name={name}
                className="form-input"
                value={formData[name]}
                onChange={onChange}
                minLength={minLength}
                required
              />
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm t-secondary">
          <p>Password must be at least 8 characters and include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="btn-secondary px-4 py-2 rounded-md" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
