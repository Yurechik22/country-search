import { searchCountries } from './api/countries-api.js';
import { REQUEST_TIMEOUT_MS, SEARCH_DEBOUNCE_MS } from './config.js';
import { mapCountryResponse } from './domain/map-country.js';
import { SearchHistory, type KeyValueStorage } from './history/search-history.js';
import { createCachedSearch } from './search/cached-search.js';
import { SearchController } from './search/search-controller.js';
import type { SearchFn, SearchState } from './search/search-state.js';
import { AppView } from './ui/app-view.js';
import { CountryDetails } from './ui/country-details.js';
import { HistoryView } from './ui/history-view.js';
import { debounce } from './utils/debounce.js';

const HISTORY_STORAGE_KEY = 'country-search:history';

const fetchCountries: SearchFn = async (query, signal) =>
  (await searchCountries(query, signal)).map(mapCountryResponse);

const cachedCountries = createCachedSearch(fetchCountries);

function getStorage(): KeyValueStorage {
  try {
    return window.localStorage;
  } catch {
    // Access to localStorage itself can throw (e.g. blocked cookies).
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
    };
  }
}

const history = new SearchHistory(getStorage(), HISTORY_STORAGE_KEY);
const details = new CountryDetails();

const view = new AppView({
  onQueryChange: handleQueryChange,
  onRetry: () => void controller.retry(),
  onSelectCountry: (country) => details.open(country),
});

const historyView = new HistoryView({
  onSelect: runHistoryQuery,
  onClear: () => {
    history.clear();
    historyView.render(history.list());
  },
});

const controller = new SearchController({
  search: cachedCountries.search,
  timeoutMs: REQUEST_TIMEOUT_MS,
  onChange: handleStateChange,
});

const debouncedSearch = debounce((query: string) => void controller.search(query), SEARCH_DEBOUNCE_MS);

function handleStateChange(state: SearchState): void {
  view.render(state);
  if (state.status === 'success') {
    historyView.render(history.add(state.query));
  }
}

function handleQueryChange(query: string): void {
  // Any edit makes the in-flight answer obsolete: abort it right away,
  // not only when the debounced search finally starts.
  controller.cancelPending();

  if (query.trim() === '') {
    debouncedSearch.cancel();
    void controller.search('');
    return;
  }

  debouncedSearch(query);
}

function runHistoryQuery(query: string): void {
  view.setQuery(query);
  debouncedSearch.cancel();
  void controller.search(query);
}

view.mount(document.body);
view.addSection(historyView.element);
historyView.render(history.list());
details.mount(document.body);
