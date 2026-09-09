import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_COLLEGES = [
  {
    key: 'medicine',
    suffix: 'medicine',
    nameAr: 'كلية الطب',
    nameEn: 'Faculty of Medicine',
    displayOrder: 1,
    subjects: [
      { key: 'med-1', nameAr: 'التشريح العام', nameEn: 'General Anatomy', isFree: false, price: 400 },
      { key: 'med-2', nameAr: 'الفسيولوجيا الطبية', nameEn: 'Medical Physiology', isFree: false, price: 400 },
      { key: 'med-3', nameAr: 'الكيمياء الحيوية الطبية', nameEn: 'Medical Biochemistry', isFree: false, price: 350 },
      { key: 'med-4', nameAr: 'علم الأمراض (الباثولوجيا)', nameEn: 'General Pathology', isFree: false, price: 400 },
      { key: 'med-5', nameAr: 'علم الأدوية (فارماكولوجي)', nameEn: 'Medical Pharmacology', isFree: false, price: 450 },
      { key: 'med-6', nameAr: 'الأحياء الدقيقة والمناعة', nameEn: 'Microbiology & Immunology', isFree: true, price: 0 },
    ],
  },
  {
    key: 'dentistry',
    suffix: 'dentistry',
    nameAr: 'كلية طب الأسنان',
    nameEn: 'Faculty of Dentistry',
    displayOrder: 2,
    subjects: [
      { key: 'dent-1', nameAr: 'تشريح الوجه والفكين', nameEn: 'Oral Anatomy', isFree: false, price: 350 },
      { key: 'dent-2', nameAr: 'أمراض اللثة', nameEn: 'Periodontology', isFree: false, price: 350 },
      { key: 'dent-3', nameAr: 'طب الأسنان التحفظي', nameEn: 'Operative Dentistry', isFree: false, price: 400 },
      { key: 'dent-4', nameAr: 'التعويضات السنية', nameEn: 'Prosthodontics', isFree: false, price: 400 },
      { key: 'dent-5', nameAr: 'جراحة الفم والوجه', nameEn: 'Oral Surgery', isFree: false, price: 450 },
      { key: 'dent-6', nameAr: 'تقويم الأسنان', nameEn: 'Orthodontics', isFree: true, price: 0 },
    ],
  },
  {
    key: 'pharmacy',
    suffix: 'pharmacy',
    nameAr: 'كلية الصيدلة',
    nameEn: 'Faculty of Pharmacy',
    displayOrder: 3,
    subjects: [
      { key: 'ph-1', nameAr: 'الكيمياء العضوية الصيدلانية', nameEn: 'Pharmaceutical Organic Chemistry', isFree: false, price: 350 },
      { key: 'ph-2', nameAr: 'علم الأدوية (فارماكولوجي)', nameEn: 'Pharmacology', isFree: false, price: 400 },
      { key: 'ph-3', nameAr: 'التحليل الدوائي', nameEn: 'Pharmaceutical Analysis', isFree: false, price: 350 },
      { key: 'ph-4', nameAr: 'تقنية الأدوية (فارماسيوتيكس)', nameEn: 'Pharmaceutics', isFree: false, price: 350 },
      { key: 'ph-5', nameAr: 'الكيمياء الحيوية', nameEn: 'Biochemistry', isFree: true, price: 0 },
      { key: 'ph-6', nameAr: 'علم الأحياء الدقيقة', nameEn: 'Microbiology', isFree: false, price: 300 },
    ],
  },
  {
    key: 'pt',
    suffix: 'pt',
    nameAr: 'كلية العلاج الطبيعي',
    nameEn: 'Faculty of Physical Therapy',
    displayOrder: 4,
    subjects: [
      { key: 'pt-1', nameAr: 'تشريح الجهاز الحركي', nameEn: 'Musculoskeletal Anatomy', isFree: false, price: 350 },
      { key: 'pt-2', nameAr: 'الميكانيكا الحيوية وعلم الحركة', nameEn: 'Biomechanics & Kinesiology', isFree: false, price: 400 },
      { key: 'pt-3', nameAr: 'التمارين العلاجية', nameEn: 'Therapeutic Exercise', isFree: false, price: 400 },
      { key: 'pt-4', nameAr: 'العلاج الكهربائي والوسائل الفيزيائية', nameEn: 'Electrotherapy', isFree: false, price: 350 },
      { key: 'pt-5', nameAr: 'العلاج الطبيعي للجهاز العضلي والعظمي', nameEn: 'Orthopedic PT', isFree: false, price: 450 },
      { key: 'pt-6', nameAr: 'العلاج الطبيعي لأمراض الأعصاب', nameEn: 'Neurological PT', isFree: true, price: 0 },
    ],
  },
  {
    key: 'veterinary',
    suffix: 'veterinary',
    nameAr: 'كلية الطب البيطري',
    nameEn: 'Faculty of Veterinary Medicine',
    displayOrder: 5,
    subjects: [
      { key: 'vet-1', nameAr: 'تشريح الحيوان', nameEn: 'Veterinary Anatomy', isFree: false, price: 300 },
      { key: 'vet-2', nameAr: 'فسيولوجيا الحيوان', nameEn: 'Veterinary Physiology', isFree: false, price: 300 },
      { key: 'vet-3', nameAr: 'علم الأوبئة البيطري', nameEn: 'Veterinary Epidemiology', isFree: false, price: 350 },
      { key: 'vet-4', nameAr: 'الجراحة البيطرية', nameEn: 'Veterinary Surgery', isFree: false, price: 400 },
      { key: 'vet-5', nameAr: 'الرقابة على الأغذية والصحة العامة', nameEn: 'Food Hygiene & Public Health', isFree: true, price: 0 },
    ],
  },
  {
    key: 'nursing',
    suffix: 'nursing',
    nameAr: 'كلية التمريض',
    nameEn: 'Faculty of Nursing',
    displayOrder: 6,
    subjects: [
      { key: 'nur-1', nameAr: 'أسس التمريض العامة', nameEn: 'Fundamentals of Nursing', isFree: false, price: 300 },
      { key: 'nur-2', nameAr: 'تمريض باطني وجراحي', nameEn: 'Medical-Surgical Nursing', isFree: false, price: 350 },
      { key: 'nur-3', nameAr: 'تمريض الأطفال وحديثي الولادة', nameEn: 'Pediatric Nursing', isFree: false, price: 350 },
      { key: 'nur-4', nameAr: 'تمريض النساء والتوليد', nameEn: 'Obstetric & Gynecologic Nursing', isFree: false, price: 350 },
      { key: 'nur-5', nameAr: 'تمريض الصحة النفسية والحرجة', nameEn: 'Psychiatric & Critical Nursing', isFree: true, price: 0 },
    ],
  },
  {
    key: 'health-sciences',
    suffix: 'health-sciences',
    nameAr: 'كلية العلوم الصحية',
    nameEn: 'Faculty of Applied Health Sciences',
    displayOrder: 7,
    subjects: [
      { key: 'hs-1', nameAr: 'الأجهزة الطبية الحيوية', nameEn: 'Biomedical Equipment', isFree: false, price: 350 },
      { key: 'hs-2', nameAr: 'التحاليل الطبية والمخبرية', nameEn: 'Medical Laboratory Technology', isFree: false, price: 400 },
      { key: 'hs-3', nameAr: 'تكنولوجيا الأشعة والتصوير الطبي', nameEn: 'Radiology & Medical Imaging', isFree: false, price: 400 },
      { key: 'hs-4', nameAr: 'تكنولوجيا الرعاية التنفسية', nameEn: 'Respiratory Care Technology', isFree: false, price: 350 },
      { key: 'hs-5', nameAr: 'الإحصاء الحيوي والمعلوماتية الصحية', nameEn: 'Health Informatics', isFree: true, price: 0 },
    ],
  },
  {
    key: 'science',
    suffix: 'science',
    nameAr: 'كلية العلوم',
    nameEn: 'Faculty of Science',
    displayOrder: 8,
    subjects: [
      { key: 'sci-1', nameAr: 'الرياضيات العامة', nameEn: 'General Mathematics', isFree: true, price: 0 },
      { key: 'sci-2', nameAr: 'الفيزياء العامة', nameEn: 'General Physics', isFree: false, price: 250 },
      { key: 'sci-3', nameAr: 'الكيمياء العامة والتحليلية', nameEn: 'General & Analytical Chemistry', isFree: false, price: 250 },
      { key: 'sci-4', nameAr: 'الأحياء العامة والخلية', nameEn: 'General Biology & Cytology', isFree: false, price: 250 },
      { key: 'sci-5', nameAr: 'علم الوراثة والبيولوجيا الجزيئية', nameEn: 'Genetics & Molecular Biology', isFree: false, price: 300 },
    ],
  },
  {
    key: 'engineering',
    suffix: 'engineering',
    nameAr: 'كلية الهندسة',
    nameEn: 'Faculty of Engineering',
    displayOrder: 9,
    subjects: [
      { key: 'eng-1', nameAr: 'رياضيات هندسية', nameEn: 'Engineering Mathematics', isFree: false, price: 300 },
      { key: 'eng-2', nameAr: 'ميكانيكا تطبيقية واستاتيكا', nameEn: 'Applied Mechanics & Statics', isFree: false, price: 300 },
      { key: 'eng-3', nameAr: 'مقاومة وخواص المواد', nameEn: 'Strength & Properties of Materials', isFree: false, price: 350 },
      { key: 'eng-4', nameAr: 'الدوائر والقياسات الكهربائية', nameEn: 'Electrical Circuits & Measurements', isFree: false, price: 350 },
      { key: 'eng-5', nameAr: 'رسم هندسي وتصميم بالحاسب CAD', nameEn: 'Engineering Drawing & CAD', isFree: true, price: 0 },
    ],
  },
  {
    key: 'cs',
    suffix: 'cs',
    nameAr: 'كلية الحاسبات والذكاء الاصطناعي',
    nameEn: 'Faculty of Computers & AI',
    displayOrder: 10,
    subjects: [
      { key: 'cs-1', nameAr: 'برمجة بلغة Python المتقدمة', nameEn: 'Python Programming', isFree: true, price: 0 },
      { key: 'cs-2', nameAr: 'هياكل البيانات والخوارزميات', nameEn: 'Data Structures & Algorithms', isFree: false, price: 350 },
      { key: 'cs-3', nameAr: 'قواعد البيانات ونظم المعلومات', nameEn: 'Database Systems', isFree: false, price: 300 },
      { key: 'cs-4', nameAr: 'شبكات الحاسب والأمن السيبراني', nameEn: 'Computer Networks & Security', isFree: false, price: 350 },
      { key: 'cs-5', nameAr: 'تعلم الآلة والذكاء الاصطناعي', nameEn: 'Machine Learning & AI', isFree: false, price: 400 },
      { key: 'cs-6', nameAr: 'هندسة البرمجيات والأنظمة الموزعة', nameEn: 'Software Engineering', isFree: false, price: 350 },
    ],
  },
];

async function main() {
  console.log('--- Step 1: Soft-delete colleges of deleted universities ---');
  const deletedUniColleges = await prisma.college.updateMany({
    where: {
      university: {
        deletedAt: { not: null },
      },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
  console.log(`Soft-deleted ${deletedUniColleges.count} colleges belonging to deleted universities.`);

  console.log('\n--- Step 2: Fetch active universities ---');
  const activeUnis = await prisma.university.findMany({
    where: { deletedAt: null },
    orderBy: { displayOrder: 'asc' },
  });
  console.log(`Found ${activeUnis.length} active universities:`, activeUnis.map(u => `${u.nameAr} (${u.slug})`));

  // Build list of valid slugs for each active university
  const allAllowedSlugs = new Set();
  for (const uni of activeUnis) {
    for (const def of TARGET_COLLEGES) {
      allAllowedSlugs.add(`${uni.slug}-${def.suffix}`);
    }
  }

  console.log('\n--- Step 3: Soft-delete unauthorized colleges in active universities ---');
  const deletedUnauthorized = await prisma.college.updateMany({
    where: {
      universityId: { in: activeUnis.map(u => u.id) },
      slug: { notIn: Array.from(allAllowedSlugs) },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
  console.log(`Soft-deleted ${deletedUnauthorized.count} unauthorized colleges.`);

  console.log('\n--- Step 4: Ensure all 10 separate colleges exist for each university ---');
  for (const uni of activeUnis) {
    console.log(`\nProcessing university: ${uni.nameAr} (${uni.slug})...`);

    for (const def of TARGET_COLLEGES) {
      const collegeSlug = `${uni.slug}-${def.suffix}`;

      // Check if college exists
      let college = await prisma.college.findUnique({
        where: { slug: collegeSlug },
      });

      if (college) {
        // Update & Restore college
        college = await prisma.college.update({
          where: { id: college.id },
          data: {
            nameAr: def.nameAr,
            nameEn: def.nameEn,
            displayOrder: def.displayOrder,
            isActive: true,
            deletedAt: null,
            universityId: uni.id,
          },
        });
        console.log(`  ✓ Updated & restored: ${def.nameAr} (${collegeSlug})`);
      } else {
        // Create college
        college = await prisma.college.create({
          data: {
            slug: collegeSlug,
            nameAr: def.nameAr,
            nameEn: def.nameEn,
            displayOrder: def.displayOrder,
            isActive: true,
            universityId: uni.id,
            description: `${def.nameAr} - ${uni.nameAr}`,
          },
        });
        console.log(`  + Created new college: ${def.nameAr} (${collegeSlug})`);
      }

      // Check if academic year exists for this college
      let year = await prisma.academicYear.findFirst({
        where: { collegeId: college.id },
      });

      if (!year) {
        year = await prisma.academicYear.create({
          data: {
            nameAr: 'السنة الدراسية الأولى',
            nameEn: 'First Academic Year',
            displayOrder: 1,
            collegeId: college.id,
          },
        });
      }

      // Check if semester exists
      let semester = await prisma.semester.findFirst({
        where: { academicYearId: year.id },
      });

      if (!semester) {
        semester = await prisma.semester.create({
          data: {
            nameAr: 'الفصل الدراسي الأول',
            nameEn: 'First Semester',
            displayOrder: 1,
            academicYearId: year.id,
          },
        });
      }

      // Ensure subjects exist for this semester
      const existingSubjectsCount = await prisma.subject.count({
        where: { semesterId: semester.id, deletedAt: null },
      });

      if (existingSubjectsCount === 0 && def.subjects?.length) {
        for (const sub of def.subjects) {
          const subjectSlug = `${collegeSlug}-${sub.key}`;
          const existingSubject = await prisma.subject.findUnique({
            where: { slug: subjectSlug },
          });

          if (existingSubject) {
            await prisma.subject.update({
              where: { id: existingSubject.id },
              data: {
                semesterId: semester.id,
                deletedAt: null,
                isPublished: true,
              },
            });
          } else {
            await prisma.subject.create({
              data: {
                slug: subjectSlug,
                nameAr: sub.nameAr,
                nameEn: sub.nameEn,
                description: `مقرر ${sub.nameAr} - ${def.nameAr} - ${uni.nameAr}`,
                semesterId: semester.id,
                isPublished: true,
                isFree: sub.isFree,
                price: sub.price,
              },
            });
          }
        }
        console.log(`    -> Seeded subjects for ${def.nameAr}`);
      }
    }
  }

  console.log('\n--- Step 5: Final verification of all active colleges ---');
  const activeColleges = await prisma.college.findMany({
    where: {
      deletedAt: null,
      university: { deletedAt: null },
    },
    select: {
      id: true,
      nameAr: true,
      slug: true,
      displayOrder: true,
      university: { select: { nameAr: true, slug: true } },
      _count: { select: { academicYears: true } },
    },
    orderBy: [
      { university: { displayOrder: 'asc' } },
      { displayOrder: 'asc' },
    ],
  });

  console.log(`Total active colleges across all active universities: ${activeColleges.length}`);
  console.table(
    activeColleges.map(c => ({
      University: c.university.nameAr,
      College: c.nameAr,
      Slug: c.slug,
      Order: c.displayOrder,
    }))
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
