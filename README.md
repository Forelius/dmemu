# Depths Master Emulator (DMEmu)

System-agnostic solo / GM emulator module for Foundry VTT (v13–v14).

## Credits

Inspired by **Game Unfolding Machine** by JeansenVaars. DMEmu adapts and extends that approach for our own use; it is not an official GUM product.

## Status

Early scaffold (`0.1.0`). See `../docs/dmemu-plan.md` in the workspace for the implementation plan.

## Packs

Compendium source lives in `packsrc/`. LevelDB packs under `packs/` are gitignored and built with the same toolchain as fade-compendiums:

```bash
npm run decomppacks   # LevelDB → packsrc JSON
npm run comppacks     # packsrc JSON → LevelDB
```

## Releases

GitHub Actions build pre-releases from `main` and stable releases from `stable`. Install via the release `module.json` URL. Publishing to Foundry’s package library is not enabled yet.
