import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Layers, 
  ChevronRight,
  Calendar,
  Database,
  RefreshCw,
  Search,
  LayoutGrid,
  Settings2,
  Globe,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
      setFormData({ name: '', jiraConnectionId: '', targetConnectionId: '', projectKey: '', testCaseFormat: 'STANDARD', automationFramework: 'PLAYWRIGHT' });
      fetchData();
      setNotification({ type: 'success', message: 'Workspace created successfully!' });
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to create workspace' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdding) {
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white transition-colors duration-300">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdding(false)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-white/10" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Create New Workspace</h1>
              <p className="text-xs text-zinc-500 dark:text-white/40">Configure your AI testing environment</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={isLoading}
              className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-sm hover:bg-zinc-800 dark:hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Create Workspace
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-8 space-y-8">
          {/* Workspace Details */}
          <section className="bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-500 dark:text-white/60">Workspace Details</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-white/80 uppercase tracking-wider">Workspace Name</label>
                <input 
                  required
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all"
                  placeholder="e.g. Q1 2025 Core Platform Testing"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <p className="text-[10px] text-zinc-400 dark:text-white/40">A unique name to identify this testing context.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-white/80 uppercase tracking-wider">Jira Project Key</label>
                <input 
                  required
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all"
                  placeholder="e.g. PROJ"
                  value={formData.projectKey}
                  onChange={e => setFormData({...formData, projectKey: e.target.value.toUpperCase()})}
                />
                <p className="text-[10px] text-zinc-400 dark:text-white/40">The project key from your Jira instance.</p>
              </div>
            </div>
          </section>

          {/* Integrations */}
          <section className="bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-500 dark:text-white/60">Integrations</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-white/80 uppercase tracking-wider">Source Jira Connection</label>
                <select 
                  required
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all appearance-none"
                  value={formData.jiraConnectionId}
                  onChange={e => setFormData({...formData, jiraConnectionId: e.target.value})}
                >
                  <option value="" className="bg-white dark:bg-[#18181B]">Select Connection</option>
                  {connections.filter(c => c.toolType === 'JIRA').map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#18181B]">{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 dark:text-white/40">Where requirements will be imported from.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-white/80 uppercase tracking-wider">Target Test Connection</label>
                <select 
                  required
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all appearance-none"
                  value={formData.targetConnectionId}
                  onChange={e => setFormData({...formData, targetConnectionId: e.target.value})}
                >
                  <option value="" className="bg-white dark:bg-[#18181B]">Select Connection</option>
                  {connections.filter(c => c.toolType === 'ZEPHYR_ESSENTIAL').map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#18181B]">{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 dark:text-white/40">Where generated test cases will be pushed.</p>
              </div>
            </div>
          </section>

          {/* Testing Configuration */}
          <section className="bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Settings2 className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-500 dark:text-white/60">Testing Configuration</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-white/80 uppercase tracking-wider">Default Test Format</label>
                <select 
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all appearance-none"
                  value={formData.testCaseFormat}
                  onChange={e => setFormData({...formData, testCaseFormat: e.target.value})}
                >
                  <option value="STANDARD" className="bg-white dark:bg-[#18181B]">Standard (Step-by-Step)</option>
                  <option value="GHERKIN" className="bg-white dark:bg-[#18181B]">Gherkin (Given/When/Then)</option>
                  <option value="DETAILED" className="bg-white dark:bg-[#18181B]">Detailed Technical</option>
                </select>
                <p className="text-[10px] text-zinc-400 dark:text-white/40">The primary format for AI-generated test cases.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-white/80 uppercase tracking-wider">Automation Framework</label>
                <select 
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all appearance-none"
                  value={formData.automationFramework}
                  onChange={e => setFormData({...formData, automationFramework: e.target.value})}
                >
                  <option value="PLAYWRIGHT" className="bg-white dark:bg-[#18181B]">Playwright (TS)</option>
                  <option value="CYPRESS" className="bg-white dark:bg-[#18181B]">Cypress (JS)</option>
                  <option value="SELENIUM" className="bg-white dark:bg-[#18181B]">Selenium (Java)</option>
                </select>
                <p className="text-[10px] text-zinc-400 dark:text-white/40">Target framework for automation script generation.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 relative">
      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed top-8 right-8 z-[100] p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-300 flex items-start gap-3 max-w-md",
          notification.type === 'success' 
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-400"
            : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-900 dark:text-rose-400"
        )}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-bold">{notification.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-xs opacity-80 mt-1">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-40 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">
            <Layers className="w-3 h-3" />
            Workspace Management
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Workspaces</h1>
          <p className="text-zinc-500 dark:text-white/40 text-sm font-medium">Orchestrate your test design lifecycle within dedicated contexts.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-zinc-900/5 dark:shadow-white/5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </header>

      {workspaces.length === 0 ? (
        <div className="py-32 text-center bg-white dark:bg-white/[0.02] rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center p-12 group hover:border-zinc-300 dark:hover:border-white/20 transition-colors shadow-sm">
          <div className="w-24 h-24 bg-zinc-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <Zap className="w-10 h-10 text-zinc-300 dark:text-white/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">No workspaces yet</h3>
          <p className="text-zinc-500 dark:text-white/40 max-w-sm mx-auto text-sm leading-relaxed mb-10">
            Create your first workspace to start generating AI-powered test cases from Jira requirements.
          </p>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-white/90 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 dark:shadow-none"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workspaces.map((ws) => (
            <Link 
              key={ws.id} 
              to={`/workspaces/${ws.id}`}
              className="bg-white dark:bg-white/[0.03] p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-2xl flex items-center justify-center font-black text-sm border border-zinc-200 dark:border-white/10 group-hover:scale-110 transition-transform">
                    {ws.projectKey?.substring(0, 2) || 'WS'}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-white/20 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 group-hover:text-zinc-900 dark:group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">{ws.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest mb-8">
                  <span className="text-indigo-600 dark:text-indigo-400">{ws.projectKey}</span>
                  <span>•</span>
                  <span>{ws.jiraConnection?.name}</span>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/20 uppercase tracking-widest">Context</span>
                    <span className="text-xs font-bold text-zinc-600 dark:text-white/60">{ws.planningContextName || 'Not detected'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/20 uppercase tracking-widest">Last Sync</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-white/60">
                      <Clock className="w-3 h-3 text-zinc-300 dark:text-white/20" />
                      {ws.lastSyncedAt ? new Date(ws.lastSyncedAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
