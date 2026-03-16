import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  Filter,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function PushExecutions() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const wsRes = await axios.get('/api/v1/workspaces');
      const workspaces = Array.isArray(wsRes.data) ? wsRes.data : [];
      if (workspaces.length > 0) {
        const res = await axios.get(`/api/v1/workspaces/${workspaces[0].id}/push-executions`);
        setExecutions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error('Failed to fetch executions:', e);
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">
            <Send className="w-3 h-3" />
            Deployment Pipeline
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Push Executions</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Track the delivery of test assets to external management systems.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              placeholder="Search executions..."
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-2 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="px-4 py-2 text-zinc-700 dark:text-zinc-300 font-bold text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center gap-2 shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Execution</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Started At</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Payload</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Traceability</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 animate-spin" />
                      <p className="text-zinc-500 font-bold text-sm">Loading history...</p>
                    </div>
                  </td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <Send className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-zinc-900 dark:text-white font-bold text-lg">No push executions</p>
                        <p className="text-zinc-500 text-sm mt-1">Start pushing test cases to see them here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <tr key={exec.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                          <Zap className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                          {exec.id?.substring(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                        {new Date(exec.startedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        exec.status === 'COMPLETED' 
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
                      )}>
                        {exec.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {exec.status}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {exec.items?.length || 0}
                        </span>
                        <span className="text-xs text-zinc-500">Test Cases</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest">
                        <Database className="w-3 h-3" />
                        Auto-linked
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="px-3 py-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 ml-auto">
                        Details
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
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
