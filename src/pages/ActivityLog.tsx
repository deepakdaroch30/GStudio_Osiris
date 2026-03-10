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
  Send
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
    if (action.includes('CREATED')) return <Link2 className="w-4 h-4 text-indigo-500" />;
    if (action.includes('SYNCED')) return <FileText className="w-4 h-4 text-emerald-500" />;
    if (action.includes('COMPLETED')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('FAILED')) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-500 mt-1">Full audit trail of all operations and system events.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading audit trail...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No activity recorded yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {getIcon(log.action)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 text-sm">{log.action.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                      {log.entityType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {log.entityId?.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {log.actorUserId || 'System'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
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
