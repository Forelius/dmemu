/**
 * Depths Master Emulator (DMEmu)
 * Inspired by Game Unfolding Machine / Plot Unfolding Machine by JeansenVaars; adapted for our own use.
 */

import { MODULE_ID } from "./constants.js";
import { GeneratorsApp } from "./apps/GeneratorsApp.js";
import { OracleApp } from "./apps/OracleApp.js";
import { PlotSheetApp } from "./apps/PlotSheetApp.js";
import { GeneratorService } from "./generators/GeneratorService.js";
import { GrandOracleService, GrandOracleResult } from "./oracle/GrandOracleService.js";
import { YesNoOracleService, YesNoRollRequest, YesNoRollResult } from "./oracle/YesNoOracleService.js";
import { PlotBeatService } from "./plot/PlotBeatService.js";
import { PlotSheetService } from "./plot/PlotSheetService.js";
import { PlotSheetTypeId } from "./plot/types.js";

export { MODULE_ID } from "./constants.js";
export { GeneratorsApp } from "./apps/GeneratorsApp.js";
export { OracleApp } from "./apps/OracleApp.js";
export { PlotSheetApp } from "./apps/PlotSheetApp.js";
export { GeneratorService } from "./generators/GeneratorService.js";
export { GrandOracleService } from "./oracle/GrandOracleService.js";
export { YesNoOracleService } from "./oracle/YesNoOracleService.js";
export { PlotBeatService } from "./plot/PlotBeatService.js";
export { PlotSheetService } from "./plot/PlotSheetService.js";
export * from "./oracle/data/yesNoMatrices.js";
export * from "./oracle/grandOracleTables.js";
export * from "./generators/generatorTables.js";
export * from "./plot/presets.js";
export * from "./plot/types.js";

interface DmemuApi {
   openOracle: () => OracleApp;
   openGenerators: () => GeneratorsApp;
   openPlotSheet: (journalId?: string) => PlotSheetApp;
   oracle: {
      yesNo: (request: YesNoRollRequest) => Promise<YesNoRollResult>;
      postYesNo: (result: YesNoRollResult) => Promise<void>;
      grand: () => Promise<GrandOracleResult>;
   };
   generators: {
      combo: (comboId: string) => Promise<unknown>;
   };
   plot: {
      createSheet: (name: string, sheetType?: PlotSheetTypeId, scope?: string) => Promise<string>;
      listSheets: () => ReturnType<typeof PlotSheetService.listSheets>;
      randomPrompt: () => Promise<void>;
      modifiedProposal: (journalId?: string) => Promise<void>;
   };
}

let oracleApp: OracleApp | null = null;
let generatorsApp: GeneratorsApp | null = null;
let plotSheetApp: PlotSheetApp | null = null;

function openOracle(): OracleApp {
   if (!oracleApp) {
      oracleApp = new OracleApp();
   }
   oracleApp.render({ force: true });
   return oracleApp;
}

function openGenerators(): GeneratorsApp {
   if (!generatorsApp) {
      generatorsApp = new GeneratorsApp();
   }
   generatorsApp.render({ force: true });
   return generatorsApp;
}

function openPlotSheet(journalId?: string): PlotSheetApp {
   if (!plotSheetApp) {
      plotSheetApp = new PlotSheetApp();
   }
   if (journalId) {
      plotSheetApp.journalId = journalId;
      plotSheetApp.draft = null;
   }
   plotSheetApp.render({ force: true });
   return plotSheetApp;
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
      openGenerators,
      openPlotSheet,
      oracle: {
         yesNo: (request) => YesNoOracleService.roll(request),
         postYesNo: (result) => YesNoOracleService.postToChat(result),
         grand: () => GrandOracleService.rollAndPost(),
      },
      generators: {
         combo: (comboId) => GeneratorService.rollComboAndPost(comboId),
      },
      plot: {
         createSheet: (name, sheetType = "standard", scope = "") =>
            PlotSheetService.createSheet(name, sheetType, scope),
         listSheets: () => PlotSheetService.listSheets(),
         randomPrompt: async () => {
            const result = await PlotBeatService.rollRandomPrompt();
            await PlotBeatService.postToChat(result);
         },
         modifiedProposal: async (journalId) => {
            const sheet = journalId ? PlotSheetService.getSheet(journalId)?.data : null;
            const result = await PlotBeatService.rollModifiedProposal(sheet ?? null);
            await PlotBeatService.postToChat(result);
         },
      },
   };
   game.dmemu = api;
   console.log(`${MODULE_ID} | Ready`);
});
