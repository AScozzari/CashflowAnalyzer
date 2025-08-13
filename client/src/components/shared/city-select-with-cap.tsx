import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ITALIAN_CITIES = [
  "Abbiategrasso", "Acerra", "Acireale", "Agrigento", "Albano Laziale", "Alessandria", "Altamura", "Ancona", "Andria", "Anzio", "Arezzo", "Arzano", "Ascoli Piceno", "Asti", "Avellino", "Aversa",
  "Bari", "Barletta", "Battipaglia", "Belluno", "Benevento", "Bergamo", "Biella", "Bologna", "Bolzano", "Brescia", "Brindisi", "Busto Arsizio",
  "Cagliari", "Caltanissetta", "Campobasso", "Carpi", "Casalnuovo di Napoli", "Caserta", "Casoria", "Castellammare di Stabia", "Catania", "Catanzaro", "Cesena", "Chieti", "Cinisello Balsamo", "Civitavecchia", "Como", "Cosenza", "Cremona", "Crotone", "Cuneo",
  "Enna",
  "Faenza", "Fermo", "Ferrara", "Fiumicino", "Firenze", "Foggia", "Forlì", "Frosinone",
  "Gallarate", "Genova", "Giugliano in Campania", "Gorizia", "Grosseto", "Guidonia Montecelio",
  "Imola", "Imperia", "Isernia", "Ivrea",
  "Lamezia Terme", "L'Aquila", "La Spezia", "Ladispoli", "Latina", "Lecce", "Lecco", "Livorno", "Lodi", "Lucca",
  "Macerata", "Mantova", "Marano di Napoli", "Massa", "Matera", "Melito di Napoli", "Messina", "Milano", "Modena", "Modugno", "Molfetta", "Monza", "Mugnano di Napoli",
  "Napoli", "Nettuno", "Novara", "Nuoro",
  "Olbia", "Oristano",
  "Padova", "Palermo", "Parma", "Pavia", "Perugia", "Pesaro", "Pescara", "Piacenza", "Pisa", "Pistoia", "Pomezia", "Pordenone", "Portici", "Potenza", "Pozzuoli", "Prato",
  "Quartu Sant'Elena", "Quarto",
  "Ragusa", "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo",
  "Salerno", "San Severo", "Sassari", "Savona", "Scafati", "Siena", "Siracusa", "Sondrio",
  "Taranto", "Teramo", "Terni", "Torre Annunziata", "Torre del Greco", "Torino", "Trapani", "Trento", "Treviso", "Trieste",
  "Udine",
  "Varese", "Velletri", "Venezia", "Verbania", "Vercelli", "Verona", "Viareggio", "Vibo Valentia", "Vicenza", "Vigevano", "Viterbo"
];

const CITY_CAP_MAP: Record<string, string> = {
  "Roma": "00100", "Milano": "20100", "Napoli": "80100", "Torino": "10100", "Palermo": "90100", "Genova": "16100", "Bologna": "40100", "Firenze": "50100", "Bari": "70100", "Catania": "95100",
  "Venezia": "30100", "Verona": "37100", "Messina": "98100", "Padova": "35100", "Trieste": "34100", "Brescia": "25100", "Taranto": "74100", "Prato": "59100", "Reggio Calabria": "89100", "Modena": "41100",
  "Reggio Emilia": "42100", "Perugia": "06100", "Livorno": "57100", "Ravenna": "48100", "Cagliari": "09100", "Foggia": "71100", "Rimini": "47900", "Salerno": "84100", "Ferrara": "44100", "Sassari": "07100",
  "Monza": "20900", "Pescara": "65100", "Bergamo": "24100", "Forlì": "47100", "Trento": "38100", "Vicenza": "36100", "Terni": "05100", "Bolzano": "39100", "Novara": "28100", "Piacenza": "29100",
  "Ancona": "60100", "Andria": "76123", "Arezzo": "52100", "Udine": "33100", "Cesena": "47521", "Lecce": "73100", "L'Aquila": "67100", "La Spezia": "19100", "Asti": "14100", "Pesaro": "61100",
  "Latina": "04100", "Pavia": "27100", "Caserta": "81100", "Pistoia": "51100", "Lecco": "23900", "Alessandria": "15100", "Avellino": "83100", "Catanzaro": "88100", "Siracusa": "96100", "Treviso": "31100",
  "Ragusa": "97100", "Cremona": "26100", "Crotone": "88900", "Cuneo": "12100", "Benevento": "82100", "Brindisi": "72100", "Pisa": "56100", "Massa": "54100", "Como": "22100", "Varese": "21100",
  "Cosenza": "87100", "Trapani": "91100", "Potenza": "85100", "Rieti": "02100", "Siena": "53100", "Agrigento": "92100", "Matera": "75100", "Campobasso": "86100", "Frosinone": "03100", "Teramo": "64100",
  "Chieti": "66100", "Pordenone": "33170", "Sondrio": "23100", "Isernia": "86170", "Biella": "13900", "Belluno": "32100", "Caltanissetta": "93100", "Viterbo": "01100", "Vercelli": "13100", "Enna": "94100",
  "Rovigo": "45100", "Verbania": "28900", "Oristano": "09170", "Imperia": "18100", "Ascoli Piceno": "63100", "Lodi": "26900", "Lucca": "55100", "Mantova": "46100", "Macerata": "62100", "Nuoro": "08100",
  "Savona": "17100", "Gorizia": "34170", "Vibo Valentia": "89900", "Grosseto": "58100", "Fermo": "63900", "Fiumicino": "00054", "Civitavecchia": "00053", "Anzio": "00042", "Nettuno": "00048", "Velletri": "00049",
  "Albano Laziale": "00041", "Pomezia": "00071", "Guidonia Montecelio": "00012", "Ladispoli": "00055", "Acerra": "80011", "Altamura": "70022", "Aversa": "81031", "Battipaglia": "84091", "Busto Arsizio": "21052",
  "Carpi": "41012", "Casalnuovo di Napoli": "80013", "Casoria": "80026", "Castellammare di Stabia": "80053", "Cinisello Balsamo": "20092", "Faenza": "48018", "Gallarate": "21013", "Giugliano in Campania": "80014",
  "Imola": "40026", "Ivrea": "10015", "Lamezia Terme": "88046", "Marano di Napoli": "80016", "Melito di Napoli": "80017", "Modugno": "70026", "Molfetta": "70056", "Mugnano di Napoli": "80018", "Olbia": "07026",
  "Portici": "80055", "Pozzuoli": "80078", "Quartu Sant'Elena": "09045", "Quarto": "80010", "San Severo": "71016", "Scafati": "84018", "Torre Annunziata": "80058", "Torre del Greco": "80059", "Viareggio": "55049", "Vigevano": "27029"
};

interface CitySelectWithCapProps {
  value: string;
  onValueChange: (value: string) => void;
  onCapChange: (cap: string) => void;
  placeholder?: string;
  className?: string;
}

export function CitySelectWithCap({ 
  value, 
  onValueChange, 
  onCapChange, 
  placeholder = "Seleziona città...",
  className 
}: CitySelectWithCapProps) {
  const [cityFilter, setCityFilter] = useState("");

  const filteredCities = ITALIAN_CITIES.filter(city => 
    city.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const handleCityChange = (cityValue: string) => {
    onValueChange(cityValue);
    const cap = CITY_CAP_MAP[cityValue];
    if (cap) {
      onCapChange(cap);
    }
  };

  return (
    <Select onValueChange={handleCityChange} value={value}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-2">
          <Input
            placeholder="Cerca città..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="mb-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
        {filteredCities.map((city) => (
          <SelectItem key={city} value={city} className="focus:bg-gray-100 dark:focus:bg-gray-700">
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}