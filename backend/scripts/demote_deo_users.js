const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const usernames = ['DEO_DCC01', 'DEO_DCC02', 'DEO_DCC03'];
  console.log(`Updating roles for ${usernames.join(', ')} to USER...`);
  
  const result = await prisma.user.updateMany({
    where: {
      username: {
        in: usernames
      }
    },
    data: {
      role: 'USER'
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
