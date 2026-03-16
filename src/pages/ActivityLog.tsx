import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link2,
  Layers,
  FileText,
  Beaker,
  Send,
  User,
  Activity,
  Search,
  Filter,
  ArrowRight,
  Shield,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/v1/audit-logs');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch logs:', e);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('created')) return <PlusIcon className="w-3.5 h-3.5" />;
    if (actionLower.includes('synced')) return <RefreshIcon className="w-3.5 h-3.5" />;
    if (actionLower.includes('completed')) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (actionLower.includes('failed')) return <AlertCircle className="w-3.5 h-3.5" />;
    if (actionLower.includes('push')) return <Send className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('failed')) return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (actionLower.includes('completed') || actionLower.includes('synced')) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (actionLower.includes('created')) return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">
            <Shield className="w-3.5 h-3.5" />
            Security & Compliance
          </div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Activity Log</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">A complete audit trail of all system events and user actions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              placeholder="Search logs..."
              className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-11 pr-5 py-3 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all w-72 shadow-inner"
            />
          </div>
          <button className="px-6 py-3 text-zinc-700 dark:text-zinc-300 font-black text-xs uppercase tracking-widest bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all flex items-center gap-2 shadow-sm active:scale-95">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Event</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Entity</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Reference</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Actor</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-10 h-10 text-emerald-500 dark:text-emerald-500 animate-spin" />
                      <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">Loading audit trail...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center text-zinc-300 dark:text-zinc-600 shadow-inner">
                        <History className="w-10 h-10" />
                      </div>
                      <div>
                        <p className="text-zinc-900 dark:text-white font-black text-xl tracking-tight">No activity recorded</p>
                        <p className="text-zinc-500 font-medium text-sm mt-1">System events will appear here as they occur.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all cursor-default">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110",
                          getActionColor(log.action)
                        )}>
                          {getIcon(log.action)}
                        </div>
                        <span className="font-black text-zinc-900 dark:text-white text-sm tracking-tight capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors">
                        <span className="bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-100 dark:border-zinc-800 font-bold shadow-inner">
                          {log.entityId?.substring(0, 8)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-sm">
                          <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                          {log.actorUserId || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {new Date(log.createdAt).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
