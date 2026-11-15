import type { Country } from '../domain/country.js';
import { el } from './dom.js';
import { createFlag } from './flag.js';
import { formatNumber } from './format.js';

function createFact(label: string, value: string): HTMLElement {
  return el('p', { className: 'card__fact' }, [
    el('span', { className: 'card__label', text: `${label}: ` }),
    value,
  ]);
}

export function createCountryCard(country: Country, onSelect: (country: Country) => void): HTMLElement {
  const button = el('button', { className: 'card', attrs: { type: 'button' } }, [
    createFlag(country, 'card__flag'),
    el('div', { className: 'card__body' }, [
      el('h2', { className: 'card__title', text: country.name }),
      createFact('Capital', country.capital),
      createFact('Region', country.region),
      createFact('Population', formatNumber(country.population)),
    ]),
  ]);
  button.addEventListener('click', () => onSelect(country));

  return el('li', { className: 'results__item' }, [button]);
}
