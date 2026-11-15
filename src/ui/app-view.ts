import type { Country } from '../domain/country.js';
import type { SearchState } from '../search/search-state.js';
import { createCountryCard } from './country-card.js';
import { el } from './dom.js';

export interface AppViewHandlers {
  onQueryChange: (query: string) => void;
  onRetry: () => void;
  onSelectCountry: (country: Country) => void;
}

/** Renders a SearchState into the page. Holds no search logic itself. */
export class AppView {
  readonly input: HTMLInputElement;
  private readonly root: HTMLElement;
  private readonly status: HTMLElement;
  private readonly results: HTMLUListElement;
  private readonly handlers: AppViewHandlers;

  constructor(handlers: AppViewHandlers) {
    this.handlers = handlers;

    this.input = el('input', {
      className: 'search__input',
      attrs: {
        type: 'search',
        id: 'country-query',
        placeholder: 'Start typing a country name…',
        autocomplete: 'off',
        spellcheck: 'false',
      },
    });
    this.input.addEventListener('input', () => this.handlers.onQueryChange(this.input.value));

    this.status = el('div', {
      className: 'status',
      attrs: { role: 'status', 'aria-live': 'polite' },
    });
    this.results = el('ul', { className: 'results', attrs: { 'aria-label': 'Search results' } });

    this.root = el('main', { className: 'app' }, [
      el('header', { className: 'app__header' }, [
        el('h1', { className: 'app__title', text: 'Country Search' }),
        el('p', { className: 'app__subtitle', text: 'Data from countries.dev' }),
      ]),
      el('div', { className: 'search' }, [
        el('label', {
          className: 'visually-hidden',
          text: 'Country name',
          attrs: { for: 'country-query' },
        }),
        this.input,
      ]),
      this.status,
      this.results,
    ]);
  }

  mount(parent: HTMLElement): void {
    parent.append(this.root);
    this.input.focus();
  }

  /** Extra controls (e.g. search history) placed right under the input. */
  addSection(section: HTMLElement): void {
    this.status.before(section);
  }

  setQuery(query: string): void {
    this.input.value = query;
  }

  render(state: SearchState): void {
    this.results.replaceChildren();
    this.status.replaceChildren();
    this.status.className = 'status';
    this.status.setAttribute('role', 'status');
    this.root.setAttribute('aria-busy', String(state.status === 'loading'));

    switch (state.status) {
      case 'idle':
        return;
      case 'loading':
        this.renderLoading(state.query);
        return;
      case 'empty':
        this.renderMessage('status--info', `No countries match “${state.query}”.`);
        return;
      case 'error':
        this.renderError(state.message);
        return;
      case 'success':
        this.renderResults(state.countries);
        return;
    }
  }

  private renderLoading(query: string): void {
    this.status.classList.add('status--loading');
    this.status.append(
      el('span', { className: 'spinner', attrs: { 'aria-hidden': 'true' } }),
      el('span', { text: `Searching for “${query}”…` }),
    );
  }

  private renderMessage(modifier: string, text: string): void {
    this.status.classList.add(modifier);
    this.status.append(el('p', { className: 'status__text', text }));
  }

  private renderError(message: string): void {
    const retry = el('button', {
      className: 'button button--retry',
      text: 'Retry',
      attrs: { type: 'button' },
    });
    retry.addEventListener('click', () => this.handlers.onRetry());

    this.status.classList.add('status--error');
    this.status.setAttribute('role', 'alert');
    this.status.append(el('p', { className: 'status__text', text: message }), retry);
  }

  private renderResults(countries: Country[]): void {
    this.renderMessage(
      'status--count',
      `${countries.length} ${countries.length === 1 ? 'country' : 'countries'} found`,
    );
    this.results.append(
      ...countries.map((country) => createCountryCard(country, this.handlers.onSelectCountry)),
    );
  }
}
