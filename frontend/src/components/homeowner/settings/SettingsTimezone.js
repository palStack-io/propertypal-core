import React from 'react';

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago',     label: 'Central Time (US & Canada)' },
  { value: 'America/Denver',      label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage',   label: 'Alaska' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii' },
  { value: 'Europe/London',       label: 'London' },
  { value: 'Europe/Paris',        label: 'Paris' },
  { value: 'Europe/Berlin',       label: 'Berlin' },
  { value: 'Asia/Tokyo',          label: 'Tokyo' },
  { value: 'Asia/Shanghai',       label: 'Shanghai' },
  { value: 'Australia/Sydney',    label: 'Sydney' },
  { value: 'Pacific/Auckland',    label: 'Auckland' },
  { value: 'UTC',                 label: 'UTC' },
];

export default function SettingsTimezone({ timezone, onChange, onSubmit, loading }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Time Zone Settings</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label className="form-label">Time Zone</label>
          <p className="text-sm t-secondary mb-2">
            Select your time zone to ensure maintenance reminders and notifications are accurate.
          </p>
          <select className="form-input" value={timezone} onChange={onChange}>
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label} ({tz.value})</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="btn-secondary px-4 py-2 rounded-md" disabled={loading}>
            {loading ? 'Saving...' : 'Save Time Zone'}
          </button>
        </div>
      </form>
    </div>
  );
}
