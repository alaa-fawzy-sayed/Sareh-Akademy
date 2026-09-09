import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PHARMACY_SUBJECTS = [
  {
    nameEn: 'Organic chemistry I',
    nameAr: 'الكيمياء العضوية 1',
    slugKey: 'organic-chemistry-1',
    price: 350,
    isFree: false,
    description: 'مقرر الكيمياء العضوية الصيدلانية (الجزء الأول)',
  },
  {
    nameEn: 'Organic chemistry II',
    nameAr: 'الكيمياء العضوية 2',
    slugKey: 'organic-chemistry-2',
    price: 350,
    isFree: false,
    description: 'مقرر الكيمياء العضوية الصيدلانية (الجزء الثاني)',
  },
  {
    nameEn: 'Analytical chemistry I',
    nameAr: 'الكيمياء التحليلية 1',
    slugKey: 'analytical-chemistry-1',
    price: 350,
    isFree: false,
    description: 'مقرر الكيمياء التحليلية الصيدلانية (الجزء الأول)',
  },
  {
    nameEn: 'Analytical chemistry II',
    nameAr: 'الكيمياء التحليلية 2',
    slugKey: 'analytical-chemistry-2',
    price: 350,
    isFree: false,
    description: 'مقرر الكيمياء التحليلية الصيدلانية (الجزء الثاني)',
  },
  {
    nameEn: 'Math',
    nameAr: 'الرياضيات',
    slugKey: 'math',
    price: 0,
    isFree: true,
    description: 'مقرر الرياضيات والإحصاء الصيدلاني',
  },
  {
    nameEn: 'Physical pharmacy',
    nameAr: 'الصيدلة الفيزيائية',
    slugKey: 'physical-pharmacy',
    price: 350,
    isFree: false,
    description: 'مقرر مبادئ الصيدلة الفيزيائية وتطبيقاتها',
  },
  {
    nameEn: 'Physiology',
    nameAr: 'علم وظائف الأعضاء (الفسيولوجيا)',
    slugKey: 'physiology',
    price: 400,
    isFree: false,
    description: 'مقرر علم وظائف الأعضاء والأجهزة الحيوية',
  },
  {
    nameEn: 'Pharmacology I',
    nameAr: 'علم الأدوية 1 (فارماكولوجي)',
    slugKey: 'pharmacology-1',
    price: 400,
    isFree: false,
    description: 'مقرر علم الأدوية وتأثيراتها العلاجية (المستوى الأول)',
  },
  {
    nameEn: 'Pharmacology II',
    nameAr: 'علم الأدوية 2 (فارماكولوجي)',
    slugKey: 'pharmacology-2',
    price: 400,
    isFree: false,
    description: 'مقرر علم الأدوية وتأثيراتها العلاجية (المستوى الثاني)',
  },
  {
    nameEn: 'Pharmacology III',
    nameAr: 'علم الأدوية 3 (فارماكولوجي)',
    slugKey: 'pharmacology-3',
    price: 450,
    isFree: false,
    description: 'مقرر علم الأدوية وتأثيراتها العلاجية (المستوى الثالث)',
  },
  {
    nameEn: 'Medicinal plants',
    nameAr: 'النباتات الطبية',
    slugKey: 'medicinal-plants',
    price: 300,
    isFree: false,
    description: 'مقرر النباتات الطبية ومصادر العقاقير الطبيعية',
  },
  {
    nameEn: 'Pharmacognosy',
    nameAr: 'علم العقاقير (فارماكوجنوزي)',
    slugKey: 'pharmacognosy',
    price: 350,
    isFree: false,
    description: 'مقرر علم العقاقير والمكونات الفعالة الدوائية',
  },
];

async function main() {
  console.log('--- Step 1: Remove all existing subjects from all colleges ---');
  await prisma.subjectTeacher.deleteMany({});
  await prisma.discountSubject.deleteMany({});
  await prisma.chapter.deleteMany({});
  const deletedSubjects = await prisma.subject.deleteMany({});
  console.log(`Successfully removed ${deletedSubjects.count} old subjects from all colleges.`);

  console.log('\n--- Step 2: Find all active pharmacy colleges ---');
  const pharmacyColleges = await prisma.college.findMany({
    where: {
      deletedAt: null,
      slug: { endsWith: '-pharmacy' },
      university: { deletedAt: null },
    },
    include: {
      university: true,
      academicYears: {
        include: {
          semesters: true,
        },
      },
    },
    orderBy: { university: { displayOrder: 'asc' } },
  });

  console.log(`Found ${pharmacyColleges.length} active pharmacy colleges:`);
  pharmacyColleges.forEach(c => console.log(`  - ${c.nameAr} (${c.slug}) at ${c.university.nameAr}`));

  console.log('\n--- Step 3: Insert the 12 specific pharmacy subjects for each university ---');
  let totalAdded = 0;

  for (const college of pharmacyColleges) {
    // Get or create academic year
    let year = college.academicYears[0];
    if (!year) {
      year = await prisma.academicYear.create({
        data: {
          nameAr: 'الفرقة الأولى',
          nameEn: 'First Academic Year',
          displayOrder: 1,
          collegeId: college.id,
        },
      });
    }

    // Get or create semester
    let semester = year.semesters?.[0];
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

    // Insert the 12 subjects
    for (const sub of PHARMACY_SUBJECTS) {
      const subjectSlug = `${college.slug}-${sub.slugKey}`;
      await prisma.subject.create({
        data: {
          slug: subjectSlug,
          nameAr: sub.nameAr,
          nameEn: sub.nameEn,
          description: sub.description,
          price: sub.price,
          isFree: sub.isFree,
          isPublished: true,
          semesterId: semester.id,
        },
      });
      totalAdded++;
    }
    console.log(`  ✓ Added 12 subjects to ${college.university.nameAr} (${college.slug})`);
  }

  console.log(`\nDone! Total subjects added across all universities: ${totalAdded}`);

  console.log('\n--- Step 4: Verification of database state ---');
  const allSubjects = await prisma.subject.findMany({
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      price: true,
      isFree: true,
      semester: {
        select: {
          academicYear: {
            select: {
              college: {
                select: {
                  nameAr: true,
                  university: {
                    select: {
                      nameAr: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { slug: 'asc' },
  });

  console.log(`Total subjects in database: ${allSubjects.length}`);
  console.table(
    allSubjects.map(s => ({
      University: s.semester.academicYear.college.university.nameAr,
      College: s.semester.academicYear.college.nameAr,
      SubjectAr: s.nameAr,
      SubjectEn: s.nameEn,
      Price: s.isFree ? 'مجاني' : `${s.price} ج.م`,
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
