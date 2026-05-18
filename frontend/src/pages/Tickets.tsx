import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { 
  Plus, Search, Filter, Trash2, X, AlertCircle, 
  MessageSquare, User as UserIcon, Calendar, Clock, Monitor, Tag
} from 'lucide-react';
import { format } from 'date-fns';

interface Ticket {
  id: number;
  asset_tag: string;
  issue_type: 'H/W' | 'S/W';
  issue_description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  created_at: string;
  modified_at: string;
  username: string;
}

export default function Tickets() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTicket, setNewTicket] = useState({
    asset_tag: 'GENERAL',
    issue_type: 'H/W' as 'H/W' | 'S/W',
    issue_description: ''
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  // Only ADMIN has full modification rights. SUPERADMIN is view-only for all tickets.
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || 
                  sessionUser?.role?.toUpperCase() === 'ADMIN';

  console.log('Tickets Auth Debug:', { apiRole: user?.role, sessionRole: sessionUser?.role, isAdmin });

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newTicket) => api.post('/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsModalOpen(false);
      setNewTicket({ asset_tag: 'GENERAL', issue_type: 'H/W', issue_description: '' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Failed to log ticket. Please ensure you have run the database migration.';
      alert(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      api.put(`/tickets/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (selectedTicket) {
        setSelectedTicket((prev: any) => ({ ...prev, status: prev.status }));
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(null);
    }
  });

  const filteredTickets = tickets?.filter(t => 
    (t.asset_tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.issue_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Closed': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and track hardware/software issues</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" /> Log New Issue
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by tag, user, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button className="flex items-center px-6 py-3 bg-card border border-border rounded-xl font-bold text-muted-foreground hover:bg-accent transition-all">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </button>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent/30 border-b border-border">

                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Added</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Modified</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets?.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-accent/30 transition-colors group cursor-pointer" onClick={() => setSelectedTicket(ticket)}>

                  <td className="px-6 py-4 text-sm font-medium">{ticket.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${ticket.issue_type === 'H/W' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                      {ticket.issue_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {ticket.issue_description}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${getStatusStyle(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(ticket.created_at), 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {ticket.modified_at ? format(new Date(ticket.modified_at), 'MMM d, HH:mm:ss') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-3">
                      {isAdmin ? (
                        <>
                          <select 
                            value={ticket.status}
                            onChange={(e) => updateMutation.mutate({ id: ticket.id, status: e.target.value })}
                            className={`text-xs font-bold py-1.5 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer ${getStatusStyle(ticket.status)}`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <button 
                            onClick={() => { if(confirm('Delete ticket?')) deleteMutation.mutate(ticket.id) }}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        ticket.status === 'Open' && (
                          <button 
                            onClick={() => { if(confirm('Delete ticket?')) deleteMutation.mutate(ticket.id) }}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity" title="Cancel Ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!filteredTickets || filteredTickets.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                    {isLoading ? 'Loading tickets...' : 'No tickets found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-accent/30">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Ticket Details</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-accent rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center"><Monitor className="w-3 h-3 mr-1" /> Type</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${selectedTicket.issue_type === 'H/W' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                    {selectedTicket.issue_type}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> Description</p>
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
                          setSelectedTicket({ ...selectedTicket, status: s as any });
                        }}
                        className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                          selectedTicket.status === s 
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
                  onClick={() => { if(confirm('Permanently delete?')) deleteMutation.mutate(selectedTicket.id) }}
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

      {/* Log Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-accent/30">
              <h3 className="text-lg font-bold text-foreground">Log New Issue</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newTicket); }} className="p-8 space-y-6">


              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Issue Type</label>
                <select
                  value={newTicket.issue_type}
                  onChange={(e) => setNewTicket({...newTicket, issue_type: e.target.value as any})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground font-bold"
                >
                  <option value="H/W">Hardware (H/W)</option>
                  <option value="S/W">Software (S/W)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={newTicket.issue_description}
                  onChange={(e) => setNewTicket({...newTicket, issue_description: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-foreground font-bold placeholder:text-slate-400"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-border rounded-xl font-bold text-muted-foreground hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Logging...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
