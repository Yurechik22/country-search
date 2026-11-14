/** Country as the UI needs it: flat, display-ready, no optional fields. */
export interface Country {
  code: string;
  name: string;
  flag: string;
  flagUrl: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
  currencies: string[];
  area: number | null;
  borders: string[];
  description: string;
}
