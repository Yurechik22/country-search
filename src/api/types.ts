/** Shape of a country object returned by https://countries.dev/name/{query}. */
export interface RawLanguage {
  name: string;
  nativeName?: string;
  iso639_1?: string;
  iso639_2?: string;
}

export interface RawCurrency {
  code: string;
  name: string;
  symbol?: string;
}

export interface RawFlags {
  png?: string;
  svg?: string;
}

export interface RawCountry {
  name: string;
  alpha2Code?: string;
  alpha3Code: string;
  flag?: string;
  flags?: RawFlags;
  /** countries.dev returns a string; older restcountries data used an array. */
  capital?: string | string[];
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  borders?: string[];
  languages?: RawLanguage[];
  currencies?: RawCurrency[];
  nativeName?: string;
  demonym?: string;
  description?: string;
}
