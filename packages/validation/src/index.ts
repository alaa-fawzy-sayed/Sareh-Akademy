import { z } from 'zod';

// ---- Auth Schemas ----

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number',
    ),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ---- University Schemas ----

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateUniversitySchema = z.object({
  nameAr: z.string().min(2).max(200).trim(),
  nameEn: z.string().min(2).max(200).trim(),
  slug: z.string().regex(slugRegex, 'Slug must be lowercase with hyphens only').max(100),
  description: z.string().max(2000).trim().optional(),
  location: z.string().max(200).trim().optional(),
  website: z.string().url().optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateUniversitySchema = CreateUniversitySchema.partial();

// ---- College Schemas ----

export const CreateCollegeSchema = z.object({
  nameAr: z.string().min(2).max(200).trim(),
  nameEn: z.string().min(2).max(200).trim(),
  slug: z.string().regex(slugRegex).max(100),
  description: z.string().max(2000).trim().optional(),
  universityId: z.string().cuid(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCollegeSchema = CreateCollegeSchema.partial();

// ---- Academic Year Schemas ----

export const CreateAcademicYearSchema = z.object({
  nameAr: z.string().min(1).max(100).trim(),
  nameEn: z.string().min(1).max(100).trim(),
  collegeId: z.string().cuid(),
  displayOrder: z.number().int().min(0).default(0),
});

export const UpdateAcademicYearSchema = CreateAcademicYearSchema.partial();

// ---- Semester Schemas ----

export const CreateSemesterSchema = z.object({
  nameAr: z.string().min(1).max(100).trim(),
  nameEn: z.string().min(1).max(100).trim(),
  academicYearId: z.string().cuid(),
  displayOrder: z.number().int().min(0).default(0),
});

export const UpdateSemesterSchema = CreateSemesterSchema.partial();

// ---- Subject Schemas ----

export const CreateSubjectSchema = z.object({
  nameAr: z.string().min(2).max(200).trim(),
  nameEn: z.string().min(2).max(200).trim(),
  slug: z.string().regex(slugRegex).max(100),
  description: z.string().max(2000).trim().optional(),
  semesterId: z.string().cuid(),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  teacherIds: z.array(z.string().cuid()).optional(),
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

// ---- Chapter Schemas ----

export const CreateChapterSchema = z.object({
  titleAr: z.string().min(1).max(300).trim(),
  titleEn: z.string().min(1).max(300).trim().optional(),
  subjectId: z.string().cuid(),
  displayOrder: z.number().int().min(0).default(0),
});

export const UpdateChapterSchema = CreateChapterSchema.partial();

// ---- Content Schemas ----

export const CreateContentSchema = z.object({
  type: z.enum(['VIDEO', 'FILE', 'QUIZ', 'RESOURCE', 'EXAM']),
  titleAr: z.string().min(1).max(300).trim(),
  titleEn: z.string().min(1).max(300).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  chapterId: z.string().cuid(),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
});

export const UpdateContentSchema = CreateContentSchema.partial();

// ---- Teacher Schemas ----

export const CreateTeacherSchema = z.object({
  nameAr: z.string().min(2).max(200).trim(),
  nameEn: z.string().min(2).max(200).trim(),
  bio: z.string().max(2000).trim().optional(),
  academicTitle: z.string().max(200).trim().optional(),
  isActive: z.boolean().default(true),
  userId: z.string().cuid().optional(),
  subjectIds: z.array(z.string().cuid()).optional(),
});

export const UpdateTeacherSchema = CreateTeacherSchema.partial();

// ---- Progress Schemas ----

export const UpdateProgressSchema = z.object({
  position: z.number().int().min(0),
  completed: z.boolean().optional(),
});

// ---- Order Schemas ----

export const CreateOrderSchema = z.object({
  subjectIds: z.array(z.string().cuid()).min(1, 'At least one subject is required'),
  discountCode: z.string().optional(),
});

// ---- Quiz Schemas ----

export const QuizAnswerSchema = z.object({
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
  explanation: z.string().max(1000).optional(),
});

export const QuizQuestionSchema = z.object({
  text: z.string().min(1).max(1000),
  explanation: z.string().max(1000).optional(),
  points: z.number().int().min(1).default(1),
  answers: z.array(QuizAnswerSchema).min(2).max(6),
});

export const CreateQuizSchema = z.object({
  contentId: z.string().cuid(),
  passingScore: z.number().int().min(1).max(100).default(60),
  maxAttempts: z.number().int().min(1).optional(),
  timeLimitMinutes: z.number().int().min(1).optional(),
  questions: z.array(QuizQuestionSchema).min(1),
});

// ---- Pagination Query Schemas ----

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---- Search Schema ----

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['university', 'college', 'subject', 'teacher', 'content']).optional(),
  universityId: z.string().cuid().optional(),
  collegeId: z.string().cuid().optional(),
  semesterId: z.string().cuid().optional(),
  isFree: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---- Announcement Schema ----

export const CreateAnnouncementSchema = z.object({
  titleAr: z.string().min(1).max(300),
  titleEn: z.string().min(1).max(300).optional(),
  bodyAr: z.string().min(1).max(5000),
  bodyEn: z.string().max(5000).optional(),
  universityId: z.string().cuid().optional(),
  collegeId: z.string().cuid().optional(),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isPublished: z.boolean().default(false),
});

// ---- Discount Schema ----

export const CreateDiscountSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  subjectIds: z.array(z.string().cuid()).optional(),
});

// ---- Inferred Types ----

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type CreateUniversityDto = z.infer<typeof CreateUniversitySchema>;
export type UpdateUniversityDto = z.infer<typeof UpdateUniversitySchema>;
export type CreateCollegeDto = z.infer<typeof CreateCollegeSchema>;
export type UpdateCollegeDto = z.infer<typeof UpdateCollegeSchema>;
export type CreateAcademicYearDto = z.infer<typeof CreateAcademicYearSchema>;
export type CreateSemesterDto = z.infer<typeof CreateSemesterSchema>;
export type CreateSubjectDto = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubjectDto = z.infer<typeof UpdateSubjectSchema>;
export type CreateChapterDto = z.infer<typeof CreateChapterSchema>;
export type CreateContentDto = z.infer<typeof CreateContentSchema>;
export type CreateTeacherDto = z.infer<typeof CreateTeacherSchema>;
export type UpdateProgressDto = z.infer<typeof UpdateProgressSchema>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type CreateQuizDto = z.infer<typeof CreateQuizSchema>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
export type CreateAnnouncementDto = z.infer<typeof CreateAnnouncementSchema>;
export type CreateDiscountDto = z.infer<typeof CreateDiscountSchema>;
