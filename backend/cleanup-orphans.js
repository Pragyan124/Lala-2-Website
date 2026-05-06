const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        machine: true,
        network: true,
        printer: true,
        server: true
      }
    });

    const orphans = inventory.filter(item => 
      !item.machine && !item.network && !item.printer && !item.server
    );

    console.log(`Found ${orphans.length} orphan records.`);
    for (const orphan of orphans) {
      console.log(`Deleting orphan: ${orphan.asset_tag}`);
      await prisma.inventory.delete({ where: { id: orphan.id } });
    }
    console.log('Cleanup complete.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
