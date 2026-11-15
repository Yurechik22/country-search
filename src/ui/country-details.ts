import type { Country } from '../domain/country.js';
import { el } from './dom.js';
import { createFlag } from './flag.js';
import { formatList, formatNumber } from './format.js';

function createFacts(country: Country): HTMLDListElement {
  const facts: Array<[string, string]> = [
    ['Capital', country.capital],
    ['Region', country.region],
    ['Population', formatNumber(country.population)],
    ['Area', country.area === null ? '—' : `${formatNumber(country.area)} km²`],
    ['Borders', formatList(country.borders, 'None')],
    ['Languages', formatList(country.languages)],
    ['Currency', formatList(country.currencies)],
  ];

  return el(
    'dl',
    { className: 'details__facts' },
    facts.flatMap(([label, value]) => [el('dt', { text: label }), el('dd', { text: value })]),
  );
}

/** Modal with full information about one country. */
export class CountryDetails {
  private readonly dialog: HTMLDialogElement;
  private readonly body: HTMLElement;

  constructor() {
    const close = el('button', {
      className: 'details__close',
      text: '×',
      attrs: { type: 'button', 'aria-label': 'Close details' },
    });
    close.addEventListener('click', () => this.dialog.close());

    this.body = el('div');
    this.dialog = el('dialog', { className: 'details', attrs: { 'aria-labelledby': 'details-title' } }, [
      close,
      this.body,
    ]);

    // Click on the backdrop (outside the content) closes the dialog.
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
  }

  mount(parent: HTMLElement): void {
    parent.append(this.dialog);
  }

  open(country: Country): void {
    this.body.replaceChildren(
      createFlag(country, 'details__flag'),
      el('div', { className: 'details__content' }, [
        el('h2', { className: 'details__title', text: country.name, attrs: { id: 'details-title' } }),
        el('p', { className: 'details__description', text: country.description }),
        createFacts(country),
      ]),
    );
    this.dialog.showModal();
  }
}
