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
- `rollTables/Oracles/` — Yes/No enrichment companions: descriptive (Notice, Someone, Place, Object, Hazard, Mood, Description), story (Focus, Reason, Intent, Activity, Discovery, Problem, Explain), quantifiers (How many/much, How good/well, How hard/tough); GUM Grand Oracle (Action, Adjective, Subject)
