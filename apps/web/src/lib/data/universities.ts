// ============================================================
// صرح أكاديمي — Sarh Academy — بيانات الجامعات والكليات والمواد
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
    { id: 'org-1', name: 'Organic chemistry I', isFree: false, price: 350, isPublished: true },
    { id: 'org-2', name: 'Organic chemistry II', isFree: false, price: 350, isPublished: true },
    { id: 'ana-1', name: 'Analytical chemistry I', isFree: false, price: 350, isPublished: true },
    { id: 'ana-2', name: 'Analytical chemistry II', isFree: false, price: 350, isPublished: true },
    { id: 'math-1', name: 'Math', isFree: true, price: 0, isPublished: true },
    { id: 'phys-pharm', name: 'Physical pharmacy', isFree: false, price: 350, isPublished: true },
    { id: 'physio', name: 'Physiology', isFree: false, price: 400, isPublished: true },
    { id: 'pharm-1', name: 'Pharmacology I', isFree: false, price: 400, isPublished: true },
    { id: 'pharm-2', name: 'Pharmacology II', isFree: false, price: 400, isPublished: true },
    { id: 'pharm-3', name: 'Pharmacology III', isFree: false, price: 450, isPublished: true },
    { id: 'med-plants', name: 'Medicinal plants', isFree: false, price: 300, isPublished: true },
    { id: 'pharmacognosy', name: 'Pharmacognosy', isFree: false, price: 350, isPublished: true },
  ],
};

function createStandardColleges(prefix: string): College[] {
  return [
    { slug: 'medicine', nameAr: 'كلية الطب', icon: '🩺', subjects: [] },
    { slug: 'dentistry', nameAr: 'كلية طب الأسنان', icon: '🦷', subjects: [] },
    { slug: 'pharmacy', nameAr: 'كلية الصيدلة', icon: '💊', subjects: commonSubjects.pharmacy.map(s => ({ ...s, id: `${prefix}-${s.id}` })) },
    { slug: 'pt', nameAr: 'كلية العلاج الطبيعي', icon: '🏃‍♂️', subjects: [] },
    { slug: 'veterinary', nameAr: 'كلية الطب البيطري', icon: '🐾', subjects: [] },
    { slug: 'nursing', nameAr: 'كلية التمريض', icon: '👩‍⚕️', subjects: [] },
    { slug: 'health-sciences', nameAr: 'كلية العلوم الصحية', icon: '🔬', subjects: [] },
    { slug: 'science', nameAr: 'كلية العلوم', icon: '🧪', subjects: [] },
    { slug: 'engineering', nameAr: 'كلية الهندسة', icon: '⚙️', subjects: [] },
    { slug: 'cs', nameAr: 'كلية الحاسبات والذكاء الاصطناعي', icon: '💻', subjects: [] },
  ];
}

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
    colleges: createStandardColleges('sphinx'),
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
    colleges: createStandardColleges('assiut'),
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
    colleges: createStandardColleges('new-assiut'),
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
    colleges: createStandardColleges('badr'),
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
    colleges: createStandardColleges('azhar'),
  },
];

export function getUniversity(slug: string): University | undefined {
  return UNIVERSITIES.find((u) => u.slug === slug);
}

export function getCollege(uniSlug: string, collegeSlug: string): College | undefined {
  return getUniversity(uniSlug)?.colleges.find((c) => c.slug === collegeSlug);
}
