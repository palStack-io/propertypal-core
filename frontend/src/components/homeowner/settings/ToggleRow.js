import React from 'react';

export default function ToggleRow({ label, description, name, checked, onChange, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-themed' : ''}`}>
      <div>
        <h3 className="font-medium">{label}</h3>
        {description && <p className="text-sm t-secondary">{description}</p>}
      </div>
      <label className="flex items-center cursor-pointer ml-4">
        <div className="relative">
          <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            className="sr-only"
          />
          <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-sky-400' : 'bg-gray-600'}`} />
          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`} />
        </div>
      </label>
    </div>
  );
}
