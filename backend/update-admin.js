const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.update({
    where: { username: 'admin' },
    data: { role: 'ADMIN' }
  });
  console.log('Updated admin user:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
