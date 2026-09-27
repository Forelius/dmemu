# Depths Master Emulator (DMEmu)

System-agnostic solo / GM emulator module for Foundry VTT (v13–v14).

## Credits

Inspired by **Plot Unfolding Machine** and **Game Unfolding Machine** by JeansenVaars. DMEmu adapts those approaches for our own use; it is not an official PUM/GUM product. https://unfolding-machines.com/

Intentional adaptations from the source systems are listed in `../docs/dmemu-adaptations.md`.

## Status

Early development. See `../docs/dmemu-plan.md` in the workspace for the implementation plan.

## Development

TypeScript lives in `src/` and compiles to `module/` (gitignored), same pattern as Fantastic Depths:

```bash
npm install
npm run build
```

Entry script loaded by Foundry: `module/dmemu.min.js`.

## Using the Oracle

1. Build the module (`npm run build`) and compile packs (`npm run comppacks`).
2. Enable **Depths Master Emulator** in your world.
3. From the **DMEmu Macros** pack, drag **Open DMEmu Oracle**, **Open DMEmu Generators**, or **Open DMEmu Plot Sheet** to your hotbar (or run `game.dmemu.openOracle()` / `openGenerators()` / `openPlotSheet()`).
4. Oracle: Yes/No, Grand, enrichment. Generators: Seed / World / Characters. Plot Sheet: nodes, track, and beats (persisted as journals).

Client setting: **DMEmu chat visibility** (self / GMs / everyone).

## Packs

Compendium source lives in `packsrc/`. LevelDB packs under `packs/` are gitignored and built with the same toolchain as fade-compendiums:

```bash
npm run decomppacks   # LevelDB → packsrc JSON
npm run comppacks     # packsrc JSON → LevelDB
```

Included so far: Oracle / Generators / Plot Sheet macros; enrichment, Grand Oracle, generator, and plot beat RollTables; **DMEmu Guide** journal.

## Releases

Publish a GitHub release from `main` (tag on `main`). The workflow builds the module, compiles packs, and attaches `module.json` + `module.zip`. Install via the release `module.json` URL. Publishing to Foundry’s package library is not enabled yet.
