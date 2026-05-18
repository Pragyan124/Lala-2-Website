import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, UploadCloud, Save, AlertCircle, Plus, Download } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { downloadTemplate } from '../lib/utils';

type BulkUploadModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const permittedType = user?.permitted_type || 'ALL';

  const [assetType, setAssetType] = useState(permittedType !== 'ALL' ? permittedType : 'MACHINE');
  const [machineSubtype, setMachineSubtype] = useState('Workstation');
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const bulkMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      if (assetType === 'USER') {
        const res = await api.post('/users/bulk', { users: payload });
        return res.data;
      } else {
        const res = await api.post('/assets/bulk', { assets: payload });
        return res.data;
      }
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to upload records. Check for duplicates or invalid data.');
    }
  });

  const startManualEntry = () => {
    setError('');
    let initialRow: any = { type: assetType };
    if (assetType === 'USER') {
      initialRow = { ...initialRow, username: '', password: '', role: 'USER', division: '', dco: 'Guwahati' };
    } else if (assetType === 'MACHINE') {
      initialRow = {
        ...initialRow,
        asset_tag: `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        subtype: 'Workstation',
        switch_type: '',
        manufacturer: '',
        model_name: 'Generic',
        cpu_serial: '',
        processor: '',
        ram: '',
        storage: '',
        monitor_serial: '',
        keyboard_serial: '',
        mouse_serial: '',
        location: '',
        assigned_to: ''
      };
    } else if (assetType === 'NETWORK') {
      initialRow = { ...initialRow, asset_tag: `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`, manufacturer: '', model_name: 'Generic', ip_address: '', location: '', assigned_to: '' };
    } else if (assetType === 'PRINTER') {
      initialRow = { ...initialRow, asset_tag: `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`, manufacturer: '', model_name: 'Generic', serial_number: '', assigned_to: '', location: '' };
    } else if (assetType === 'SERVER') {
      initialRow = {
        ...initialRow,
        asset_tag: `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        manufacturer: '',
        serial_number: '',
        os: '',
        location: '',
        assigned_to: ''
      };
    }
    setData([initialRow]);
    setFileName('Manual Entry');
  };

  const addRow = () => {
    if (data.length === 0) return;
    const newRow = { ...data[data.length - 1] };
    // Clear values but keep keys
    Object.keys(newRow).forEach(key => {
      if (key !== 'type') newRow[key] = '';
    });
    // Set default role for user if applicable
    if (assetType === 'USER') newRow.role = 'USER';

    setData([...data, newRow]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          setError('File is empty.');
          return;
        }

        // Clean up keys and add type
        const processed = jsonData.map((row: any) => {
          const newRow: any = { type: assetType };
          for (const key in row) {
            const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            // Don't let Excel data override the selected type
            if (normalizedKey !== 'type') {
              let finalKey = normalizedKey;
              // Map Serial Number back to ip_address for Storage category
              if (assetType === 'NETWORK' && (normalizedKey === 'serial_number' || normalizedKey === 'sn')) {
                finalKey = 'ip_address';
              }
              if (assetType === 'MACHINE' && machineSubtype === 'UPS' && (normalizedKey === 'serial_number' || normalizedKey === 'sn')) {
                finalKey = 'cpu_serial';
              }
              newRow[finalKey] = String(row[key]);
            }
          }
          return newRow;
        });

        setData(processed);
      } catch (err) {
        setError('Error parsing file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setData(newData);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setData(data.filter((_, i) => i !== rowIndex));
  };

  const handleSubmit = () => {
    if (data.length === 0) return;
    setError('');

    // Validate required fields
    for (let i = 0; i < data.length; i++) {
      if (assetType === 'USER') {
        const username = data[i].username || data[i].user_name || data[i].user;
        if (!username) {
          setError(`Row ${i + 1} is missing required 'username' field.`);
          return;
        }
        data[i].username = username;
      } else {
        if (!data[i].asset_tag) {
          data[i].asset_tag = `AUTO-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
        }
        if (!data[i].model_name) {
          data[i].model_name = 'Generic';
        }
      }
    }

    bulkMutation.mutate(data);
  };

  // Determine columns from the first row's keys
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'type' && k !== 'asset_tag' && k !== 'model_name') : [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden border border-border transition-colors">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-accent/20 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-foreground">Bulk Entry & Upload</h2>
            <p className="text-sm text-muted-foreground mt-1">Add records manually or upload an Excel file</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!data.length ? (
            <div className="max-w-2xl mx-auto space-y-8 py-8">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4 transition-colors">
                <label className="block text-sm font-semibold text-muted-foreground">1. Select Data Type</label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-medium disabled:opacity-50"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  disabled={permittedType !== 'ALL'}
                >
                  <optgroup label="Assets">
                    {(permittedType === 'ALL' || permittedType === 'MACHINE') && <option value="MACHINE">Machines (Laptops/Desktops)</option>}
                    {(permittedType === 'ALL' || permittedType === 'SERVER') && <option value="SERVER">Servers (Enterprise/Host)</option>}
                    {(permittedType === 'ALL' || permittedType === 'NETWORK') && <option value="NETWORK">Storage Devices (External Drives/Storage)</option>}
                    {(permittedType === 'ALL' || permittedType === 'PRINTER') && <option value="PRINTER">Printers</option>}
                  </optgroup>
                  {permittedType === 'ALL' && (
                    <optgroup label="System">
                      <option value="USER">User Directory</option>
                    </optgroup>
                  )}
                </select>
              </div>

              {assetType === 'MACHINE' && (
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-semibold text-muted-foreground">Select Machine Subtype</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Workstation', 'UPS', 'Switch', 'Router', 'Mux'].map(sub => (
                      <button
                        key={sub}
                        onClick={() => setMachineSubtype(sub)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                          machineSubtype === sub 
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-accent transition-all group flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors">
                    <UploadCloud className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Upload File</h3>
                    <p className="text-xs text-muted-foreground">Excel or CSV formats</p>
                    <button 
                      onClick={() => downloadTemplate(assetType as any, machineSubtype)}
                      className="text-[10px] font-bold text-primary hover:underline mt-1 flex items-center justify-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download {assetType === 'MACHINE' ? machineSubtype : assetType} Template
                    </button>
                  </div>
                  <label className="cursor-pointer inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    <span>Choose File</span>
                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-accent transition-all group flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors">
                    <Save className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Manual Entry</h3>
                    <p className="text-xs text-muted-foreground">Fill in an Excel-like table</p>
                  </div>
                  <button
                    onClick={startManualEntry}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-green-700 bg-green-100 rounded-xl hover:bg-green-200 transition-colors"
                  >
                    Start Manually
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm transition-colors">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/5 rounded-lg">
                    <Save className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {fileName === 'Manual Entry' ? 'Manual Data Entry' : `Preview: ${fileName}`}
                    </h3>
                    <p className="text-xs text-muted-foreground transition-colors">Managing {data.length} records</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={addRow}
                    className="flex items-center px-4 py-2 text-sm font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </button>
                  <button
                    onClick={() => setData([])}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 transition-colors"
                  >
                    Reset & Start Over
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm animate-shake transition-colors">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="border border-border rounded-xl overflow-hidden shadow-sm overflow-x-auto transition-colors">
                <table className="min-w-full divide-y divide-border table-fixed">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-12">#</th>
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {assetType === 'NETWORK' && col === 'ip_address' ? 'Serial Number' : (assetType === 'MACHINE' && machineSubtype === 'UPS' && col === 'cpu_serial') ? 'Serial Number' : (assetType === 'SERVER' && col === 'serial_number') ? 'Serial Number' : col.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-accent/50 transition-colors group">
                        <td className="px-4 py-3 text-xs text-muted-foreground font-medium transition-colors">{rowIndex + 1}</td>
                        {columns.map(col => (
                          <td key={col} className="px-2 py-1">
                            <input
                              type="text"
                              value={row[col] || ''}
                              onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                              placeholder="..."
                              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm text-foreground px-2 py-1.5 rounded transition-all outline-none"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteRow(rowIndex)}
                            className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
                            title="Remove row"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {data.length > 0 && (
          <div className="p-6 border-t border-border bg-accent/20 flex items-center justify-between transition-colors">
            <p className="text-sm text-muted-foreground italic transition-colors">
              * Ensure required fields like <strong>{assetType === 'USER' ? 'username' : 'asset_tag'}</strong> are filled.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-foreground bg-card border border-border rounded-xl hover:bg-accent transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={bulkMutation.isPending}
                className="flex items-center px-8 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {bulkMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Records
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
