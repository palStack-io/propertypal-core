import React from 'react';

export default function SettingsAccount({ formData, onChange, onSubmit, loading }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Account Information</h2>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'First Name', name: 'first_name', type: 'text', required: true },
            { label: 'Last Name',  name: 'last_name',  type: 'text', required: true },
            { label: 'Email Address', name: 'email',  type: 'email', required: true },
            { label: 'Phone Number',  name: 'phone',  type: 'tel',   required: false },
          ].map(({ label, name, type, required }) => (
            <div key={name}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                name={name}
                className="form-input"
                value={formData[name]}
                onChange={onChange}
                required={required}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="btn-secondary px-4 py-2 rounded-md" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
