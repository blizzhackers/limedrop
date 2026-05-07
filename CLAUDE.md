# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm dev          # Start dev server at http://localhost:5173
pnpm build        # Type-check (tsc -b) then Vite build → dist/
pnpm preview      # Serve the dist/ folder
pnpm lint         # Biome check + auto-fix (src/ only)
```

There are no tests. Type-checking is done via `tsc -b` as part of `pnpm build`.

## Architecture

LimeDrop is a single-page React app that acts as a front-end for a D2Bot# API server (default `http://localhost:8080`). It loads inventory data from multiple Diablo II mule accounts, lets users filter/search items, build a drop cart, and trigger automated in-game drops.

### Data flow

1. **Authentication** — `D2BotAPI` ([src/lib/D2Bot.ts](src/lib/D2Bot.ts)) performs a challenge/response login using PBKDF2-AES-CBC. All API calls are base64-encoded JSON POSTed to `/api`.
2. **Account loading** — `App.tsx` fetches the account list and spawns `inventoryWorker.ts` ([src/workers/inventoryWorker.ts](src/workers/inventoryWorker.ts)) as a Web Worker. The worker calls `api.query()` per account and posts results back. This keeps heavy network work off the main thread.
3. **State** — Zustand store with `subscribeWithSelector` + `persist` middleware ([src/stores/appStore.ts](src/stores/appStore.ts)). Persisted keys: `realm`, `gameType`, `gameMode`, `gameClass`, `apiUrl`, `username`, `gameName`. The store also caches inventory per `account:realm` key with a 5-minute TTL.
4. **Filtering** — `useFilteredInventory` ([src/hooks/useFilteredInventory.ts](src/hooks/useFilteredInventory.ts)) runs entirely in the main thread via `useMemo`. Filter state is managed by TanStack Form (via `useAppForm` in `src/lib/forms/filterForm`) and passed through `useDeferredValue` before filtering so the UI stays responsive.
5. **Local persistence** — IndexedDB (`limedrop-db`) accessed through `openLimeDropDb` ([src/db/openLimeDropDb.ts](src/db/openLimeDropDb.ts)) stores two object stores: `recentDrops` and `itemPacks`. Both encrypt their payloads with AES (crypto-js) keyed from the username.

### Sidebar filter change flow

**Game type / mode / class / realm** changes trigger a full network reload:

1. Sidebar calls a Zustand action (`setGameClass`, `setGameMode`, `setGameType`, `setRealm`) → store updates.
2. `useAccountsToLoad` ([src/hooks/useAccountsToLoad.ts](src/hooks/useAccountsToLoad.ts)) has a `useAppStore.subscribe` listener watching `[gameType, gameMode, gameClass, realm, selectedAccount, accountDataCache]`. It fires immediately.
3. Inside the subscriber, the running worker is **terminated**. It re-derives valid accounts for the new combination, then checks each against the 5-minute in-memory cache (`inventoryCache`, keyed `account:realm`, also validates the full filter combination). Cache hits go straight into `inventory`; misses become the new `accountsToLoad` list. If there are no cache hits, `inventory` is cleared and `loadingInventory` is set to `true`.
4. `useInventoryWorker` ([src/hooks/useInventoryWorker.ts](src/hooks/useInventoryWorker.ts)) re-runs because `accountsToLoad` changed. It spawns a new Worker and posts `{ type: "load-accounts", ... }`.
5. The worker calls `api.query()` per account, posts `{ type: "account-items", items }` back as each finishes. The handler merges each batch into `inventoryCache` and appends to `inventory` via `appendUniqueItems` (inside `startTransition`). When all accounts finish it posts `{ type: "done" }` → `fullyLoaded: true`.
6. `useFilteredInventory` (`useMemo`) re-runs on the updated `inventory` and applies the current filter form values (passed through `useDeferredValue` in `InventoryGrid`).

**Account selection** follows the same path through the subscriber (it is in the watched slice), so it may respawn the worker or serve from cache.

**Character selection** is handled entirely client-side. `setSelectedCharacter` is **not** in the subscriber's watched slice, so no worker is spawned. `useFilteredInventory` filters by `item.character !== selectedCharacter.split(".")[0]` against the already-loaded inventory — no network round-trip.

### Item versioning

Items come in two formats:
- **V1** — legacy format parsed from a colon-delimited `itemid` string and human-readable description text. Quality, type, etc. are reverse-engineered from the description.
- **V2** — newer format where the last segment of `itemid` is a base64-encoded JSON blob containing full item metadata (`ItemInfo`).

`extractItemInfo` in [src/lib/utils.ts](src/lib/utils.ts) detects the version and delegates accordingly. The `InventoryItem` type is `V1InventoryItem | V2InventoryItem`. Use `isV2Item()` before accessing V2-only fields (`stats`, `code`, `flags`, etc.).

### Key files

| File | Role |
|------|------|
| `src/lib/D2Bot.ts` | API client class; handles auth, session, all API calls |
| `src/lib/utils.ts` | `InventoryItem` types, item parsing, realm/mode enums, sort helpers |
| `src/stores/appStore.ts` | All global state + action functions; persists a subset to localStorage |
| `src/workers/inventoryWorker.ts` | Web Worker that fetches inventory per account in the background |
| `src/hooks/useFilteredInventory.ts` | Pure filter logic over the in-memory inventory |
| `src/hooks/useInventoryWorker.ts` | Sets up/tears down the worker and wires messages to store |
| `src/hooks/useAccountsToLoad.ts` | Determines which accounts need fresh data |
| `src/db/openLimeDropDb.ts` | IndexedDB setup (v2 schema) |
| `src/db/recentDropsDb.ts` | Encrypted recent-drop CRUD |
| `src/db/itemPacksDb.ts` | Encrypted item-pack CRUD |
| `src/types/filterTypes.ts` | `FilterFormValues`, `StatFilter`, `Comparison`, `DEFAULT_FILTER_VALUES` |
| `src/constants/sdk.ts` | D2 SDK constants (quality, item type, flags, colors) |
| `src/constants/NTItemAlias.ts` | NTBot item alias constants used for flag checks |

### UI structure

- **Topbar** — search, login/logout, cart button, recent-drops button.
- **Sidebar** — realm/game-type/game-mode/game-class selectors + account/character filter. Collapses on desktop, opens as a `Drawer` on mobile.
- **InventoryGrid** — paginated (100/page) + infinite-scroll grid of `InventoryCard` tiles. Filter sheet opens via `AdvancedFilters` and shows active filters as pills (`ActiveFilterPills`).
- **CartDrawer** — items staged for drop; submits via `gameaction` API call.

### Tooling

- **Biome** (`biome.json`) — formatter (spaces) and linter. `noExplicitAny` is an error; `useExhaustiveDependencies` is a warning. Run `pnpm lint` before committing.
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin.
- **shadcn/ui** primitives in `src/components/ui/` (Radix UI under the hood).
- Path alias `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
