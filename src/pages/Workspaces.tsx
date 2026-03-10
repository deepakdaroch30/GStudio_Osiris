import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Layers, 
  ChevronRight,
  Calendar,
  Database,
  RefreshCw,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jiraConnectionId: '',
    targetConnectionId: '',
    projectKey: '',
    testCaseFormat: 'STANDARD',
    automationFramework: 'PLAYWRIGHT'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ws, conns] = await Promise.all([
        axios.get('/api/v1/workspaces'),
        axios.get('/api/v1/connections')
      ]);
      setWorkspaces(Array.isArray(ws.data) ? ws.data : []);
      setConnections(Array.isArray(conns.data) ? conns.data : []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
      setWorkspaces([]);
      setConnections([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/api/v1/workspaces', formData);
      setIsAdding(false);
      setFormData({ name: '', jiraConnectionId: '', targetConnectionId: '', projectKey: '' });
      fetchData();
    } catch (e) {
      alert('Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workspaces</h1>
          <p className="text-slate-500 mt-1">Orchestrate your test design lifecycle within dedicated contexts.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </header>

      {isAdding && (
        <div className="mb-12 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">New Workspace</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Workspace Name</label>
              <input 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Q1 2024 Core Platform"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jira Project Key</label>
              <input 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. PROJ"
                value={formData.projectKey}
                onChange={e => setFormData({...formData, projectKey: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Source Jira Connection</label>
              <select 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.jiraConnectionId}
                onChange={e => setFormData({...formData, jiraConnectionId: e.target.value})}
              >
                <option value="">Select Connection</option>
                {connections.filter(c => c.toolType === 'JIRA').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Test Connection</label>
              <select 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.targetConnectionId}
                onChange={e => setFormData({...formData, targetConnectionId: e.target.value})}
              >
                <option value="">Select Connection</option>
                {connections.filter(c => c.toolType === 'ZEPHYR_ESSENTIAL').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Default Test Format</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.testCaseFormat}
                onChange={e => setFormData({...formData, testCaseFormat: e.target.value})}
              >
                <option value="STANDARD">Standard (Step-by-Step)</option>
                <option value="GHERKIN">Gherkin (Given/When/Then)</option>
                <option value="DETAILED">Detailed Technical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Automation Framework</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.automationFramework}
                onChange={e => setFormData({...formData, automationFramework: e.target.value})}
              >
                <option value="PLAYWRIGHT">Playwright (TS)</option>
                <option value="CYPRESS">Cypress (JS)</option>
                <option value="SELENIUM">Selenium (Java)</option>
              </select>
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
                disabled={isLoading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No workspaces yet</h3>
            <p className="text-slate-500">Create your first workspace to start syncing requirements.</p>
          </div>
        ) : (
          workspaces.map((ws) => (
            <Link 
              key={ws.id} 
              to={`/workspaces/${ws.id}`}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                  {ws.projectKey?.substring(0, 2) || 'WS'}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{ws.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="font-bold text-slate-700">{ws.projectKey}</span>
                <span>•</span>
                <span>{ws.jiraConnection?.name}</span>
              </div>
              
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Context</span>
                  <span className="font-medium text-slate-700">{ws.planningContextName || 'Not detected'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Last Synced</span>
                  <span className="font-medium text-slate-700">
                    {ws.lastSyncedAt ? new Date(ws.lastSyncedAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
