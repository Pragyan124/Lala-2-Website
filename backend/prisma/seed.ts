import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create initial user
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: 'password123', // should be hashed in prod
      role: 'ADMIN',
      division: 'IT Operations',
      dco: 'Guwahati',
    }
  });

  console.log('Created Admin User:', adminUser.username);

  // Create Machine
  const machineInventory = await prisma.inventory.create({
    data: {
      asset_tag: 'ASSET-MC-2026-001',
      type: 'MACHINE',
      created_by: adminUser.user_id,
      machine: {
        create: {
          asset_tag: 'ASSET-MC-2026-001',
          manufacturer: 'Dell',
          model_name: 'Latitude 5420',
          cpu_serial: 'CPU-998877-X',
          monitor_serial: 'MON-4455-DELL',
          keyboard_serial: 'KB-1122-LOGI',
          mouse_serial: 'MS-3344-LOGI',
          location: 'Level 4, IT Department',
          created_by: adminUser.user_id,
        }
      }
    }
  });

  // Create Network
  const networkInventory = await prisma.inventory.create({
    data: {
      asset_tag: 'ASSET-NW-2026-042',
      type: 'NETWORK',
      created_by: adminUser.user_id,
      network: {
        create: {
          asset_tag: 'ASSET-NW-2026-042',
          manufacturer: 'Cisco',
          model_name: 'Catalyst 9300',
          ip_address: '192.168.10.254',
          assigned_to: 'Core Switch Stack A',
          created_by: adminUser.user_id,
        }
      }
    }
  });

  // Create Printer
  const printerInventory = await prisma.inventory.create({
    data: {
      asset_tag: 'ASSET-PR-2026-009',
      type: 'PRINTER',
      created_by: adminUser.user_id,
      printer: {
        create: {
          asset_tag: 'ASSET-PR-2026-009',
          manufacturer: 'HP',
          model_name: 'LaserJet Pro M404n',
          assigned_to: 'Accounting Office - Room 102',
          created_by: adminUser.user_id,
        }
      }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
