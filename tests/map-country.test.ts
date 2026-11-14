import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from '../src/domain/map-country.js';
import { norwayRaw, sparseRaw } from './fixtures/countries.js';

describe('mapCountryResponse', () => {
  it('maps the card fields from a full API record', () => {
    const country = mapCountryResponse(norwayRaw);

    expect(country).toMatchObject({
      code: 'NOR',
      name: 'Norway',
      flag: '🇳🇴',
      flagUrl: 'https://flagcdn.com/no.svg',
      capital: 'Oslo',
      region: 'Europe',
      population: 5379475,
    });
  });

  it('maps languages to a list of names', () => {
    expect(mapCountryResponse(norwayRaw).languages).toEqual([
      'Norwegian',
      'Norwegian Bokmål',
      'Norwegian Nynorsk',
    ]);
  });

  it('maps details: area, borders and currencies', () => {
    const country = mapCountryResponse(norwayRaw);

    expect(country.area).toBe(323802);
    expect(country.borders).toEqual(['FIN', 'SWE', 'RUS']);
    expect(country.currencies).toEqual(['Norwegian krone (NOK, kr)']);
  });

  it('builds a description when the API does not provide one', () => {
    expect(mapCountryResponse(norwayRaw).description).toBe(
      'Norway (Norge) is a country in Northern Europe. Its people are called Norwegian.',
    );
  });

  it('prefers the API description when it exists', () => {
    const country = mapCountryResponse({ ...norwayRaw, description: 'Land of fjords.' });

    expect(country.description).toBe('Land of fjords.');
  });

  it('uses safe defaults for missing optional fields', () => {
    const country = mapCountryResponse(sparseRaw);

    expect(country).toMatchObject({
      name: 'Testland',
      flag: '',
      flagUrl: '',
      region: 'Unknown',
      population: 0,
      area: null,
      languages: [],
      currencies: [],
      borders: [],
    });
  });

  it('joins a legacy array-shaped capital', () => {
    expect(mapCountryResponse(sparseRaw).capital).toBe('First City, Second City');
  });

  it('falls back to the PNG flag and a dash for an empty capital', () => {
    const country = mapCountryResponse({
      ...sparseRaw,
      capital: [],
      flags: { png: 'https://flagcdn.com/w320/tt.png' },
    });

    expect(country.flagUrl).toBe('https://flagcdn.com/w320/tt.png');
    expect(country.capital).toBe('—');
  });

  it('does not mutate the input', () => {
    const input = structuredClone(norwayRaw);

    mapCountryResponse(input);

    expect(input).toStrictEqual(norwayRaw);
  });
});
