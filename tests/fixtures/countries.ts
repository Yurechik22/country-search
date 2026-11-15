import type { RawCountry } from '../../src/api/types.js';

/** Trimmed copy of a real https://countries.dev/name/norway response item. */
export const norwayRaw: RawCountry = {
  area: 323802,
  flag: '🇳🇴',
  name: 'Norway',
  flags: { png: 'https://flagcdn.com/w320/no.png', svg: 'https://flagcdn.com/no.svg' },
  region: 'Europe',
  borders: ['FIN', 'SWE', 'RUS'],
  capital: 'Oslo',
  demonym: 'Norwegian',
  languages: [
    { name: 'Norwegian', iso639_1: 'no', iso639_2: 'nor', nativeName: 'Norsk' },
    { name: 'Norwegian Bokmål', iso639_1: 'nb', iso639_2: 'nob', nativeName: 'Norsk bokmål' },
    { name: 'Norwegian Nynorsk', iso639_1: 'nn', iso639_2: 'nno', nativeName: 'Norsk nynorsk' },
  ],
  subregion: 'Northern Europe',
  alpha2Code: 'NO',
  alpha3Code: 'NOR',
  currencies: [{ code: 'NOK', name: 'Norwegian krone', symbol: 'kr' }],
  nativeName: 'Norge',
  population: 5379475,
};

/** A sparse record: optional fields are missing, capital uses the legacy array shape. */
export const sparseRaw: RawCountry = {
  name: 'Testland',
  alpha3Code: 'TST',
  capital: ['First City', 'Second City'],
};

export const swedenRaw: RawCountry = {
  name: 'Sweden',
  alpha3Code: 'SWE',
  flag: '🇸🇪',
  flags: { svg: 'https://flagcdn.com/se.svg' },
  capital: 'Stockholm',
  region: 'Europe',
  population: 10353442,
};
