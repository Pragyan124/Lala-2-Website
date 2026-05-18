const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing modified_at with created_at for existing records...');
  
  // Update Inventory
  const inventories = await prisma.inventory.findMany();
  for (const item of inventories) {
    await prisma.inventory.update({
      where: { id: item.id },
      data: { modified_at: item.created_at }
    });
  }
  console.log(`Updated ${inventories.length} inventory records.`);

  // Update Machines
  const machines = await prisma.machine.findMany();
  for (const item of machines) {
    await prisma.machine.update({
      where: { id: item.id },
      data: { modified_at: item.created_at }
    });
  }
  console.log(`Updated ${machines.length} machine records.`);

  // Update Tickets
  const tickets = await prisma.ticket.findMany();
  for (const item of tickets) {
    await prisma.ticket.update({
      where: { id: item.id },
      data: { modified_at: item.created_at }
    });
  }
  console.log(`Updated ${tickets.length} ticket records.`);

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
