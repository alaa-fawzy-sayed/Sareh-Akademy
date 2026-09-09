import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding chapters, video lessons, PDFs, and interactive quizzes...');

  // Get subjects in database
  const subjects = await prisma.subject.findMany({
    include: {
      chapters: true,
      semester: {
        include: {
          academicYear: {
            include: {
              college: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${subjects.length} subjects in database.`);

  const sampleVideos = [
    {
      titleAr: 'مقدمة تمهيدية للمقرر ونظرة عامة',
      titleEn: 'Course Introduction & Syllabus Overview',
      duration: 720, // 12 mins
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // or safe educational sample
      isFree: true,
      description: 'فيديو تعريفي شامل يوضح أهداف المقرر الدراسي، خطة الأسابيع، وتوزيع الدرجات وطريقة المذاكرة الفعالة.',
    },
    {
      titleAr: 'المحاضرة الأولى: المفاهيم الأساسية والمدخل العلمي',
      titleEn: 'Lecture 1: Core Fundamentals & Principles',
      duration: 2150, // ~36 mins
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      isFree: false,
      description: 'شرح تفصيلي للمفاهيم التأسيسية وأهم القواعد والنظريات الأساسية مع التطبيقات العملية.',
    },
    {
      titleAr: 'المحاضرة الثانية: الآليات والتطبيقات المعملية',
      titleEn: 'Lecture 2: Mechanisms & Practical Applications',
      duration: 2480, // ~41 mins
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      isFree: false,
      description: 'دراسة الآليات الحيوية والتفاعلات الكيميائية/السريرية مع أمثلة حية وحالات واقعية.',
    },
    {
      titleAr: 'محاضرة مراجعة وحل أسئلة وتدريبات تفاعلية',
      titleEn: 'Review & Problem Solving Session',
      duration: 1800, // 30 mins
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      isFree: false,
      description: 'حل نماذج امتحانات السنوات السابقة وشرح أسلوب الإجابة النموذجية في الاختبارات النهائية.',
    },
  ];

  const sampleQuizData = {
    passingScore: 60,
    timeLimitMinutes: 15,
    questions: [
      {
        text: 'ما هي القاعدة الذهبية لتحديد استقرار المركب الوسيط أو المركب الدوائي النشط؟',
        explanation: 'الرنين والكثافة الإلكترونية وتوزيع الشحنات هي المحدد الأساسي لاستقرار المركبات الوسيطة صيدلانياً.',
        points: 2,
        answers: [
          { text: 'توزيع الشحنات عبر ظاهرة الرنين الإلكتروني (Resonance)', isCorrect: true, explanation: 'إجابة صحيحة! الرنين يقلل من طاقة الجزيء ويزيد استقراره.' },
          { text: 'زيادة الوزن الجزيئي فقط دون النظر للروابط', isCorrect: false, explanation: 'الوزن الجزيئي وحده لا يحدد الاستقرار.' },
          { text: 'وجود رابطة ثلاثية غير مشبعة دائماً', isCorrect: false, explanation: 'الروابط غير المشبعة قد تكون عالية التفاعلية وليست دائماً الأكثر استقراراً.' },
          { text: 'عدم احتواء المركب على أي مجموعات قطبية', isCorrect: false, explanation: 'القطبية تؤثر على الذائبية ولكن ليست شرطاً مطلقاً للاستقرار.' },
        ],
      },
      {
        text: 'أي مما يلي يُعد من أهم خصائص الامتصاص الدوائي الفموي (Oral Bioavailability)؟',
        explanation: 'معامل الذائبية في الدهون (Lipophilicity) ودرجة التأين يحددان عبور الدواء للأغشية المخاطية.',
        points: 2,
        answers: [
          { text: 'معامل التوزيع بين الزيت والماء ودرجة التأين (pKa)', isCorrect: true, explanation: 'صحيح، وفق قاعدة Lipinski Rule of 5 لتحديد النفاذية الحيوية.' },
          { text: 'حجم الجرعة المعطاة فقط بغض النظر عن التركيب', isCorrect: false, explanation: 'التركيب الفيزيوكيميائي هو المحدد للنفاذية.' },
          { text: 'سرعة تصنيع الحبة الدوائية بالكبس الميكانيكي', isCorrect: false, explanation: 'هذا عامل تصنيعي وليس حركياً حيوياً.' },
          { text: 'لون وصبغة الغلاف الخارجي للقرص', isCorrect: false, explanation: 'الصبغة ليس لها علاقة بالتوافر الحيوي.' },
        ],
      },
      {
        text: 'ما هو الإنزيم الرئيسي المسؤول عن أيض النسبة الكبرى من الأدوية في الكبد؟',
        explanation: 'عائلة Cytochrome P450 وبالتحديد CYP3A4 مسؤولة عن استقلاب أكثر من 50% من الأدوية المتداولة.',
        points: 2,
        answers: [
          { text: 'عائلة السيتوكروم Cytochrome P450 (مثل CYP3A4)', isCorrect: true, explanation: 'ممتاز! هذا الإنزيم الكبدي الأساسي المسؤول عن الأكسدة الحيوية.' },
          { text: 'إنزيم الأميليز اللعابي (Salivary Amylase)', isCorrect: false, explanation: 'الأميليز يهضم الكربوهيدرات ولا علاقة له بأيض الأدوية الكبدي.' },
          { text: 'إنزيم الببسين في المعدة (Pepsin)', isCorrect: false, explanation: 'الببسين هاضم للبروتينات في الوسط الحمضي.' },
          { text: 'إنزيم الرنين في الكلى (Renin)', isCorrect: false, explanation: 'الرنين هرمون تنظيمي لضغط الدم.' },
        ],
      },
      {
        text: 'ما هو الإجراء الفوري الأهم عند ملاحظة تفاعل دوائي تحسسي حاد (Anaphylaxis) لدى مريض؟',
        explanation: 'الأدرينالين (Epinephrine) عن طريق الحقن العضلي هو خط العلاج الأول المنقذ للحياة فوراً.',
        points: 2,
        answers: [
          { text: 'حقن الأدرينالين (Epinephrine IM) فوراً وطلب الإسعاف', isCorrect: true, explanation: 'أحسنت! الأدرينالين يعكس انخفاض الضغط وتضيق الشعب الهوائية فوراً.' },
          { text: 'إعطاء مسكن باراسيتامول فموي', isCorrect: false, explanation: 'المسكنات الفموية لا تجدي نفعاً في الصدمة التحسسية الحادة وتزيد الخطر.' },
          { text: 'الانتظار ساعتين لملاحظة هدوء الأعراض', isCorrect: false, explanation: 'التأخير قد يؤدي للوفاة السريعة نتيجة انسداد مجرى التنفس.' },
          { text: 'شرب كميات كبيرة من الماء المغلي', isCorrect: false, explanation: 'إجراء خاطئ وخطير على مجرى التنفس.' },
        ],
      },
      {
        text: 'في التقييم السريري، ماذا يعبر مصطلح المؤشر العلاجي (Therapeutic Index - TI)؟',
        explanation: 'المؤشر العلاجي هو النسبة بين الجرعة السامة والجرعة الفعالة LD50 / ED50.',
        points: 2,
        answers: [
          { text: 'النسبة بين الجرعة القاتلة/السامة والجرعة الفعالة (هامش الأمان)', isCorrect: true, explanation: 'صحيح! كلما كبر المؤشر العلاجي كان الدواء أكثر أماناً.' },
          { text: 'سعر الدواء في الصيدليات مقارنة ببدائله', isCorrect: false, explanation: 'هذا تصنيف اقتصادي تجاري.' },
          { text: 'مدة بقاء الدواء في العبوة بعد الفتح', isCorrect: false, explanation: 'هذه فترة الصلاحية بعد الفتح (In-use shelf life).' },
          { text: 'سرعة امتصاص الدواء خلال أول خمس دقائق', isCorrect: false, explanation: 'هذا معدل الامتصاص (Rate of Absorption).' },
        ],
      },
    ],
  };

  let totalChapters = 0;
  let totalVideos = 0;
  let totalQuizzes = 0;

  for (const subject of subjects) {
    // If subject already has chapters, skip or add to it
    if (subject.chapters.length >= 2) continue;

    // Create 3 Chapters for this subject
    const chapter1 = await prisma.chapter.create({
      data: {
        subjectId: subject.id,
        titleAr: 'الفصل الأول: الأسس النظرية والمفاهيم الأولية',
        titleEn: 'Chapter 1: Foundations & Fundamentals',
        displayOrder: 1,
      },
    });

    const chapter2 = await prisma.chapter.create({
      data: {
        subjectId: subject.id,
        titleAr: 'الفصل الثاني: الدراسات التطبيقية والتحليلات المتقدمة',
        titleEn: 'Chapter 2: Advanced Analysis & Practice',
        displayOrder: 2,
      },
    });

    const chapter3 = await prisma.chapter.create({
      data: {
        subjectId: subject.id,
        titleAr: 'الفصل الثالث: المراجعات النهائية وبنك الامتحانات',
        titleEn: 'Chapter 3: Final Reviews & Clinical Cases',
        displayOrder: 3,
      },
    });

    totalChapters += 3;

    // Add Contents to Chapter 1:
    // 1. Promo / Free Lesson
    const introContent = await prisma.content.create({
      data: {
        chapterId: chapter1.id,
        titleAr: sampleVideos[0].titleAr,
        titleEn: sampleVideos[0].titleEn,
        description: sampleVideos[0].description,
        type: 'VIDEO',
        isFree: true, // Always free preview
        isPublished: true,
        displayOrder: 1,
        video: {
          create: {
            storageKey: sampleVideos[0].url,
            duration: sampleVideos[0].duration,
            viewCount: 42,
          },
        },
      },
    });

    // 2. Lecture 1 Video
    const lecture1Content = await prisma.content.create({
      data: {
        chapterId: chapter1.id,
        titleAr: sampleVideos[1].titleAr,
        titleEn: sampleVideos[1].titleEn,
        description: sampleVideos[1].description,
        type: 'VIDEO',
        isFree: subject.isFree,
        isPublished: true,
        displayOrder: 2,
        video: {
          create: {
            storageKey: sampleVideos[1].url,
            duration: sampleVideos[1].duration,
            viewCount: 88,
          },
        },
      },
    });

    // 3. Lecture 1 PDF Summary
    await prisma.content.create({
      data: {
        chapterId: chapter1.id,
        titleAr: `ملخص ومذكرة الفصل الأول — ${subject.nameAr} (PDF)`,
        titleEn: 'Chapter 1 Lecture Notes & Cheat-Sheet (PDF)',
        description: 'مذكرة شاملة تضم تلخيص القوانين والجداول والرسومات التوضيحية بصيغة جاهزة للطباعة.',
        type: 'FILE',
        isFree: subject.isFree,
        isPublished: true,
        displayOrder: 3,
        file: {
          create: {
            storageKey: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            fileType: 'PDF',
            mimeType: 'application/pdf',
            sizeBytes: BigInt(2450000),
            originalName: `${subject.slug}-chapter-1-notes.pdf`,
            downloadCount: 19,
          },
        },
      },
    });

    // 4. Chapter 1 Quiz
    const quiz1Content = await prisma.content.create({
      data: {
        chapterId: chapter1.id,
        titleAr: `اختبار تقييم الفصل الأول — ${subject.nameAr}`,
        titleEn: 'Chapter 1 Self-Assessment Quiz',
        description: 'اختبار تدريبي تفاعلي لقياس استيعاب المفاهيم الأساسية مع تصحيح فوري وشرح تفصيلي للإجابات.',
        type: 'QUIZ',
        isFree: true, // Free quiz preview to engage students
        isPublished: true,
        displayOrder: 4,
      },
    });

    const quiz1 = await prisma.quiz.create({
      data: {
        contentId: quiz1Content.id,
        passingScore: sampleQuizData.passingScore,
        timeLimitMinutes: sampleQuizData.timeLimitMinutes,
      },
    });

    for (let qIdx = 0; qIdx < sampleQuizData.questions.length; qIdx++) {
      const q = sampleQuizData.questions[qIdx];
      const createdQ = await prisma.quizQuestion.create({
        data: {
          quizId: quiz1.id,
          text: q.text,
          explanation: q.explanation,
          points: q.points,
          displayOrder: qIdx + 1,
        },
      });

      for (let aIdx = 0; aIdx < q.answers.length; aIdx++) {
        const ans = q.answers[aIdx];
        await prisma.quizAnswer.create({
          data: {
            questionId: createdQ.id,
            text: ans.text,
            isCorrect: ans.isCorrect,
            explanation: ans.explanation,
            displayOrder: aIdx + 1,
          },
        });
      }
    }

    totalQuizzes++;

    // Add Contents to Chapter 2:
    await prisma.content.create({
      data: {
        chapterId: chapter2.id,
        titleAr: sampleVideos[2].titleAr,
        titleEn: sampleVideos[2].titleEn,
        description: sampleVideos[2].description,
        type: 'VIDEO',
        isFree: subject.isFree,
        isPublished: true,
        displayOrder: 1,
        video: {
          create: {
            storageKey: sampleVideos[2].url,
            duration: sampleVideos[2].duration,
            viewCount: 65,
          },
        },
      },
    });

    await prisma.content.create({
      data: {
        chapterId: chapter2.id,
        titleAr: `ملزمة الحالات والتطبيقات المعملية — ${subject.nameAr}`,
        titleEn: 'Practical Laboratory Cases Handbook',
        description: 'دليل التدريبات المعملية والسريرية مع صور وفحوصات نموذجية.',
        type: 'FILE',
        isFree: subject.isFree,
        isPublished: true,
        displayOrder: 2,
        file: {
          create: {
            storageKey: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            fileType: 'PDF',
            mimeType: 'application/pdf',
            sizeBytes: BigInt(3800000),
            originalName: `${subject.slug}-lab-guide.pdf`,
            downloadCount: 31,
          },
        },
      },
    });

    // Add Contents to Chapter 3:
    await prisma.content.create({
      data: {
        chapterId: chapter3.id,
        titleAr: sampleVideos[3].titleAr,
        titleEn: sampleVideos[3].titleEn,
        description: sampleVideos[3].description,
        type: 'VIDEO',
        isFree: subject.isFree,
        isPublished: true,
        displayOrder: 1,
        video: {
          create: {
            storageKey: sampleVideos[3].url,
            duration: sampleVideos[3].duration,
            viewCount: 110,
          },
        },
      },
    });

    // Comprehensive Final Quiz
    const finalQuizContent = await prisma.content.create({
      data: {
        chapterId: chapter3.id,
        titleAr: `الاختبار النهائي الشامل للمقرر — ${subject.nameAr}`,
        titleEn: 'Comprehensive Final Subject Exam',
        description: 'اختبار تجريبي قياسي مطابق لنظام امتحانات الكلية النهائية مع مؤقت زمني وتصحيح تفصيلي.',
        type: 'QUIZ',
        isFree: subject.isFree,
        isPublished: true,
        displayOrder: 2,
      },
    });

    const finalQuiz = await prisma.quiz.create({
      data: {
        contentId: finalQuizContent.id,
        passingScore: 70,
        timeLimitMinutes: 20,
      },
    });

    for (let qIdx = 0; qIdx < sampleQuizData.questions.length; qIdx++) {
      const q = sampleQuizData.questions[qIdx];
      const createdQ = await prisma.quizQuestion.create({
        data: {
          quizId: finalQuiz.id,
          text: q.text,
          explanation: q.explanation,
          points: q.points,
          displayOrder: qIdx + 1,
        },
      });

      for (let aIdx = 0; aIdx < q.answers.length; aIdx++) {
        const ans = q.answers[aIdx];
        await prisma.quizAnswer.create({
          data: {
            questionId: createdQ.id,
            text: ans.text,
            isCorrect: ans.isCorrect,
            explanation: ans.explanation,
            displayOrder: aIdx + 1,
          },
        });
      }
    }

    totalQuizzes++;
    totalVideos += 4;
  }

  console.log(`✅ Seeding finished successfully!`);
  console.log(`📊 Added: ${totalChapters} chapters, ${totalVideos} videos, and ${totalQuizzes} interactive quizzes across subjects.`);
}

main()
  .catch((e) => {
    console.error('Error seeding chapters & quizzes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
