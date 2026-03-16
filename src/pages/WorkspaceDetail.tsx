import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Layers,
  FileText,
  Beaker,
  Send,
  Code,
  History,
  Upload,
  Zap,
  Settings,
  ArrowUpRight,
  Database,
  Terminal,
  Cpu,
  MoreHorizontal,
  User,
  X,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [syncDebug, setSyncDebug] = useState<any>(null);

  const [technicalContext, setTechnicalContext] = useState('');
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    aiProvider: 'GEMINI',
    groqApiKey: '',
    groqModel: 'llama-3.3-70b-versatile'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const fetchWorkspace = async () => {
    setIsLoading(true);
    try {
      const [ws, reqs] = await Promise.all([
        axios.get(`/api/v1/workspaces/${id}`),
        axios.get(`/api/v1/workspaces/${id}/requirements`)
      ]);
      setWorkspace(ws.data);
      setRequirements(Array.isArray(reqs.data) ? reqs.data : []);
      setAiSettings({
        aiProvider: ws.data?.aiProvider || 'GEMINI',
        groqApiKey: ws.data?.groqApiKey || '',
        groqModel: ws.data?.groqModel || 'llama-3.3-70b-versatile'
      });
      if (Array.isArray(reqs.data) && reqs.data.length > 0) {
        setTechnicalContext(reqs.data[0].technicalContext || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAiSettings = async () => {
    setIsSavingSettings(true);
    try {
      await axios.patch(`/api/v1/workspaces/${id}`, aiSettings);
      setShowAiSettings(false);
      fetchWorkspace();
      setNotification({ type: 'success', message: 'AI settings saved successfully' });
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Failed to save AI settings' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveContext = async () => {
    if (requirements.length === 0) return;
    try {
      await axios.patch(`/api/v1/requirements/${requirements[0].id}/technical-context`, {
        technicalContext
      });
      setNotification({ type: 'success', message: 'Technical context saved!' });
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Failed to save context' });
    }
  };

  const handleDetectContext = async () => {
    setIsDetecting(true);
    try {
      await axios.post(`/api/v1/workspaces/${id}/context`);
      fetchWorkspace();
      setNotification({ type: 'success', message: 'Context detected successfully' });
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e.response?.data?.error || 'Failed to detect context' });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSync = async (forceFull = false) => {
    setIsSyncing(true);
    try {
      const res = await axios.post(`/api/v1/workspaces/${id}/sync-requirements`, { forceFull });
      setSyncDebug(res.data);
      setNotification({ type: 'success', message: `Sync successful! Fetched ${res.data.count} requirements.` });
      fetchWorkspace();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.error || 'Sync failed';
      const details = e.response?.data?.jiraResponse ? JSON.stringify(e.response.data.jiraResponse) : '';
      setSyncDebug({ error: msg, details, jiraResponse: e.response?.data });
      setNotification({ type: 'error', message: `${msg}: ${details}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDebugProject = async () => {
    try {
      const res = await axios.get(`/api/v1/workspaces/${id}/project-info`);
      setSyncDebug({ debugType: 'PROJECT_INFO', ...res.data });
      setNotification({ type: 'success', message: 'Project info fetched' });
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Debug failed: ' + (e.response?.data?.error || e.message) });
    }
  };

  const handleManualImport = async () => {
    if (!manualJson) return;
    setIsImporting(true);
    try {
      const res = await axios.post(`/api/v1/workspaces/${id}/manual-import`, { jsonData: manualJson });
      setNotification({ type: 'success', message: `Import successful! Added ${res.data.count} requirements.` });
      setManualJson('');
      setShowManualImport(false);
      fetchWorkspace();
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e.response?.data?.error || 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm tracking-widest uppercase">Initializing Workspace...</p>
      </div>
    </div>
  );
  
  if (!workspace) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-700 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Workspace not found</h2>
        <button onClick={() => navigate('/workspaces')} className="text-emerald-500 font-bold text-sm hover:underline">Return to Workspaces</button>
      </div>
    </div>
  );

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

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
        <button onClick={() => navigate('/workspaces')} className="hover:text-emerald-600 transition-colors">Workspaces</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-zinc-900 dark:text-white">{workspace.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-10 pointer-events-none">
          <Layers className="w-80 h-80 -rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-zinc-200 dark:shadow-none border border-white/10">
              {workspace.projectKey?.substring(0, 2) || 'WS'}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">{workspace.name}</h1>
                <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-[0.2em]">
                  {workspace.projectKey}
                </span>
              </div>
              <div className="flex items-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  {workspace.jiraConnection?.name}
                </div>
                <div className="w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  {workspace.targetConnection?.name}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={handleDetectContext}
              disabled={isDetecting}
              className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3 group shadow-inner"
            >
              <Search className={cn("w-4 h-4 transition-transform group-hover:scale-110", isDetecting && "animate-spin")} />
              Detect Context
            </button>
            
            <div className="relative group/sync">
              <button 
                onClick={() => handleSync(false)}
                disabled={isSyncing}
                className="px-8 py-4 bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-zinc-200 dark:shadow-none transition-all flex items-center gap-3 active:scale-95"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                Sync Requirements
              </button>
              
              <div className="absolute top-full right-0 mt-4 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-3 opacity-0 invisible group-hover/sync:opacity-100 group-hover/sync:visible transition-all z-20 translate-y-2 group-hover/sync:translate-y-0">
                <button 
                  onClick={() => handleSync(true)}
                  className="w-full text-left px-4 py-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors uppercase tracking-widest"
                >
                  Force Full Sync
                </button>
                <button 
                  onClick={handleDebugProject}
                  className="w-full text-left px-4 py-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors uppercase tracking-widest"
                >
                  Debug Config
                </button>
                <button 
                  onClick={() => setShowManualImport(true)}
                  className="w-full text-left px-4 py-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors uppercase tracking-widest"
                >
                  Manual Import
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 pt-10 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="space-y-3">
            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Planning Context</div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-zinc-900 dark:text-white font-black text-lg tracking-tight leading-tight">{workspace.planningContextName || 'Not detected'}</div>
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mt-0.5">{workspace.planningContextType || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Last Synced</div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-zinc-900 dark:text-white font-black text-lg tracking-tight leading-tight">
                  {workspace.lastSyncedAt ? new Date(workspace.lastSyncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </div>
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">{requirements.length} requirements</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Workspace Status</div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-inner">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <div>
                <div className="text-zinc-900 dark:text-white font-black uppercase text-sm tracking-[0.2em]">Active</div>
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Created {new Date(workspace.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Log */}
      {syncDebug && (
        <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="px-8 py-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {syncDebug.debugType === 'PROJECT_INFO' ? 'Project Config Debug' : 'Jira Sync Debug Log'}
              </span>
            </div>
            <button onClick={() => setSyncDebug(null)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-8 font-mono text-xs leading-relaxed text-zinc-400 max-h-80 overflow-y-auto scrollbar-hide">
            {syncDebug.debugType === 'PROJECT_INFO' ? (
              <div className="space-y-4">
                <div className="flex gap-6">
                  <span className="text-zinc-600 w-32 shrink-0 font-bold uppercase text-[10px] tracking-widest">Project Name:</span>
                  <span className="text-white font-bold">{syncDebug.project?.name}</span>
                </div>
                <div className="flex gap-6">
                  <span className="text-zinc-600 w-32 shrink-0 font-bold uppercase text-[10px] tracking-widest">Issue Types:</span>
                  <span className="text-emerald-400 font-bold">{syncDebug.availableIssueTypes?.join(', ')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-6">
                  <span className="text-zinc-600 w-32 shrink-0 font-bold uppercase text-[10px] tracking-widest">Last JQL:</span>
                  <span className="text-emerald-400 break-all font-bold">{syncDebug.lastJql}</span>
                </div>
                <div className="flex gap-6">
                  <span className="text-zinc-600 w-32 shrink-0 font-bold uppercase text-[10px] tracking-widest">Issues Found:</span>
                  <span className="text-white font-black text-lg">{syncDebug.debug?.issuesFound}</span>
                </div>
                {syncDebug.debug?.issuesFound === 0 && (
                  <div className="mt-6 p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
                    <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-widest mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Zero Issues Found
                    </div>
                    <p className="font-medium text-sm">Check if the Project Key is correct or if the JQL filter is too restrictive.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Technical Context */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Code className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Technical Context</h3>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Provide Swagger/API documentation to improve AI accuracy.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(technicalContext);
                  setNotification({ type: 'success', message: 'Copied to clipboard!' });
                }}
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-inner"
              >
                Copy
              </button>
              <button 
                onClick={handleSaveContext}
                className="px-6 py-3 bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-zinc-200 dark:shadow-none transition-all active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <textarea 
              className="w-full h-80 p-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-xs font-mono text-zinc-600 dark:text-zinc-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none scrollbar-hide shadow-inner"
              placeholder="Paste Swagger JSON or API documentation here..."
              value={technicalContext}
              onChange={e => setTechnicalContext(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-10">
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase tracking-widest text-xs">Configuration</h3>
              <Settings className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Test Format', value: workspace.testCaseFormat, icon: FileText, color: 'text-blue-500' },
                { label: 'Automation', value: workspace.automationFramework, icon: Beaker, color: 'text-purple-500' },
                { label: 'AI Provider', value: workspace.aiProvider || 'GEMINI', icon: Zap, color: 'text-amber-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-inner">
                  <div className="flex items-center gap-4">
                    <item.icon className={cn("w-5 h-5", item.color)} />
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">{item.value}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAiSettings(true)}
              className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-[10px] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-inner uppercase tracking-widest"
            >
              <Settings className="w-4 h-4" />
              Advanced Settings
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-zinc-900 dark:bg-emerald-500/10 border border-zinc-800 dark:border-emerald-500/20 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
            <h3 className="text-white dark:text-emerald-400 font-black tracking-tight uppercase tracking-widest text-xs">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/requirements?workspaceId=${workspace.id}`)}
                className="w-full flex items-center justify-between p-5 bg-white/5 dark:bg-emerald-500/5 hover:bg-white/10 dark:hover:bg-emerald-500/10 rounded-2xl transition-all group border border-white/5"
              >
                <span className="text-sm font-black text-white dark:text-emerald-400 uppercase tracking-widest">View Requirements</span>
                <ArrowUpRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate(`/test-design?workspaceId=${workspace.id}`)}
                className="w-full flex items-center justify-between p-5 bg-white/5 dark:bg-emerald-500/5 hover:bg-white/10 dark:hover:bg-emerald-500/10 rounded-2xl transition-all group border border-white/5"
              >
                <span className="text-sm font-black text-white dark:text-emerald-400 uppercase tracking-widest">Design Test Cases</span>
                <ArrowUpRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Requirements', count: requirements.length, icon: FileText, path: '/requirements', color: 'text-blue-500' },
          { label: 'Test Cases', count: 24, icon: Beaker, path: '/test-design', color: 'text-purple-500' },
          { label: 'Push History', count: 5, icon: Send, path: '/push-executions', color: 'text-emerald-500' },
          { label: 'Audit Logs', count: 12, icon: History, path: '/activity-log', color: 'text-amber-500' },
        ].map((item) => (
          <button 
            key={item.label}
            onClick={() => navigate(item.path + `?workspaceId=${workspace.id}`)}
            className="group bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-10 rounded-[2rem] hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left relative overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
            </div>
            
            <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:scale-110 transition-all duration-300 mb-8 shadow-inner">
              <item.icon className={cn("w-7 h-7", item.color)} />
            </div>
            
            <div className="space-y-2">
              <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{item.count}</div>
              <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">{item.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 space-y-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Recent Activity</h3>
          </div>
          <button 
            onClick={() => navigate(`/activity-log?workspaceId=${workspace.id}`)}
            className="text-[10px] font-black text-zinc-400 hover:text-emerald-600 transition-colors uppercase tracking-[0.2em]"
          >
            View All Activity
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { action: 'Requirement Sync', user: 'System', time: '2 hours ago', status: 'Success', details: 'Fetched 12 new requirements from Jira', icon: RefreshCw, color: 'text-emerald-500' },
            { action: 'Context Update', user: 'Admin', time: '5 hours ago', status: 'Updated', details: 'Technical context updated for API v2', icon: Code, color: 'text-blue-500' },
            { action: 'Test Generation', user: 'AI Engine', time: 'Yesterday', status: 'Completed', details: 'Generated 24 test cases for AUTH-102', icon: Zap, color: 'text-purple-500' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-6 p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50 rounded-3xl hover:bg-white dark:hover:bg-zinc-800/20 transition-all group shadow-inner hover:shadow-lg hover:shadow-zinc-200/50">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-600 group-hover:scale-110 transition-all shrink-0 shadow-sm">
                <activity.icon className={cn("w-6 h-6", activity.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-black text-zinc-900 dark:text-white truncate uppercase tracking-widest">{activity.action}</h4>
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{activity.time}</span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1 mb-4">{activity.details}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-zinc-500" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{activity.user}</span>
                  </div>
                  <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    activity.status === 'Success' || activity.status === 'Completed' 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" 
                      : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                  )}>
                    {activity.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Import Modal */}
      {showManualImport && (
        <div className="fixed inset-0 bg-zinc-900/80 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-300">
            <div className="p-12 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Manual Import</h3>
                <p className="text-zinc-500 dark:text-zinc-500 text-sm font-medium">Import requirements via raw JSON payload.</p>
              </div>
              <button onClick={() => setShowManualImport(false)} className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all shadow-inner">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-12 space-y-8">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                Paste the JSON response from your Jira API or Postman call. The system will automatically parse and map the issues to this workspace.
              </p>
              <textarea 
                className="w-full h-80 p-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] font-mono text-xs text-zinc-600 dark:text-zinc-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none scrollbar-hide shadow-inner"
                placeholder='{ "issues": [ ... ] }'
                value={manualJson}
                onChange={e => setManualJson(e.target.value)}
              />
            </div>
            <div className="p-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-6">
              <button 
                onClick={() => setShowManualImport(false)}
                className="px-8 py-4 text-zinc-400 dark:text-zinc-500 font-black text-xs uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualImport}
                disabled={isImporting || !manualJson}
                className="bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-200 dark:shadow-none disabled:opacity-50 flex items-center gap-3 transition-all active:scale-95"
              >
                {isImporting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Import Requirements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      {showAiSettings && (
        <div className="fixed inset-0 bg-zinc-900/80 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-300">
            <div className="p-12 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">AI Settings</h3>
                <p className="text-zinc-500 dark:text-zinc-500 text-sm font-medium">Configure the intelligence engine.</p>
              </div>
              <button onClick={() => setShowAiSettings(false)} className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all shadow-inner">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-12 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] px-1">AI Provider</label>
                <select 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-2xl text-zinc-900 dark:text-white font-black uppercase tracking-widest text-xs outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                  value={aiSettings.aiProvider}
                  onChange={e => setAiSettings({...aiSettings, aiProvider: e.target.value})}
                >
                  <option value="GEMINI" className="bg-white dark:bg-zinc-900">Google Gemini (Default)</option>
                  <option value="GROQ" className="bg-white dark:bg-zinc-900">Groq (High Performance)</option>
                </select>
              </div>

              {aiSettings.aiProvider === 'GROQ' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] px-1">Groq API Key</label>
                    <input 
                      type="password"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-2xl text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                      placeholder="gsk_..."
                      value={aiSettings.groqApiKey}
                      onChange={e => setAiSettings({...aiSettings, groqApiKey: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] px-1">Groq Model</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-2xl text-zinc-900 dark:text-white font-black uppercase tracking-widest text-xs outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                      value={aiSettings.groqModel}
                      onChange={e => setAiSettings({...aiSettings, groqModel: e.target.value})}
                    >
                      <option value="llama-3.3-70b-versatile" className="bg-white dark:bg-zinc-900">Llama 3.3 70B Versatile</option>
                      <option value="llama-3.1-8b-instant" className="bg-white dark:bg-zinc-900">Llama 3.1 8B Instant</option>
                      <option value="mixtral-8x7b-32768" className="bg-white dark:bg-zinc-900">Mixtral 8x7B</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="p-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-6">
              <button 
                onClick={() => setShowAiSettings(false)}
                className="px-8 py-4 text-zinc-400 dark:text-zinc-500 font-black text-xs uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAiSettings}
                disabled={isSavingSettings}
                className="bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-200 dark:shadow-none disabled:opacity-50 flex items-center gap-3 transition-all active:scale-95"
              >
                {isSavingSettings && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
