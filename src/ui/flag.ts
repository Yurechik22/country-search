import type { Country } from '../domain/country.js';
import { el } from './dom.js';

/** Flag image when the API gives a URL, emoji otherwise. */
export function createFlag(country: Country, className: string): HTMLElement {
  if (country.flagUrl) {
    return el('img', {
      className,
      attrs: { src: country.flagUrl, alt: `Flag of ${country.name}`, loading: 'lazy' },
    });
  }
  return el('span', { className, text: country.flag, attrs: { 'aria-hidden': 'true' } });
}
