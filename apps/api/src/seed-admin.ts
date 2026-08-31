import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // 1. Roles
  const roles = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'STUDENT', 'TEACHER'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true },
    });
  }

  // 2. Admin User
  const email = 'admin@top-pharma.com';
  const passwordHash = await argon2.hash('admin123456');

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true, isEmailVerified: true },
    create: {
      email,
      firstName: 'مدير',
      lastName: 'المنصة',
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (superAdminRole) {
    await prisma.userRole_Assignment.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    });
  }

  console.log('ADMIN_CREATED_SUCCESS');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
