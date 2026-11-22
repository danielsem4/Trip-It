import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma';

// Usage: npm run user:create -- <email> <name> <password> [ADMIN|USER]
async function main() {
  const [email, name, password, role = 'USER'] = process.argv.slice(2);
  if (!email || !name || !password) {
    throw new Error('Usage: npm run user:create -- <email> <name> <password> [ADMIN|USER]');
  }
  if (role !== 'ADMIN' && role !== 'USER') {
    throw new Error(`Invalid role: ${role}`);
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { name, hashPassword, role, isActive: true },
    create: { email: normalizedEmail, name, hashPassword, role },
  });

  console.log(`User ready: ${user.email} (id ${user.id}, ${user.role})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
