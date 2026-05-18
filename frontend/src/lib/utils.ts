import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadTemplate(type: 'MACHINE' | 'NETWORK' | 'PRINTER' | 'SERVER' | 'USER', subtype?: string) {
  let headers: string[] = [];
  let fileName = '';

  switch (type) {
    case 'MACHINE':
      if (subtype === 'UPS' || subtype === 'Switch' || subtype === 'Router' || subtype === 'Mux') {
        headers = ['subtype', 'switch_type', 'manufacturer', 'serial_number', 'location', 'assigned_to'];
        fileName = `${subtype}_Template.xlsx`;
      } else {
        // Default to Workstation
        headers = [
          'manufacturer', 
          'cpu_serial', 'monitor_serial', 'keyboard_serial', 'mouse_serial', 
          'processor', 'ram', 'storage', 'location', 'assigned_to'
        ];
        fileName = 'Workstation_Template.xlsx';
      }
      break;
    case 'NETWORK':
      headers = ['manufacturer', 'serial_number', 'location', 'assigned_to'];
      fileName = 'Storage_Template.xlsx';
      break;
    case 'PRINTER':
      headers = ['manufacturer', 'serial_number', 'assigned_to'];
      fileName = 'Printer_Template.xlsx';
      break;
    case 'SERVER':
      headers = ['manufacturer', 'serial_number', 'os', 'location', 'assigned_to'];
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
