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
   scope: string;
   track: PlotTrackState;
   nodeCategories: PlotNodeCategory[];
}

export const PLOT_SHEET_FLAG = "plotSheet" as const;

export function getPlotSheetFlag(doc: { getFlag: (scope: string, key: string) => unknown }): PlotSheetData | null {
   const raw = doc.getFlag(MODULE_ID, PLOT_SHEET_FLAG);
   if (!raw || typeof raw !== "object") return null;
   return raw as PlotSheetData;
}

export function emptySlots(count: number): PlotNodeSlot[] {
   return Array.from({ length: count }, () => ({ text: "" }));
}
