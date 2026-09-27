import {
   PlotNodeCategory,
   PlotNodeCategoryId,
   PlotSheetData,
   PlotSheetTypeId,
   emptySlots,
} from "./types.js";

export interface PlotSheetPreset {
   id: PlotSheetTypeId;
   /** i18n key suffix under DMEMU.Plot.SheetType */
   i18nKey: string;
   hasTrack: boolean;
   track: {
      boxes: number;
      sectionKeys: string[];
      sectionSizes: number[];
   };
   /** Category id + slot count */
   nodeLayout: { id: PlotNodeCategoryId; i18nKey: string; slots: number }[];
}

const STANDARD_NODES: PlotSheetPreset["nodeLayout"] = [
   { id: "worldElements", i18nKey: "WorldElements", slots: 5 },
   { id: "potentialProblems", i18nKey: "PotentialProblems", slots: 5 },
   { id: "usefulFindings", i18nKey: "UsefulFindings", slots: 5 },
   { id: "pendingQuestions", i18nKey: "PendingQuestions", slots: 5 },
   { id: "notableCharacters", i18nKey: "NotableCharacters", slots: 5 },
   { id: "interestingLocations", i18nKey: "InterestingLocations", slots: 5 },
];

/** Shared beat table names in packsrc/rollTables/PlotBeats. */
export const PLOT_BEAT_TABLES = {
   complication: "Plot Beat — Complication",
   catalyst: "Plot Beat — Catalyst",
   challenge: "Plot Beat — Challenge",
   situation: "Plot Beat — Situation",
   modifiedProposal: "Plot Beat — Modified proposal",
} as const;

export const PLOT_SHEET_PRESETS: Record<PlotSheetTypeId, PlotSheetPreset> = {
   standard: {
      id: "standard",
      i18nKey: "Standard",
      hasTrack: true,
      track: {
         boxes: 9,
         sectionKeys: ["Exposition", "Confrontation", "Resolution"],
         sectionSizes: [3, 3, 3],
      },
      nodeLayout: STANDARD_NODES,
   },
   journey: {
      id: "journey",
      i18nKey: "Journey",
      hasTrack: true,
      track: {
         boxes: 15,
         sectionKeys: ["Exposition", "Rising", "Climax", "Falling", "Resolution"],
         sectionSizes: [3, 3, 3, 3, 3],
      },
      nodeLayout: STANDARD_NODES,
   },
   storyFocus: {
      id: "storyFocus",
      i18nKey: "StoryFocus",
      hasTrack: true,
      track: {
         boxes: 12,
         sectionKeys: ["ActOne", "ActTwo", "ActThree"],
         sectionSizes: [4, 4, 4],
      },
      nodeLayout: STANDARD_NODES,
   },
   scenes: {
      id: "scenes",
      i18nKey: "Scenes",
      hasTrack: true,
      track: {
         boxes: 12,
         sectionKeys: ["Scenes"],
         sectionSizes: [12],
      },
      nodeLayout: STANDARD_NODES,
   },
   dungeon: {
      id: "dungeon",
      i18nKey: "Dungeon",
      hasTrack: true,
      track: {
         boxes: 12,
         sectionKeys: ["Rooms"],
         sectionSizes: [12],
      },
      nodeLayout: STANDARD_NODES,
   },
   exploration: {
      id: "exploration",
      i18nKey: "Exploration",
      hasTrack: true,
      track: {
         boxes: 12,
         sectionKeys: ["Areas"],
         sectionSizes: [12],
      },
      nodeLayout: STANDARD_NODES,
   },
   storyParts: {
      id: "storyParts",
      i18nKey: "StoryParts",
      hasTrack: true,
      track: {
         boxes: 6,
         sectionKeys: ["Parts"],
         sectionSizes: [6],
      },
      nodeLayout: STANDARD_NODES,
   },
   improvised: {
      id: "improvised",
      i18nKey: "Improvised",
      hasTrack: false,
      track: { boxes: 0, sectionKeys: [], sectionSizes: [] },
      nodeLayout: STANDARD_NODES,
   },
   sandbox: {
      id: "sandbox",
      i18nKey: "Sandbox",
      hasTrack: false,
      track: { boxes: 0, sectionKeys: [], sectionSizes: [] },
      nodeLayout: STANDARD_NODES,
   },
   customized: {
      id: "customized",
      i18nKey: "Customized",
      hasTrack: true,
      track: {
         boxes: 12,
         sectionKeys: ["Custom"],
         sectionSizes: [12],
      },
      nodeLayout: STANDARD_NODES,
   },
};

export const PLOT_SHEET_TYPE_IDS = Object.keys(PLOT_SHEET_PRESETS) as PlotSheetTypeId[];

export function createPlotSheetData(sheetType: PlotSheetTypeId, scope = ""): PlotSheetData {
   const preset = PLOT_SHEET_PRESETS[sheetType];
   const nodeCategories: PlotNodeCategory[] = preset.nodeLayout.map((n) => ({
      id: n.id,
      i18nKey: n.i18nKey,
      slots: emptySlots(n.slots),
   }));
   return {
      version: 1,
      sheetType,
      scope,
      track: {
         boxes: preset.track.boxes,
         checked: 0,
         sectionKeys: [...preset.track.sectionKeys],
         sectionSizes: [...preset.track.sectionSizes],
      },
      nodeCategories,
   };
}
