// ============================================================
// TOP-PHARMA — بيانات الجامعات والكليات والمواد
// هذا الملف يحتوي على البيانات الثابتة للعرض
// في الإصدار النهائي ستُجلب من API
// ============================================================

export interface Subject {
  id: string;
  name: string;
  description?: string;
  isFree: boolean;
  price?: number;
  isPublished: boolean;
}

export interface College {
  slug: string;
  nameAr: string;
  icon: string;
  subjects: Subject[];
}

export interface University {
  slug: string;
  nameAr: string;
  nameEn: string;
  description: string;
  location: string;
  emoji: string;
  logo?: string;
  color: string;
  established?: string;
  colleges: College[];
}

// ============================================================
// الكليات المشتركة بين أغلب الجامعات الخاصة
// ============================================================
const commonSubjects = {
  pharmacy: [
    { id: 'ph-1', name: 'الكيمياء العضوية الصيدلانية', isFree: false, isPublished: true },
    { id: 'ph-2', name: 'علم الصيدلة (فارماكولوجي)', isFree: false, isPublished: true },
    { id: 'ph-3', name: 'التحليل الدوائي', isFree: false, isPublished: true },
    { id: 'ph-4', name: 'تقنية الأدوية (فارماسيوتيكس)', isFree: false, isPublished: true },
    { id: 'ph-5', name: 'الكيمياء الحيوية', isFree: true, isPublished: true, price: 0 },
    { id: 'ph-6', name: 'علم الأحياء الدقيقة', isFree: false, isPublished: true },
    { id: 'ph-7', name: 'الكيمياء العامة والتحليلية', isFree: false, isPublished: true },
  ],
  dentistry: [
    { id: 'dent-1', name: 'تشريح الوجه والفكين', isFree: false, isPublished: true },
    { id: 'dent-2', name: 'أمراض اللثة', isFree: false, isPublished: true },
    { id: 'dent-3', name: 'طب الأسنان التحفظي', isFree: false, isPublished: true },
    { id: 'dent-4', name: 'التعويضات السنية', isFree: false, isPublished: true },
    { id: 'dent-5', name: 'جراحة الفم والوجه', isFree: false, isPublished: true },
    { id: 'dent-6', name: 'تقويم الأسنان', isFree: false, isPublished: true },
  ],
  science: [
    { id: 'sci-1', name: 'الرياضيات العامة', isFree: true, isPublished: true },
    { id: 'sci-2', name: 'الفيزياء العامة', isFree: false, isPublished: true },
    { id: 'sci-3', name: 'الكيمياء العامة', isFree: false, isPublished: true },
    { id: 'sci-4', name: 'الأحياء العامة', isFree: false, isPublished: true },
    { id: 'sci-5', name: 'الجيولوجيا', isFree: false, isPublished: true },
  ],
  nursing: [
    { id: 'nur-1', name: 'أسس التمريض', isFree: false, isPublished: true },
    { id: 'nur-2', name: 'تمريض باطني وجراحي', isFree: false, isPublished: true },
    { id: 'nur-3', name: 'تمريض الأطفال', isFree: false, isPublished: true },
    { id: 'nur-4', name: 'تمريض النساء والتوليد', isFree: false, isPublished: true },
    { id: 'nur-5', name: 'الصحة النفسية', isFree: false, isPublished: true },
  ],
  veterinary: [
    { id: 'vet-1', name: 'تشريح الحيوان', isFree: false, isPublished: true },
    { id: 'vet-2', name: 'فسيولوجيا الحيوان', isFree: false, isPublished: true },
    { id: 'vet-3', name: 'علم الأوبئة البيطري', isFree: false, isPublished: true },
    { id: 'vet-4', name: 'الجراحة البيطرية', isFree: false, isPublished: true },
    { id: 'vet-5', name: 'الرقابة على الأغذية', isFree: false, isPublished: true },
  ],
  cs: [
    { id: 'cs-1', name: 'برمجة بلغة Python', isFree: true, isPublished: true },
    { id: 'cs-2', name: 'قواعد البيانات', isFree: false, isPublished: true },
    { id: 'cs-3', name: 'هياكل البيانات والخوارزميات', isFree: false, isPublished: true },
    { id: 'cs-4', name: 'شبكات الحاسب', isFree: false, isPublished: true },
    { id: 'cs-5', name: 'هندسة البرمجيات', isFree: false, isPublished: true },
    { id: 'cs-6', name: 'الذكاء الاصطناعي', isFree: false, isPublished: true },
  ],
  engineering: [
    { id: 'eng-1', name: 'رياضيات هندسية', isFree: false, isPublished: true },
    { id: 'eng-2', name: 'ميكانيكا تطبيقية', isFree: false, isPublished: true },
    { id: 'eng-3', name: 'مقاومة المواد', isFree: false, isPublished: true },
    { id: 'eng-4', name: 'الدوائر الكهربائية', isFree: false, isPublished: true },
    { id: 'eng-5', name: 'رسم هندسي', isFree: false, isPublished: true },
  ],
  medicine: [
    { id: 'med-1', name: 'التشريح العام', isFree: false, isPublished: true },
    { id: 'med-2', name: 'الفسيولوجيا', isFree: false, isPublished: true },
    { id: 'med-3', name: 'الكيمياء الحيوية الطبية', isFree: false, isPublished: true },
    { id: 'med-4', name: 'الباثولوجيا', isFree: false, isPublished: true },
    { id: 'med-5', name: 'علم الأدوية (فارماكولوجي)', isFree: false, isPublished: true },
    { id: 'med-6', name: 'الأحياء الدقيقة والمناعة', isFree: false, isPublished: true },
  ],
};

// ============================================================
// الجامعات الخمس
// ============================================================
export const UNIVERSITIES: University[] = [
  // 1. جامعة سفنكس
  {
    slug: 'sphinx',
    nameAr: 'جامعة سفنكس',
    nameEn: 'Sphinx University',
    description: 'جامعة خاصة معتمدة في محافظة أسيوط، تضم كليات متنوعة في الطب والعلوم والتكنولوجيا',
    location: 'أسيوط، مصر',
    emoji: '🦁',
    logo: '/images/logos/sphinx.jpg',
    color: '#6C63FF',
    established: '2019',
    colleges: [
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', icon: '💊', subjects: commonSubjects.pharmacy.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', icon: '🦷', subjects: commonSubjects.dentistry.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
      { slug: 'science', nameAr: 'كلية العلوم', icon: '🔬', subjects: commonSubjects.science.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
      { slug: 'nursing', nameAr: 'كلية التمريض', icon: '🏥', subjects: commonSubjects.nursing.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
      { slug: 'veterinary', nameAr: 'كلية الطب البيطري', icon: '🐾', subjects: commonSubjects.veterinary.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', icon: '💻', subjects: commonSubjects.cs.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
      { slug: 'engineering', nameAr: 'كلية الهندسة', icon: '⚙️', subjects: commonSubjects.engineering.map(s => ({ ...s, id: `sphinx-${s.id}` })) },
    ],
  },

  // 2. جامعة أسيوط (الحكومية)
  {
    slug: 'assiut',
    nameAr: 'جامعة أسيوط',
    nameEn: 'Assiut University',
    description: 'إحدى أعرق الجامعات الحكومية في صعيد مصر، تأسست عام 1957',
    location: 'أسيوط، مصر',
    emoji: '🏛️',
    logo: '/images/logos/assiut.jpg',
    color: '#F59E0B',
    established: '1957',
    colleges: [
      { slug: 'medicine', nameAr: 'كلية الطب', icon: '🩺', subjects: commonSubjects.medicine.map(s => ({ ...s, id: `assiut-${s.id}` })) },
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', icon: '💊', subjects: commonSubjects.pharmacy.map(s => ({ ...s, id: `assiut-${s.id}` })) },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', icon: '🦷', subjects: commonSubjects.dentistry.map(s => ({ ...s, id: `assiut-${s.id}` })) },
      { slug: 'veterinary', nameAr: 'كلية الطب البيطري', icon: '🐾', subjects: commonSubjects.veterinary.map(s => ({ ...s, id: `assiut-${s.id}` })) },
      { slug: 'science', nameAr: 'كلية العلوم', icon: '🔬', subjects: commonSubjects.science.map(s => ({ ...s, id: `assiut-${s.id}` })) },
      { slug: 'engineering', nameAr: 'كلية الهندسة', icon: '⚙️', subjects: commonSubjects.engineering.map(s => ({ ...s, id: `assiut-${s.id}` })) },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', icon: '💻', subjects: commonSubjects.cs.map(s => ({ ...s, id: `assiut-${s.id}` })) },
    ],
  },

  // 3. جامعة أسيوط الأهلية
  {
    slug: 'new-assiut',
    nameAr: 'جامعة أسيوط الأهلية',
    nameEn: 'New Assiut University',
    description: 'جامعة أهلية حديثة توفر تعليماً جامعياً متميزاً في محافظة أسيوط',
    location: 'أسيوط، مصر',
    emoji: '🌟',
    logo: '/images/logos/new-assiut.jpg',
    color: '#10B981',
    established: '2020',
    colleges: [
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', icon: '💊', subjects: commonSubjects.pharmacy.map(s => ({ ...s, id: `new-assiut-${s.id}` })) },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', icon: '🦷', subjects: commonSubjects.dentistry.map(s => ({ ...s, id: `new-assiut-${s.id}` })) },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', icon: '💻', subjects: commonSubjects.cs.map(s => ({ ...s, id: `new-assiut-${s.id}` })) },
      { slug: 'engineering', nameAr: 'كلية الهندسة', icon: '⚙️', subjects: commonSubjects.engineering.map(s => ({ ...s, id: `new-assiut-${s.id}` })) },
      { slug: 'nursing', nameAr: 'كلية التمريض', icon: '🏥', subjects: commonSubjects.nursing.map(s => ({ ...s, id: `new-assiut-${s.id}` })) },
    ],
  },

  // 4. جامعة بدر أسيوط
  {
    slug: 'badr',
    nameAr: 'جامعة بدر أسيوط',
    nameEn: 'Badr University in Assiut',
    description: 'جامعة خاصة متكاملة تهدف إلى تقديم تعليم عالي الجودة وفق المعايير الدولية',
    location: 'أسيوط، مصر',
    emoji: '⭐',
    logo: '/images/logos/badr.jpg',
    color: '#EF4444',
    established: '2021',
    colleges: [
      { slug: 'medicine', nameAr: 'كلية الطب', icon: '🩺', subjects: commonSubjects.medicine.map(s => ({ ...s, id: `badr-${s.id}` })) },
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', icon: '💊', subjects: commonSubjects.pharmacy.map(s => ({ ...s, id: `badr-${s.id}` })) },
      { slug: 'dentistry', nameAr: 'كلية طب الأسنان', icon: '🦷', subjects: commonSubjects.dentistry.map(s => ({ ...s, id: `badr-${s.id}` })) },
      { slug: 'nursing', nameAr: 'كلية التمريض', icon: '🏥', subjects: commonSubjects.nursing.map(s => ({ ...s, id: `badr-${s.id}` })) },
      { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', icon: '💻', subjects: commonSubjects.cs.map(s => ({ ...s, id: `badr-${s.id}` })) },
      { slug: 'engineering', nameAr: 'كلية الهندسة', icon: '⚙️', subjects: commonSubjects.engineering.map(s => ({ ...s, id: `badr-${s.id}` })) },
    ],
  },

  // 5. جامعة الأزهر أسيوط
  {
    slug: 'azhar',
    nameAr: 'جامعة الأزهر أسيوط',
    nameEn: 'Al-Azhar University (Assiut Branch)',
    description: 'فرع جامعة الأزهر في أسيوط، تجمع بين التعليم الديني والعلمي والتقني',
    location: 'أسيوط، مصر',
    emoji: '🕌',
    logo: '/images/logos/azhar.jpg',
    color: '#8B5CF6',
    established: '1970',
    colleges: [
      { slug: 'medicine', nameAr: 'كلية الطب', icon: '🩺', subjects: commonSubjects.medicine.map(s => ({ ...s, id: `azhar-${s.id}` })) },
      { slug: 'pharmacy', nameAr: 'كلية الصيدلة', icon: '💊', subjects: commonSubjects.pharmacy.map(s => ({ ...s, id: `azhar-${s.id}` })) },
      { slug: 'science', nameAr: 'كلية العلوم', icon: '🔬', subjects: commonSubjects.science.map(s => ({ ...s, id: `azhar-${s.id}` })) },
      { slug: 'engineering', nameAr: 'كلية الهندسة', icon: '⚙️', subjects: commonSubjects.engineering.map(s => ({ ...s, id: `azhar-${s.id}` })) },
      {
        slug: 'sharia',
        nameAr: 'كلية الشريعة والقانون',
        icon: '⚖️',
        subjects: [
          { id: 'azhar-sh-1', name: 'الفقه الإسلامي', isFree: false, isPublished: true },
          { id: 'azhar-sh-2', name: 'أصول الفقه', isFree: false, isPublished: true },
          { id: 'azhar-sh-3', name: 'القانون المدني', isFree: false, isPublished: true },
          { id: 'azhar-sh-4', name: 'قانون الأسرة', isFree: false, isPublished: true },
        ],
      },
      {
        slug: 'arabic',
        nameAr: 'كلية اللغة العربية',
        icon: '📖',
        subjects: [
          { id: 'azhar-ar-1', name: 'النحو والصرف', isFree: false, isPublished: true },
          { id: 'azhar-ar-2', name: 'البلاغة العربية', isFree: false, isPublished: true },
          { id: 'azhar-ar-3', name: 'الأدب العربي القديم', isFree: false, isPublished: true },
          { id: 'azhar-ar-4', name: 'علوم القرآن الكريم', isFree: false, isPublished: true },
        ],
      },
    ],
  },
];

export function getUniversity(slug: string): University | undefined {
  return UNIVERSITIES.find((u) => u.slug === slug);
}

export function getCollege(uniSlug: string, collegeSlug: string): College | undefined {
  return getUniversity(uniSlug)?.colleges.find((c) => c.slug === collegeSlug);
}
