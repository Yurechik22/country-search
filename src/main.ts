import { searchCountries } from './api/countries-api.js';
import { REQUEST_TIMEOUT_MS, SEARCH_DEBOUNCE_MS } from './config.js';
import { mapCountryResponse } from './domain/map-country.js';
import { SearchController } from './search/search-controller.js';
import type { SearchFn } from './search/search-state.js';
import { AppView } from './ui/app-view.js';
import { CountryDetails } from './ui/country-details.js';
import { debounce } from './utils/debounce.js';

const fetchCountries: SearchFn = async (query, signal) =>
  (await searchCountries(query, signal)).map(mapCountryResponse);

const details = new CountryDetails();

const view = new AppView({
  onQueryChange: handleQueryChange,
  onRetry: () => void controller.retry(),
  onSelectCountry: (country) => details.open(country),
});

const controller = new SearchController({
  search: fetchCountries,
  timeoutMs: REQUEST_TIMEOUT_MS,
  onChange: (state) => view.render(state),
});

const debouncedSearch = debounce((query: string) => void controller.search(query), SEARCH_DEBOUNCE_MS);

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

view.mount(document.body);
details.mount(document.body);
