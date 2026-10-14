import { MODULE_ID } from "../constants.js";

/** Category ids used by node slots and beat invoke flags. */
export type PlotNodeCategoryId =
   | "worldElements"
   | "potentialProblems"
   | "usefulFindings"
   | "pendingQuestions"
   | "notableCharacters"
   | "interestingLocations";

export type PlotSheetTypeId =
   | "standard"
   | "journey"
   | "storyFocus"
   | "scenes"
   | "dungeon"
   | "exploration"
   | "storyParts"
   | "improvised"
   | "sandbox"
   | "customized";

export interface PlotNodeSlot {
   text: string;
}

export interface PlotNodeCategory {
   id: PlotNodeCategoryId;
   /** i18n key suffix under DMEMU.Plot.NodeCategory */
   i18nKey: string;
   slots: PlotNodeSlot[];
}

export interface PlotTrackState {
   boxes: number;
   checked: number;
   /** i18n key suffixes under DMEMU.Plot.TrackSection (one per section in order) */
   sectionKeys: string[];
   /** How many boxes belong to each section (sums to boxes). */
   sectionSizes: number[];
}

export interface PlotSheetData {
   version: 1;
   sheetType: PlotSheetTypeId;
   /** Owning campaign journal id. */
   campaignId: string;
   scope: string;
   /** Mission / pitch beyond the short scope line. */
   mission: string;
   track: PlotTrackState;
   nodeCategories: PlotNodeCategory[];
}

/** Legacy fields that may still exist on older journal flags. */
export interface LegacyPlotSheetPrep {
   universe?: string;
   protagonists?: string;
}

export const PLOT_SHEET_FLAG = "plotSheet" as const;

export function normalizePlotSheetData(data: PlotSheetData & LegacyPlotSheetPrep): PlotSheetData {
   return {
      version: 1,
      sheetType: data.sheetType,
      campaignId: data.campaignId ?? "",
      scope: data.scope ?? "",
      mission: data.mission ?? "",
      track: data.track,
      nodeCategories: data.nodeCategories,
   };
}

export function getPlotSheetFlag(doc: { getFlag: (scope: string, key: string) => unknown }): PlotSheetData | null {
   const raw = doc.getFlag(MODULE_ID, PLOT_SHEET_FLAG);
   if (!raw || typeof raw !== "object") return null;
   return normalizePlotSheetData(raw as PlotSheetData & LegacyPlotSheetPrep);
}

/** Read legacy prep fields still stored on older sheets (before campaign migration). */
export function getLegacyPlotSheetPrep(doc: {
   getFlag: (scope: string, key: string) => unknown;
}): LegacyPlotSheetPrep {
   const raw = doc.getFlag(MODULE_ID, PLOT_SHEET_FLAG);
   if (!raw || typeof raw !== "object") return {};
   const obj = raw as LegacyPlotSheetPrep;
   return {
      universe: typeof obj.universe === "string" ? obj.universe : "",
      protagonists: typeof obj.protagonists === "string" ? obj.protagonists : "",
   };
}

export function emptySlots(count: number): PlotNodeSlot[] {
   return Array.from({ length: count }, () => ({ text: "" }));
}
