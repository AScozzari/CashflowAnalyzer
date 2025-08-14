import { z } from 'zod';

// Schema di validazione per movimenti finanziari
export const movementValidationSchema = z.object({
  amount: z.string()
    .min(1, 'Importo richiesto')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Importo deve essere un numero positivo'),
  description: z.string()
    .min(3, 'Descrizione deve avere almeno 3 caratteri')
    .max(500, 'Descrizione troppo lunga'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipo movimento richiesto'
  }),
  flowDate: z.string()
    .min(1, 'Data flusso richiesta')
    .refine((val) => !isNaN(Date.parse(val)), 'Data non valida'),
  companyId: z.number().min(1, 'Azienda richiesta'),
  resourceId: z.number().optional(),
  ibansId: z.number().optional(),
  movementReasonId: z.number().min(1, 'Causale richiesta'),
  movementStatusId: z.number().min(1, 'Status richiesto'),
  tags: z.array(z.string()).optional(),
  xmlData: z.string().optional()
});

// Schema per aziende
export const companyValidationSchema = z.object({
  name: z.string()
    .min(2, 'Nome azienda deve avere almeno 2 caratteri')
    .max(100, 'Nome azienda troppo lungo'),
  vatNumber: z.string()
    .min(11, 'Partita IVA deve avere almeno 11 caratteri')
    .max(16, 'Partita IVA troppo lunga')
    .regex(/^[A-Z0-9]+$/, 'Partita IVA contiene caratteri non validi'),
  address: z.string().max(200, 'Indirizzo troppo lungo').optional(),
  city: z.string().max(50, 'Città troppo lunga').optional(),
  postalCode: z.string()
    .regex(/^\d{5}$/, 'CAP deve essere di 5 cifre')
    .optional(),
  fiscalCode: z.string()
    .min(16, 'Codice fiscale deve essere di 16 caratteri')
    .max(16, 'Codice fiscale deve essere di 16 caratteri')
    .optional()
});

// Schema per IBAN
export const ibanValidationSchema = z.object({
  name: z.string()
    .min(2, 'Nome IBAN richiesto')
    .max(50, 'Nome IBAN troppo lungo'),
  iban: z.string()
    .min(15, 'IBAN troppo corto')
    .max(34, 'IBAN troppo lungo')
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, 'Formato IBAN non valido'),
  bankName: z.string()
    .max(100, 'Nome banca troppo lungo')
    .optional(),
  isDefault: z.boolean().optional()
});

// Utility per validazione sicura
export const safeValidate = <T,>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: 'general', message: 'Errore di validazione sconosciuto' }]
    };
  }
};

// Validazione CSRF token
export const validateCSRFToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  return token.length >= 32 && /^[a-zA-Z0-9]+$/.test(token);
};

// Sanitizzazione input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '');
};

// Validazione formato file
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type) || allowedTypes.some(type => 
    file.name.toLowerCase().endsWith(type.replace('*', ''))
  );
};

// Validazione dimensione file (in MB)
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
};