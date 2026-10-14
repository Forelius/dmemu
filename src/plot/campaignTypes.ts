import { MODULE_ID } from "../constants.js";

export interface CampaignData {
   version: 1;
   universe: string;
   protagonists: string;
}

export const CAMPAIGN_FLAG = "campaign" as const;

export function createCampaignData(universe = "", protagonists = ""): CampaignData {
   return {
      version: 1,
      universe,
      protagonists,
   };
}

export function normalizeCampaignData(data: CampaignData): CampaignData {
   return {
      version: 1,
      universe: data.universe ?? "",
      protagonists: data.protagonists ?? "",
   };
}

export function getCampaignFlag(doc: { getFlag: (scope: string, key: string) => unknown }): CampaignData | null {
   const raw = doc.getFlag(MODULE_ID, CAMPAIGN_FLAG);
   if (!raw || typeof raw !== "object") return null;
   return normalizeCampaignData(raw as CampaignData);
}
