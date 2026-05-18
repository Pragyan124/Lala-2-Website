import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Package, Users as UsersIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const lowercaseQuery = query.toLowerCase();

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await api.get('/assets');
      return res.data;
    }
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    }
  });

  const filteredAssets = assets?.filter((asset: any) => {
    return (
      asset.asset_tag?.toLowerCase().includes(lowercaseQuery) ||
      asset.type?.toLowerCase().includes(lowercaseQuery) ||
      asset.model_name?.toLowerCase().includes(lowercaseQuery) ||
      asset.manufacturer?.toLowerCase().includes(lowercaseQuery) ||
      asset.ip_address?.toLowerCase().includes(lowercaseQuery) ||
      asset.location?.toLowerCase().includes(lowercaseQuery) ||
      asset.cpu_serial?.toLowerCase().includes(lowercaseQuery) ||
      asset.host_name?.toLowerCase().includes(lowercaseQuery) ||
      asset.role_service?.toLowerCase().includes(lowercaseQuery) ||
      asset.env_tag?.toLowerCase().includes(lowercaseQuery)
    );
  }) || [];

  const filteredUsers = users?.filter((user: any) => {
    return (
      user.username?.toLowerCase().includes(lowercaseQuery) ||
      user.division?.toLowerCase().includes(lowercaseQuery) ||
      user.dco?.toLowerCase().includes(lowercaseQuery) ||
      user.role?.toLowerCase().includes(lowercaseQuery)
    );
  }) || [];

  const isLoading = isLoadingAssets || isLoadingUsers;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground transition-colors">
          Search Results for "{query}"
        </h1>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground transition-colors">Searching...</div>
      ) : (
        <div className="space-y-8">
          {/* Assets Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                <Package className="w-5 h-5 mr-2 text-primary" />
                Assets ({filteredAssets.length})
              </h2>
              {filteredAssets.length > 0 && (
                <Link to={`/assets`} className="text-sm text-primary hover:underline flex items-center">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              )}
            </div>
            
            {filteredAssets.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center text-muted-foreground transition-colors">
                No matching assets found.
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-colors">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tag ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAssets.map((asset: any) => (
                      <tr key={asset.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{asset.asset_tag}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{asset.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{asset.model_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {asset.created_at ? format(new Date(asset.created_at), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {asset.modified_at ? format(new Date(asset.modified_at), 'MMM d, HH:mm:ss') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Users Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                <UsersIcon className="w-5 h-5 mr-2 text-primary" />
                Users ({filteredUsers.length})
              </h2>
              {filteredUsers.length > 0 && (
                <Link to="/users" className="text-sm text-primary hover:underline flex items-center">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              )}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center text-muted-foreground transition-colors">
                No matching users found.
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-colors">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Division</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">DCO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user: any) => (
                      <tr key={user.user_id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.division || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.dco || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
