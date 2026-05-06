const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// This script transfers data from the old SQLite file (dev2.db) 
// to your new MySQL database configured in .env

async function migrate() {
  const mysql = new PrismaClient();
  const sqliteDbPath = path.join(__dirname, 'prisma', 'dev2.db');
  
  const sqlite = new sqlite3.Database(sqliteDbPath);

  console.log('🚀 Starting Migration from SQLite to MySQL...');

  const query = (sql) => new Promise((resolve, reject) => {
    sqlite.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  try {
    // 1. Transfer Users
    console.log('👥 Migrating Users...');
    const users = await query('SELECT * FROM User');
    for (const user of users) {
      await mysql.user.upsert({
        where: { username: user.username },
        update: {},
        create: {
          user_id: user.user_id,
          username: user.username,
          password: user.password,
          role: user.role,
          division: user.division,
          dco: user.dcom,
          permitted_type: user.permitted_type || 'ALL',
          created_at: new Date(user.created_at),
          created_by_name: user.created_by_name
        }
      });
    }
    console.log(`✅ Migrated ${users.length} users.`);

    // 2. Transfer Inventory
    console.log('📦 Migrating Inventory Base...');
    const inventory = await query('SELECT * FROM Inventory');
    for (const item of inventory) {
      await mysql.inventory.upsert({
        where: { asset_tag: item.asset_tag },
        update: {},
        create: {
          id: item.id,
          asset_tag: item.asset_tag,
          type: item.type,
          created_at: new Date(item.created_at),
          created_by: item.created_by,
          created_by_name: item.created_by_name
        }
      });
    }
    console.log(`✅ Migrated ${inventory.length} inventory records.`);

    // 3. Transfer Machines
    console.log('💻 Migrating Machines...');
    const machines = await query('SELECT * FROM Machine');
    for (const m of machines) {
      await mysql.machine.upsert({
        where: { asset_tag: m.asset_tag },
        update: {},
        create: {
          id: m.id,
          inventory_id: m.inventory_id,
          asset_tag: m.asset_tag,
          manufacturer: m.manufacturer,
          model_name: m.model_name,
          cpu_serial: m.cpu_serial,
          monitor_serial: m.monitor_serial,
          keyboard_serial: m.keyboard_serial,
          mouse_serial: m.mouse_serial,
          location: m.location,
          created_at: new Date(m.created_at),
          created_by: m.created_by
        }
      });
    }

    // 4. Transfer Networks
    console.log('🌐 Migrating Network Assets...');
    const networks = await query('SELECT * FROM Network');
    for (const n of networks) {
      await mysql.network.upsert({
        where: { asset_tag: n.asset_tag },
        update: {},
        create: {
          id: n.id,
          inventory_id: n.inventory_id,
          asset_tag: n.asset_tag,
          manufacturer: n.manufacturer,
          model_name: n.model_name,
          ip_address: n.ip_address,
          assigned_to: n.assigned_to,
          created_at: new Date(n.created_at),
          created_by: n.created_by
        }
      });
    }

    // 5. Transfer Printers
    console.log('🖨️ Migrating Printers...');
    const printers = await query('SELECT * FROM Printer');
    for (const p of printers) {
      await mysql.printer.upsert({
        where: { asset_tag: p.asset_tag },
        update: {},
        create: {
          id: p.id,
          inventory_id: p.inventory_id,
          asset_tag: p.asset_tag,
          manufacturer: p.manufacturer,
          model_name: p.model_name,
          assigned_to: p.assigned_to,
          created_at: new Date(p.created_at),
          created_by: p.created_by
        }
      });
    }

    console.log('🎉 Migration Complete! Your MySQL database is now ready.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    sqlite.close();
    await mysql.$disconnect();
  }
}

migrate();
