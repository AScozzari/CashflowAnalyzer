import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, DollarSign, Clock, MapPin, Languages, Palette } from "lucide-react";

export function LocalizationSettings() {
  const features = [
    {
      icon: Languages,
      title: "Gestione Lingua",
      description: "Impostazione lingua predefinita dell'interfaccia",
      status: "Pianificato",
      details: ["Italiano (attuale)", "Inglese", "Francese", "Spagnolo"],
      color: "bg-blue-500"
    },
    {
      icon: Calendar,
      title: "Formato Date",
      description: "Configurazione formato visualizzazione date",
      status: "Pianificato", 
      details: ["DD/MM/YYYY (Italiano)", "MM/DD/YYYY (US)", "YYYY-MM-DD (ISO)", "Formato personalizzato"],
      color: "bg-green-500"
    },
    {
      icon: DollarSign,
      title: "Valute",
      description: "Gestione valute e simboli monetari",
      status: "Pianificato",
      details: ["EUR (€) - Euro", "USD ($) - Dollaro", "GBP (£) - Sterlina", "CHF - Franco Svizzero"],
      color: "bg-yellow-500"
    },
    {
      icon: Clock,
      title: "Fuso Orario",
      description: "Configurazione timezone e orari",
      status: "Pianificato",
      details: ["Europe/Rome (CET/CEST)", "UTC", "America/New_York", "Asia/Tokyo"],
      color: "bg-purple-500"
    },
    {
      icon: MapPin,
      title: "Regionalizzazione",
      description: "Adattamenti specifici per regioni",
      status: "Pianificato",
      details: ["Italia - Normative fiscali", "UE - GDPR compliance", "Separatori decimali", "Formati numerici"],
      color: "bg-indigo-500"
    },
    {
      icon: Palette,
      title: "Preferenze UI",
      description: "Personalizzazione interfaccia locale",
      status: "Pianificato",
      details: ["Direzione testo (LTR/RTL)", "Layout adattivo", "Temi culturali", "Icone regionali"],
      color: "bg-pink-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <Globe className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Localizzazione
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Impostazioni lingua, formato date, valute, fuso orario e adattamenti regionali
          </p>
          <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50 dark:bg-purple-800 dark:text-purple-200">
            Sezione in sviluppo - verrà implementata nelle prossime versioni
          </Badge>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${feature.color} p-2 rounded-lg`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {feature.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Funzionalità previste:
                </h4>
                <ul className="space-y-1">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Development Timeline */}
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Timeline di Sviluppo
          </CardTitle>
          <CardDescription>
            Roadmap prevista per l'implementazione delle funzionalità di localizzazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Fase 1 - Gestione Lingue</div>
                <div className="text-xs text-gray-500">Supporto multilingua dell'interfaccia</div>
              </div>
              <Badge variant="outline">Q2 2025</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Fase 2 - Formati Regionali</div>
                <div className="text-xs text-gray-500">Date, valute e numeri localizzati</div>
              </div>
              <Badge variant="outline">Q3 2025</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Fase 3 - Compliance Regionale</div>
                <div className="text-xs text-gray-500">Adattamenti normativi e fiscali</div>
              </div>
              <Badge variant="outline">Q4 2025</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}