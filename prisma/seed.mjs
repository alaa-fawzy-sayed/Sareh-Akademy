import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ============================================================
// بيانات الجامعات والكليات الحقيقية لأسيوط
// ============================================================
const commonSubjects = {
  pharmacy: [
    { key: 'ph-1', nameAr: 'الكيمياء العضوية الصيدلانية', nameEn: 'Pharmaceutical Organic Chemistry', isFree: false, price: 350 },
    { key: 'ph-2', nameAr: 'علم الصيدلة (فارماكولوجي)', nameEn: 'Pharmacology', isFree: false, price: 400 },
    { key: 'ph-3', nameAr: 'التحليل الدوائي', nameEn: 'Pharmaceutical Analysis', isFree: false, price: 350 },
    { key: 'ph-4', nameAr: 'تقنية الأدوية (فارماسيوتيكس)', nameEn: 'Pharmaceutics', isFree: false, price: 350 },
    { key: 'ph-5', nameAr: 'الكيمياء الحيوية', nameEn: 'Biochemistry', isFree: true, price: 0 },
    { key: 'ph-6', nameAr: 'علم الأحياء الدقيقة', nameEn: 'Microbiology', isFree: false, price: 300 },
    { key: 'ph-7', nameAr: 'الكيمياء العامة والتحليلية', nameEn: 'General & Analytical Chemistry', isFree: false, price: 300 },
  ],
  dentistry: [
    { key: 'dent-1', nameAr: 'تشريح الوجه والفكين', nameEn: 'Oral Anatomy', isFree: false, price: 350 },
    { key: 'dent-2', nameAr: 'أمراض اللثة', nameEn: 'Periodontology', isFree: false, price: 350 },
    { key: 'dent-3', nameAr: 'طب الأسنان التحفظي', nameEn: 'Operative Dentistry', isFree: false, price: 400 },
    { key: 'dent-4', nameAr: 'التعويضات السنية', nameEn: 'Prosthodontics', isFree: false, price: 400 },
    { key: 'dent-5', nameAr: 'جراحة الفم والوجه', nameEn: 'Oral Surgery', isFree: false, price: 450 },
    { key: 'dent-6', nameAr: 'تقويم الأسنان', nameEn: 'Orthodontics', isFree: false, price: 450 },
  ],
  science: [
    { key: 'sci-1', nameAr: 'الرياضيات العامة', nameEn: 'General Mathematics', isFree: true, price: 0 },
    { key: 'sci-2', nameAr: 'الفيزياء العامة', nameEn: 'General Physics', isFree: false, price: 250 },
    { key: 'sci-3', nameAr: 'الكيمياء العامة', nameEn: 'General Chemistry', isFree: false, price: 250 },
    { key: 'sci-4', nameAr: 'الأحياء العامة', nameEn: 'General Biology', isFree: false, price: 250 },
    { key: 'sci-5', nameAr: 'الجيولوجيا', nameEn: 'Geology', isFree: false, price: 250 },
  ],
  nursing: [
    { key: 'nur-1', nameAr: 'أسس التمريض', nameEn: 'Fundamentals of Nursing', isFree: false, price: 300 },
    { key: 'nur-2', nameAr: 'تمريض باطني وجراحي', nameEn: 'Medical-Surgical Nursing', isFree: false, price: 350 },
    { key: 'nur-3', nameAr: 'تمريض الأطفال', nameEn: 'Pediatric Nursing', isFree: false, price: 350 },
    { key: 'nur-4', nameAr: 'تمريض النساء والتوليد', nameEn: 'Obstetric & Gynecologic Nursing', isFree: false, price: 350 },
    { key: 'nur-5', nameAr: 'الصحة النفسية', nameEn: 'Psychiatric Mental Health Nursing', isFree: false, price: 300 },
  ],
  veterinary: [
    { key: 'vet-1', nameAr: 'تشريح الحيوان', nameEn: 'Veterinary Anatomy', isFree: false, price: 300 },
    { key: 'vet-2', nameAr: 'فسيولوجيا الحيوان', nameEn: 'Veterinary Physiology', isFree: false, price: 300 },
    { key: 'vet-3', nameAr: 'علم الأوبئة البيطري', nameEn: 'Veterinary Epidemiology', isFree: false, price: 350 },
    { key: 'vet-4', nameAr: 'الجراحة البيطرية', nameEn: 'Veterinary Surgery', isFree: false, price: 400 },
    { key: 'vet-5', nameAr: 'الرقابة على الأغذية', nameEn: 'Food Hygiene & Control', isFree: false, price: 300 },
  ],
  cs: [
    { key: 'cs-1', nameAr: 'برمجة بلغة Python', nameEn: 'Python Programming', isFree: true, price: 0 },
    { key: 'cs-2', nameAr: 'قواعد البيانات', nameEn: 'Database Systems', isFree: false, price: 300 },
    { key: 'cs-3', nameAr: 'هياكل البيانات والخوارزميات', nameEn: 'Data Structures & Algorithms', isFree: false, price: 350 },
    { key: 'cs-4', nameAr: 'شبكات الحاسب', nameEn: 'Computer Networks', isFree: false, price: 350 },
    { key: 'cs-5', nameAr: 'هندسة البرمجيات', nameEn: 'Software Engineering', isFree: false, price: 350 },
    { key: 'cs-6', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', isFree: false, price: 400 },
  ],
  engineering: [
    { key: 'eng-1', nameAr: 'رياضيات هندسية', nameEn: 'Engineering Mathematics', isFree: false, price: 300 },
    { key: 'eng-2', nameAr: 'ميكانيكا تطبيقية', nameEn: 'Applied Mechanics', isFree: false, price: 300 },
    { key: 'eng-3', nameAr: 'مقاومة المواد', nameEn: 'Strength of Materials', isFree: false, price: 350 },
    { key: 'eng-4', nameAr: 'الدوائر الكهربائية', nameEn: 'Electrical Circuits', isFree: false, price: 350 },
    { key: 'eng-5', nameAr: 'رسم هندسي', nameEn: 'Engineering Drawing', isFree: false, price: 300 },
  ],
  medicine: [
    { key: 'med-1', nameAr: 'التشريح العام', nameEn: 'General Anatomy', isFree: false, price: 400 },
    { key: 'med-2', nameAr: 'الفسيولوجيا', nameEn: 'Medical Physiology', isFree: false, price: 400 },
    { key: 'med-3', nameAr: 'الكيمياء الحيوية الطبية', nameEn: 'Medical Biochemistry', isFree: false, price: 350 },
    { key: 'med-4', nameAr: 'الباثولوجيا', nameEn: 'General Pathology', isFree: false, price: 400 },
    { key: 'med-5', nameAr: 'علم الأدوية (فارماكولوجي)', nameEn: 'Medical Pharmacology', isFree: false, price: 450 },
    { key: 'med-6', nameAr: 'الأحياء الدقيقة والمناعة', nameEn: 'Microbiology & Immunology', isFree: false, price: 400 },
  ],
};

const REAL_UNIVERSITIES = [
  // 1. جامعة سفنكس
  {
    slug: 'sphinx',
    nameAr: 'جامعة سفنكس',
    nameEn: 'Sphinx University',
    description: 'جامعة خاصة معتمدة في محافظة أسيوط، تضم كليات متنوعة في الطب والعلوم والتكنولوجيا',
    location: 'أسيوط، مصر',
    logoUrl: '/images/logos/sphinx.jpg',
    displayOrder: 1,
    colleges: [
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', nameEn: 'Faculty of Pharmacy', subjects: commonSubjects.pharmacy },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', nameEn: 'Faculty of Dentistry', subjects: commonSubjects.dentistry },
      { slug: 'science', nameAr: 'كلية العلوم', nameEn: 'Faculty of Science', subjects: commonSubjects.science },
      { slug: 'nursing', nameAr: 'كلية التمريض', nameEn: 'Faculty of Nursing', subjects: commonSubjects.nursing },
      { slug: 'veterinary', nameAr: 'كلية الطب البيطري', nameEn: 'Faculty of Veterinary Medicine', subjects: commonSubjects.veterinary },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', nameEn: 'Faculty of Computers & AI', subjects: commonSubjects.cs },
      { slug: 'engineering', nameAr: 'كلية الهندسة', nameEn: 'Faculty of Engineering', subjects: commonSubjects.engineering },
    ],
  },

  // 2. جامعة أسيوط (الحكومية)
  {
    slug: 'assiut',
    nameAr: 'جامعة أسيوط',
    nameEn: 'Assiut University',
    description: 'إحدى أعرق الجامعات الحكومية في صعيد مصر، تأسست عام 1957',
    location: 'أسيوط، مصر',
    logoUrl: '/images/logos/assiut.jpg',
    displayOrder: 2,
    colleges: [
      { slug: 'medicine', nameAr: 'كلية الطب', nameEn: 'Faculty of Medicine', subjects: commonSubjects.medicine },
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', nameEn: 'Faculty of Pharmacy', subjects: commonSubjects.pharmacy },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', nameEn: 'Faculty of Dentistry', subjects: commonSubjects.dentistry },
      { slug: 'veterinary', nameAr: 'كلية الطب البيطري', nameEn: 'Faculty of Veterinary Medicine', subjects: commonSubjects.veterinary },
      { slug: 'science', nameAr: 'كلية العلوم', nameEn: 'Faculty of Science', subjects: commonSubjects.science },
      { slug: 'engineering', nameAr: 'كلية الهندسة', nameEn: 'Faculty of Engineering', subjects: commonSubjects.engineering },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', nameEn: 'Faculty of Computers & AI', subjects: commonSubjects.cs },
    ],
  },

  // 3. جامعة أسيوط الأهلية
  {
    slug: 'new-assiut',
    nameAr: 'جامعة أسيوط الأهلية',
    nameEn: 'New Assiut University',
    description: 'جامعة أهلية حديثة توفر تعليماً جامعياً متميزاً في محافظة أسيوط',
    location: 'أسيوط الجديدة، مصر',
    logoUrl: '/images/logos/new-assiut.jpg',
    displayOrder: 3,
    colleges: [
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', nameEn: 'Faculty of Pharmacy', subjects: commonSubjects.pharmacy },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', nameEn: 'Faculty of Dentistry', subjects: commonSubjects.dentistry },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', nameEn: 'Faculty of Computers & AI', subjects: commonSubjects.cs },
      { slug: 'engineering', nameAr: 'كلية الهندسة', nameEn: 'Faculty of Engineering', subjects: commonSubjects.engineering },
      { slug: 'nursing', nameAr: 'كلية التمريض', nameEn: 'Faculty of Nursing', subjects: commonSubjects.nursing },
    ],
  },

  // 4. جامعة بدر أسيوط
  {
    slug: 'badr',
    nameAr: 'جامعة بدر أسيوط',
    nameEn: 'Badr University in Assiut',
    description: 'جامعة خاصة متكاملة تهدف إلى تقديم تعليم عالي الجودة وفق المعايير الدولية',
    location: 'ناصر الجديدة (غرب أسيوط)',
    logoUrl: '/images/logos/badr.jpg',
    displayOrder: 4,
    colleges: [
      { slug: 'medicine', nameAr: 'كلية الطب', nameEn: 'Faculty of Medicine', subjects: commonSubjects.medicine },
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', nameEn: 'Faculty of Pharmacy', subjects: commonSubjects.pharmacy },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', nameEn: 'Faculty of Dentistry', subjects: commonSubjects.dentistry },
      { slug: 'nursing', nameAr: 'كلية التمريض', nameEn: 'Faculty of Nursing', subjects: commonSubjects.nursing },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', nameEn: 'Faculty of Computers & AI', subjects: commonSubjects.cs },
      { slug: 'engineering', nameAr: 'كلية الهندسة', nameEn: 'Faculty of Engineering', subjects: commonSubjects.engineering },
    ],
  },

  // 5. جامعة الأزهر أسيوط
  {
    slug: 'azhar',
    nameAr: 'جامعة الأزهر أسيوط',
    nameEn: 'Al-Azhar University (Assiut Branch)',
    description: 'فرع جامعة الأزهر في أسيوط، تجمع بين التعليم الديني والعلمي والتقني',
    location: 'أسيوط، مصر',
    logoUrl: '/images/logos/azhar.jpg',
    displayOrder: 5,
    colleges: [
      { slug: 'medicine', nameAr: 'كلية الطب', nameEn: 'Faculty of Medicine', subjects: commonSubjects.medicine },
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', nameEn: 'Faculty of Pharmacy', subjects: commonSubjects.pharmacy },
      { slug: 'science', nameAr: 'كلية العلوم', nameEn: 'Faculty of Science', subjects: commonSubjects.science },
      { slug: 'engineering', nameAr: 'كلية الهندسة', nameEn: 'Faculty of Engineering', subjects: commonSubjects.engineering },
      {
        slug: 'sharia',
        nameAr: 'كلية الشريعة والقانون',
        nameEn: 'Faculty of Sharia & Law',
        subjects: [
          { key: 'azhar-sh-1', nameAr: 'الفقه الإسلامي', nameEn: 'Islamic Jurisprudence', isFree: false, price: 250 },
          { key: 'azhar-sh-2', nameAr: 'أصول الفقه', nameEn: 'Usul al-Fiqh', isFree: false, price: 250 },
          { key: 'azhar-sh-3', nameAr: 'القانون المدني', nameEn: 'Civil Law', isFree: false, price: 300 },
          { key: 'azhar-sh-4', nameAr: 'قانون الأسرة', nameEn: 'Family Law', isFree: false, price: 300 },
        ],
      },
      {
        slug: 'arabic',
        nameAr: 'كلية اللغة العربية',
        nameEn: 'Faculty of Arabic Language',
        subjects: [
          { key: 'azhar-ar-1', nameAr: 'النحو والصرف', nameEn: 'Grammar & Morphology', isFree: false, price: 250 },
          { key: 'azhar-ar-2', nameAr: 'البلاغة العربية', nameEn: 'Arabic Rhetoric', isFree: false, price: 250 },
          { key: 'azhar-ar-3', nameAr: 'الأدب العربي القديم', nameEn: 'Classical Arabic Literature', isFree: false, price: 250 },
          { key: 'azhar-ar-4', nameAr: 'علوم القرآن الكريم', nameEn: 'Quranic Sciences', isFree: true, price: 0 },
        ],
      },
    ],
  },
];

async function main() {
  console.log('🌱 Starting database seed with real Assiut Universities...');

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
  console.log('✅ Super admin user ready: admin@top-pharma.com / admin123456');

  // 3. Seed Real Universities, Colleges, Academic Years, Semesters & Subjects
  for (const u of REAL_UNIVERSITIES) {
    const university = await prisma.university.upsert({
      where: { slug: u.slug },
      update: {
        nameAr: u.nameAr,
        nameEn: u.nameEn,
        location: u.location,
        description: u.description,
        logoUrl: u.logoUrl,
        displayOrder: u.displayOrder,
        isActive: true,
      },
      create: {
        slug: u.slug,
        nameAr: u.nameAr,
        nameEn: u.nameEn,
        location: u.location,
        description: u.description,
        logoUrl: u.logoUrl,
        displayOrder: u.displayOrder,
        isActive: true,
      },
    });

    for (let cIdx = 0; cIdx < u.colleges.length; cIdx++) {
      const col = u.colleges[cIdx];
      const collegeSlug = `${u.slug}-${col.slug}`;

      const college = await prisma.college.upsert({
        where: { slug: collegeSlug },
        update: {
          nameAr: col.nameAr,
          nameEn: col.nameEn,
          displayOrder: cIdx + 1,
          isActive: true,
        },
        create: {
          slug: collegeSlug,
          nameAr: col.nameAr,
          nameEn: col.nameEn,
          displayOrder: cIdx + 1,
          universityId: university.id,
          isActive: true,
        },
      });

      // Create Academic Year 1
      let academicYear = await prisma.academicYear.findFirst({
        where: { collegeId: college.id, displayOrder: 1 },
      });

      if (!academicYear) {
        academicYear = await prisma.academicYear.create({
          data: {
            nameAr: 'الفرقة الأولى',
            nameEn: 'First Year',
            displayOrder: 1,
            collegeId: college.id,
          },
        });
      }

      // Create Semester 1
      let semester = await prisma.semester.findFirst({
        where: { academicYearId: academicYear.id, displayOrder: 1 },
      });

      if (!semester) {
        semester = await prisma.semester.create({
          data: {
            nameAr: 'الفصل الدراسي الأول',
            nameEn: 'First Semester',
            displayOrder: 1,
            academicYearId: academicYear.id,
          },
        });
      }

      // Seed subjects under this college / semester
      for (const sub of col.subjects) {
        const subSlug = `${u.slug}-${col.slug}-${sub.key}`;
        await prisma.subject.upsert({
          where: { slug: subSlug },
          update: {
            nameAr: sub.nameAr,
            nameEn: sub.nameEn,
            semesterId: semester.id,
            isFree: sub.isFree,
            price: sub.price,
            isPublished: true,
          },
          create: {
            slug: subSlug,
            nameAr: sub.nameAr,
            nameEn: sub.nameEn,
            description: `مقرر ${sub.nameAr} لطلاب ${col.nameAr} بـ ${u.nameAr}`,
            isFree: sub.isFree,
            price: sub.price,
            isPublished: true,
            semesterId: semester.id,
          },
        });
      }
    }
  }

  console.log('✅ Sphinx, Assiut Gov, New Assiut, Badr Assiut, and Al-Azhar Assiut successfully seeded with their real logos and colleges!');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
