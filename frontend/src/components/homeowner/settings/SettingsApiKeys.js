import React, { useState } from 'react';
import { apiHelpers } from '../../../services/api';

export default function SettingsApiKeys({ setMessage, setError }) {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scopes: ['read:maintenance', 'write:maintenance'],
    expires_days: '',
  });

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await apiHelpers.get('integrations/api-keys');
      setApiKeys(res.api_keys || []);
      setLoaded(true);
    } catch { setError('Failed to load API keys'); }
    finally { setLoading(false); }
  };

  if (!loaded) { fetchKeys(); }

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiHelpers.post('integrations/api-keys', formData);
      setNewApiKey(res.api_key);
      setFormData({ name: '', scopes: ['read:maintenance', 'write:maintenance'], expires_days: '' });
      await fetchKeys();
      setMessage('API key created!');
    } catch (err) { setError(err.response?.data?.error || 'Failed to create API key'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    try { await apiHelpers.delete(`integrations/api-keys/${id}`); setMessage('API key deleted'); await fetchKeys(); }
    catch { setError('Failed to delete API key'); }
  };

  const handleToggle = async (id) => {
    try { await apiHelpers.put(`integrations/api-keys/${id}/toggle`); setMessage('API key updated'); await fetchKeys(); }
    catch { setError('Failed to update API key'); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); setMessage('Copied!'); setTimeout(() => setMessage(''), 3000); };

  const toggleScope = (scope, checked) => {
    const scopes = checked ? [...formData.scopes, scope] : formData.scopes.filter(s => s !== scope);
    setFormData(f => ({ ...f, scopes }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="t-secondary text-sm mt-1">Manage API keys for integrations like Home Assistant</p>
        </div>
        <button onClick={() => { setShowForm(f => !f); setNewApiKey(null); }} className="btn-primary px-4 py-2 rounded-md text-sm">
          + Create New Key
        </button>
      </div>

      {/* Reveal panel after creation */}
      {newApiKey && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Save Your API Key</h3>
          <p className="text-sm t-primary mb-3">This is the only time you'll see this key. Copy it now!</p>
          <div className="card p-3 font-mono text-sm break-all flex justify-between items-center">
            <span className="t-primary">{newApiKey}</span>
            <button onClick={() => copy(newApiKey)} className="ml-2 t-brand hover:opacity-80">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <button onClick={() => setNewApiKey(null)} className="mt-3 text-sm t-secondary hover:opacity-75">
            I've saved my key, close this
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && !newApiKey && (
        <div className="card p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Key Name</label>
              <input type="text" className="form-input" placeholder="e.g., Home Assistant" value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Permissions</label>
              <div className="space-y-2 mt-1">
                {[
                  { scope: 'read:maintenance',  label: 'Read Maintenance Tasks' },
                  { scope: 'write:maintenance', label: 'Create/Update Maintenance Tasks' },
                ].map(({ scope, label }) => (
                  <label key={scope} className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.scopes.includes(scope)}
                      onChange={e => toggleScope(scope, e.target.checked)} className="mr-2" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Expiration (Optional)</label>
              <input type="number" className="form-input" placeholder="Days until expiration (empty = no expiry)"
                value={formData.expires_days} onChange={e => setFormData(f => ({ ...f, expires_days: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary px-4 py-2 rounded-md">Create API Key</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2 rounded-md">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="text-center py-8 t-secondary">Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 t-secondary">
          <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p>No API keys yet</p>
          <p className="text-sm mt-1">Create your first key to integrate with Home Assistant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map(key => (
            <div key={key.id} className="card p-4 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium t-primary">{key.name}</h4>
                  <span className={`badge ${key.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {key.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm t-secondary mt-1">
                  <span className="font-mono">{key.key_prefix}...</span>
                  {key.last_used_at && <span className="ml-3">Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>}
                  {key.expires_at && <span className="ml-3">Expires: {new Date(key.expires_at).toLocaleDateString()}</span>}
                </div>
                <div className="text-xs t-muted mt-1">Scopes: {key.scopes.join(', ')}</div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleToggle(key.id)} className="btn-secondary text-sm px-3 py-1 rounded-md">
                  {key.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(key.id)} className="alert-error text-sm px-3 py-1 rounded-md">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 alert-info rounded-lg p-4">
        <h3 className="font-semibold mb-2">Integration Guide</h3>
        <p className="text-sm mb-3">Learn how to integrate propertyPal with Home Assistant using API keys</p>
        <a href="https://github.com/palStack-io/propertypal-core/blob/main/HOME_ASSISTANT_INTEGRATION.md"
          target="_blank" rel="noopener noreferrer" className="t-brand hover:opacity-80 text-sm">
          View Documentation →
        </a>
      </div>
    </div>
  );
}
