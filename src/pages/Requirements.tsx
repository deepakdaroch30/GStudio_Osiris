import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Beaker,
  ChevronDown,
  Layers,
  Zap,
  ArrowRight,
  MoreHorizontal,
  ExternalLink,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Requirements() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workspaceId = searchParams.get('workspaceId');
  
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || '');
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchRequirements();
    }
  }, [selectedWorkspaceId]);

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get('/api/v1/workspaces');
      const data = Array.isArray(res.data) ? res.data : [];
      setWorkspaces(data);
      if (!selectedWorkspaceId && data.length > 0) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch workspaces:', e);
      setWorkspaces([]);
    }
  };

  const fetchRequirements = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/v1/workspaces/${selectedWorkspaceId}/requirements`);
      setRequirements(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch requirements:', e);
      setRequirements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => 
      prev.length === requirements.length ? [] : requirements.map(r => r.id)
    );
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    setIsGenerating(true);
    try {
      await axios.post('/api/v1/generation-batches', {
        workspaceId: selectedWorkspaceId,
        requirementIds: selectedIds
      });
      navigate(`/test-design?workspaceId=${selectedWorkspaceId}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSync = async () => {
    if (!selectedWorkspaceId) return;
    setIsSyncing(true);
    try {
      const res = await axios.post(`/api/v1/workspaces/${selectedWorkspaceId}/sync-requirements`);
      setNotification({ type: 'success', message: `Sync successful! Fetched ${res.data.count} requirements.` });
      fetchRequirements();
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e.response?.data?.error || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">
            <Layers className="w-3 h-3" />
            {workspaces.find(w => w.id === selectedWorkspaceId)?.name || 'Select Workspace'}
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Requirements</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Import and select user stories for AI-powered test generation.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-inner">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => setSelectedWorkspaceId(ws.id)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  selectedWorkspaceId === ws.id 
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                {ws.name}
              </button>
            ))}
          </div>
          <button 
            onClick={handleSync}
            disabled={!selectedWorkspaceId || isSyncing}
            className="px-4 py-2 text-zinc-700 dark:text-zinc-300 font-bold text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            Sync Jira
          </button>
          <button 
            onClick={handleGenerate}
            disabled={selectedIds.length === 0 || isGenerating}
            className="bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
          >
            <Zap className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            {isGenerating ? 'Processing...' : `Generate Tests (${selectedIds.length})`}
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input 
                placeholder="Search by key or title..."
                className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-2 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-80 shadow-inner"
              />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-tighter">
            {requirements.length} Requirements Found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 w-12">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-emerald-600 focus:ring-emerald-500/50 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                      checked={selectedIds.length === requirements.length && requirements.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Issue Key</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Requirement Details</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-zinc-300 dark:text-zinc-700 animate-spin" />
                      <p className="text-zinc-500 font-bold text-sm">Fetching requirements from Jira...</p>
                    </div>
                  </td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-zinc-900 dark:text-white font-bold text-lg">No requirements found</p>
                        <p className="text-zinc-500 text-sm mt-1">Sync with Jira to import your project requirements.</p>
                      </div>
                      <button 
                        onClick={handleSync}
                        className="mt-2 bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Sync Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                requirements.map((req) => (
                  <tr 
                    key={req.id} 
                    className={cn(
                      "group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all cursor-pointer",
                      selectedIds.includes(req.id) && "bg-emerald-50 dark:bg-emerald-500/[0.03]"
                    )}
                    onClick={() => toggleSelect(req.id)}
                  >
                    <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                          checked={selectedIds.includes(req.id)}
                          onChange={() => toggleSelect(req.id)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">{req.key}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{req.title}</div>
                        <div className="text-xs text-zinc-500 line-clamp-1 max-w-xl">{req.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                        req.priority === 'High' ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border border-rose-100 dark:border-rose-400/20' : 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                      )}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                        {new Date(req.syncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
