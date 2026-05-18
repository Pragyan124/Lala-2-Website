import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Package, Monitor, Wifi, Printer as PrinterIcon, Server as ServerIcon, TrendingUp, PieChart as PieIcon, MessageSquare, ShieldCheck, Router as RouterIcon, Share2, Trash2, X, Clock, AlertCircle, User as UserIcon, Calendar } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { useState, useMemo } from 'react';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  // Only ADMIN has modification rights. SUPERADMIN is view-only.
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || 
                  sessionUser?.role?.toUpperCase() === 'ADMIN';
  
  const isSuperAdmin = user?.role?.toUpperCase() === 'SUPERADMIN' ||
                       sessionUser?.role?.toUpperCase() === 'SUPERADMIN';

  console.log('Auth Debug:', { apiRole: user?.role, sessionRole: sessionUser?.role, isAdmin });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await api.get('/assets');
      return res.data;
    }
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) =>
      api.put(`/tickets/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (selectedTicket) {
        setSelectedTicket((prev: any) => ({ ...prev, status: prev.status })); // Update local state for modal
      }
    }
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(null);
    }
  });

  const total = assets?.length || 0;
  const machines = assets?.filter((a: any) => a.type === 'MACHINE').length || 0;
  const servers = assets?.filter((a: any) => a.type === 'SERVER').length || 0;
  const networks = assets?.filter((a: any) => a.type === 'NETWORK').length || 0;
  const printers = assets?.filter((a: any) => a.type === 'PRINTER').length || 0;

  // Machine Subtype Breakdown
  const workstations = assets?.filter((a: any) => a.type === 'MACHINE' && (a.subtype === 'Workstation' || !a.subtype)).length || 0;
  const machineSwitches = assets?.filter((a: any) => a.type === 'MACHINE' && a.subtype === 'Switch').length || 0;
  const routers = assets?.filter((a: any) => a.type === 'MACHINE' && a.subtype === 'Router').length || 0;
  const muxes = assets?.filter((a: any) => a.type === 'MACHINE' && a.subtype === 'Mux').length || 0;

  const chartData = [
    { name: 'Machines', value: machines, color: '#6366f1' },
    { name: 'Servers', value: servers, color: '#f97316' },
    { name: 'Storage', value: networks, color: '#a855f7' },
    { name: 'Printers', value: printers, color: '#22c55e' },
  ].filter(d => d.value > 0);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Closed': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    }
  };

  // Activity Data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
  const activityData = last7Days.map(date => {
    const count = assets?.filter((a: any) => isSameDay(new Date(a.created_at), date)).length || 0;
    return {
      date: format(date, 'MMM d'),
      count: count
    };
  });

  const lastSyncTime = useMemo(() => {
    const allTimes = [
      ...(assets?.map((a: any) => new Date(a.modified_at).getTime()) || []),
      ...(tickets?.map((t: any) => new Date(t.modified_at).getTime()) || [])
    ].filter(t => !isNaN(t));
    
    if (allTimes.length === 0) return format(new Date(), 'HH:mm:ss');
    return format(new Date(Math.max(...allTimes)), 'HH:mm:ss');
  }, [assets, tickets]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-6 emerald-gradient rounded-full" />
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Summary</h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium opacity-70">Institutional infrastructure monitoring and performance analysis.</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground bg-accent/30 px-4 py-2 rounded-full border border-border/50 backdrop-blur-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span>Last DB Update: {lastSyncTime} IST</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Link to="/assets?tab=ALL" className="group relative overflow-hidden bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="p-4 rounded-2xl bg-primary/10 text-primary mb-6 w-fit group-hover:emerald-gradient group-hover:text-white transition-all duration-500 shadow-inner">
            <Package className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Global Assets</p>
            <p className="text-4xl font-black text-foreground tracking-tighter">{total}</p>
          </div>
        </Link>

        <Link to="/assets?tab=MACHINE" className="group relative overflow-hidden bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6 w-fit group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
            <Monitor className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Workstations</p>
            <p className="text-4xl font-black text-foreground tracking-tighter">{machines}</p>
          </div>
        </Link>

        <Link to="/assets?tab=SERVER" className="group relative overflow-hidden bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-6 w-fit group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-inner">
            <ServerIcon className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Compute Nodes</p>
            <p className="text-4xl font-black text-foreground tracking-tighter">{servers}</p>
          </div>
        </Link>

        <Link to="/assets?tab=NETWORK" className="group relative overflow-hidden bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-6 w-fit group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
            <Wifi className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Storage Assets</p>
            <p className="text-4xl font-black text-foreground tracking-tighter">{networks}</p>
          </div>
        </Link>

        <Link to="/assets?tab=PRINTER" className="group relative overflow-hidden bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6 w-fit group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
            <PrinterIcon className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Printers</p>
            <p className="text-4xl font-black text-foreground tracking-tighter">{printers}</p>
          </div>
        </Link>
      </div>


      {/* Machine Breakdown Section */}
      <div className="bg-accent/30 p-6 rounded-3xl border border-border/50">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center">
          <Monitor className="w-4 h-4 mr-2" /> Machine Subtype Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-indigo-500 mb-1" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Workstations</p>
            <p className="text-2xl font-bold text-foreground">{workstations}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center justify-center">
            <Share2 className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Switches</p>
            <p className="text-2xl font-bold text-foreground">{machineSwitches}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center justify-center">
            <RouterIcon className="w-5 h-5 text-purple-500 mb-1" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Routers</p>
            <p className="text-2xl font-bold text-foreground">{routers}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center justify-center">
            <PieIcon className="w-5 h-5 text-orange-500 mb-1" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Muxes</p>
            <p className="text-2xl font-bold text-foreground">{muxes}</p>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center"><PieIcon className="w-5 h-5 mr-2 text-blue-500" /> Asset Distribution</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-indigo-500" /> Recent Activity</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center"><MessageSquare className="w-6 h-6 mr-3 text-primary" /> Recent Complaints</h2>
          <Link to="/tickets" className="text-sm font-semibold text-primary hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Issue</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-muted-foreground uppercase">User</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Type</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Status & Handling</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Added</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets?.slice(0, 5).map((t: any) => (
                <tr key={t.id} className="hover:bg-accent/30 transition-colors group cursor-pointer" onClick={() => setSelectedTicket(t)}>
                  <td className="px-8 py-4 text-sm font-medium text-foreground max-w-xs truncate">{t.issue_description}</td>
                  <td className="px-8 py-4 text-xs font-bold text-muted-foreground">{t.username || 'Unknown'}</td>
                  <td className="px-8 py-4 text-xs">
                    <span className={`px-2 py-1 font-bold rounded uppercase ${t.issue_type === 'H/W' ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      {t.issue_type}
                    </span>
                  </td>
                  <td className="px-8 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-3">
                      {isAdmin ? (
                        <>
                          <select
                            value={t.status}
                            onChange={(e) => updateMutation.mutate({ id: t.id, status: e.target.value })}
                            className={`text-[10px] font-bold py-1 px-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all ${getStatusStyle(t.status)}`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <button
                            onClick={() => { if (confirm('Permanently delete this ticket?')) deleteTicketMutation.mutate(t.id) }}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(t.status)}`}>
                          {t.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(t.created_at), 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-8 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {t.modified_at ? format(new Date(t.modified_at), 'MMM d, HH:mm:ss') : '-'}
                  </td>
                </tr>
              ))}
              {(!tickets || tickets.length === 0) && (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-muted-foreground italic">No recent complaints found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-accent/30">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Issue Details</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-accent rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description</p>
                <div className="p-4 bg-accent/20 rounded-2xl border border-border/50">
                  <p className="text-foreground leading-relaxed">{selectedTicket.issue_description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center"><UserIcon className="w-3 h-3 mr-1" /> Logged By</p>
                  <p className="text-sm font-semibold text-foreground">{selectedTicket.username || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Added</p>
                  <p className="text-sm font-semibold text-foreground">{format(new Date(selectedTicket.created_at), 'PPP HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center"><Clock className="w-3 h-3 mr-1" /> Last Modified</p>
                  <p className="text-sm font-semibold text-foreground">{selectedTicket.modified_at ? format(new Date(selectedTicket.modified_at), 'PPP HH:mm:ss') : 'Never'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center"><Clock className="w-3 h-3 mr-1" /> Ticket Status</p>
                {isAdmin ? (
                  <div className="flex items-center space-x-2">
                    {['Open', 'In Progress', 'Closed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          updateMutation.mutate({ id: selectedTicket.id, status: s });
                          setSelectedTicket({ ...selectedTicket, status: s });
                        }}
                        className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${selectedTicket.status === s
                            ? getStatusStyle(s) + ' border-current shadow-sm'
                            : 'bg-accent/50 text-muted-foreground border-transparent hover:bg-accent'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 bg-accent/30 border-t border-border flex justify-end space-x-3">
              {isAdmin && (
                <button
                  onClick={() => { if (confirm('Permanently delete?')) deleteTicketMutation.mutate(selectedTicket.id) }}
                  className="px-6 py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-6 py-2.5 bg-foreground text-background hover:opacity-90 rounded-xl text-xs font-bold transition-opacity"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
