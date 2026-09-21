# Pack source (JSON)

Edit JSON under `packsrc/<packName>/`. Compile to LevelDB with `npm run comppacks` (you run this locally / CI does it on release).

Supported pack folders (same as fade-compendiums build tooling):

- `actors`
- `items`
- `macros`
- `rollTables`
- `journals`
- `scenes`

Declared in `module.json` initially: `rollTables`, `macros`, `journals`.
