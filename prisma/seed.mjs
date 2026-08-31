import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Super Administrator with all permissions' },
    { name: 'ADMIN', description: 'Administrator' },
    { name: 'CONTENT_MANAGER', description: 'Content Manager' },
    { name: 'STUDENT', description: 'Student' },
    { name: 'TEACHER', description: 'Teacher / Instructor' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, isSystem: true },
    });
  }
  console.log('✅ Roles seeded');

  // 2. Create Super Admin User
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const adminEmail = 'admin@top-pharma.com';
  const passwordHash = await argon2.hash('admin123456');

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, isActive: true, isEmailVerified: true },
    create: {
      email: adminEmail,
      firstName: 'مدير',
      lastName: 'المنصة',
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    },
  });

  if (superAdminRole) {
    await prisma.userRole_Assignment.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }
  console.log('✅ Super admin user created: admin@top-pharma.com / admin123456');

  // 3. Create Sample Universities
  const universities = [
    {
      slug: 'cairo',
      nameAr: 'جامعة القاهرة',
      nameEn: 'Cairo University',
      location: 'الجيزة',
      description: 'أعرق الجامعات المصرية والعربية في مجال الصيدلة والعلوم الطبية',
      isActive: true,
      displayOrder: 1,
    },
    {
      slug: 'alexandria',
      nameAr: 'جامعة الإسكندرية',
      nameEn: 'Alexandria University',
      location: 'الإسكندرية',
      description: 'جامعة الإسكندرية العريقة كمركز أكاديمي وصيدلي متقدم',
      isActive: true,
      displayOrder: 2,
    },
    {
      slug: 'ain-shams',
      nameAr: 'جامعة عين شمس',
      nameEn: 'Ain Shams University',
      location: 'القاهرة',
      description: 'جامعة عين شمس الرائدة في كليات الصيدلة ومستشفياتها التعليمية',
      isActive: true,
      displayOrder: 3,
    },
    {
      slug: 'mansoura',
      nameAr: 'جامعة المنصورة',
      nameEn: 'Mansoura University',
      location: 'المنصورة',
      description: 'جامعة المنصورة المتميزة في الأبحاث والتعليم الصيدلي والطبية',
      isActive: true,
      displayOrder: 4,
    },
  ];

  for (const u of universities) {
    const uni = await prisma.university.upsert({
      where: { slug: u.slug },
      update: u,
      create: u,
    });

    // 4. Create Pharmacy College for each university
    const college = await prisma.college.upsert({
      where: { slug: `${u.slug}-pharmacy` },
      update: {
        nameAr: 'كلية الصيدلة',
        nameEn: 'Faculty of Pharmacy',
        isActive: true,
        universityId: uni.id,
      },
      create: {
        slug: `${u.slug}-pharmacy`,
        nameAr: 'كلية الصيدلة',
        nameEn: 'Faculty of Pharmacy',
        description: 'دراسات الصيدلة وعلم الأدوية والتركيبات الطبية',
        isActive: true,
        displayOrder: 1,
        universityId: uni.id,
      },
    });

    // 5. Create Academic Years for Pharmacy
    const academicYears = [
      { key: 'year-1', nameAr: 'الفرقة الأولى', nameEn: 'First Year', displayOrder: 1 },
      { key: 'year-2', nameAr: 'الفرقة الثانية', nameEn: 'Second Year', displayOrder: 2 },
      { key: 'year-3', nameAr: 'الفرقة الثالثة', nameEn: 'Third Year', displayOrder: 3 },
      { key: 'year-4', nameAr: 'الفرقة الرابعة', nameEn: 'Fourth Year', displayOrder: 4 },
      { key: 'year-5', nameAr: 'الفرقة الخامسة', nameEn: 'Fifth Year', displayOrder: 5 },
    ];

    for (const ay of academicYears) {
      const year = await prisma.academicYear.create({
        data: {
          nameAr: ay.nameAr,
          nameEn: ay.nameEn,
          displayOrder: ay.displayOrder,
          collegeId: college.id,
        },
      });

      // 6. Create Semesters
      const semesters = [
        { nameAr: 'الفصل الدراسي الأول', nameEn: 'First Semester', displayOrder: 1 },
        { nameAr: 'الفصل الدراسي الثاني', nameEn: 'Second Semester', displayOrder: 2 },
      ];

      for (const sem of semesters) {
        const semester = await prisma.semester.create({
          data: {
            nameAr: sem.nameAr,
            nameEn: sem.nameEn,
            displayOrder: sem.displayOrder,
            academicYearId: year.id,
          },
        });

        // 7. Seed specific pharmacy subjects requested by the user
        const pharmacySubjects = [
          // الفرقة الأولى - الترم الأول
          { key: 'org-1', nameAr: 'Organic chemistry I', nameEn: 'Organic Chemistry I', semOrder: 1, yearOrder: 1 },
          { key: 'anal-1', nameAr: 'Analytical chemistry I', nameEn: 'Analytical Chemistry I', semOrder: 1, yearOrder: 1 },
          { key: 'math', nameAr: 'Math', nameEn: 'Mathematics', semOrder: 1, yearOrder: 1 },
          { key: 'med-plants', nameAr: 'Medicinal plants', nameEn: 'Medicinal Plants', semOrder: 1, yearOrder: 1 },

          // الفرقة الأولى - الترم الثاني
          { key: 'org-2', nameAr: 'Organic chemistry II', nameEn: 'Organic Chemistry II', semOrder: 2, yearOrder: 1 },
          { key: 'anal-2', nameAr: 'Analytical chemistry II', nameEn: 'Analytical Chemistry II', semOrder: 2, yearOrder: 1 },
          { key: 'phys-pharm', nameAr: 'Physical pharmacy', nameEn: 'Physical Pharmacy', semOrder: 2, yearOrder: 1 },

          // الفرقة الثانية
          { key: 'physiology', nameAr: 'Physiology', nameEn: 'Physiology', semOrder: 1, yearOrder: 2 },
          { key: 'pharmacog', nameAr: 'Pharmacognosy', nameEn: 'Pharmacognosy', semOrder: 2, yearOrder: 2 },

          // الفرقة الثالثة والرابعة
          { key: 'pharma-1', nameAr: 'Pharmacology I', nameEn: 'Pharmacology I', semOrder: 1, yearOrder: 3 },
          { key: 'pharma-2', nameAr: 'Pharmacology II', nameEn: 'Pharmacology II', semOrder: 2, yearOrder: 3 },
          { key: 'pharma-3', nameAr: 'Pharmacology III', nameEn: 'Pharmacology III', semOrder: 1, yearOrder: 4 },
        ];

        // Filter subjects that belong to this year and semester
        const targetSubjects = pharmacySubjects.filter(
          (sub) => sub.yearOrder === ay.displayOrder && sub.semOrder === sem.displayOrder
        );

        for (const sub of targetSubjects) {
          await prisma.subject.create({
            data: {
              slug: `${u.slug}-${sub.key}`,
              nameAr: sub.nameAr,
              nameEn: sub.nameEn,
              description: `مقرر ${sub.nameAr} لطلاب كلية الصيدلة بـ ${u.nameAr}`,
              isFree: false,
              isPublished: true,
              semesterId: semester.id,
              price: 350.00,
            },
          });
        }
      }
    }
  }

  console.log('✅ Cairo, Alexandria, Ain Shams, Mansoura Universities seeded with Pharmacy College and all requested subjects!');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
