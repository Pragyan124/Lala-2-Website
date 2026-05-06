import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all users DCO to Guwahati...');
  
  const result = await prisma.user.updateMany({
    data: {
      dco: 'Guwahati'
    }
  });
  
  console.log(`Updated ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
