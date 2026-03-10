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
  RefreshCw
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
    if (confirm('Delete this test case?')) {
      try {
        await axios.delete(`/api/v1/test-cases/${id}`);
        fetchTestCases();
      } catch (e) {
        console.error(e);
        alert('Failed to delete test case');
      }
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
    } catch (e) {
      console.error(e);
      alert('Failed to save comment');
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
    } catch (e) {
      console.error(e);
      alert('Failed to save labels');
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
      alert('Push completed successfully!');
      fetchTestCases();
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
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Test Design</h1>
          <p className="text-slate-500 mt-1">Review, refine, and approve AI-generated test cases.</p>
        </div>
        <div className="flex items-center gap-3">
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
            onClick={handlePush}
            disabled={testCases.length === 0 || isPushing}
            className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            <Send className={cn("w-4 h-4", isPushing && "animate-spin")} />
            {isPushing ? 'Pushing...' : 'Push to Zephyr'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading test cases...</div>
          ) : Object.keys(groupedTestCases).length === 0 ? (
            <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <Beaker className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No test cases generated</h3>
              <p className="text-slate-500">Go to Requirements to generate test cases for this workspace.</p>
            </div>
          ) : (
            Object.entries(groupedTestCases).map(([reqId, group]: [string, any]) => (
              <div key={reqId} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <button 
                  onClick={() => toggleExpand(reqId)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group.key}</div>
                      <div className="text-sm font-bold text-slate-900">{group.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {group.cases.length} Cases
                    </div>
                    {expandedReqs.includes(reqId) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {expandedReqs.includes(reqId) && (
                  <div className="divide-y divide-slate-100">
                    {group.cases.map((tc: any) => (
                      <div key={tc.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                tc.scenarioType === 'NEGATIVE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              )}>
                                {tc.scenarioType}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Priority: {tc.priority}
                              </span>
                              {tc.labels && tc.labels.split(',').map((label: string, i: number) => (
                                <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                                  {label}
                                </span>
                              ))}
                              {tc.status === 'PUSHED' && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Pushed
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-4">{tc.title}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preconditions</div>
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  {tc.preconditions || 'None'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Result</div>
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  {tc.expectedResult}
                                </div>
                              </div>
                            </div>

                            <div className="mt-6">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Steps & Expected Results</div>
                              <div className="space-y-3">
                                {JSON.parse(tc.stepsJson).map((step: any, i: number) => (
                                  <div key={i} className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                    <div className="flex gap-3 text-sm p-3 border-b border-slate-100">
                                      <span className="font-bold text-slate-400">{i + 1}.</span>
                                      <span className="text-slate-700">{typeof step === 'string' ? step : step.action}</span>
                                    </div>
                                    <div className="bg-emerald-50/30 p-3 flex gap-3 text-xs">
                                      <span className="font-bold text-emerald-600 shrink-0">Expected:</span>
                                      <span className="text-emerald-700 italic">{typeof step === 'string' ? tc.expectedResult : step.expectedResult}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {tc.automationScript && (
                              <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automation Script</div>
                                  <button 
                                    onClick={() => setViewingScript(tc.automationScript)}
                                    className="text-xs text-indigo-600 font-bold hover:underline"
                                  >
                                    View Full Code
                                  </button>
                                </div>
                                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                  {tc.automationScript.split('\n').slice(0, 5).join('\n')}...
                                </pre>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => handleApprove(tc.id)}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                tc.status === 'APPROVED' ? 'bg-emerald-600 text-white' : 
                                tc.status === 'PUSHED' ? 'bg-indigo-600 text-white opacity-50 cursor-not-allowed' :
                                'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              )}
                              disabled={tc.status === 'PUSHED'}
                              title={tc.status === 'APPROVED' ? "Approved" : "Approve"}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleGenerateScript(tc.id)}
                              disabled={isGeneratingScript === tc.id}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                              title="Generate Automation Script"
                            >
                              <Code className={cn("w-5 h-5", isGeneratingScript === tc.id && "animate-pulse")} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingLabelsId(tc.id);
                                setLabelsText(tc.labels || '');
                              }}
                              className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                              title="Edit Labels"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setCommentingId(tc.id);
                                setCommentText(tc.comments || '');
                              }}
                              className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                              title="Add Comment"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(tc.id)}
                              className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-rose-600 transition-colors"
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
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900">Coverage Insights</h3>
            </div>
            {coverage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Overall Coverage</span>
                  <span className="text-sm font-bold text-indigo-600">{coverage.score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all" style={{ width: `${coverage.score}%` }} />
                </div>
                <div className="space-y-3 mt-4">
                  {coverage.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">Analyzing requirements...</div>
            )}
          </div>

          <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-lg shadow-indigo-200">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Automation Ready
            </h3>
            <p className="text-xs text-indigo-200 mb-4 leading-relaxed">
              Your workspace is configured for <strong>Playwright (TS)</strong>. 
              Generate scripts for approved test cases to accelerate your automation suite.
            </p>
            <button className="w-full py-2 bg-white text-indigo-900 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">
              Configure Framework
            </button>
          </div>
        </div>
      </div>

      {viewingScript && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Automation Script Preview</h3>
              </div>
              <button 
                onClick={() => setViewingScript(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-900">
              <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                {viewingScript}
              </pre>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setViewingScript(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(viewingScript);
                  alert('Copied to clipboard!');
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {commentingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Test Case Comments</h3>
              <button onClick={() => setCommentingId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea 
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add your review comments or notes here..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setCommentingId(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveComment}
                disabled={isSavingComment}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingComment && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLabelsId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Edit Labels</h3>
              <button onClick={() => setEditingLabelsId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <input 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Label1, Label2, Label3"
                value={labelsText}
                onChange={e => setLabelsText(e.target.value.replace(/\s+/g, '_'))}
              />
              <p className="text-[10px] text-slate-400 mt-2 italic">Labels cannot contain spaces. Spaces will be replaced with underscores.</p>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setEditingLabelsId(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveLabels}
                disabled={isSavingLabels}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingLabels && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
