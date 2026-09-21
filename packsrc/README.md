# Pack source (JSON)

Edit JSON under `packsrc/<packName>/`. Compile to LevelDB with `npm run comppacks` (you run this locally / CI does it on release).

Supported pack folders (same as fade-compendiums build tooling):

- `actors`
- `items`
- `macros`
- `rollTables`
- `journals`
- `scenes`

Declared in `module.json`: `rollTables`, `macros`, `journals`.

Oracle content (initial):

- `macros/Open_DMEmu_Oracle.json`
- `rollTables/Oracles/Oracle_Notice_perceive.json`
- `rollTables/Oracles/Oracle_Focus_what.json`
