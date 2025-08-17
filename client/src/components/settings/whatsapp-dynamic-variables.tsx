import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, CreditCard, Truck, Calendar, Euro, Phone, Mail, User, FileText, Hash } from 'lucide-react';

// Definizione delle variabili dinamiche categorizzate per entità
export const DYNAMIC_VARIABLES = {
  company: {
    icon: Building2,
    label: 'Azienda',
    color: 'bg-blue-100 text-blue-800',
    variables: [
      { key: 'company.name', label: 'Nome Azienda', example: 'EasyCashFlows S.r.l.', type: 'text' },
      { key: 'company.adminContact', label: 'Referente Amministrativo', example: 'Mario Rossi', type: 'text' },
      { key: 'company.email', label: 'Email Azienda', example: 'info@easycashflows.it', type: 'email' },
      { key: 'company.address', label: 'Indirizzo', example: 'Via Roma 123, Milano', type: 'text' },
      { key: 'company.vatNumber', label: 'Partita IVA', example: 'IT12345678901', type: 'text' },
      { key: 'company.taxCode', label: 'Codice Fiscale', example: '12345678901', type: 'text' }
    ]
  },
  customer: {
    icon: Users,
    label: 'Cliente',
    color: 'bg-green-100 text-green-800',
    variables: [
      { key: 'customer.name', label: 'Nome Cliente/Ragione Sociale', example: 'Mario Rossi / ABC S.r.l.', type: 'text' },
      { key: 'customer.firstName', label: 'Nome (solo privati)', example: 'Mario', type: 'text' },
      { key: 'customer.lastName', label: 'Cognome (solo privati)', example: 'Rossi', type: 'text' },
      { key: 'customer.email', label: 'Email Cliente', example: 'mario.rossi@email.com', type: 'email' },
      { key: 'customer.phone', label: 'Telefono Cliente', example: '+39 333 1234567', type: 'phone' },
      { key: 'customer.contactPerson', label: 'Referente (solo business)', example: 'Laura Bianchi', type: 'text' },
      { key: 'customer.vatNumber', label: 'P.IVA Cliente', example: 'IT98765432109', type: 'text' }
    ]
  },
  supplier: {
    icon: Truck,
    label: 'Fornitore',
    color: 'bg-orange-100 text-orange-800',
    variables: [
      { key: 'supplier.name', label: 'Nome Fornitore', example: 'Forniture Ufficio S.r.l.', type: 'text' },
      { key: 'supplier.contactPerson', label: 'Referente Fornitore', example: 'Giuseppe Verdi', type: 'text' },
      { key: 'supplier.email', label: 'Email Fornitore', example: 'ordini@forniture.it', type: 'email' },
      { key: 'supplier.phone', label: 'Telefono Fornitore', example: '+39 02 1234567', type: 'phone' },
      { key: 'supplier.vatNumber', label: 'P.IVA Fornitore', example: 'IT55566677788', type: 'text' }
    ]
  },
  movement: {
    icon: CreditCard,
    label: 'Movimento Finanziario',
    color: 'bg-purple-100 text-purple-800',
    variables: [
      { key: 'movement.amount', label: 'Importo', example: '€ 1.250,00', type: 'currency' },
      { key: 'movement.flowDate', label: 'Data Movimento', example: '15/03/2025', type: 'date' },
      { key: 'movement.documentNumber', label: 'Numero Documento', example: 'FAT-2025-001', type: 'text' },
      { key: 'movement.type', label: 'Tipo Movimento', example: 'Entrata / Uscita', type: 'text' },
      { key: 'movement.notes', label: 'Note Movimento', example: 'Pagamento fattura servizi', type: 'text' },
      { key: 'movement.reason', label: 'Causale Movimento', example: 'Vendita prodotti', type: 'text' }
    ]
  },
  system: {
    icon: Calendar,
    label: 'Sistema',
    color: 'bg-gray-100 text-gray-800',
    variables: [
      { key: 'system.currentDate', label: 'Data Corrente', example: '17/08/2025', type: 'date' },
      { key: 'system.currentTime', label: 'Ora Corrente', example: '14:30', type: 'time' },
      { key: 'system.dueDate', label: 'Data Scadenza (calcolata)', example: '31/08/2025', type: 'date' },
      { key: 'system.daysDue', label: 'Giorni alla Scadenza', example: '14 giorni', type: 'number' }
    ]
  }
};

interface WhatsAppDynamicVariablesProps {
  onVariableSelect?: (variableKey: string, label: string) => void;
  selectedVariables?: string[];
}

export function WhatsAppDynamicVariables({ onVariableSelect, selectedVariables = [] }: WhatsAppDynamicVariablesProps) {
  const [activeCategory, setActiveCategory] = useState('company');

  const getVariableIcon = (type: string) => {
    switch (type) {
      case 'currency': return Euro;
      case 'date': return Calendar;
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'number': return Hash;
      case 'text': default: return FileText;
    }
  };

  const handleVariableClick = (variableKey: string, label: string) => {
    onVariableSelect?.(variableKey, label);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Variabili Dinamiche per Template WhatsApp
        </CardTitle>
        <CardDescription>
          Variabili che estraggono automaticamente dati dalle entità del sistema (aziende, clienti, movimenti, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(DYNAMIC_VARIABLES).map(([key, category]) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(DYNAMIC_VARIABLES).map(([categoryKey, category]) => (
            <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <category.icon className="w-5 h-5" />
                <h3 className="text-lg font-semibold">{category.label}</h3>
                <Badge className={category.color}>
                  {category.variables.length} variabili
                </Badge>
              </div>

              <div className="grid gap-3">
                {category.variables.map((variable) => {
                  const IconComponent = getVariableIcon(variable.type);
                  const isSelected = selectedVariables.includes(variable.key);
                  
                  return (
                    <div
                      key={variable.key}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200'
                      }`}
                      onClick={() => handleVariableClick(variable.key, variable.label)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <IconComponent className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {`{{${variable.key}}}`}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {variable.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {variable.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Esempio: {variable.example}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Badge className="bg-blue-600">Selezionata</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Esempi di Utilizzo Dinamico</h3>
          <div className="grid gap-4">
            <div className="border border-green-200 rounded-lg p-4 bg-green-50 dark:bg-green-950">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                📧 Sollecito Pagamento Dinamico
              </h4>
              <code className="text-sm block bg-white dark:bg-gray-900 p-3 rounded border">
                Ciao {`{{customer.name}}`}, ti ricordiamo il pagamento di {`{{movement.amount}}`} 
                per la fattura {`{{movement.documentNumber}}`} con scadenza {`{{movement.flowDate}}`}.
                <br />
                Cordiali saluti, {`{{company.adminContact}}`} - {`{{company.name}}`}
              </code>
            </div>

            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                ✅ Conferma Pagamento Ricevuto
              </h4>
              <code className="text-sm block bg-white dark:bg-gray-900 p-3 rounded border">
                Grazie {`{{customer.name}}`}! Abbiamo ricevuto il pagamento di {`{{movement.amount}}`} 
                in data {`{{system.currentDate}}`} per {`{{movement.reason}}`}.
              </code>
            </div>

            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                🎯 Marketing Personalizzato
              </h4>
              <code className="text-sm block bg-white dark:bg-gray-900 p-3 rounded border">
                Ciao {`{{customer.firstName}}`}, abbiamo un'offerta speciale per te! 
                Sconto del 15% valido fino al {`{{system.dueDate}}`}. 
                Contattaci su {`{{company.email}}`}
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}