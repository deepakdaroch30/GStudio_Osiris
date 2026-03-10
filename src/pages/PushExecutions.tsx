import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database
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
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Push Executions</h1>
        <p className="text-slate-500 mt-1">Track the status of test cases pushed to external management tools.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Execution ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Started At</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Traceability</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading history...</td></tr>
            ) : executions.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No push executions found.</td></tr>
            ) : (
              executions.map((exec) => (
                <tr key={exec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{exec.id?.substring(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{new Date(exec.startedAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "flex items-center gap-2 text-sm font-bold uppercase tracking-wide",
                      exec.status === 'COMPLETED' ? 'text-emerald-600' : 'text-indigo-600'
                    )}>
                      {exec.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {exec.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {exec.items?.length || 0} Test Cases
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                      <Database className="w-3 h-3" />
                      Auto-linked
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 hover:underline text-sm font-medium">View Details</button>
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
