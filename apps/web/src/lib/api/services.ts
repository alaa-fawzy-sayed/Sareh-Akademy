/**
 * Centralized API service helpers.
 * All public-facing pages should use these functions to fetch data.
 */

import api from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface University {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  location: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  _count?: { colleges: number };
}

export interface College {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string | null;
  _count?: { subjects?: number; academicYears?: number };
}

export interface Subject {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  introVideoUrl?: string | null;
  price: number | null;
  isFree: boolean;
  isPublished: boolean;
  _count?: { chapters: number };
}

export interface UniversityDetail extends University {
  colleges: College[];
}

export interface CollegeDetail extends College {
  subjects: Subject[];
  university: { id: string; nameAr: string; nameEn: string; slug: string };
}

export interface PlatformStats {
  users: number;
  subjects: number;
  universities: number;
  revenue: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Unwrap API envelope: { success, data: { data: [...], meta } } or plain array */
function unwrapList<T>(res: any): T[] {
  const outer = res?.data;
  if (Array.isArray(outer)) return outer;
  if (outer && Array.isArray(outer.data)) return outer.data;
  if (outer && Array.isArray(outer.data?.data)) return outer.data.data;
  if (outer && Array.isArray(outer.items)) return outer.items;
  return [];
}

// ─── Universities ─────────────────────────────────────────────────────────────

export async function fetchUniversities(): Promise<University[]> {
  const res = await api.get('/universities?isActive=true&limit=50');
  return unwrapList<University>(res);
}

export async function fetchUniversityBySlug(slug: string): Promise<UniversityDetail | null> {
  try {
    const res = await api.get(`/universities/${slug}`);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

// ─── Colleges ────────────────────────────────────────────────────────────────

export async function fetchCollegesByUniversity(universityId: string): Promise<College[]> {
  const res = await api.get(`/colleges?universityId=${universityId}&limit=50`);
  return unwrapList<College>(res);
}

export async function fetchCollegeBySlug(
  universitySlug: string,
  collegeSlug: string,
): Promise<CollegeDetail | null> {
  try {
    // 1. Resolve university
    const uni = await fetchUniversityBySlug(universitySlug);
    if (!uni) return null;

    // 2. Resolve college from list
    const colleges = await fetchCollegesByUniversity(uni.id);
    const col = colleges.find((c) => c.slug === collegeSlug);
    if (!col) return null;

    // 3. Fetch college detail
    const res = await api.get(`/colleges/${col.id}`);
    const detail: any = res.data?.data ?? res.data;
    if (!detail) return null;

    // 4. Fetch subjects for this college (via semester→academicYear→college chain)
    const subjectsRes = await api.get(
      `/subjects?collegeId=${col.id}&isPublished=true&limit=200`,
    );
    const rawSubjects: any[] = unwrapList<any>(subjectsRes);
    const subjects: Subject[] = rawSubjects.map((s) => ({
      id:           s.id,
      nameAr:       s.nameAr,
      nameEn:       s.nameEn,
      slug:         s.slug,
      description:  s.description ?? null,
      thumbnailUrl: s.thumbnailUrl ?? null,
      price:        s.price ?? null,
      isFree:       s.isFree ?? false,
      isPublished:  s.isPublished ?? true,
      _count:       s._count,
    }));

    return {
      ...detail,
      subjects,
      university: {
        id:     uni.id,
        nameAr: uni.nameAr,
        nameEn: uni.nameEn,
        slug:   uni.slug,
      },
    };
  } catch {
    return null;
  }
}


// ─── Subjects ────────────────────────────────────────────────────────────────

export async function fetchSubjects(params?: {
  collegeId?: string;
  universityId?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}): Promise<Subject[]> {
  const q = new URLSearchParams();
  if (params?.collegeId) q.set('collegeId', params.collegeId);
  if (params?.universityId) q.set('universityId', params.universityId);
  if (params?.isPublished !== undefined) q.set('isPublished', String(params.isPublished));
  q.set('limit', String(params?.limit ?? 100));
  if (params?.page) q.set('page', String(params.page));

  const res = await api.get(`/subjects?${q.toString()}`);
  return unwrapList<Subject>(res);
}

export async function fetchSubjectsByCollegeId(collegeId: string): Promise<Subject[]> {
  return fetchSubjects({ collegeId, isPublished: true });
}

export interface ChapterContent {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  type: 'VIDEO' | 'FILE' | 'QUIZ';
  isFree: boolean;
  displayOrder: number;
  video?: { duration?: number; viewCount?: number } | null;
  file?: { fileType?: string; originalName?: string; downloadCount?: number } | null;
}

export interface ChapterDetail {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  displayOrder: number;
  contents: ChapterContent[];
}

export interface SubjectDetail extends Subject {
  semester?: {
    nameAr: string;
    academicYear?: {
      nameAr: string;
      college?: {
        nameAr: string;
        slug: string;
        university?: {
          nameAr: string;
          slug: string;
        };
      };
    };
  };
  chapters?: ChapterDetail[];
}

export async function fetchSubjectBySlugOrId(idOrSlug: string): Promise<SubjectDetail | null> {
  try {
    const res = await api.get(`/subjects/${idOrSlug}`);
    const data = res.data?.data ?? res.data;
    return data ?? null;
  } catch {
    return null;
  }
}

// ─── All colleges (for /subjects page grouped view) ──────────────────────────

export interface CollegeWithSubjects {
  id: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  universitySlug: string;
  universityNameAr: string;
  subjects: Subject[];
}

export async function fetchAllCollegesWithSubjects(): Promise<CollegeWithSubjects[]> {
  try {
    // Get all published subjects (each includes semester → academicYear → college)
    const subjectsRes = await api.get('/subjects?isPublished=true&limit=300');
    const rawSubjects: any[] = unwrapList<any>(subjectsRes);

    // Extract college info from the nested path
    const collegeMap = new Map<string, CollegeWithSubjects>();

    for (const s of rawSubjects) {
      const college = s?.semester?.academicYear?.college;
      if (!college?.id) continue;

      // استخراج بيانات الجامعة من nested path
      const university = college.university;
      const universitySlug: string = university?.slug ?? '';
      const universityNameAr: string = university?.nameAr ?? '';

      if (!collegeMap.has(college.id)) {
        collegeMap.set(college.id, {
          id:              college.id,
          nameAr:          college.nameAr,
          slug:            college.slug,
          icon:            college.icon ?? null,
          universitySlug,
          universityNameAr,
          subjects:        [],
        });
      }

      const subject: Subject = {
        id:           s.id,
        nameAr:       s.nameAr,
        nameEn:       s.nameEn,
        slug:         s.slug,
        description:  s.description ?? null,
        thumbnailUrl: s.thumbnailUrl ?? null,
        price:        s.price ?? null,
        isFree:       s.isFree ?? false,
        isPublished:  s.isPublished ?? true,
        _count:       s._count,
      };

      collegeMap.get(college.id)!.subjects.push(subject);
    }

    return Array.from(collegeMap.values());
  } catch {
    return [];
  }
}


// ─── Platform stats ───────────────────────────────────────────────────────────

export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  try {
    const res = await api.get('/admin/stats');
    return res.data?.stats ?? null;
  } catch {
    return null;
  }
}


// ─── Payments ─────────────────────────────────────────────────────────────────

export interface CheckoutResult {
  orderId: string;
  isFree: boolean;
  status: string;
  /** Paymob iframe URL — موجود فقط في بيئة الإنتاج */
  iframeUrl?: string;
  paymentKey?: string;
  paymobOrderId?: number;
  /** true في بيئة التطوير (Mock mode) */
  mockMode?: boolean;
  message?: string;
}

export interface OrderItem {
  id: string;
  subjectId: string;
  subjectName: string;
  price: string;
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  totalAmount: string;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    id?: string;
    provider: string;
    providerRef?: string | null;
    status: string;
    verifiedAt: string | null;
    metadata?: any;
    amount?: string | number;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  discountAmount?: string | null;
}

export interface OrdersPage {
  data: Order[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * إنشاء checkout session
 * @param subjectIds — مصفوفة IDs المواد المطلوب الاشتراك بها
 * @param discountCode — كود خصم اختياري
 */
export async function checkout(
  subjectIds: string[],
  discountCode?: string,
): Promise<CheckoutResult> {
  const body: Record<string, unknown> = { subjectIds };
  if (discountCode?.trim()) body.discountCode = discountCode.trim().toUpperCase();
  const res = await api.post('/payments/checkout', body);
  return res.data?.data ?? res.data;
}

/**
 * إكمال دفع Mock (بيئة التطوير فقط)
 */
export async function mockComplete(orderId: string): Promise<Order> {
  const res = await api.post(`/payments/mock-complete/${orderId}`);
  return res.data?.data ?? res.data;
}

/**
 * جلب طلبات المستخدم الحالي
 */
export async function fetchMyOrders(page = 1, limit = 10): Promise<OrdersPage> {
  const res = await api.get(`/payments/orders?page=${page}&limit=${limit}`);
  return res.data;
}

/**
 * جلب تفاصيل طلب بعينه
 */
export async function fetchOrderById(orderId: string): Promise<Order> {
  const res = await api.get(`/payments/orders/${orderId}`);
  return res.data;
}

/**
 * تحديث سعر مادة (Admin)
 */
export async function updateSubjectPrice(
  subjectId: string,
  price: number,
  isFree: boolean,
): Promise<void> {
  await api.patch(`/subjects/${subjectId}`, { price: isFree ? 0 : price, isFree });
}

/**
 * إرسال إيصال دفع يدوي (فودافون كاش / إنستاباي)
 */
export async function submitManualPayment(data: {
  subjectIds: string[];
  senderNumber: string;
  paymentMethod?: string;
  receiptUrl: string;
  notes?: string;
  transactionRef?: string;
}): Promise<{ success: boolean; message: string; orderId: string }> {
  const res = await api.post('/payments/submit-manual-payment', data);
  return res.data?.data ?? res.data;
}

/**
 * اعتماد طلب دفع يدوي وتفعيل المادة للطالب (Admin)
 */
export async function approveOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  const res = await api.patch(`/admin/orders/${orderId}/approve`);
  return res.data?.data ?? res.data;
}

/**
 * رفض طلب دفع مع كتابة السبب (Admin)
 */
export async function rejectOrder(
  orderId: string,
  reason: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.patch(`/admin/orders/${orderId}/reject`, { reason });
  return res.data?.data ?? res.data;
}


