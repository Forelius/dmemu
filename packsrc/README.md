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

Oracle content:

- `macros/Open_DMEmu_Oracle.json`
- `macros/Open_DMEmu_Generators.json`
- `rollTables/Oracles/` — enrichment companions and Grand Oracle (Action, Adjective, Subject)
- `rollTables/Generators/` — seed, world, and character generator tables
