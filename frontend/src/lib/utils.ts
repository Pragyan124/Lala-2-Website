import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadTemplate(type: 'MACHINE' | 'NETWORK' | 'PRINTER' | 'SERVER' | 'USER') {
  let headers: string[] = [];
  let fileName = '';

  switch (type) {
    case 'MACHINE':
      headers = [
        'asset_tag', 'subtype', 'switch_type', 'manufacturer', 'model_name', 
        'cpu_serial', 'monitor_serial', 'keyboard_serial', 'mouse_serial', 
        'processor', 'ram', 'storage', 'ip_address', 'mac_address', 'vlan', 'location'
      ];
      fileName = 'Machine_Template.xlsx';
      break;
    case 'NETWORK':
      headers = ['asset_tag', 'manufacturer', 'model_name', 'ip_address', 'mac_address', 'vlan', 'location'];
      fileName = 'Network_Template.xlsx';
      break;
    case 'PRINTER':
      headers = ['asset_tag', 'manufacturer', 'model_name', 'assigned_to'];
      fileName = 'Printer_Template.xlsx';
      break;
    case 'SERVER':
      headers = [
        'asset_tag', 'host_name', 'form_factor', 'cpu_core_count', 'ram_capacity', 
        'storage_config', 'ip_address', 'mac_address', 'subnet_vlan', 'gateway_dns', 
        'open_ports', 'os', 'kernel_version', 'env_tag', 'role_service'
      ];
      fileName = 'Server_Template.xlsx';
      break;
    case 'USER':
      headers = ['username', 'password', 'role', 'division', 'dco', 'permitted_type'];
      fileName = 'User_Template.xlsx';
      break;
  }

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, fileName);
}
