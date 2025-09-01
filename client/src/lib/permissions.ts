import { User } from "@shared/schema";

export type Permission = 
  | 'view_settings'
  | 'create_movements' 
  | 'edit_movements'
  | 'delete_movements'
  | 'view_all_movements'
  | 'view_analytics'
  | 'create_users'
  | 'manage_entities';

// Configurazione permessi per ruolo
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'view_settings',
    'create_movements',
    'edit_movements', 
    'delete_movements',
    'view_all_movements',
    'view_analytics',
    'create_users',
    'manage_entities'
  ],
  finance: [
    'create_movements',
    'edit_movements',
    'delete_movements', 
    'view_all_movements',
    'view_analytics',
    'manage_entities'
    // NO 'view_settings' - finance non vede impostazioni
  ],
  cashflow: [
    'create_movements',
    'edit_movements',
    'delete_movements', 
    'view_all_movements',
    'view_analytics',
    'manage_entities'
    // NO 'view_settings' - cashflow non vede impostazioni
    // NO fatture - cashflow non può gestire fatture
  ],
  user: [
    'view_analytics', // Solo i propri dati
    // NO create/edit/delete movements
    // NO view_all_movements - solo i propri
    // NO settings, NO manage_entities
  ]
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

export function canViewAllMovements(user: User | null): boolean {
  return hasPermission(user, 'view_all_movements');
}

export function canCreateMovements(user: User | null): boolean {
  return hasPermission(user, 'create_movements');
}

export function canEditMovements(user: User | null): boolean {
  return hasPermission(user, 'edit_movements');
}

export function canDeleteMovements(user: User | null): boolean {
  return hasPermission(user, 'delete_movements');
}

export function canViewSettings(user: User | null): boolean {
  return hasPermission(user, 'view_settings');
}

export function canManageEntities(user: User | null): boolean {
  return hasPermission(user, 'manage_entities');
}

// Helper per determinare se user può vedere solo i propri dati
export function isRestrictedUser(user: User | null): boolean {
  return user?.role === 'user';
}