// Application constants
export const APP_NAME = "CashFlow Management System";

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// File upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

// Movement types
export const MOVEMENT_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
} as const;

// Date formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

// Currency
export const CURRENCY = 'EUR';
export const CURRENCY_LOCALE = 'it-IT';

// Legal forms for companies
export const LEGAL_FORMS = [
  'S.r.l.',
  'S.p.A.',
  'S.r.l.s.',
  'Ditta Individuale',
  'A.s.s.d.',
  'S.s.d. S.r.l.'
];

// European countries (simplified list)
export const EUROPEAN_COUNTRIES = [
  'Italia',
  'Francia',
  'Germania',
  'Spagna',
  'Portogallo',
  'Austria',
  'Belgio',
  'Bulgaria',
  'Cipro',
  'Croazia',
  'Danimarca',
  'Estonia',
  'Finlandia',
  'Grecia',
  'Irlanda',
  'Lettonia',
  'Lituania',
  'Lussemburgo',
  'Malta',
  'Paesi Bassi',
  'Polonia',
  'Repubblica Ceca',
  'Romania',
  'Slovacchia',
  'Slovenia',
  'Svezia',
  'Ungheria'
];

// Italian banks (major ones)
export const ITALIAN_BANKS = [
  'Banca Intesa Sanpaolo',
  'UniCredit',
  'Banco BPM',
  'BPER Banca',
  'Monte dei Paschi di Siena',
  'Crédit Agricole Italia',
  'UBI Banca',
  'Poste Italiane',
  'Banca Mediolanum',
  'CheBanca!',
  'ING Direct',
  'Fineco Bank',
  'Banca Sella',
  'Banca Generali',
  'Banca Popolare di Vicenza',
  'Altro'
];

// Status variants for UI components
export const STATUS_VARIANTS = {
  'Saldato': 'default',
  'Da Saldare': 'secondary',
  'In Lavorazione': 'outline',
  'Saldato Parziale': 'secondary',
  'Annullato': 'destructive',
  'Sospeso': 'outline',
} as const;

// Chart colors
export const CHART_COLORS = {
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  secondary: '#64748B',
  info: '#06B6D4',
  purple: '#8B5CF6',
  gray: '#6B7280'
};

// Movement status colors for charts
export const STATUS_COLORS = {
  "Saldato": "#10B981",
  "Da Saldare": "#F59E0B",
  "In Lavorazione": "#2563EB",
  "Saldato Parziale": "#8B5CF6",
  "Annullato": "#EF4444",
  "Sospeso": "#6B7280",
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Questo campo è obbligatorio',
  INVALID_EMAIL: 'Inserisci un indirizzo email valido',
  INVALID_DATE: 'Inserisci una data valida',
  INVALID_NUMBER: 'Inserisci un numero valido',
  INVALID_IBAN: 'Inserisci un IBAN valido',
  INVALID_TAX_CODE: 'Inserisci un codice fiscale valido',
  INVALID_VAT_NUMBER: 'Inserisci una partita IVA valida',
  FILE_TOO_LARGE: 'Il file è troppo grande (max 10MB)',
  INVALID_FILE_TYPE: 'Tipo di file non supportato',
  MIN_LENGTH: (min: number) => `Minimo ${min} caratteri`,
  MAX_LENGTH: (max: number) => `Massimo ${max} caratteri`,
};

// API Base URL configuration
export const API_BASE_URL = import.meta.env.PROD 
  ? '' // In production, use relative URLs (nginx proxy handles routing)
  : '';

// API endpoints
export const API_ENDPOINTS = {
  COMPANIES: '/api/companies',
  CORES: '/api/cores',
  RESOURCES: '/api/resources',
  IBANS: '/api/ibans',
  OFFICES: '/api/offices',
  TAGS: '/api/tags',
  MOVEMENT_STATUSES: '/api/movement-statuses',
  MOVEMENTS: '/api/movements',
  ANALYTICS: {
    STATS: '/api/analytics/stats',
    CASH_FLOW: '/api/analytics/cash-flow',
    STATUS_DISTRIBUTION: '/api/analytics/status-distribution',
  }
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  COMPANIES: ['companies'],
  COMPANY: (id: string) => ['companies', id],
  CORES: ['cores'],
  CORES_BY_COMPANY: (companyId: string) => ['cores', companyId],
  RESOURCES: ['resources'],
  RESOURCES_BY_COMPANY: (companyId: string) => ['resources', companyId],
  IBANS: ['ibans'],
  IBANS_BY_COMPANY: (companyId: string) => ['ibans', companyId],
  OFFICES: ['offices'],
  OFFICES_BY_COMPANY: (companyId: string) => ['offices', companyId],
  TAGS: ['tags'],
  MOVEMENT_STATUSES: ['movement-statuses'],
  MOVEMENTS: ['movements'],
  MOVEMENT: (id: string) => ['movements', id],
  ANALYTICS_STATS: ['analytics', 'stats'],
  ANALYTICS_CASH_FLOW: ['analytics', 'cash-flow'],
  ANALYTICS_STATUS_DISTRIBUTION: ['analytics', 'status-distribution'],
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Errore di connessione. Verifica la tua connessione internet.',
  SERVER_ERROR: 'Errore del server. Riprova più tardi.',
  UNAUTHORIZED: 'Non sei autorizzato ad accedere a questa risorsa.',
  FORBIDDEN: 'Non hai i permessi necessari per questa operazione.',
  NOT_FOUND: 'Risorsa non trovata.',
  VALIDATION_ERROR: 'I dati inseriti non sono validi.',
  UNKNOWN_ERROR: 'Si è verificato un errore imprevisto.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Elemento creato con successo.',
  UPDATED: 'Elemento aggiornato con successo.',
  DELETED: 'Elemento eliminato con successo.',
  UPLOADED: 'File caricato con successo.',
} as const;
