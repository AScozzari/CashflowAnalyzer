import type { SecuritySettings } from '../../shared/schema';

// Security Manager - REAL Dynamic Security Enforcement
class SecurityManagerService {
  private settings: SecuritySettings | null = null;
  private lastRefresh: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Carica settings dal database
  async loadSettings(): Promise<SecuritySettings> {
    try {
      const now = Date.now();
      
      // Cache check - ricarica solo se necessario
      if (this.settings && (now - this.lastRefresh) < this.CACHE_TTL) {
        return this.settings;
      }

      const { storage } = await import('../storage');
      let settings = await storage.getSecuritySettings();
      
      // Se non esistono, crea settings di default
      if (!settings) {
        console.log('[SECURITY MANAGER] No security settings found, creating defaults...');
        settings = await storage.updateSecuritySettings({
          sessionTimeout: 3600,
          maxConcurrentSessions: 3,
          enforceSessionTimeout: true,
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireLowercase: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: false,
          passwordExpiryDays: 90,
          passwordHistoryCount: 5,
          twoFactorEnabled: false,
          twoFactorMandatoryForAdmin: false,
          twoFactorMandatoryForFinance: false,
          loginAttemptsLimit: 5,
          loginBlockDuration: 900,
          apiRateLimit: 100,
          auditEnabled: true,
          auditRetentionDays: 90,
          trackFailedLogins: true,
          trackIpChanges: true,
          jwtExpirationHours: 24,
          refreshTokenExpirationDays: 7,
          apiKeyRotationDays: 30
        });
      }

      this.settings = settings;
      this.lastRefresh = now;
      
      console.log(`[SECURITY MANAGER] Settings loaded: loginAttempts=${settings.loginAttemptsLimit}, blockDuration=${settings.loginBlockDuration}s, apiRateLimit=${settings.apiRateLimit}`);
      return settings;
    } catch (error) {
      console.error('[SECURITY MANAGER] Error loading settings:', error);
      
      // Fallback to default settings
      return {
        id: 'default',
        sessionTimeout: 3600,
        maxConcurrentSessions: 3,
        enforceSessionTimeout: true,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        passwordExpiryDays: 90,
        passwordHistoryCount: 5,
        twoFactorEnabled: false,
        twoFactorMandatoryForAdmin: false,
        twoFactorMandatoryForFinance: false,
        loginAttemptsLimit: 5,
        loginBlockDuration: 900,
        apiRateLimit: 100,
        auditEnabled: true,
        auditRetentionDays: 90,
        trackFailedLogins: true,
        trackIpChanges: true,
        jwtExpirationHours: 24,
        refreshTokenExpirationDays: 7,
        apiKeyRotationDays: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      } as SecuritySettings;
    }
  }

  // Forza refresh immediato dei settings
  async refreshSettings(): Promise<SecuritySettings> {
    this.lastRefresh = 0; // Reset cache
    const settings = await this.loadSettings();
    
    console.log('[SECURITY MANAGER] Settings force refreshed!');
    this.notifySettingsChanged(settings);
    
    return settings;
  }

  // Ottieni setting specifico con fallback
  async getSetting<K extends keyof SecuritySettings>(key: K): Promise<SecuritySettings[K]> {
    const settings = await this.loadSettings();
    return settings[key];
  }

  // Verifica se password rispetta policy
  async validatePassword(password: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const settings = await this.loadSettings();
    const errors: string[] = [];

    if (password.length < settings.passwordMinLength) {
      errors.push(`Password deve essere almeno ${settings.passwordMinLength} caratteri`);
    }

    if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password deve contenere almeno una lettera maiuscola');
    }

    if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password deve contenere almeno una lettera minuscola');
    }

    if (settings.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password deve contenere almeno un numero');
    }

    if (settings.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password deve contenere almeno un simbolo');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Verifica se IP tracking è abilitato
  async isIpTrackingEnabled(): Promise<boolean> {
    return await this.getSetting('trackIpChanges');
  }

  // Verifica se audit è abilitato
  async isAuditEnabled(): Promise<boolean> {
    return await this.getSetting('auditEnabled');
  }

  // Ottieni timeout sessione in millisecondi
  async getSessionTimeout(): Promise<number> {
    const timeoutSeconds = await this.getSetting('sessionTimeout');
    return timeoutSeconds * 1000; // Convert to milliseconds
  }

  // Verifica se 2FA è obbligatorio per il ruolo
  async isTwoFactorRequired(role: string): Promise<boolean> {
    const settings = await this.loadSettings();
    
    if (role === 'admin') {
      return settings.twoFactorMandatoryForAdmin;
    }
    if (role === 'finance') {
      return settings.twoFactorMandatoryForFinance;
    }
    
    return settings.twoFactorEnabled;
  }

  // Ottieni limiti login dinamici
  async getLoginLimits(): Promise<{
    maxAttempts: number;
    blockDurationMs: number;
  }> {
    const settings = await this.loadSettings();
    return {
      maxAttempts: settings.loginAttemptsLimit,
      blockDurationMs: settings.loginBlockDuration * 1000
    };
  }

  // Ottieni rate limit API dinamico
  async getApiRateLimit(): Promise<number> {
    return await this.getSetting('apiRateLimit');
  }

  // Callback per notificare cambiamenti di settings
  private settingsChangeCallbacks: Array<(settings: SecuritySettings) => void> = [];

  // Registra callback per cambiamenti settings
  onSettingsChanged(callback: (settings: SecuritySettings) => void): void {
    this.settingsChangeCallbacks.push(callback);
  }

  // Notifica tutti i callback registrati
  private notifySettingsChanged(settings: SecuritySettings): void {
    this.settingsChangeCallbacks.forEach(callback => {
      try {
        callback(settings);
      } catch (error) {
        console.error('[SECURITY MANAGER] Error in settings change callback:', error);
      }
    });
  }

  // Metodo per update settings (chiamato dall'API)
  async updateSettings(newSettings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      const { storage } = await import('../storage');
      const updatedSettings = await storage.updateSecuritySettings(newSettings);
      
      // Force refresh cache
      this.settings = updatedSettings;
      this.lastRefresh = Date.now();
      
      console.log('[SECURITY MANAGER] Settings updated successfully');
      this.notifySettingsChanged(updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('[SECURITY MANAGER] Error updating settings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const securityManager = new SecurityManagerService();

// Export additional utility functions
export async function getCurrentSecuritySettings(): Promise<SecuritySettings> {
  return await securityManager.loadSettings();
}

export async function validatePasswordWithPolicy(password: string): Promise<{ valid: boolean; errors: string[] }> {
  return await securityManager.validatePassword(password);
}

export async function getSecuritySetting<K extends keyof SecuritySettings>(key: K): Promise<SecuritySettings[K]> {
  return await securityManager.getSetting(key);
}