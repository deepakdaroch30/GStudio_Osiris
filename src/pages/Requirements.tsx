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
  ChevronDown
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
      alert(`Sync successful! Fetched ${res.data.count} requirements.`);
      fetchRequirements();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Requirements</h1>
          <p className="text-slate-500 mt-1">Review and select user stories for AI test case generation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={!selectedWorkspaceId || isSyncing}
            className="px-4 py-2 text-slate-600 font-medium bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            Sync
          </button>
          <select 
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedWorkspaceId}
            onChange={e => setSelectedWorkspaceId(e.target.value)}
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <button 
            onClick={handleGenerate}
            disabled={selectedIds.length === 0 || isGenerating}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            <Beaker className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            {isGenerating ? 'Generating...' : `Generate Tests (${selectedIds.length})`}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="Search requirements..."
                className="pl-9 pr-4 py-1.5 rounded-md border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing {requirements.length} requirements
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedIds.length === requirements.length && requirements.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Key</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Synced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading requirements...</td></tr>
            ) : requirements.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No requirements found for this workspace. Sync from Jira to begin.</td></tr>
            ) : (
              requirements.map((req) => (
                <tr key={req.id} className={cn("hover:bg-slate-50 transition-colors", selectedIds.includes(req.id) && "bg-indigo-50/30")}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedIds.includes(req.id)}
                      onChange={() => toggleSelect(req.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{req.key}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{req.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-md">{req.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs font-bold",
                      req.priority === 'High' ? 'text-rose-600' : 'text-slate-600'
                    )}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(req.syncedAt).toLocaleDateString()}
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
