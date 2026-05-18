import { useState } from 'react';
import { X, Save, User as UserIcon, Shield } from 'lucide-react';
import api from '../lib/api';

interface UserEditModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditModal({ user, onClose, onSuccess }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    role: user.role,
    permitted_type: user.permitted_type || 'ALL',
    division: user.division || '',
    dco: user.dco || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const userStr = sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.put(`/users/${user.user_id}`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-border">
        <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit User</h2>
              <p className="text-primary-foreground/70 text-sm">Update account details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-medium transition-colors">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            {isSuperAdmin ? (
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPERADMIN">SuperAdmin</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Role</label>
                <div className="px-4 py-3 rounded-xl bg-muted border border-border text-muted-foreground text-sm font-medium transition-colors">
                  {formData.role === 'ADMIN' ? 'Administrator' : (formData.role === 'SUPERADMIN' ? 'SuperAdmin' : 'Standard User')}
                  <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">Only SuperAdmin can change roles</p>
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">Permitted Asset Category</label>
                <select
                  value={formData.permitted_type}
                  onChange={e => setFormData({ ...formData, permitted_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="ALL">Full Access (All Types)</option>
                  <option value="MACHINE">Machines Only</option>
                  <option value="NETWORK">Networks Only</option>
                  <option value="PRINTER">Printers Only</option>
                </select>
                <p className="text-[10px] text-muted-foreground/60 mt-1 italic transition-colors">Determines which items this user can Create/Edit/Delete</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Division</label>
              <input
                type="text"
                value={formData.division}
                onChange={e => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="e.g. Finance, HR"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">DCO</label>
              <input
                type="text"
                value={formData.dco}
                onChange={e => setFormData({ ...formData, dco: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="e.g. DCO 1"
              />
            </div>
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border text-muted-foreground font-bold hover:bg-accent transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Update User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
