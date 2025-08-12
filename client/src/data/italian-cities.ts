export interface ItalianCity {
  nome: string;
  codice: string;
  zona: {
    codice: string;
    nome: string;
  };
  regione: {
    codice: string;
    nome: string;
  };
  provincia: {
    codice: string;
    nome: string;
  };
  sigla: string;
  codiceCatastale: string;
  cap: string[];
  popolazione: number;
}

export const ITALIAN_CITIES: ItalianCity[] = [
  {"nome":"Abano Terme","codice":"028001","zona":{"codice":"2","nome":"Nord-est"},"regione":{"codice":"05","nome":"Veneto"},"provincia":{"codice":"028","nome":"Padova"},"sigla":"PD","codiceCatastale":"A001","cap":["35031"],"popolazione":19349},
  {"nome":"Abbadia Cerreto","codice":"098001","zona":{"codice":"1","nome":"Nord-ovest"},"regione":{"codice":"03","nome":"Lombardia"},"provincia":{"codice":"098","nome":"Lodi"},"sigla":"LO","codiceCatastale":"A004","cap":["26834"],"popolazione":297},
  {"nome":"Abbadia Lariana","codice":"097001","zona":{"codice":"1","nome":"Nord-ovest"},"regione":{"codice":"03","nome":"Lombardia"},"provincia":{"codice":"097","nome":"Lecco"},"sigla":"LC","codiceCatastale":"A005","cap":["23821"],"popolazione":3249},
  {"nome":"Abbadia San Salvatore","codice":"052001","zona":{"codice":"3","nome":"Centro"},"regione":{"codice":"09","nome":"Toscana"},"provincia":{"codice":"052","nome":"Siena"},"sigla":"SI","codiceCatastale":"A006","cap":["53021"],"popolazione":6557},
  {"nome":"Abbasanta","codice":"095001","zona":{"codice":"5","nome":"Isole"},"regione":{"codice":"20","nome":"Sardegna"},"provincia":{"codice":"095","nome":"Oristano"},"sigla":"OR","codiceCatastale":"A007","cap":["09071"],"popolazione":2828},
  {"nome":"Abbateggio","codice":"068001","zona":{"codice":"4","nome":"Sud"},"regione":{"codice":"13","nome":"Abruzzo"},"provincia":{"codice":"068","nome":"Pescara"},"sigla":"PE","codiceCatastale":"A008","cap":["65020"],"popolazione":441},
  {"nome":"Abbiategrasso","codice":"015002","zona":{"codice":"1","nome":"Nord-ovest"},"regione":{"codice":"03","nome":"Lombardia"},"provincia":{"codice":"015","nome":"Milano"},"sigla":"MI","codiceCatastale":"A010","cap":["20081"],"popolazione":30994}
  // Note: This is a truncated list. In production, include all ~7900 Italian cities
];

export const getItalianCitiesForSelect = () => 
  ITALIAN_CITIES.map(city => ({
    value: city.nome,
    label: `${city.nome} (${city.sigla})`,
    region: city.regione.nome,
    province: city.provincia.nome
  }));