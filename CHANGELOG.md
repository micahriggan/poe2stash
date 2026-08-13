# Changelog

## [Unreleased]

### Fixed

#### Dev server and build

- `npm run dev` failed to start with `` `renderer` option dependency "vite-plugin-electron-renderer" not found ``. The package was installed; it imports `esbuild`, which Vite 8 no longer depends on (it uses Rolldown/oxc), so nothing pulled `esbuild` into `node_modules`. The plugin caught the resulting `ERR_MODULE_NOT_FOUND` and reported it as a missing dependency. The `renderer` option is not needed here — `nodeIntegration` is disabled and the Renderer reaches the Main process over the local express server — so it was removed along with the dependency.
- `npm install` could not resolve peers: `@vitejs/plugin-react@4` supports Vite 7 at most. Upgraded to `^6.0.5`.
- The Main process crashed on load with `Calling require for "path" in an environment that doesn't expose the require function`. Rolldown emits `require()` for externalized Node builtins even in an ESM bundle, so the Main build now carries a `createRequire` banner.
- Replaced `__dirname` in `vite.config.ts` with a root-relative preload path, clearing Vite's native-config-loader warning.

#### Electron 43 upgrade fallout

- `net.request` rejected the proxy's options object: `referrerPolicy` needed a literal type against the narrowed `ClientRequestConstructorOptions`.
- `File.path` was removed in Electron 32. The preload now exposes `webUtils.getPathForFile` over `contextBridge` as `window.electronFile`, used when selecting a chat log file.

Both of these blocked `npm run build`, which runs `tsc` before bundling.

#### Trade API mod format

The trade API now returns `implicitMods`, `explicitMods`, and `enchantMods` as objects carrying `description`, `domain`, `hash`, and a `mods` array, rather than plain strings. `extended.mods` is no longer sent.

- The item list rendered these objects directly as React children, which threw React error #31 and blanked the page as soon as any item with mods was displayed.
- Price estimation called string methods on them, so every modded item failed to price.

Item types were updated to match, mod rendering now goes through a shared formatter, and the estimator reads the structured data. Mod text is displayed with the game's markup resolved (`[Attack|Attacks]` renders as "Attacks"), and explicit mods show their tier.

#### Price estimation

- Estimates could be cached as `NaN` and displayed as `~NaN` for a day. An empty comparable set is now reported as "no estimate" instead of being averaged, prices that fail to convert are dropped, an exchange rate that cannot be resolved is no longer cached, and `upscalePrice` no longer divides by a bad rate. Estimates already cached as `NaN` are filtered out on read so they are re-checked.
- Mod tier ordering was inverted. `getHighTierMods` sorted descending, selecting the *worst* mods on an item to search on, which biased estimates low. It now sorts ascending. Mods with no affix data rank last rather than being treated as tier 0, which is a real and best-possible tier.

#### Leagues

- The league list was hardcoded and had gone stale, so searches ran against a league that no longer exists. It is now loaded from `trade2/data/leagues` at startup, with the static list kept only as a fallback until that request resolves. The selected league falls back to the first live league if the current selection is not in the list.

### Added

- **Stash value totals.** The main view shows the total listed value and total estimated value of the items in view, with a count of how many have been price checked. Totals respect the stash tab filter and the search box. `PriceChecker.totalValue` converts a mixed-currency set into one figure, fetching any missing exchange rates first, and upscales to divine once large enough.
- **Recheck All.** Re-estimates every item in view, ignoring cached estimates, for when estimates are stale rather than missing. The existing "Price Check All" button passed React's click event straight into the new parameter, which would have made every run a forced recheck; both buttons now use explicit handlers and are disabled while a check is running.
- **Unit tests.** `vitest` with `npm test` and `npm run test:watch`, 43 tests covering mod parsing, tier ordering, the `NaN` guards, currency conversion, and price estimation against mocked trade calls. Test config is kept separate from `vite.config.ts` so runs do not build and launch the Main process; an in-memory `localStorage` stands in for the cache layer. `test/proxy.test.ts` is excluded, being a manual script against the live API.

### Changed

- Mod handling moved into `src/services/mods.ts` (`formatModText`, `modValues`, `statId`, `parseMod`).
- `extractMod`, `getStatEntryForMod`, and `getStatEntry` were removed. They reconstructed each mod's stat id by normalising its text and matching it against the stat table, including inversion handling for increased/reduced wording, and threw when a mod was not found. The API now supplies the id and tier directly.
- Dropping the stat table import took the renderer bundle from 764 kB to 267 kB (172 kB to 88 kB gzipped). `src/data/stats.ts` is retained but no longer imported.
- README formatting.

### Known limitations

- Item coverage comes from public trade listings for the account, not the stash API, so items in private tabs or without a price are not visible to the app.
- Tests cover pure logic and the estimator's orchestration. React components and the Electron Main process are not yet covered.
