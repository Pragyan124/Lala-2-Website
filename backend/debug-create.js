const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Machine creation...');
    const inv = await prisma.inventory.create({
      data: {
        asset_tag: 'TEST-TAG-' + Date.now(),
        type: 'MACHINE',
      }
    });
    await prisma.machine.create({
      data: {
        inventory_id: inv.id,
        asset_tag: inv.asset_tag,
        manufacturer: 'Test',
        model_name: 'Test',
        assigned_to: 'Test User',
        location: 'Test Loc'
      }
    });
    console.log('Machine created successfully!');

    console.log('Testing Printer creation...');
    const inv2 = await prisma.inventory.create({
      data: {
        asset_tag: 'TEST-PRINTER-' + Date.now(),
        type: 'PRINTER',
      }
    });
    await prisma.printer.create({
      data: {
        inventory_id: inv2.id,
        asset_tag: inv2.asset_tag,
        manufacturer: 'Test',
        model_name: 'Test',
        assigned_to: 'Test User',
        location: 'Test Loc'
      }
    });
    console.log('Printer created successfully!');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
