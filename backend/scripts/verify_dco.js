const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying user records...');
  
  const users = await prisma.user.findMany();
  
  users.forEach(u => {
    console.log(`User: ${u.username}, Role: ${u.role}, DCO: ${u.dco}`);
    if (u.dco !== 'Guwahati') {
      console.error(`ERROR: User ${u.username} has DCO ${u.dco}, expected Guwahati`);
    }
  });
  
  console.log('Verification complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
