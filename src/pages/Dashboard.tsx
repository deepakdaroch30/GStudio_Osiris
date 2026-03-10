import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Layers, 
  Send, 
  History,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    workspaces: 0,
    requirements: 0,
    testCases: 0,
    pushes: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ws, logs] = await Promise.all([
          axios.get('/api/v1/workspaces'),
          axios.get('/api/v1/audit-logs')
        ]);
        setStats({
          workspaces: ws.data.length,
          requirements: 12, // Mocked for now
          testCases: 24,
          pushes: 5
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here's what's happening across your workspaces.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Active Workspaces', value: stats.workspaces, icon: Layers, color: 'bg-blue-500' },
          { label: 'Synced Requirements', value: stats.requirements, icon: CheckCircle2, color: 'bg-emerald-500' },
          { label: 'Generated Tests', value: stats.testCases, icon: Clock, color: 'bg-indigo-500' },
          { label: 'Successful Pushes', value: stats.pushes, icon: Send, color: 'bg-violet-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={stat.color + " p-2 rounded-lg text-white"}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Workspaces</h2>
            <button className="text-sm text-indigo-600 font-medium hover:underline">View all</button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold">
                      W{i}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Workspace {i}</div>
                      <div className="text-xs text-slate-500">Project: PROJ-{i} • Last synced 2h ago</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">
                    Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Activity</h2>
            <button className="text-sm text-indigo-600 font-medium hover:underline">View all</button>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[
                { action: 'Requirements Synced', user: 'Admin', time: '10m ago', icon: CheckCircle2, color: 'text-emerald-500' },
                { action: 'Test Generation Started', user: 'Admin', time: '45m ago', icon: Clock, color: 'text-indigo-500' },
                { action: 'Push Execution Failed', user: 'System', time: '2h ago', icon: AlertCircle, color: 'text-rose-500' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={activity.color + " mt-1"}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{activity.action}</div>
                    <div className="text-xs text-slate-500">By {activity.user} • {activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
