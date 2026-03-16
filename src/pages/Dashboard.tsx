import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Layers, 
  Send, 
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Zap,
  Activity,
  ChevronRight,
  Search
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-xs font-bold uppercase tracking-widest mb-2">
            <Activity className="w-3 h-3" />
            System Live
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
            Monitor your AI test generation pipeline and workspace health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              placeholder="Search everything..."
              className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg pl-9 pr-4 py-2 text-zinc-900 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-64 shadow-inner"
            />
          </div>
          <button className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-sm">
            <Zap className="w-4 h-4" />
            Quick Action
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Workspaces', value: stats.workspaces, icon: Layers, trend: '+2', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Synced Requirements', value: stats.requirements, icon: CheckCircle2, trend: '+12%', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Generated Tests', value: stats.testCases, icon: Clock, trend: '+8', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Successful Pushes', value: stats.pushes, icon: Send, trend: '100%', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="group bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-lg dark:hover:shadow-emerald-500/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl transition-colors", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stat.value}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workspaces */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-transparent">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <h2 className="font-bold text-zinc-900 dark:text-white">Recent Workspaces</h2>
            </div>
            <button className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold group-hover:text-zinc-900 dark:group-hover:text-white transition-colors border border-zinc-200 dark:border-zinc-700">
                      W{i}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Workspace {i}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                        <span>Project: PROJ-{i}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <span>Last synced 2h ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                      <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">12 Requirements</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase font-bold tracking-tighter">Synced</div>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-500/20">
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-transparent">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <h2 className="font-bold text-zinc-900 dark:text-white">Live Activity</h2>
            </div>
          </div>
          <div className="p-6 relative">
            <div className="absolute left-8 top-8 bottom-8 w-px bg-zinc-100 dark:bg-zinc-800" />
            <div className="space-y-8 relative">
              {[
                { action: 'Requirements Synced', user: 'Deepak', time: '10m ago', icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/20' },
                { action: 'Test Generation Started', user: 'Deepak', time: '45m ago', icon: Clock, color: 'text-blue-700 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/20' },
                { action: 'Push Execution Failed', user: 'System', time: '2h ago', icon: AlertCircle, color: 'text-rose-700 dark:text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/20' },
                { action: 'New Workspace Created', user: 'Deepak', time: '5h ago', icon: Zap, color: 'text-amber-700 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/20' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn("relative z-10 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-950 border border-transparent dark:border-none", activity.bg, activity.color)}>
                    <activity.icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">{activity.action}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">By {activity.user} • {activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
            <button className="w-full py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest">
              View Audit Log
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
