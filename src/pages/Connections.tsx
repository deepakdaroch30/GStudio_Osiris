import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Link2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function Connections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    toolType: 'JIRA',
    baseUrl: '',
    authType: 'BASIC',
    username: '',
    secret: ''
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await axios.get('/api/v1/connections');
      setConnections(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch connections:', e);
      setConnections([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    try {
      await axios.post('/api/v1/connections/validate', formData);
      await axios.post('/api/v1/connections', formData);
      setIsAdding(false);
      setFormData({ name: '', toolType: 'JIRA', baseUrl: '', authType: 'BASIC', username: '', secret: '' });
      fetchConnections();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Validation failed. Please check your credentials.';
      alert(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      await axios.delete(`/api/v1/connections/${id}`);
      fetchConnections();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Connections</h1>
          <p className="text-slate-500 mt-1">Manage your external delivery and test management tools.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </header>

      {isAdding && (
        <div className="mb-12 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">New Connection</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Connection Name</label>
              <input 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Production Jira"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Tool Type</label>
      <select 
        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
        value={formData.toolType}
        onChange={e => {
          const type = e.target.value;
          setFormData({
            ...formData, 
            toolType: type,
            authType: type === 'ZEPHYR_ESSENTIAL' ? 'BEARER' : 'BASIC'
          });
        }}
      >
        <option value="JIRA">Jira</option>
        <option value="ZEPHYR_ESSENTIAL">Zephyr Essential</option>
      </select>
    </div>
    <div className="space-y-2 md:col-span-2">
      <label className="text-sm font-semibold text-slate-700">Base URL</label>
      <input 
        required
        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
        placeholder="https://your-domain.atlassian.net"
        value={formData.baseUrl}
        onChange={e => setFormData({...formData, baseUrl: e.target.value})}
      />
      <p className="text-xs text-slate-500 italic">Enter base URL only. Do not include resource paths like /projects.</p>
    </div>
    {formData.toolType !== 'ZEPHYR_ESSENTIAL' && (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Username / Email</label>
        <input 
          required
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="admin@company.com"
          value={formData.username}
          onChange={e => setFormData({...formData, username: e.target.value})}
        />
      </div>
    )}
    <div className={formData.toolType === 'ZEPHYR_ESSENTIAL' ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <label className="text-sm font-semibold text-slate-700">
        {formData.toolType === 'ZEPHYR_ESSENTIAL' ? 'Bearer Token' : 'API Token / Secret'}
      </label>
      <input 
        required
        type="password"
        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
        placeholder="••••••••••••••••"
        value={formData.secret}
        onChange={e => setFormData({...formData, secret: e.target.value})}
      />
      <p className="text-xs text-slate-500 italic">
        {formData.toolType === 'ZEPHYR_ESSENTIAL' 
          ? 'Enter your Zephyr Bearer Token.' 
          : 'For Jira Cloud, use an API Token, not your password.'}
      </p>
    </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isValidating}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isValidating ? 'Validating...' : 'Validate & Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Connection</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Base URL</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {connections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No connections found. Add your first connection to get started.
                </td>
              </tr>
            ) : (
              connections.map((conn) => (
                <tr key={conn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-900">{conn.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                      {conn.toolType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono truncate max-w-xs">
                    {conn.baseUrl}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Active
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(conn.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
