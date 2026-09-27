/**
 * Depths Master Emulator (DMEmu)
 * Inspired by Game Unfolding Machine / Plot Unfolding Machine by JeansenVaars; adapted for our own use.
 */

import { MODULE_ID } from "./constants.js";
import { OracleApp } from "./apps/OracleApp.js";
import { GrandOracleService, GrandOracleResult } from "./oracle/GrandOracleService.js";
import { YesNoOracleService, YesNoRollRequest, YesNoRollResult } from "./oracle/YesNoOracleService.js";

export { MODULE_ID } from "./constants.js";
export { OracleApp } from "./apps/OracleApp.js";
export { GrandOracleService } from "./oracle/GrandOracleService.js";
export { YesNoOracleService } from "./oracle/YesNoOracleService.js";
export * from "./oracle/data/yesNoMatrices.js";
export * from "./oracle/grandOracleTables.js";

interface DmemuApi {
   openOracle: () => OracleApp;
   oracle: {
      yesNo: (request: YesNoRollRequest) => Promise<YesNoRollResult>;
      postYesNo: (result: YesNoRollResult) => Promise<void>;
      grand: () => Promise<GrandOracleResult>;
   };
}

let oracleApp: OracleApp | null = null;

function openOracle(): OracleApp {
   if (!oracleApp) {
      oracleApp = new OracleApp();
   }
   oracleApp.render({ force: true });
   return oracleApp;
}

function registerSettings(): void {
   game.settings.register(MODULE_ID, "oracleChatVisibility", {
      name: "DMEMU.Settings.OracleChatVisibility.Name",
      hint: "DMEMU.Settings.OracleChatVisibility.Hint",
      scope: "client",
      config: true,
      type: String,
      choices: {
         self: "DMEMU.Settings.OracleChatVisibility.Choices.self",
         gm: "DMEMU.Settings.OracleChatVisibility.Choices.gm",
         everyone: "DMEMU.Settings.OracleChatVisibility.Choices.everyone",
      },
      default: "self",
   });
}

Hooks.once("init", () => {
   console.log(`${MODULE_ID} | Initializing Depths Master Emulator`);
   registerSettings();
});

Hooks.once("ready", () => {
   const api: DmemuApi = {
      openOracle,
      oracle: {
         yesNo: (request) => YesNoOracleService.roll(request),
         postYesNo: (result) => YesNoOracleService.postToChat(result),
         grand: () => GrandOracleService.rollAndPost(),
      },
   };
   game.dmemu = api;
   console.log(`${MODULE_ID} | Ready`);
});
