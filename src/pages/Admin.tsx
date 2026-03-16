import React from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  Activity, 
  Lock, 
  Globe, 
  Zap,
  ChevronRight,
  ArrowUpRight,
  Settings,
  CreditCard,
  Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Admin() {
  const stats = [
    { label: 'Active Users', value: '124', icon: Users, trend: '+12%' },
    { label: 'API Requests', value: '1.2M', icon: Activity, trend: '+5.4%' },
    { label: 'Storage Used', value: '42.8 GB', icon: Zap, trend: '85%' },
    { label: 'Security Score', value: '98/100', icon: Shield, trend: 'Optimal' },
  ];

  const settingsGroups = [
    {
      title: 'Organization',
      items: [
        { name: 'General Settings', desc: 'Manage your organization profile and branding', icon: Settings },
        { name: 'Members & Roles', desc: 'Invite team members and manage permissions', icon: Users },
        { name: 'Billing & Usage', desc: 'View invoices and manage subscription plans', icon: CreditCard },
      ]
    },
    {
      title: 'Security & Access',
      items: [
        { name: 'Authentication', desc: 'Configure SSO, SAML, and 2FA settings', icon: Lock },
        { name: 'API Keys', desc: 'Manage access tokens for external integrations', icon: Key },
        { name: 'Audit Logs', desc: 'View detailed history of all system activities', icon: Activity, link: '/activity-log' },
      ]
    },
    {
      title: 'Platform',
      items: [
        { name: 'Webhooks', desc: 'Configure real-time event notifications', icon: Globe },
        { name: 'Notifications', desc: 'Manage system-wide alert configurations', icon: Bell },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">
          <Shield className="w-3.5 h-3.5" />
          Enterprise Administration
        </div>
        <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Admin Controls</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">Manage your organization's security, members, and platform settings.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] space-y-5 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 shadow-inner border border-zinc-100 dark:border-zinc-700">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest",
                stat.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              )}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-12">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-6">
            <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] px-2">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item) => (
                <div 
                  key={item.name}
                  className="group bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-500 border border-zinc-100 dark:border-zinc-700 shadow-inner">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-zinc-900 dark:text-white font-black text-lg tracking-tight group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                      <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-2 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
        <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner">
          <div className="space-y-2">
            <h3 className="text-rose-600 dark:text-rose-400 font-black text-xl tracking-tight">Danger Zone</h3>
            <p className="text-zinc-500 font-medium">Irreversible actions that affect your entire organization.</p>
          </div>
          <button className="px-8 py-4 bg-white dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-widest border border-rose-200 dark:border-rose-500/20 rounded-2xl transition-all shadow-sm active:scale-95">
            Delete Organization
          </button>
        </div>
      </div>

    </div>
  );
}
