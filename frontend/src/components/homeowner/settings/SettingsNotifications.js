import React from 'react';
import ToggleRow from './ToggleRow';

const NOTIFICATION_ROWS = [
  { name: 'email_notifications',  label: 'Email Notifications',   description: 'Receive notifications via email' },
  { name: 'maintenance_reminders', label: 'Maintenance Reminders', description: 'Get reminders about upcoming maintenance tasks' },
  { name: 'payment_reminders',    label: 'Payment Reminders',     description: 'Get reminders about upcoming payments' },
  { name: 'project_updates',      label: 'Project Updates',       description: 'Get notifications about project status changes' },
  { name: 'document_updates',     label: 'Document Updates',      description: 'Get notifications when documents are added or updated', last: true },
];

export default function SettingsNotifications({ settings, onChange, onSubmit, loading }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
      <form onSubmit={onSubmit}>
        <div>
          {NOTIFICATION_ROWS.map(row => (
            <ToggleRow
              key={row.name}
              name={row.name}
              label={row.label}
              description={row.description}
              checked={settings[row.name]}
              onChange={onChange}
              last={row.last}
            />
          ))}
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
