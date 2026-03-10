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
  Upload
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
    } catch (e) {
      console.error(e);
      alert('Failed to save AI settings');
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
      alert('Technical context saved!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDetectContext = async () => {
    setIsDetecting(true);
    try {
      await axios.post(`/api/v1/workspaces/${id}/context`);
      fetchWorkspace();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Failed to detect context');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSync = async (forceFull = false) => {
    setIsSyncing(true);
    try {
      const res = await axios.post(`/api/v1/workspaces/${id}/sync-requirements`, { forceFull });
      setSyncDebug(res.data);
      alert(`Sync successful! Fetched ${res.data.count} requirements.`);
      fetchWorkspace();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.error || 'Sync failed';
      const details = e.response?.data?.jiraResponse ? JSON.stringify(e.response.data.jiraResponse) : '';
      setSyncDebug({ error: msg, details, jiraResponse: e.response?.data });
      alert(`${msg}\n\n${details}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDebugProject = async () => {
    try {
      const res = await axios.get(`/api/v1/workspaces/${id}/project-info`);
      setSyncDebug({ debugType: 'PROJECT_INFO', ...res.data });
    } catch (e: any) {
      alert('Debug failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleManualImport = async () => {
    if (!manualJson) return;
    setIsImporting(true);
    try {
      const res = await axios.post(`/api/v1/workspaces/${id}/manual-import`, { jsonData: manualJson });
      alert(`Import successful! Added ${res.data.count} requirements.`);
      setManualJson('');
      setShowManualImport(false);
      fetchWorkspace();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!workspace) return <div className="p-8">Workspace not found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button onClick={() => navigate('/workspaces')} className="hover:text-indigo-600">Workspaces</button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{workspace.name}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {workspace.projectKey?.substring(0, 2) || 'WS'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="font-bold text-slate-700">{workspace.projectKey}</span>
                <span>•</span>
                <span>{workspace.jiraConnection?.name}</span>
                <span>→</span>
                <span>{workspace.targetConnection?.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDetectContext}
              disabled={isDetecting}
              title="Detect active sprint or project context"
              className="px-4 py-2 text-slate-600 font-medium bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Search className={cn("w-4 h-4", isDetecting && "animate-spin")} />
              Detect Context
            </button>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleSync(false)}
                disabled={isSyncing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                Sync Requirements
              </button>
              <button 
                onClick={() => handleSync(true)}
                disabled={isSyncing}
                className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium text-right"
              >
                Force Full Project Sync
              </button>
              <button 
                onClick={handleDebugProject}
                className="text-[10px] text-slate-400 hover:text-amber-600 font-medium text-right"
              >
                Debug Project Config
              </button>
              <button 
                onClick={() => setShowManualImport(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-600 font-medium text-right flex items-center justify-end gap-1"
              >
                <Upload className="w-3 h-3" />
                Manual Import (JSON)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 border-t border-slate-50 pt-8">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Planning Context</div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-slate-900">{workspace.planningContextName || 'Not detected'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Type: {workspace.planningContextType || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Synced</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-900">
                {workspace.lastSyncedAt ? new Date(workspace.lastSyncedAt).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{requirements.length} requirements persisted</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-bold text-slate-900 uppercase text-sm tracking-wide">Active</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Created on {new Date(workspace.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {syncDebug && (
        <div className="bg-slate-900 text-slate-300 p-6 rounded-xl mb-8 font-mono text-xs overflow-auto max-h-64 border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <span className="text-indigo-400 font-bold">
              {syncDebug.debugType === 'PROJECT_INFO' ? 'PROJECT CONFIG DEBUG' : 'JIRA SYNC DEBUG LOG'}
            </span>
            <button onClick={() => setSyncDebug(null)} className="text-slate-500 hover:text-white">Close</button>
          </div>
          <div className="space-y-2">
            {syncDebug.debugType === 'PROJECT_INFO' ? (
              <>
                <div className="flex gap-4">
                  <span className="text-slate-500 w-24">Project Name:</span>
                  <span className="text-white">{syncDebug.project?.name}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-500 w-24">Issue Types:</span>
                  <span className="text-emerald-400">{syncDebug.availableIssueTypes?.join(', ')}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-4">
                  <span className="text-slate-500 w-24">Last JQL:</span>
                  <span className="text-emerald-400 break-all">{syncDebug.lastJql}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-500 w-24">Issues Found:</span>
                  <span className="text-white font-bold">{syncDebug.debug?.issuesFound}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-500 w-24">Project Key:</span>
                  <span className="text-white">{syncDebug.debug?.projectKey}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-500 w-24">Project ID:</span>
                  <span className="text-white">{syncDebug.debug?.projectId}</span>
                </div>
                {syncDebug.debug?.issuesFound === 0 && (
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded">
                    WARNING: 0 issues found. This usually means the JQL filter is too restrictive or the Project Key is incorrect for the API.
                    Try "Force Full Project Sync" or check if the Project Key "THIN" is correct in Jira settings.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900">Technical Context (Swagger/API Docs)</h3>
            </div>
            <button 
              onClick={handleSaveContext}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Save Context
            </button>
          </div>
          <textarea 
            className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste Swagger JSON or API documentation here to improve AI generation accuracy..."
            value={technicalContext}
            onChange={e => setTechnicalContext(e.target.value)}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Workspace Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Test Format</span>
              <span className="font-bold text-slate-700">{workspace.testCaseFormat}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Automation</span>
              <span className="font-bold text-slate-700">{workspace.automationFramework}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">AI Provider</span>
              <span className="font-bold text-slate-700">{workspace.aiProvider || 'GEMINI'}</span>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => setShowAiSettings(true)}
                className="w-full py-2 text-indigo-600 font-bold text-xs border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Edit Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Requirements', count: requirements.length, icon: FileText, path: '/requirements' },
          { label: 'Test Cases', count: 24, icon: Beaker, path: '/test-design' },
          { label: 'Push History', count: 5, icon: Send, path: '/push-executions' },
          { label: 'Audit Logs', count: 12, icon: History, path: '/activity-log' },
        ].map((item) => (
          <button 
            key={item.label}
            onClick={() => navigate(item.path + `?workspaceId=${workspace.id}`)}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 transition-all text-left group"
          >
            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg w-fit mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
              <item.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{item.count}</div>
            <div className="text-sm font-medium text-slate-500">{item.label}</div>
          </button>
        ))}
      </div>

      {showManualImport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Manual Requirement Import</h3>
              <button onClick={() => setShowManualImport(false)} className="text-slate-400 hover:text-slate-600">
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                Paste the JSON response from your Postman call (the one that returns the list of issues) below. 
                The app will parse and import them into this workspace.
              </p>
              <textarea 
                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder='{ "issues": [ ... ] }'
                value={manualJson}
                onChange={e => setManualJson(e.target.value)}
              />
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowManualImport(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualImport}
                disabled={isImporting || !manualJson}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Import Requirements
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">AI Provider Settings</h3>
              <button onClick={() => setShowAiSettings(false)} className="text-slate-400 hover:text-slate-600">
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">AI Provider</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={aiSettings.aiProvider}
                  onChange={e => setAiSettings({...aiSettings, aiProvider: e.target.value})}
                >
                  <option value="GEMINI">Google Gemini (Default)</option>
                  <option value="GROQ">Groq (POC)</option>
                </select>
              </div>

              {aiSettings.aiProvider === 'GROQ' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Groq API Key</label>
                    <input 
                      type="password"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="gsk_..."
                      value={aiSettings.groqApiKey}
                      onChange={e => setAiSettings({...aiSettings, groqApiKey: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Groq Model</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={aiSettings.groqModel}
                      onChange={e => setAiSettings({...aiSettings, groqModel: e.target.value})}
                    >
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowAiSettings(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAiSettings}
                disabled={isSavingSettings}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingSettings && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
