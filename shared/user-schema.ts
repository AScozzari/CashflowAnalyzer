// User management specific schemas and validations
import { z } from 'zod';

// User role validation
export const userRoleSchema = z.enum(['admin', 'finance', 'user']);

// User status validation
export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

// User preference schemas
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  language: z.enum(['it', 'en']).default('it'),
  timezone: z.string().default('Europe/Rome'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  currency: z.string().default('EUR'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).default({}),
}).default({});

// User profile validation
export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

// User creation validation
export const createUserSchema = z.object({
  username: z.string().min(3, 'Username deve avere almeno 3 caratteri'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve avere almeno 6 caratteri'),
  role: userRoleSchema,
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: userStatusSchema.default('active'),
  preferences: userPreferencesSchema.optional(),
});

// User update validation
export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Password change validation
export const changeUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: z.string().min(6, 'La nuova password deve avere almeno 6 caratteri'),
  confirmPassword: z.string().min(1, 'Conferma password richiesta'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

// User permission validation
export const userPermissionSchema = z.object({
  resource: z.string(),
  actions: z.array(z.enum(['create', 'read', 'update', 'delete', 'manage'])),
});

// Bulk user operations
export const bulkUserOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'change_role']),
  userIds: z.array(z.string().min(1)),
  params: z.record(z.any()).optional(),
});

// User activity log schema
export const userActivitySchema = z.object({
  action: z.string(),
  resource: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ChangeUserPassword = z.infer<typeof changeUserPasswordSchema>;
export type UserPermission = z.infer<typeof userPermissionSchema>;
export type BulkUserOperation = z.infer<typeof bulkUserOperationSchema>;
export type UserActivity = z.infer<typeof userActivitySchema>;