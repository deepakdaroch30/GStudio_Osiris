import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { 
  Beaker, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  X,
  Send,
  FileText,
  Code,
  MessageSquare,
  Sparkles,
  Lightbulb,
  RefreshCw,
  Copy,
  Save,
  Tag
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function TestDesign() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || '');
  const [testCases, setTestCases] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState<string | null>(null);
  const [expandedReqs, setExpandedReqs] = useState<string[]>([]);
  const [viewingScript, setViewingScript] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [editingLabelsId, setEditingLabelsId] = useState<string | null>(null);
  const [labelsText, setLabelsText] = useState('');
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      fetchTestCases();
      fetchCoverage();
    }
  }, [selectedWorkspaceId]);

  const fetchWorkspaces = async () => {
    try {
      const wsRes = await axios.get('/api/v1/workspaces');
      const data = Array.isArray(wsRes.data) ? wsRes.data : [];
      setWorkspaces(data);
      if (!selectedWorkspaceId && data.length > 0) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch workspaces:', e);
      setWorkspaces([]);
    }
  };

  const fetchTestCases = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/v1/workspaces/${selectedWorkspaceId}/test-cases`);
      const data = Array.isArray(res.data) ? res.data : [];
      setTestCases(data);
      const reqIds = Array.from(new Set(data.map((tc: any) => tc.requirementId)));
      setExpandedReqs(reqIds as string[]);
    } catch (e) {
      console.error('Failed to fetch test cases:', e);
      setTestCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoverage = async () => {
    try {
      const res = await axios.get(`/api/v1/workspaces/${selectedWorkspaceId}/coverage-analysis`);
      setCoverage(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    await axios.post(`/api/v1/test-cases/${id}/approve`);
    fetchTestCases();
  };

  const handleGenerateScript = async (id: string) => {
    setIsGeneratingScript(id);
    try {
      await axios.post(`/api/v1/test-cases/${id}/generate-script`);
      fetchTestCases();
    } finally {
      setIsGeneratingScript(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReqs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/v1/test-cases/${id}`);
      setDeleteConfirmId(null);
      fetchTestCases();
      setNotification({ type: 'success', message: 'Test case deleted' });
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Failed to delete test case' });
    }
  };

  const handleSaveComment = async () => {
    if (!commentingId) return;
    setIsSavingComment(true);
    try {
      await axios.patch(`/api/v1/test-cases/${commentingId}`, {
        comments: commentText
      });
      setCommentingId(null);
      setCommentText('');
      fetchTestCases();
      setNotification({ type: 'success', message: 'Comment saved' });
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Failed to save comment' });
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleSaveLabels = async () => {
    if (!editingLabelsId) return;
    setIsSavingLabels(true);
    try {
      await axios.patch(`/api/v1/test-cases/${editingLabelsId}`, {
        labels: labelsText
      });
      setEditingLabelsId(null);
      setLabelsText('');
      fetchTestCases();
      setNotification({ type: 'success', message: 'Labels saved' });
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Failed to save labels' });
    } finally {
      setIsSavingLabels(false);
    }
  };

  const handlePush = async () => {
    const approvedIds = testCases.filter(tc => tc.status === 'APPROVED' || tc.status === 'DRAFT').map(tc => tc.id);
    if (approvedIds.length === 0) return;
    
    setIsPushing(true);
    try {
      await axios.post('/api/v1/push-executions', {
        workspaceId: selectedWorkspaceId,
        testCaseIds: approvedIds
      });
      setNotification({ type: 'success', message: 'Push completed successfully!' });
      fetchTestCases();
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Push failed' });
    } finally {
      setIsPushing(false);
    }
  };

  const groupedTestCases = testCases.reduce((acc: any, tc) => {
    if (!acc[tc.requirementId]) {
      acc[tc.requirementId] = {
        key: tc.sourceRequirementKey,
        title: tc.sourceRequirementTitle,
        cases: []
      };
    }
    acc[tc.requirementId].cases.push(tc);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 transition-colors duration-300 relative">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-500 mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-2">Delete Test Case?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8">
              This will permanently remove the test case. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            <Beaker className="w-3 h-3" />
            Quality Assurance
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Test Design</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Review and approve AI-generated test scenarios for your project.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <select 
            className="pl-4 pr-8 py-2 rounded-xl border-none bg-transparent font-bold text-zinc-700 dark:text-zinc-300 text-sm outline-none focus:ring-0 cursor-pointer"
            value={selectedWorkspaceId}
            onChange={e => setSelectedWorkspaceId(e.target.value)}
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id} className="bg-white dark:bg-zinc-900">{ws.name}</option>
            ))}
          </select>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
          <button 
            onClick={handlePush}
            disabled={testCases.length === 0 || isPushing}
            className="bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-zinc-200 dark:shadow-none active:scale-95"
          >
            <Send className={cn("w-4 h-4", isPushing && "animate-spin")} />
            {isPushing ? 'Pushing...' : 'Push to Zephyr'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4 bg-white dark:bg-zinc-900/40 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400" />
              <span className="font-bold text-sm uppercase tracking-widest">Synchronizing Data...</span>
            </div>
          ) : Object.keys(groupedTestCases).length === 0 ? (
            <div className="py-32 text-center bg-white dark:bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                <Beaker className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">No Test Scenarios Found</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto text-sm leading-relaxed">
                Generate test cases from the Requirements section to start reviewing them here.
              </p>
            </div>
          ) : (
            Object.entries(groupedTestCases).map(([reqId, group]: [string, any]) => (
              <div key={reqId} className="group/req">
                <div className="flex items-center gap-4 mb-4 px-2">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    <FileText className="w-3 h-3" />
                    Requirement: {group.key}
                  </div>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none">
                  <button 
                    onClick={() => toggleExpand(reqId)}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 group-hover/req:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{group.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            {group.cases.length} Scenarios Generated
                          </span>
                          <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            AI Verified
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        expandedReqs.includes(reqId) ? "bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black rotate-180" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                      )}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </button>

                  {expandedReqs.includes(reqId) && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30">
                      {group.cases.map((tc: any, idx: number) => (
                        <div key={tc.id} className={cn(
                          "p-8 transition-all duration-300",
                          idx !== group.cases.length - 1 && "border-b border-zinc-100 dark:border-zinc-800"
                        )}>
                          <div className="flex items-start gap-8">
                            <div className="flex-1 space-y-8">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border",
                                  tc.scenarioType === 'NEGATIVE' 
                                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' 
                                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                )}>
                                  {tc.scenarioType}
                                </span>
                                <span className="text-[10px] font-black bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full uppercase tracking-wider">
                                  {tc.priority} Priority
                                </span>
                                {tc.labels && tc.labels.split(',').map((label: string, i: number) => (
                                  <span key={i} className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {label}
                                  </span>
                                ))}
                                {tc.status === 'PUSHED' && (
                                  <span className="text-[10px] font-black bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-200 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-zinc-200 dark:shadow-none">
                                    <CheckCircle2 className="w-3 h-3" /> Pushed
                                  </span>
                                )}
                              </div>

                              <div>
                                <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">{tc.title}</h4>
                                {tc.comments && (
                                  <div className="mt-3 flex gap-2 text-sm text-zinc-500 dark:text-zinc-400 italic bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                                    <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <span>{tc.comments}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Preconditions</div>
                                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[80px]">
                                    {tc.preconditions || 'No specific setup required.'}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Final Objective</div>
                                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[80px]">
                                    {tc.expectedResult}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Execution Steps</div>
                                <div className="space-y-3">
                                  {JSON.parse(tc.stepsJson).map((step: any, i: number) => (
                                    <div key={i} className="group/step bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-md">
                                      <div className="flex gap-4 p-4 items-start">
                                        <div className="w-6 h-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-400 shrink-0 group-hover/step:bg-zinc-900 dark:group-hover/step:bg-emerald-500 group-hover/step:text-white dark:group-hover/step:text-black transition-colors">
                                          {i + 1}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                            {typeof step === 'string' ? step : step.action}
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-1 rounded-md">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Expected: {typeof step === 'string' ? tc.expectedResult : step.expectedResult}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {tc.automationScript && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Automation Script</div>
                                    <button 
                                      onClick={() => setViewingScript(tc.automationScript)}
                                      className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                                    >
                                      Expand Full View
                                    </button>
                                  </div>
                                  <div className="relative group/code">
                                    <pre className="bg-zinc-900 dark:bg-black text-zinc-300 dark:text-zinc-400 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-zinc-800 dark:border-zinc-800 shadow-inner">
                                      {tc.automationScript.split('\n').slice(0, 6).join('\n')}
                                      {tc.automationScript.split('\n').length > 6 && '\n// ... more code'}
                                    </pre>
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 dark:from-black/80 to-transparent rounded-2xl opacity-0 group-hover/code:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                      <button 
                                        onClick={() => setViewingScript(tc.automationScript)}
                                        className="bg-white/10 dark:bg-zinc-900/40 backdrop-blur-md text-white dark:text-zinc-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 dark:border-zinc-700 hover:bg-white/20 dark:hover:bg-zinc-800/60 transition-colors"
                                      >
                                        View Code
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-3 sticky top-24">
                              <button 
                                onClick={() => handleApprove(tc.id)}
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90",
                                  tc.status === 'APPROVED' 
                                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-emerald-200 dark:shadow-none' 
                                    : tc.status === 'PUSHED' 
                                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-500 opacity-50 cursor-not-allowed' 
                                      : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                )}
                                disabled={tc.status === 'PUSHED'}
                                title={tc.status === 'APPROVED' ? "Approved" : "Approve"}
                              >
                                <Check className="w-6 h-6" />
                              </button>
                              <button 
                                onClick={() => handleGenerateScript(tc.id)}
                                disabled={isGeneratingScript === tc.id}
                                className="w-12 h-12 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-lg active:scale-90 disabled:opacity-50"
                                title="Generate Automation Script"
                              >
                                <Code className={cn("w-6 h-6", isGeneratingScript === tc.id && "animate-spin")} />
                              </button>
                              <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800 mx-auto my-1" />
                              <button 
                                onClick={() => {
                                  setEditingLabelsId(tc.id);
                                  setLabelsText(tc.labels || '');
                                }}
                                className="w-12 h-12 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-lg active:scale-90"
                                title="Edit Labels"
                              >
                                <Tag className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setCommentingId(tc.id);
                                  setCommentText(tc.comments || '');
                                }}
                                className="w-12 h-12 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-lg active:scale-90"
                                title="Add Comment"
                              >
                                <MessageSquare className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(tc.id)}
                                className="w-12 h-12 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:border-rose-500 dark:hover:border-rose-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-lg active:scale-90"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 dark:bg-emerald-500 rounded-2xl flex items-center justify-center text-white dark:text-black shadow-lg shadow-zinc-200 dark:shadow-none">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-zinc-900 dark:text-white tracking-tight">Coverage Analysis</h3>
              </div>
              {coverage && (
                <div className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">
                  Live
                </div>
              )}
            </div>

            {coverage ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Requirement Coverage</span>
                      <div className="text-4xl font-black text-zinc-900 dark:text-white">{coverage.score}%</div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                      <ChevronUp className="w-3 h-3" />
                      Good
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <div className="bg-emerald-500 dark:bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)] dark:shadow-none" style={{ width: `${coverage.score}%` }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">AI Insights</div>
                  <div className="space-y-3">
                    {coverage.insights.map((insight: string, i: number) => (
                      <div key={i} className="flex gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900 group">
                        <div className="w-6 h-6 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-emerald-500 group-hover:border-zinc-900 dark:group-hover:bg-emerald-500 transition-colors">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:text-white dark:group-hover:text-black transition-colors" />
                        </div>
                        <span className="leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-200 dark:text-zinc-800" />
                <span className="text-[10px] font-black uppercase tracking-widest">Analyzing Requirements...</span>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl shadow-zinc-900/20 dark:shadow-none relative overflow-hidden group border border-transparent dark:border-zinc-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 dark:border-zinc-700">
                <Code className="w-6 h-6 text-white dark:text-zinc-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white dark:text-zinc-100 tracking-tight">Automation Engine</h3>
                <p className="text-sm text-zinc-400 dark:text-zinc-400 leading-relaxed">
                  Your workspace is optimized for <strong>Playwright (TS)</strong>. 
                  Generate scripts for approved scenarios to accelerate your delivery.
                </p>
              </div>
              <button className="w-full py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-50 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-xl shadow-white/5 dark:shadow-none">
                Configure Engine
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewingScript && (
        <div className="fixed inset-0 bg-zinc-900/80 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border border-white/20 dark:border-zinc-800">
            <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 dark:bg-emerald-500 rounded-2xl flex items-center justify-center text-white dark:text-black shadow-lg shadow-zinc-200 dark:shadow-none">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Automation Script</h3>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Playwright TypeScript Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingScript(null)}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-10 bg-zinc-950 dark:bg-black">
              <pre className="text-emerald-300 dark:text-emerald-400 font-mono text-sm leading-relaxed selection:bg-emerald-500/30">
                {viewingScript}
              </pre>
            </div>
            <div className="px-10 py-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-4 bg-zinc-50/50 dark:bg-zinc-950/50">
              <button 
                onClick={() => setViewingScript(null)}
                className="px-8 py-3 text-zinc-600 dark:text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md rounded-2xl transition-all"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(viewingScript);
                }}
                className="bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-200 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all shadow-xl shadow-zinc-200 dark:shadow-none active:scale-95 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {commentingId && (
        <div className="fixed inset-0 bg-zinc-900/80 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-zinc-800">
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Review Comments</h3>
              </div>
              <button onClick={() => setCommentingId(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <textarea 
                className="w-full h-40 p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none dark:text-zinc-200 shadow-inner"
                placeholder="Add your review comments or notes here..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
            </div>
            <div className="px-8 py-6 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                onClick={() => setCommentingId(null)}
                className="px-6 py-2 text-zinc-500 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveComment}
                disabled={isSavingComment}
                className="bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-zinc-100 dark:shadow-none transition-all active:scale-95"
              >
                {isSavingComment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLabelsId && (
        <div className="fixed inset-0 bg-zinc-900/80 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-zinc-800">
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Edit Labels</h3>
              </div>
              <button onClick={() => setEditingLabelsId(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Scenario Tags</label>
                <input 
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-zinc-200 shadow-inner"
                  placeholder="e.g. Smoke, Regression, UI"
                  value={labelsText}
                  onChange={e => setLabelsText(e.target.value.replace(/\s+/g, '_'))}
                />
              </div>
              <div className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                <Lightbulb className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 leading-relaxed uppercase tracking-wider">
                  Labels cannot contain spaces. Spaces are auto-replaced with underscores.
                </p>
              </div>
            </div>
            <div className="px-8 py-6 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                onClick={() => setEditingLabelsId(null)}
                className="px-6 py-2 text-zinc-500 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveLabels}
                disabled={isSavingLabels}
                className="bg-zinc-900 dark:bg-emerald-500 text-white dark:text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-zinc-100 dark:shadow-none transition-all active:scale-95"
              >
                {isSavingLabels ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
