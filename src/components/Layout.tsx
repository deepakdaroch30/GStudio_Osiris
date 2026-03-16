import React from 'react';
import { 
  LayoutDashboard, 
  Link2, 
  Layers, 
  FileText, 
  Beaker, 
  Send, 
  History,
  ChevronRight,
  User,
  Settings,
  ShieldCheck,
  Search,
  Plus,
  Command,
  Sun,
  Moon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useTheme } from '@/src/contexts/ThemeContext';

const navGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { name: 'Workspaces', icon: Layers, path: '/workspaces' },
    ]
  },
  {
    label: 'Test Design',
    items: [
      { name: 'Requirements', icon: FileText, path: '/requirements' },
      { name: 'Test Design', icon: Beaker, path: '/test-design' },
    ]
  },
  {
    label: 'Execution',
    items: [
      { name: 'Push Executions', icon: Send, path: '/push-executions' },
      { name: 'Activity Log', icon: History, path: '/activity-log' },
    ]
  },
  {
    label: 'Admin',
    items: [
      { name: 'Connections', icon: Link2, path: '/connections' },
      { name: 'Enterprise Admin', icon: ShieldCheck, path: '/admin' },
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <div className={cn(
      "w-[240px] flex flex-col h-screen sticky top-0 border-r transition-colors duration-300",
      theme === 'dark' ? "bg-[#09090B] border-white/5" : "bg-white border-zinc-200"
    )}>
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors",
            theme === 'dark' ? "bg-white text-black" : "bg-zinc-900 text-white"
          )}>
            <Beaker className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-sm font-bold tracking-tight leading-none transition-colors", theme === 'dark' ? "text-white" : "text-zinc-900")}>TestGen AI</span>
            <span className={cn("text-[10px] font-medium mt-1 transition-colors", theme === 'dark' ? "text-white/40" : "text-zinc-500")}>Enterprise Plan</span>
          </div>
        </div>
      </div>

      {/* Search / Quick Actions */}
      <div className="px-4 mb-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer group",
          theme === 'dark' 
            ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" 
            : "bg-zinc-100 border-zinc-200 text-zinc-400 hover:bg-zinc-200 hover:border-zinc-300 shadow-inner"
        )}>
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Search...</span>
          <div className="ml-auto flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
            <Command className="w-3 h-3" />
            <span className="text-[10px] font-bold">K</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 overflow-y-auto space-y-6 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 mb-2">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] transition-colors",
                theme === 'dark' ? "text-white/20" : "text-zinc-400"
              )}>{group.label}</span>
            </div>
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 group relative",
                    isActive 
                      ? (theme === 'dark' ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-900 shadow-sm")
                      : (theme === 'dark' ? "text-white/50 hover:bg-white/5 hover:text-white/80" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive 
                      ? "text-white" 
                      : (theme === 'dark' ? "text-white/40 group-hover:text-white/60" : "text-zinc-400 group-hover:text-zinc-600")
                  )} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className={cn("absolute left-0 w-0.5 h-4 rounded-full", theme === 'dark' ? "bg-white" : "bg-zinc-900")} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 mt-auto">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group",
          theme === 'dark' ? "hover:bg-white/5" : "hover:bg-zinc-50 border border-transparent hover:border-zinc-200 shadow-sm"
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={cn("text-xs font-bold truncate transition-colors", theme === 'dark' ? "text-white" : "text-zinc-900")}>Enterprise Admin</span>
            <span className={cn("text-[10px] font-medium truncate transition-colors", theme === 'dark' ? "text-white/30" : "text-zinc-500")}>admin@testgen.ai</span>
          </div>
          <Settings className={cn(
            "w-3.5 h-3.5 ml-auto transition-colors",
            theme === 'dark' ? "text-white/20 group-hover:text-white/60" : "text-zinc-400 group-hover:text-zinc-600"
          )} />
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={cn("flex min-h-screen transition-colors duration-300", theme === 'dark' ? "bg-[#09090B]" : "bg-zinc-50")}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className={cn(
          "h-14 backdrop-blur-md border-b sticky top-0 z-30 flex items-center justify-between px-6 transition-colors duration-300",
          theme === 'dark' ? "bg-[#09090B]/80 border-white/5" : "bg-white/80 border-zinc-200"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-2 text-xs transition-colors", theme === 'dark' ? "text-white/40" : "text-zinc-500")}>
              <Layers className="w-3.5 h-3.5" />
              <span className="hover:text-white transition-colors cursor-pointer">Workspaces</span>
              <ChevronRight className="w-3 h-3" />
              <span className={cn("font-medium transition-colors", theme === 'dark' ? "text-white" : "text-zinc-900")}>Core Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold transition-colors",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white/60" : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              System Online
            </div>
            
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-1.5 rounded-lg border transition-all",
                theme === 'dark' 
                  ? "text-white/40 hover:text-white bg-white/5 border-white/10" 
                  : "text-zinc-500 hover:text-zinc-900 bg-zinc-100 border-zinc-200"
              )}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className={cn("h-4 w-px mx-1", theme === 'dark' ? "bg-white/10" : "bg-zinc-200")} />
            
            <button className={cn("p-1.5 transition-colors", theme === 'dark' ? "text-white/40 hover:text-white" : "text-zinc-500 hover:text-zinc-900")}>
              <Plus className="w-4 h-4" />
            </button>
            <button className={cn("p-1.5 transition-colors", theme === 'dark' ? "text-white/40 hover:text-white" : "text-zinc-500 hover:text-zinc-900")}>
              <Search className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
