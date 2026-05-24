import React from 'react';

export default function SettingsAppearance({ settings, onChange, onSubmit, loading }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>
      <form onSubmit={onSubmit}>
        <div className="space-y-6">
          <div>
            <label className="form-label">Theme</label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { value: 'dark',  icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', label: 'Dark Theme' },
                { value: 'light', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', label: 'Light Theme' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className="flex flex-col items-center border rounded-md p-4 cursor-pointer transition"
                  style={{
                    borderColor: settings.theme === opt.value ? 'var(--brand-primary)' : 'var(--border)',
                    background: settings.theme === opt.value ? 'var(--bg-card)' : 'transparent',
                  }}
                >
                  <input type="radio" name="theme" value={opt.value} checked={settings.theme === opt.value} onChange={onChange} className="sr-only" />
                  <svg className="h-10 w-10 mb-2 t-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon} />
                  </svg>
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Dashboard Layout</label>
            <select name="dashboard_layout" className="form-input mt-2" value={settings.dashboard_layout} onChange={onChange}>
              <option value="default">Default Layout</option>
              <option value="compact">Compact Layout</option>
              <option value="expanded">Expanded Layout</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="btn-secondary px-4 py-2 rounded-md" disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
