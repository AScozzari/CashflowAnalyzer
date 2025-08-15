import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface WhatsAppSetupGuideProps {
  provider: 'twilio' | 'linkmobility';
}

export function WhatsAppSetupGuide({ provider }: WhatsAppSetupGuideProps) {
  const guides = {
    twilio: {
      title: "Guida Setup Twilio + Meta Business Manager",
      description: "Configurazione completa per Twilio WhatsApp Business API con Meta",
      estimatedTime: "3-7 giorni lavorativi",
      difficulty: "Intermedio",
      steps: [
        {
          title: "1. Preparazione Documenti Business",
          description: "Raccogli la documentazione aziendale necessaria",
          items: [
            "Certificato di Costituzione o Visura Camerale",
            "Partita IVA e Codice Fiscale",
            "Certificato MSME/UDYAM (se applicabile)",
            "Sito web aziendale professionale",
            "Email aziendale con dominio proprietario",
            "Bollette utenze per verifica indirizzo"
          ],
          status: "required",
          estimated: "1 giorno"
        },
        {
          title: "2. Creazione Meta Business Manager",
          description: "Setup dell'account Meta Business per la gestione WhatsApp",
          items: [
            "Vai su business.facebook.com e crea account business",
            "Completa informazioni aziendali (nome, email, sito, paese)",
            "Verifica che le informazioni corrispondano ai documenti legali",
            "Annota il Meta Business Manager ID dalle impostazioni business"
          ],
          status: "required",
          estimated: "30 minuti"
        },
        {
          title: "3. Registrazione Account Twilio",
          description: "Setup account sviluppatore Twilio",
          items: [
            "Registra account su twilio.com",
            "Completa verifica aziendale Twilio",
            "Ottieni Account SID e Auth Token dal dashboard",
            "Acquista numero telefono dedicato per WhatsApp",
            "Attiva Programmable Messaging API"
          ],
          status: "required",
          estimated: "1 ora"
        },
        {
          title: "4. Collegamento Twilio-Meta",
          description: "Integrazione tra le due piattaforme",
          items: [
            "In Twilio Console: Messaging > Senders > WhatsApp Senders",
            "Click 'Get Started' e segui setup guidato",
            "Scegli numero Twilio per WhatsApp",
            "Click 'Continue with Facebook' per collegamento",
            "Autorizza Twilio ad accedere al tuo Meta Business Manager"
          ],
          status: "required",
          estimated: "30 minuti"
        },
        {
          title: "5. Creazione WhatsApp Business Account",
          description: "Setup WABA nel Meta Business Manager",
          items: [
            "Compila nome azienda e categoria business",
            "Questo crea WABA associato al tuo Twilio Account SID",
            "Verifica numero copiando numero WhatsApp Twilio",
            "Seleziona 'Text Message' come metodo verifica",
            "Inserisci codice di verifica ricevuto via SMS"
          ],
          status: "required",
          estimated: "15 minuti"
        },
        {
          title: "6. Verifica Business (Raccomandato)",
          description: "Processo opzionale ma consigliato per funzionalità avanzate",
          items: [
            "Meta Business Manager > Settings > Security Center > Business Verification",
            "Click 'Start Verification' se disponibile",
            "Scegli metodo: Email (più veloce), Telefono, o Dominio",
            "Carica documenti business registration",
            "Fornisci certificati fiscali (Partita IVA, etc.)",
            "Tempo approvazione: 2-15 giorni lavorativi"
          ],
          status: "optional",
          estimated: "2-15 giorni"
        },
        {
          title: "7. Creazione Message Templates",
          description: "Setup template pre-approvati per messaggi business",
          items: [
            "Twilio Console > Messaging > Content Template Builder",
            "Crea template categorie: Utility, Marketing, Authentication",
            "Usa variabili {{1}}, {{2}} per personalizzazione",
            "I template devono essere non-promozionali e di valore",
            "Tempo approvazione Meta: 24-48 ore"
          ],
          status: "required",
          estimated: "1-2 giorni"
        }
      ],
      pricing: {
        setup: "Setup fee: €50/mese",
        messaging: "€0.0055/messaggio",
        features: ["Template pre-approvati Meta", "Webhook real-time", "Analytics avanzate", "Support 24/7"]
      },
      links: [
        { title: "Twilio WhatsApp Docs", url: "https://www.twilio.com/docs/whatsapp", type: "docs" },
        { title: "Meta Business Manager", url: "https://business.facebook.com/", type: "platform" },
        { title: "Twilio Console", url: "https://console.twilio.com/", type: "platform" }
      ]
    },
    linkmobility: {
      title: "Guida Setup LinkMobility + Meta Business Manager",
      description: "Configurazione completa per LinkMobility WhatsApp Business API",
      estimatedTime: "5-10 giorni lavorativi",
      difficulty: "Facile",
      steps: [
        {
          title: "1. Preparazione Documenti Business",
          description: "Documentazione aziendale per verifica Meta",
          items: [
            "Certificato di Costituzione o Visura Camerale",
            "Partita IVA e documentazione fiscale",
            "Sito web aziendale professionale",
            "Email aziendale con dominio proprietario",
            "Logo aziendale e materiali brand",
            "Stima volumi messaggi mensili"
          ],
          status: "required",
          estimated: "1 giorno"
        },
        {
          title: "2. Creazione Meta Business Manager",
          description: "Setup account Meta Business con privilegi admin",
          items: [
            "Vai su business.facebook.com e crea account",
            "Usa account esistente Facebook o crea nuovo",
            "Completa informazioni business dettagliate",
            "Naviga in WhatsApp Manager > Create WhatsApp Business Account",
            "Annota Meta Business Manager ID per LinkMobility"
          ],
          status: "required",
          estimated: "45 minuti"
        },
        {
          title: "3. Contatto LinkMobility BSP",
          description: "Applicazione tramite Business Solution Provider autorizzato",
          items: [
            "Contatta LinkMobility: +47 22 99 44 00 o info@linkmobility.com",
            "Richiedi accesso WhatsApp Business API come BSP",
            "Fornisci Meta Business Manager ID ottenuto",
            "Presenta documentazione business per verifica",
            "Discuti volumi messaggi e data go-live prevista"
          ],
          status: "required",
          estimated: "1-2 giorni"
        },
        {
          title: "4. Processo Approvazione LinkMobility",
          description: "LinkMobility gestisce setup tecnico e hosting",
          items: [
            "LinkMobility rivede applicazione e documenti",
            "Setup hosting WhatsApp virtuale (non SIM-based)",
            "Configurazione numero dedicato business",
            "Integrazione con Meta Business Manager",
            "Fornitura API Key e credenziali accesso"
          ],
          status: "automated",
          estimated: "5-10 giorni"
        },
        {
          title: "5. Verifica Numero e Attivazione",
          description: "Processo finale di attivazione del servizio",
          items: [
            "LinkMobility fornisce numero WhatsApp dedicato",
            "Verifica numero tramite Meta Business Manager",
            "Test connessione API con credenziali fornite",
            "Configurazione webhook per messaggi in entrata",
            "Attivazione completa del servizio"
          ],
          status: "required",
          estimated: "1 giorno"
        },
        {
          title: "6. Verifica Business Meta",
          description: "Processo di verifica per brand recognition",
          items: [
            "Meta Business Manager > Business Verification",
            "Carica documenti business registration",
            "LinkMobility supporta il processo di verifica",
            "Accesso a funzionalità avanzate dopo approvazione",
            "Green checkmark per account verificati"
          ],
          status: "optional",
          estimated: "5-15 giorni"
        },
        {
          title: "7. Setup Message Templates",
          description: "Creazione template per messaggi proattivi",
          items: [
            "Meta Business Manager > Message Templates",
            "Categorie: Marketing, Utility, Authentication",
            "Template devono essere value-driven, non promozionali",
            "LinkMobility supporta processo approvazione",
            "Template pricing: Marketing sempre a pagamento, Utility gratis in finestra 24h"
          ],
          status: "required",
          estimated: "2-3 giorni"
        }
      ],
      pricing: {
        setup: "Setup fee: €30/mese",
        messaging: "€0.004/messaggio", 
        features: ["GDPR Compliant", "Template veloce approval", "API REST semplice", "EU Data Centers"]
      },
      links: [
        { title: "LinkMobility WhatsApp", url: "https://www.linkmobility.com/channels/whatsapp", type: "docs" },
        { title: "LinkMobility Contact", url: "https://www.linkmobility.com/contact", type: "contact" },
        { title: "Meta Business Manager", url: "https://business.facebook.com/", type: "platform" }
      ]
    }
  };

  const guide = guides[provider];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {guide.title}
          </CardTitle>
          <CardDescription>{guide.description}</CardDescription>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {guide.estimatedTime}
            </Badge>
            <Badge variant="secondary">{guide.difficulty}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            {guide.steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {step.status === 'required' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    {step.status === 'optional' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                    {step.status === 'automated' && <Clock className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{step.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {step.estimated}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                    <ul className="space-y-1">
                      {step.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Pricing */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold text-sm">💰 Pricing {provider === 'twilio' ? 'Twilio' : 'LinkMobility'}</div>
                <div className="text-sm space-y-1">
                  <div><strong>Setup:</strong> {guide.pricing.setup}</div>
                  <div><strong>Messaging:</strong> {guide.pricing.messaging}</div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {guide.pricing.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {guide.links.map((link, index) => (
              <a 
                key={index}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                {link.title} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}