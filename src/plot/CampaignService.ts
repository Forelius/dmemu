import { MODULE_ID } from "../constants.js";
import { renderCampaignSummaryHtml } from "./campaignSummary.js";
import {
   CAMPAIGN_FLAG,
   CampaignData,
   createCampaignData,
   getCampaignFlag,
} from "./campaignTypes.js";
import { PLOT_SHEET_PRESETS } from "./presets.js";
import { getPlotSheetFlag, PlotSheetTypeId } from "./types.js";

function localize(key: string): string {
   return game.i18n.localize(key);
}

const PAGE_ROLE_FLAG = "pageRole";
const SUMMARY_ROLE = "summary";
const NOTES_ROLE = "notes";

/**
 * JournalEntry-backed campaign persistence (universe + protagonists).
 */
export class CampaignService {
   static isCampaign(doc: { getFlag: (scope: string, key: string) => unknown }): boolean {
      return !!getCampaignFlag(doc);
   }

   static listCampaigns(): { id: string; name: string }[] {
      const journals = game.journal?.contents ?? [];
      const out: { id: string; name: string }[] = [];
      for (const j of journals) {
         if (!getCampaignFlag(j)) continue;
         out.push({ id: j.id, name: j.name });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
   }

   static listSheetsForCampaign(
      campaignId: string
   ): { id: string; name: string; sheetType: PlotSheetTypeId }[] {
      const journals = game.journal?.contents ?? [];
      const out: { id: string; name: string; sheetType: PlotSheetTypeId }[] = [];
      for (const j of journals) {
         const data = getPlotSheetFlag(j);
         if (!data || data.campaignId !== campaignId) continue;
         out.push({ id: j.id, name: j.name, sheetType: data.sheetType });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
   }

   static async createCampaign(
      name: string,
      universe = "",
      protagonists = ""
   ): Promise<string> {
      const data = createCampaignData(universe, protagonists);
      const summaryHtml = renderCampaignSummaryHtml(data, []);
      const doc = await JournalEntry.create({
         name: name.trim() || localize("DMEMU.Campaign.DefaultName"),
         pages: [
            {
               name: localize("DMEMU.Campaign.SummaryPageName"),
               type: "text",
               sort: 0,
               text: {
                  content: summaryHtml,
                  format: 1,
               },
               flags: {
                  [MODULE_ID]: {
                     [PAGE_ROLE_FLAG]: SUMMARY_ROLE,
                  },
               },
            },
            {
               name: localize("DMEMU.Campaign.JournalPageName"),
               type: "text",
               sort: 1,
               text: {
                  content: `<p><em>${localize("DMEMU.Campaign.JournalPageHint")}</em></p>`,
                  format: 1,
               },
               flags: {
                  [MODULE_ID]: {
                     [PAGE_ROLE_FLAG]: NOTES_ROLE,
                  },
               },
            },
         ],
         flags: {
            [MODULE_ID]: {
               [CAMPAIGN_FLAG]: data,
            },
         },
      });
      if (!doc) {
         throw new Error(localize("DMEMU.Campaign.CreateFailed"));
      }
      return doc.id;
   }

   static getCampaign(journalId: string): {
      journal: {
         id: string;
         name: string;
         update: (data: object) => Promise<unknown>;
         setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
         pages: { contents?: unknown[]; find?: (fn: (p: unknown) => boolean) => unknown };
         getEmbeddedCollection?: (name: string) => { contents: unknown[] };
         createEmbeddedDocuments?: (type: string, data: object[]) => Promise<unknown>;
      };
      data: CampaignData;
   } | null {
      const journal = game.journal?.get(journalId);
      if (!journal) return null;
      const data = getCampaignFlag(journal);
      if (!data) return null;
      return { journal, data };
   }

   static async saveCampaign(journalId: string, data: CampaignData): Promise<void> {
      const journal = game.journal?.get(journalId);
      if (!journal) {
         throw new Error(localize("DMEMU.Campaign.MissingCampaign"));
      }
      await journal.setFlag(MODULE_ID, CAMPAIGN_FLAG, data);
      await this.#syncSummaryPage(journal, data);
   }

   static async renameCampaign(journalId: string, name: string): Promise<void> {
      const journal = game.journal?.get(journalId);
      if (!journal) return;
      await journal.update({ name: name.trim() || journal.name });
   }

   static async #syncSummaryPage(
      journal: {
         id?: string;
         pages?: { contents?: unknown[] };
         getEmbeddedCollection?: (name: string) => { contents: unknown[] };
         createEmbeddedDocuments?: (type: string, data: object[]) => Promise<unknown>;
      },
      data: CampaignData
   ): Promise<void> {
      const sheets = journal.id ? this.listSheetsForCampaign(journal.id) : [];
      const sheetViews = sheets.map((s) => ({
         name: s.name,
         sheetTypeLabel: localize(`DMEMU.Plot.SheetType.${PLOT_SHEET_PRESETS[s.sheetType].i18nKey}`),
      }));
      const pages =
         journal.pages?.contents ??
         journal.getEmbeddedCollection?.("pages")?.contents ??
         [];
      const summary = (
         pages as {
            getFlag?: (s: string, k: string) => unknown;
            update?: (d: object) => Promise<unknown>;
         }[]
      ).find((p) => p.getFlag?.(MODULE_ID, PAGE_ROLE_FLAG) === SUMMARY_ROLE);
      const html = renderCampaignSummaryHtml(data, sheetViews);
      if (summary?.update) {
         await summary.update({
            name: localize("DMEMU.Campaign.SummaryPageName"),
            "text.content": html,
         });
         return;
      }
      if (typeof journal.createEmbeddedDocuments === "function") {
         await journal.createEmbeddedDocuments("JournalEntryPage", [
            {
               name: localize("DMEMU.Campaign.SummaryPageName"),
               type: "text",
               sort: 0,
               text: { content: html, format: 1 },
               flags: {
                  [MODULE_ID]: {
                     [PAGE_ROLE_FLAG]: SUMMARY_ROLE,
                  },
               },
            },
         ]);
      }
   }
}
