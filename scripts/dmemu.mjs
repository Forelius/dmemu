/**
 * Depths Master Emulator (DMEmu)
 * Inspired by Game Unfolding Machine by JeansenVaars; adapted for Fantastic Depths.
 */

const MODULE_ID = "dmemu";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Depths Master Emulator`);
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Ready`);
});
