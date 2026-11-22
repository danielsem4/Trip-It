import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma';

async function main() {
  const email = 'admin@tripit.local';
  const hashPassword = await bcrypt.hash('Admin1234!', 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', hashPassword, role: 'ADMIN' },
  });

  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
