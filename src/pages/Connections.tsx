import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Link2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Lock,
  User,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setError(null);
    setSuccess(null);
    
    try {
      // Step 1: Validate
      try {
        await axios.post('/api/v1/connections/validate', formData);
      } catch (valErr: any) {
        const msg = valErr.response?.data?.message || valErr.message || 'Validation failed. Please check your credentials and Base URL.';
        throw new Error(`Validation Error: ${msg}`);
      }

      // Step 2: Save
      try {
        await axios.post('/api/v1/connections', formData);
      } catch (saveErr: any) {
        const msg = saveErr.response?.data?.error || saveErr.message || 'Failed to save connection to database.';
        throw new Error(`Save Error: ${msg}`);
      }

      setSuccess('Connection saved successfully!');
      setTimeout(() => {
        setIsAdding(false);
        setFormData({ name: '', toolType: 'JIRA', baseUrl: '', authType: 'BASIC', username: '', secret: '' });
        setSuccess(null);
      }, 1500);
      fetchConnections();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsValidating(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/v1/connections/${id}`);
      setDeleteConfirm(null);
      fetchConnections();
    } catch (e: any) {
      setError('Failed to delete connection.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Connections</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Manage integrations with Jira, Zephyr, and other tools.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Connection
          </button>
        )}
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">New Connection</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure your external tool credentials.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAdding(false)}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="p-8 space-y-8 bg-white dark:bg-transparent">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-400">Connection Failed</p>
                  <p className="text-xs text-rose-600 dark:text-rose-500/80 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Success</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500/80 mt-1">{success}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Connection Name</label>
                    <input 
                      required
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                      placeholder="e.g. Production Jira"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">A friendly name to identify this connection.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tool Type</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none shadow-inner"
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
                      <option value="JIRA">Atlassian Jira</option>
                      <option value="ZEPHYR_ESSENTIAL">Zephyr Essential</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Authentication
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Base URL
                    </label>
                    <input 
                      required
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                      placeholder="https://your-domain.atlassian.net"
                      value={formData.baseUrl}
                      onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                    />
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">Enter base URL only (e.g. https://company.atlassian.net).</p>
                  </div>

                  {formData.toolType !== 'ZEPHYR_ESSENTIAL' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Username / Email
                      </label>
                      <input 
                        required
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                        placeholder="admin@company.com"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" />
                      {formData.toolType === 'ZEPHYR_ESSENTIAL' ? 'Bearer Token' : 'API Token / Secret'}
                    </label>
                    <input 
                      required
                      type="password"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                      placeholder="••••••••••••••••"
                      value={formData.secret}
                      onChange={e => setFormData({...formData, secret: e.target.value})}
                    />
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {formData.toolType === 'ZEPHYR_ESSENTIAL' 
                        ? 'Enter your Zephyr Bearer Token.' 
                        : 'For Jira Cloud, use an API Token, not your password.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 text-zinc-500 dark:text-zinc-400 font-bold text-sm hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isValidating}
                className="bg-emerald-500 text-black px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Validate & Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Connection</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Base URL</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {connections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <Link2 className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-zinc-900 dark:text-white font-bold text-lg">No connections found</p>
                        <p className="text-zinc-500 text-sm mt-1">Add your first connection to start importing requirements.</p>
                      </div>
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="mt-2 bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
                      >
                        Add Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                connections.map((conn) => (
                  <tr key={conn.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700 group-hover:border-emerald-500/30 transition-all">
                          <Link2 className="w-5 h-5 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white block">{conn.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">ID: {conn.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                        {conn.toolType}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                        <Globe className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                        <span className="truncate max-w-[200px]">{conn.baseUrl}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full w-fit border border-emerald-100 dark:border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(conn.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-500 mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-2">Delete Connection?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8">
              This will permanently remove the connection. Any workspaces using this connection may stop working.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
