import { el } from './dom.js';

export interface HistoryViewHandlers {
  onSelect: (query: string) => void;
  onClear: () => void;
}

/** "Recent: [norway] [sweden] Clear" row under the search input. */
export class HistoryView {
  readonly element: HTMLElement;
  private readonly list: HTMLUListElement;
  private readonly handlers: HistoryViewHandlers;

  constructor(handlers: HistoryViewHandlers) {
    this.handlers = handlers;
    this.list = el('ul', { className: 'history__list' });

    const clear = el('button', {
      className: 'chip chip--ghost',
      text: 'Clear',
      attrs: { type: 'button', 'aria-label': 'Clear search history' },
    });
    clear.addEventListener('click', () => this.handlers.onClear());

    this.element = el('nav', { className: 'history', attrs: { 'aria-label': 'Recent searches' } }, [
      el('span', { className: 'history__label', text: 'Recent:' }),
      this.list,
      clear,
    ]);
  }

  render(queries: string[]): void {
    this.element.hidden = queries.length === 0;
    this.list.replaceChildren(
      ...queries.map((query) => {
        const chip = el('button', { className: 'chip', text: query, attrs: { type: 'button' } });
        chip.addEventListener('click', () => this.handlers.onSelect(query));
        return el('li', {}, [chip]);
      }),
    );
  }
}
