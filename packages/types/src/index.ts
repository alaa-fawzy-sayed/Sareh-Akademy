// ============================================================
// TOP-PHARMA — SHARED TYPES
// ============================================================

// ---- Enums ----

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  SUPPORT = 'SUPPORT',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum ContentType {
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  QUIZ = 'QUIZ',
  RESOURCE = 'RESOURCE',
  EXAM = 'EXAM',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentProvider {
  PAYMOB = 'PAYMOB',
  STRIPE = 'STRIPE',
  MANUAL = 'MANUAL',
  MOCK = 'MOCK',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum AccessSource {
  PURCHASE = 'PURCHASE',
  CODE = 'CODE',
  ADMIN = 'ADMIN',
  PROMO = 'PROMO',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum NotificationType {
  NEW_LECTURE = 'NEW_LECTURE',
  NEW_COURSE = 'NEW_COURSE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  QUIZ_RESULT = 'QUIZ_RESULT',
  SYSTEM = 'SYSTEM',
}

export enum FileType {
  PDF = 'PDF',
  WORD = 'WORD',
  EXCEL = 'EXCEL',
  POWERPOINT = 'POWERPOINT',
  IMAGE = 'IMAGE',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER',
}

// ---- Base Interfaces ----

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeletable extends BaseEntity {
  deletedAt: string | null;
}

export interface Localizable {
  nameAr: string;
  nameEn: string;
}

// ---- Academic Hierarchy ----

export interface IUniversity extends SoftDeletable, Localizable {
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  website: string | null;
  isActive: boolean;
  displayOrder: number;
  metadata: Record<string, unknown> | null;
  _count?: { colleges: number };
}

export interface ICollege extends SoftDeletable, Localizable {
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  universityId: string;
  university?: Pick<IUniversity, 'id' | 'nameAr' | 'nameEn' | 'slug'>;
  _count?: { academicYears: number };
}

export interface IAcademicYear extends BaseEntity, Localizable {
  displayOrder: number;
  collegeId: string;
  college?: Pick<ICollege, 'id' | 'nameAr' | 'nameEn'>;
  _count?: { semesters: number };
}

export interface ISemester extends BaseEntity, Localizable {
  displayOrder: number;
  academicYearId: string;
  academicYear?: Pick<IAcademicYear, 'id' | 'nameAr' | 'nameEn'>;
  _count?: { subjects: number };
}

export interface ISubject extends SoftDeletable, Localizable {
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  isFree: boolean;
  isPublished: boolean;
  semesterId: string;
  price: string | null;
  semester?: Pick<ISemester, 'id' | 'nameAr' | 'nameEn'>;
  teachers?: ITeacherSummary[];
  _count?: { chapters: number };
}

export interface IChapter extends BaseEntity {
  titleAr: string;
  titleEn: string;
  displayOrder: number;
  subjectId: string;
  subject?: Pick<ISubject, 'id' | 'nameAr' | 'nameEn'>;
  _count?: { contents: number };
}

export interface IContent extends BaseEntity {
  type: ContentType;
  titleAr: string;
  titleEn: string | null;
  description: string | null;
  displayOrder: number;
  isFree: boolean;
  isPublished: boolean;
  chapterId: string;
  chapter?: Pick<IChapter, 'id' | 'titleAr' | 'titleEn'>;
  video?: IVideo;
  file?: IFile;
  quiz?: IQuizSummary;
}

export interface IVideo {
  id: string;
  contentId: string;
  duration: number | null;
  viewCount: number;
}

export interface IFile {
  id: string;
  contentId: string;
  fileType: FileType;
  sizeBytes: number;
  downloadCount: number;
}

export interface IQuizSummary {
  id: string;
  contentId: string;
  questionCount: number;
  passingScore: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
}

// ---- Teachers ----

export interface ITeacherSummary {
  id: string;
  nameAr: string;
  nameEn: string;
  avatarUrl: string | null;
}

export interface ITeacher extends ITeacherSummary, BaseEntity {
  bio: string | null;
  academicTitle: string | null;
  isActive: boolean;
  userId: string | null;
  subjects?: Pick<ISubject, 'id' | 'nameAr' | 'nameEn' | 'slug'>[];
}

// ---- Users ----

export interface IUser extends BaseEntity {
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  roles: UserRole[];
}

export interface IAuthTokens {
  accessToken: string;
  expiresIn: number;
}

// ---- Progress ----

export interface IUserProgress {
  id: string;
  userId: string;
  contentId: string;
  position: number;
  completed: boolean;
  lastWatched: string;
}

// ---- Payments ----

export interface IOrder extends BaseEntity {
  userId: string;
  status: OrderStatus;
  totalAmount: string;
  currency: string;
  items: IOrderItem[];
  payment?: IPaymentSummary;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  subjectId: string;
  subjectName: string;
  price: string;
}

export interface IPaymentSummary {
  id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: string;
  verifiedAt: string | null;
}

// ---- Access ----

export interface IUserAccess extends BaseEntity {
  userId: string;
  subjectId: string | null;
  contentId: string | null;
  source: AccessSource;
  expiresAt: string | null;
  grantedBy: string | null;
}

// ---- Notifications ----

export interface INotification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
}

// ---- Search ----

export interface ISearchResult {
  type: 'university' | 'college' | 'subject' | 'teacher' | 'content';
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
  thumbnail: string | null;
}

// ---- Pagination ----

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ---- API Responses ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

// ---- Admin Stats ----

export interface IAdminStats {
  totalUsers: number;
  totalUniversities: number;
  totalColleges: number;
  totalSubjects: number;
  totalTeachers: number;
  totalVideos: number;
  totalFiles: number;
  totalOrders: number;
  totalRevenue: string;
  activeSubscriptions: number;
  totalViews: number;
  newUsersThisMonth: number;
  revenueThisMonth: string;
}
