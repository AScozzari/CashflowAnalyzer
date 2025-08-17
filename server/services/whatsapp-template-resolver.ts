import { DatabaseStorage } from '../storage';

interface TemplateContext {
  // Entità principali
  companyId?: string;
  customerId?: string;
  supplierId?: string;
  movementId?: string;
  
  // Dati opzionali per override
  overrideData?: Record<string, any>;
}

interface ResolvedVariable {
  key: string;
  value: string;
  type: 'text' | 'email' | 'phone' | 'currency' | 'date' | 'number' | 'time';
  rawValue?: any;
}

export class WhatsAppTemplateResolver {
  constructor(private storage: DatabaseStorage) {}

  /**
   * Risolve tutte le variabili dinamiche in un template WhatsApp
   */
  async resolveTemplate(templateBody: string, context: TemplateContext): Promise<string> {
    // Trova tutte le variabili nel formato {{entity.field}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(templateBody)) !== null) {
      variables.push(match[1]);
    }

    // Risolvi ogni variabile
    let resolvedTemplate = templateBody;
    for (const variable of variables) {
      const resolvedValue = await this.resolveVariable(variable, context);
      resolvedTemplate = resolvedTemplate.replace(
        new RegExp(`\\{\\{${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'),
        resolvedValue.value
      );
    }

    return resolvedTemplate;
  }

  /**
   * Risolve una singola variabile dinamica
   */
  private async resolveVariable(variableKey: string, context: TemplateContext): Promise<ResolvedVariable> {
    const [entity, field] = variableKey.split('.');
    
    try {
      switch (entity) {
        case 'company':
          return await this.resolveCompanyVariable(field, context.companyId, context.overrideData);
        
        case 'customer':
          return await this.resolveCustomerVariable(field, context.customerId, context.overrideData);
        
        case 'supplier':
          return await this.resolveSupplierVariable(field, context.supplierId, context.overrideData);
        
        case 'movement':
          return await this.resolveMovementVariable(field, context.movementId, context.overrideData);
        
        case 'system':
          return this.resolveSystemVariable(field, context.overrideData);
        
        default:
          return {
            key: variableKey,
            value: `[${variableKey}: entità non trovata]`,
            type: 'text'
          };
      }
    } catch (error) {
      console.error(`Error resolving variable ${variableKey}:`, error);
      return {
        key: variableKey,
        value: `[${variableKey}: errore]`,
        type: 'text'
      };
    }
  }

  /**
   * Risolve variabili dell'azienda
   */
  private async resolveCompanyVariable(field: string, companyId?: string, overrideData?: Record<string, any>): Promise<ResolvedVariable> {
    if (!companyId) {
      return { key: `company.${field}`, value: `[azienda non specificata]`, type: 'text' };
    }

    const companies = await this.storage.getCompanies();
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      return { key: `company.${field}`, value: `[azienda non trovata]`, type: 'text' };
    }

    const fieldMap: Record<string, { value: any; type: ResolvedVariable['type'] }> = {
      'name': { value: company.name, type: 'text' },
      'adminContact': { value: company.adminContact || 'N/A', type: 'text' },
      'email': { value: company.email || 'N/A', type: 'email' },
      'address': { value: `${company.address}, ${company.city}`, type: 'text' },
      'vatNumber': { value: company.vatNumber || 'N/A', type: 'text' },
      'taxCode': { value: company.taxCode || 'N/A', type: 'text' }
    };

    const fieldData = fieldMap[field];
    if (!fieldData) {
      return { key: `company.${field}`, value: `[campo non trovato]`, type: 'text' };
    }

    return {
      key: `company.${field}`,
      value: String(fieldData.value),
      type: fieldData.type,
      rawValue: fieldData.value
    };
  }

  /**
   * Risolve variabili del cliente
   */
  private async resolveCustomerVariable(field: string, customerId?: string, overrideData?: Record<string, any>): Promise<ResolvedVariable> {
    if (!customerId) {
      return { key: `customer.${field}`, value: `[cliente non specificato]`, type: 'text' };
    }

    const customers = await this.storage.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return { key: `customer.${field}`, value: `[cliente non trovato]`, type: 'text' };
    }

    const fieldMap: Record<string, { value: any; type: ResolvedVariable['type'] }> = {
      'name': { 
        value: customer.type === 'business' 
          ? customer.name 
          : `${customer.firstName} ${customer.lastName}`, 
        type: 'text' 
      },
      'firstName': { value: customer.firstName || 'N/A', type: 'text' },
      'lastName': { value: customer.lastName || 'N/A', type: 'text' },
      'email': { value: customer.email || 'N/A', type: 'email' },
      'phone': { value: customer.phone || 'N/A', type: 'phone' },
      'contactPerson': { value: customer.contactPerson || 'N/A', type: 'text' },
      'vatNumber': { value: customer.vatNumber || 'N/A', type: 'text' }
    };

    const fieldData = fieldMap[field];
    if (!fieldData) {
      return { key: `customer.${field}`, value: `[campo non trovato]`, type: 'text' };
    }

    return {
      key: `customer.${field}`,
      value: String(fieldData.value),
      type: fieldData.type,
      rawValue: fieldData.value
    };
  }

  /**
   * Risolve variabili del fornitore
   */
  private async resolveSupplierVariable(field: string, supplierId?: string, overrideData?: Record<string, any>): Promise<ResolvedVariable> {
    if (!supplierId) {
      return { key: `supplier.${field}`, value: `[fornitore non specificato]`, type: 'text' };
    }

    const suppliers = await this.storage.getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
      return { key: `supplier.${field}`, value: `[fornitore non trovato]`, type: 'text' };
    }

    const fieldMap: Record<string, { value: any; type: ResolvedVariable['type'] }> = {
      'name': { value: supplier.name, type: 'text' },
      'contactPerson': { value: supplier.contactPerson || 'N/A', type: 'text' },
      'email': { value: supplier.email || 'N/A', type: 'email' },
      'phone': { value: supplier.phone || 'N/A', type: 'phone' },
      'vatNumber': { value: supplier.vatNumber, type: 'text' }
    };

    const fieldData = fieldMap[field];
    if (!fieldData) {
      return { key: `supplier.${field}`, value: `[campo non trovato]`, type: 'text' };
    }

    return {
      key: `supplier.${field}`,
      value: String(fieldData.value),
      type: fieldData.type,
      rawValue: fieldData.value
    };
  }

  /**
   * Risolve variabili del movimento finanziario
   */
  private async resolveMovementVariable(field: string, movementId?: string, overrideData?: Record<string, any>): Promise<ResolvedVariable> {
    if (!movementId) {
      return { key: `movement.${field}`, value: `[movimento non specificato]`, type: 'text' };
    }

    const movements = await this.storage.getMovements();
    const movement = movements.find(m => m.id === movementId);
    if (!movement) {
      return { key: `movement.${field}`, value: `[movimento non trovato]`, type: 'text' };
    }

    const fieldMap: Record<string, { value: any; type: ResolvedVariable['type'] }> = {
      'amount': { 
        value: new Intl.NumberFormat('it-IT', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(Number(movement.amount)), 
        type: 'currency' 
      },
      'flowDate': { 
        value: new Date(movement.flowDate).toLocaleDateString('it-IT'), 
        type: 'date' 
      },
      'documentNumber': { value: movement.documentNumber || 'N/A', type: 'text' },
      'type': { value: movement.type === 'income' ? 'Entrata' : 'Uscita', type: 'text' },
      'notes': { value: movement.notes || 'N/A', type: 'text' },
      'reason': { value: movement.reason || 'N/A', type: 'text' }
    };

    const fieldData = fieldMap[field];
    if (!fieldData) {
      return { key: `movement.${field}`, value: `[campo non trovato]`, type: 'text' };
    }

    return {
      key: `movement.${field}`,
      value: String(fieldData.value),
      type: fieldData.type,
      rawValue: fieldData.value
    };
  }

  /**
   * Risolve variabili di sistema
   */
  private resolveSystemVariable(field: string, overrideData?: Record<string, any>): ResolvedVariable {
    const now = new Date();
    
    const fieldMap: Record<string, { value: any; type: ResolvedVariable['type'] }> = {
      'currentDate': { 
        value: now.toLocaleDateString('it-IT'), 
        type: 'date' 
      },
      'currentTime': { 
        value: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), 
        type: 'time' 
      },
      'dueDate': { 
        value: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT'), 
        type: 'date' 
      },
      'daysDue': { 
        value: '30 giorni', 
        type: 'text' 
      }
    };

    const fieldData = fieldMap[field];
    if (!fieldData) {
      return { key: `system.${field}`, value: `[campo sistema non trovato]`, type: 'text' };
    }

    return {
      key: `system.${field}`,
      value: String(fieldData.value),
      type: fieldData.type,
      rawValue: fieldData.value
    };
  }

  /**
   * Ottiene un'anteprima del template risolto senza dati specifici
   */
  async getTemplatePreview(templateBody: string): Promise<string> {
    const mockContext: TemplateContext = {
      companyId: 'mock',
      customerId: 'mock',
      supplierId: 'mock',
      movementId: 'mock',
      overrideData: {
        mockMode: true
      }
    };

    // Per l'anteprima, usiamo dati di esempio
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let previewTemplate = templateBody;
    let match;
    
    while ((match = variableRegex.exec(templateBody)) !== null) {
      const variable = match[1];
      const [entity, field] = variable.split('.');
      
      let exampleValue = `[${variable}]`;
      
      // Esempi specifici per l'anteprima
      if (entity === 'company' && field === 'name') exampleValue = 'EasyCashFlows S.r.l.';
      if (entity === 'customer' && field === 'name') exampleValue = 'Mario Rossi';
      if (entity === 'movement' && field === 'amount') exampleValue = '€ 1.250,00';
      if (entity === 'system' && field === 'currentDate') exampleValue = new Date().toLocaleDateString('it-IT');
      
      previewTemplate = previewTemplate.replace(
        new RegExp(`\\{\\{${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'),
        exampleValue
      );
    }

    return previewTemplate;
  }
}