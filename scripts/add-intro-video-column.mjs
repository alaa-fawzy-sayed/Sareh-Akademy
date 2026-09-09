import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding introVideoUrl to subjects table...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "introVideoUrl" TEXT;`);
  console.log('Column added successfully or already exists!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
