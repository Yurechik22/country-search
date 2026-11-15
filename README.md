# Country Search

RS School task: live country search over [countries.dev](https://countries.dev/docs) with debounce,
request cancellation (`AbortController`), timeouts and race-condition handling.

Design decisions, complexity and the cancellation flow are described in [DESIGN.md](./DESIGN.md).

## Features

- Search as you type (debounced), empty input clears the list without a request.
- Every input change aborts the previous request; stale responses never reach the screen.
- Loading indicator, "no matches" state for 404, error state with **Retry** for HTTP/network
  errors and timeouts. The app's own cancellations are never shown as errors.
- Country cards (flag, name, capital, region, population) and a details dialog
  (description, area, borders, languages, currency).
- Bonus: cache by query with in-flight deduplication and per-caller cancellation.
- Bonus: search history in `localStorage`, click an entry to search again.

## Tech

TypeScript compiled by `tsc` to native ES modules (no bundler), Vitest with fake timers and
fetch mocks, ESLint + Prettier, Husky (pre-commit: lint-staged, pre-push: tests).

## Getting started

```bash
npm install
npm run build     # compile src/ → dist/
npm start         # serve the project root, open the printed URL
```

## Scripts

| Script               | What it does                                       |
| -------------------- | -------------------------------------------------- |
| `npm run build`      | Compile TypeScript to `dist/`                      |
| `npm run watch`      | Compile in watch mode                              |
| `npm run build:site` | Build and assemble the deployable site in `site/`  |
| `npm test`           | Run unit tests once                                |
| `npm run test:watch` | Run tests in watch mode                            |
| `npm run lint`       | ESLint                                             |
| `npm run format`     | Prettier (write)                                   |
| `npm run typecheck`  | Type-check without emitting                        |

## Project structure

```
src/
  api/        countries.dev client, HttpError, error classification
  domain/     Country model and pure mapper from the API response
  search/     SearchController (state machine), cache, shared types
  history/    search history storage
  ui/         DOM rendering only (no innerHTML)
  utils/      debounce, timeout signal
  main.ts     wiring
tests/        Vitest unit tests, race-condition test, fixtures
```
