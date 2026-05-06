const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return val;
}

async function dump() {
  console.log('-- Users');
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`INSERT INTO "User" ("user_id", "username", "password", "role", "division", "dcom", "created_by", "created_at", "modified_by", "modified_at") VALUES (${u.user_id}, ${escape(u.username)}, ${escape(u.password)}, ${escape(u.role)}, ${escape(u.division)}, ${escape(u.dcom)}, ${escape(u.created_by)}, ${escape(u.created_at)}, ${escape(u.modified_by)}, ${escape(u.modified_at)});`);
  }

  console.log('\n-- Inventory');
  const inventory = await prisma.inventory.findMany();
  for (const i of inventory) {
    console.log(`INSERT INTO "Inventory" ("id", "asset_tag", "type", "created_by", "created_at") VALUES (${i.id}, ${escape(i.asset_tag)}, ${escape(i.type)}, ${escape(i.created_by)}, ${escape(i.created_at)});`);
  }
  
  console.log('\n-- Machines');
  const machines = await prisma.machine.findMany();
  for (const m of machines) {
    console.log(`INSERT INTO "Machine" ("id", "inventory_id", "asset_tag", "manufacturer", "model_name", "cpu_serial", "monitor_serial", "keyboard_serial", "mouse_serial", "location", "assigned_to", "created_by", "created_at") VALUES (${m.id}, ${m.inventory_id}, ${escape(m.asset_tag)}, ${escape(m.manufacturer)}, ${escape(m.model_name)}, ${escape(m.cpu_serial)}, ${escape(m.monitor_serial)}, ${escape(m.keyboard_serial)}, ${escape(m.mouse_serial)}, ${escape(m.location)}, ${escape(m.assigned_to)}, ${escape(m.created_by)}, ${escape(m.created_at)});`);
  }

  console.log('\n-- Networks');
  const networks = await prisma.network.findMany();
  for (const n of networks) {
    console.log(`INSERT INTO "Network" ("id", "inventory_id", "asset_tag", "manufacturer", "model_name", "ip_address", "assigned_to", "created_by", "created_at") VALUES (${n.id}, ${n.inventory_id}, ${escape(n.asset_tag)}, ${escape(n.manufacturer)}, ${escape(n.model_name)}, ${escape(n.ip_address)}, ${escape(n.assigned_to)}, ${escape(n.created_by)}, ${escape(n.created_at)});`);
  }

  console.log('\n-- Printers');
  const printers = await prisma.printer.findMany();
  for (const p of printers) {
    console.log(`INSERT INTO "Printer" ("id", "inventory_id", "asset_tag", "manufacturer", "model_name", "assigned_to", "location", "created_by", "created_at") VALUES (${p.id}, ${p.inventory_id}, ${escape(p.asset_tag)}, ${escape(p.manufacturer)}, ${escape(p.model_name)}, ${escape(p.assigned_to)}, ${escape(p.location)}, ${escape(p.created_by)}, ${escape(p.created_at)});`);
  }
}

dump().then(() => prisma.$disconnect()).catch(console.error);
