import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Upload, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState
} from '@tanstack/react-table';
import BulkUploadModal from '../components/BulkUploadModal';
import UserEditModal from '../components/UserEditModal';
import { useNavigate } from 'react-router-dom';

type UserData = {
  user_id: number;
  username: string;
  role: string;
  division: string | null;
  dco: string | null;
  created_at: string;
  creator_name: string | null;
};

const columnHelper = createColumnHelper<UserData>();

export default function Users() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const userStr = sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  // Super Admin can only view, not edit. Only ADMIN can edit.
  const isAdmin = currentUser?.role === 'ADMIN';

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    }
  });

  const handleDelete = async (user: UserData) => {
    if (user.user_id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        await api.delete(`/users/${user.user_id}`);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('username', {
      header: ({ column }) => (
        <button className="flex items-center hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Username <ArrowUpDown className="ml-2 h-4 w-4" />
        </button>
      ),
      cell: info => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold mr-3 uppercase">
            {info.getValue().charAt(0)}
          </div>
          <span className="font-medium text-foreground">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => {
        const role = info.getValue()?.toUpperCase();
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            role === 'SUPERADMIN' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
            (role === 'ADMIN' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400')
          }`}>
            {info.getValue()}
          </span>
        );
      },
    }),
    columnHelper.accessor('division', {
      header: 'Division',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('dco', {
      header: 'DCO',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('created_at', {
      header: 'Joined',
      cell: info => format(new Date(info.getValue()), 'MMM d, yyyy'),
    }),
    columnHelper.accessor('creator_name', {
      header: 'Added By',
      cell: info => <span className="text-muted-foreground italic">{info.getValue() || 'System'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        isAdmin && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setEditingUser(info.row.original)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Edit User"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleDelete(info.row.original)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Delete User"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      ),
    }),
  ], [isAdmin, currentUser]);

  const table = useReactTable({
    data: users || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">User Directory</h1>
        {isAdmin && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center px-4 py-2 bg-card text-card-foreground border border-border rounded-md hover:bg-accent transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload Users
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-colors">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-accent/50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-accent/50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-accent/20 transition-colors">
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="mr-4">
                  Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
                  <strong>{table.getPageCount()}</strong>
                </span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="bg-card border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 rounded-md border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 rounded-md border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-md border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-md border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      {isBulkModalOpen && (
        <BulkUploadModal 
          onClose={() => setIsBulkModalOpen(false)} 
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })} 
        />
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
        />
      )}
    </>
  );
}
