import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { ArrowUpDown, Plus, X, Edit, Trash2, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download as DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';
import BulkUploadModal from '../components/BulkUploadModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

type InventoryItem = {
  id: number;
  asset_tag: string;
  type: string;
  subtype?: string;
  switch_type?: string;
  manufacturer: string;
  model_name: string;
  created_at: string;
  creator_name?: string;
  cpu_serial?: string;
  monitor_serial?: string;
  keyboard_serial?: string;
  mouse_serial?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  ip_address?: string;
  mac_address?: string;
  vlan?: string;
  location?: string;
  assigned_to?: string;
  host_name?: string;
  form_factor?: string;
  cpu_core_count?: string;
  ram_capacity?: string;
  storage_config?: string;
  subnet_vlan?: string;
  gateway_dns?: string;
  open_ports?: string;
  os?: string;
  kernel_version?: string;
  env_tag?: string;
  role_service?: string;
};

const columnHelper = createColumnHelper<InventoryItem>();

export default function Assets() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'ALL';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  const [assetType, setAssetType] = useState('MACHINE');
  const [formData, setFormData] = useState<any>({});
  
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Admin check (now includes SUPERADMIN)
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
  
  // Extremely strict check for permitted type to avoid accidental "ALL" access
  const permittedType = (user?.permitted_type || user?.permittedType || 'NONE').toUpperCase();

  // Function to check if current user can manage a specific type
  const canManageType = (type: string) => {
    // SuperAdmin can manage everything
    if (role === 'SUPERADMIN') return true;
    
    // Admins and Users with specific permitted_type can manage that type
    if (permittedType === 'ALL') return isAdmin; 
    return type.toUpperCase() === permittedType;
  };

  const canEditInventory = role === 'SUPERADMIN' || isAdmin || (permittedType !== 'NONE' && permittedType !== 'ALL'); 

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await api.get('/assets');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newAsset: any) => {
      const res = await api.post('/assets', newAsset);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, asset: any }) => {
      const res = await api.put(`/assets/${data.id}`, data.asset);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting asset:', { type: assetType, ...formData });
    if (editMode && editItemId) {
      updateMutation.mutate({
        id: editItemId,
        asset: { type: assetType, ...formData }
      });
    } else {
      createMutation.mutate({
        type: assetType,
        ...formData
      });
    }
  };

  const openAddModal = () => {
    setError('');
    if (permittedType && permittedType !== 'ALL') {
      setAssetType(permittedType);
    }
    setFormData({});
    setEditMode(false);
    setEditItemId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditMode(true);
    setEditItemId(item.id);
    setAssetType(item.type);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditMode(false);
    setEditItemId(null);
    setError('');
  };

  const handleTypeChange = (e: any) => {
    setAssetType(e.target.value);
    setFormData({}); // reset fields when type changes
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('asset_tag', {
        header: ({ column }) => (
          <button className="flex items-center hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Tag ID <ArrowUpDown className="ml-2 h-4 w-4" />
          </button>
        ),
        cell: info => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: info => {
          const item = info.row.original;
          const type = item.type;
          let color = 'bg-muted text-muted-foreground';
          if (type === 'MACHINE') color = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
          if (type === 'NETWORK') color = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
          if (type === 'PRINTER') color = 'bg-green-500/10 text-green-600 dark:text-green-400';
          if (type === 'SERVER') color = 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
          
          return (
            <div className="flex flex-col">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${color}`}>{type}</span>
              {type === 'MACHINE' && item.subtype && (
                <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                  {item.subtype}{item.switch_type ? ` (${item.switch_type})` : ''}
                </span>
              )}
            </div>
          );
        }
      }),
      columnHelper.accessor('model_name', {
        header: 'Model',
        cell: info => (
          <div>
            <p className="font-medium text-foreground">{info.getValue() || '-'}</p>
            <p className="text-xs text-muted-foreground">{info.row.original.manufacturer || '-'}</p>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'hardware',
        header: 'Hardware',
        cell: info => {
          const item = info.row.original;
          if (item.type === 'MACHINE') {
            if (item.subtype !== 'Workstation') return '-';
            return (
              <div className="text-xs space-y-0.5">
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">CPU:</span> {item.processor || '-'}</p>
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">RAM:</span> {item.ram || '-'}</p>
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Disk:</span> {item.storage || '-'}</p>
              </div>
            );
          }
          if (item.type === 'SERVER') {
            return (
              <div className="text-xs space-y-0.5">
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">CPU:</span> {item.cpu_core_count || '-'} Cores</p>
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">RAM:</span> {item.ram_capacity || '-'}</p>
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Disk:</span> {item.storage_config || '-'}</p>
              </div>
            );
          }
          return '-';
        }
      }),
      columnHelper.display({
        id: 'details',
        header: 'Details',
        cell: info => {
          const item = info.row.original;
          if (item.type === 'MACHINE') {
            if (item.subtype === 'Workstation') return (
              <div className="text-xs space-y-0.5">
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Loc:</span> {item.location || '-'}</p>
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Asgn:</span> {item.assigned_to || '-'}</p>
              </div>
            );
            return (
              <div className="text-xs space-y-0.5">
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">IP:</span> {item.ip_address || '-'}</p>
                <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">VLAN:</span> {item.vlan || '-'}</p>
              </div>
            );
          }
          if (item.type === 'NETWORK') return <span className="text-sm text-muted-foreground">{item.ip_address || 'No IP'}</span>;
          if (item.type === 'PRINTER') return (
            <div className="text-xs space-y-0.5">
              <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Loc:</span> {item.location || '-'}</p>
              <p><span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Asgn:</span> {item.assigned_to || '-'}</p>
            </div>
          );
          if (item.type === 'SERVER') return (
            <div className="text-xs space-y-0.5">
              <p><span className="text-muted-foreground">Host:</span> {item.host_name || '-'}</p>
              <p><span className="text-muted-foreground">IP:</span> {item.ip_address || '-'}</p>
            </div>
          );
          return '-';
        }
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: info => info.getValue() ? format(new Date(info.getValue()), 'MMM d, yyyy') : '-',
      }),
      columnHelper.accessor('creator_name', {
        header: 'Added By',
        cell: info => <span className="text-muted-foreground italic">{info.getValue() || 'System'}</span>,
      })
    ];

    // Actions column for Admins
    if (isAdmin) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: 'Actions',
          cell: info => {
            const item = info.row.original;
            if (!canManageType(item.type)) return null;
            
            return (
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(item)} className="p-1 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          }
        })
      );
    }
    
    return baseColumns;
  }, [isAdmin, permittedType]);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    if (activeTab === 'ALL') return assets;
    return assets.filter((a: any) => a.type === activeTab);
  }, [assets, activeTab]);

  const table = useReactTable({
    data: filteredAssets,
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

  const exportToExcel = () => {
    const dataToExport = table.getRowModel().rows.map(row => {
      const item = row.original;
      return {
        'Asset Tag': item.asset_tag,
        'Type': item.type,
        'Manufacturer': item.manufacturer || item.host_name || '-',
        'Model': item.model_name || item.role_service || '-',
        'Location/Assigned': item.location || item.assigned_to || item.env_tag || '-',
        'IP Address': item.ip_address || '-',
        'Created At': item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : '-',
        'Added By': item.creator_name || 'System'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, `Inventory_${activeTab}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = table.getRowModel().rows.map(row => {
      const item = row.original;
      return [
        item.asset_tag,
        item.type,
        item.manufacturer || item.host_name || '-',
        item.model_name || item.role_service || '-',
        item.location || item.assigned_to || item.env_tag || '-',
        item.creator_name || 'System'
      ];
    });

    autoTable(doc, {
      head: [['Asset Tag', 'Type', 'Manufacturer', 'Model', 'Location/User', 'Added By']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillStyle: 'DFDFDF', textColor: 0 },
    });

    doc.save(`Inventory_${activeTab}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground transition-colors">Inventory Management</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-md hover:bg-green-500/20 transition-colors shadow-sm font-medium"
            title="Download Excel"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors shadow-sm font-medium"
            title="Download PDF"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            PDF
          </button>

          {canEditInventory && (permittedType === 'ALL' || (activeTab !== 'ALL' && activeTab === permittedType)) && (
            <div className="flex items-center space-x-3 pl-3 border-l border-border transition-colors">
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center px-4 py-2 bg-card text-card-foreground border border-border rounded-md hover:bg-accent transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </button>
              <button 
                onClick={openAddModal}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-1 bg-accent p-1 rounded-lg w-fit transition-colors">
        {['ALL', 'MACHINE', 'SERVER', 'NETWORK', 'PRINTER'].map(tab => {
          const isPermitted = permittedType === 'ALL' || tab === 'ALL' || tab === permittedType;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
                activeTab === tab 
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                  : isPermitted 
                    ? 'text-muted-foreground hover:text-foreground hover:bg-background'
                    : 'text-muted-foreground/50 bg-background/50 opacity-60 cursor-help'
              }`}
              title={!isPermitted ? `You have View-Only access to ${tab}s` : ''}
            >
              {tab === 'ALL' ? 'All Assets' : tab.charAt(0) + tab.slice(1).toLowerCase() + 's'}
              {!isPermitted && tab !== 'ALL' && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-accent text-muted-foreground rounded uppercase tracking-tighter transition-colors">View Only</span>
              )}
            </button>
          );
        })}
      </div>
 
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-colors">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
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
              {table.getRowModel().rows.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No inventory found for this category.</div>
              )}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-border transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editMode ? 'Edit Inventory' : 'Add New Inventory'}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                <select 
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted"
                  value={assetType}
                  onChange={handleTypeChange}
                  disabled={editMode || (permittedType !== 'ALL')}
                >
                  {(permittedType === 'ALL' || permittedType === 'MACHINE') && <option value="MACHINE">Machine</option>}
                  {(permittedType === 'ALL' || permittedType === 'SERVER') && <option value="SERVER">Server</option>}
                  {(permittedType === 'ALL' || permittedType === 'NETWORK') && <option value="NETWORK">Network</option>}
                  {(permittedType === 'ALL' || permittedType === 'PRINTER') && <option value="PRINTER">Printer</option>}
                </select>
              </div>
 
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Asset Tag</label>
                  <input type="text" required name="asset_tag" value={formData.asset_tag || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                {assetType !== 'SERVER' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Manufacturer</label>
                      <input type="text" required name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Model Name</label>
                      <input type="text" required name="model_name" value={formData.model_name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </>
                )}
              </div>

              {/* Machine Specific Fields */}
              {assetType === 'MACHINE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Subtype</label>
                    <select 
                      name="subtype" 
                      value={formData.subtype || 'Workstation'} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Workstation">Workstation</option>
                      <option value="Switch">Switch</option>
                      <option value="Router">Router</option>
                      <option value="Mux">Mux</option>
                    </select>
                  </div>

                  {formData.subtype === 'Switch' && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Switch Type</label>
                      <select 
                        name="switch_type" 
                        value={formData.switch_type || ''} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select Switch Type</option>
                        <option value="Core Switch">Core Switch</option>
                        <option value="Access Switch">Access Switch</option>
                      </select>
                    </div>
                  )}

                  {(formData.subtype === 'Workstation' || !formData.subtype) ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">CPU Serial</label>
                        <input type="text" name="cpu_serial" value={formData.cpu_serial || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Processor</label>
                        <input type="text" name="processor" value={formData.processor || ''} onChange={handleChange} placeholder="e.g. Intel i5-12400" className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">RAM</label>
                          <input type="text" name="ram" value={formData.ram || ''} onChange={handleChange} placeholder="e.g. 16GB" className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Storage</label>
                          <input type="text" name="storage" value={formData.storage || ''} onChange={handleChange} placeholder="e.g. 512GB SSD" className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Monitor Serial</label>
                        <input type="text" name="monitor_serial" value={formData.monitor_serial || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Keyboard Serial</label>
                          <input type="text" name="keyboard_serial" value={formData.keyboard_serial || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Mouse Serial</label>
                          <input type="text" name="mouse_serial" value={formData.mouse_serial || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">IP Address</label>
                        <input type="text" name="ip_address" value={formData.ip_address || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">MAC Address</label>
                        <input type="text" name="mac_address" value={formData.mac_address || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">VLAN</label>
                        <input type="text" name="vlan" value={formData.vlan || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                      <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned To</label>
                      <input type="text" name="assigned_to" value={formData.assigned_to || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                </>
              )}

              {/* Network Specific Fields */}
              {assetType === 'NETWORK' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">IP Address</label>
                    <input type="text" name="ip_address" value={formData.ip_address || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned To (Stack)</label>
                    <input type="text" name="assigned_to" value={formData.assigned_to || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </>
              )}

              {/* Server Specific Fields */}
              {assetType === 'SERVER' && (
                <div className="space-y-4">
                  <div className="bg-accent/30 p-3 rounded-lg border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">1. Hardware Attributes</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Host Name</label>
                        <input type="text" required name="host_name" value={formData.host_name || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Form Factor</label>
                        <input type="text" name="form_factor" value={formData.form_factor || ''} onChange={handleChange} placeholder="e.g. 2U Rack" className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">CPU Cores</label>
                        <input type="text" name="cpu_core_count" value={formData.cpu_core_count || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">RAM Capacity</label>
                        <input type="text" name="ram_capacity" value={formData.ram_capacity || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Storage</label>
                        <input type="text" name="storage_config" value={formData.storage_config || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/30 p-3 rounded-lg border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">2. Network Attributes</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">IP Address</label>
                        <input type="text" name="ip_address" value={formData.ip_address || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">MAC Address</label>
                        <input type="text" name="mac_address" value={formData.mac_address || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Subnet/VLAN</label>
                        <input type="text" name="subnet_vlan" value={formData.subnet_vlan || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Gateway/DNS</label>
                        <input type="text" name="gateway_dns" value={formData.gateway_dns || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Open Ports</label>
                        <input type="text" name="open_ports" value={formData.open_ports || ''} onChange={handleChange} placeholder="80, 443, 22" className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/30 p-3 rounded-lg border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">3. Software Attributes</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">OS</label>
                        <input type="text" name="os" value={formData.os || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Kernel</label>
                        <input type="text" name="kernel_version" value={formData.kernel_version || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Environment</label>
                        <select name="env_tag" value={formData.env_tag || ''} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md">
                          <option value="">Select Env</option>
                          <option value="Production">Production</option>
                          <option value="Staging">Staging</option>
                          <option value="Development">Development</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Role/Service</label>
                        <input type="text" name="role_service" value={formData.role_service || ''} onChange={handleChange} placeholder="e.g. Database" className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Printer Specific Fields */}
              {assetType === 'PRINTER' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                      <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned To</label>
                      <input type="text" name="assigned_to" value={formData.assigned_to || ''} onChange={handleChange} className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                </>
              )}

              {(createMutation.isError || updateMutation.isError) && (
                 <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded-lg border border-destructive/20 transition-colors">
                   <p className="font-bold">{((createMutation.error as any)?.response?.data?.error) || ((updateMutation.error as any)?.response?.data?.error) || 'Error saving inventory'}</p>
                   <p className="text-xs mt-1">{((createMutation.error as any)?.response?.data?.details) || ((updateMutation.error as any)?.response?.data?.details)}</p>
                 </div>
              )}
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <BulkUploadModal 
          onClose={() => setIsBulkModalOpen(false)} 
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['assets'] })} 
        />
      )}
    </div>
  );
}
