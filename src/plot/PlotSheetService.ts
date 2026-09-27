import { MODULE_ID } from "../constants.js";
import { createPlotSheetData, PLOT_SHEET_PRESETS } from "./presets.js";
import { renderPlotSheetSummaryHtml } from "./plotSheetSummary.js";
import { getPlotSheetFlag, PLOT_SHEET_FLAG, PlotSheetData, PlotSheetTypeId } from "./types.js";

function localize(key: string): string {
   return game.i18n.localize(key);
}

const PAGE_ROLE_FLAG = "pageRole";
const SUMMARY_ROLE = "summary";
const NOTES_ROLE = "notes";

/**
 * JournalEntry-backed plot sheet persistence.
 */
export class PlotSheetService {
   static isPlotSheet(doc: { getFlag: (scope: string, key: string) => unknown }): boolean {
      return !!getPlotSheetFlag(doc);
   }

   static listSheets(): { id: string; name: string; sheetType: PlotSheetTypeId }[] {
      const journals = game.journal?.contents ?? [];
      const out: { id: string; name: string; sheetType: PlotSheetTypeId }[] = [];
      for (const j of journals) {
         const data = getPlotSheetFlag(j);
         if (!data) continue;
         out.push({ id: j.id, name: j.name, sheetType: data.sheetType });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
   }

   static async createSheet(name: string, sheetType: PlotSheetTypeId, scope = ""): Promise<string> {
      const data = createPlotSheetData(sheetType, scope);
      const summaryHtml = renderPlotSheetSummaryHtml(data);
      const doc = await JournalEntry.create({
         name: name.trim() || localize("DMEMU.Plot.DefaultName"),
         pages: [
            {
               name: localize("DMEMU.Plot.SummaryPageName"),
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
               name: localize("DMEMU.Plot.JournalPageName"),
               type: "text",
               sort: 1,
               text: {
                  content: `<p><em>${localize("DMEMU.Plot.JournalPageHint")}</em></p>`,
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
               [PLOT_SHEET_FLAG]: data,
            },
         },
      });
      if (!doc) {
         throw new Error(localize("DMEMU.Plot.CreateFailed"));
      }
      return doc.id;
   }

   static getSheet(journalId: string): {
      journal: {
         id: string;
         name: string;
         update: (data: object) => Promise<unknown>;
         setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
         pages: { contents?: unknown[]; find?: (fn: (p: unknown) => boolean) => unknown };
         getEmbeddedCollection?: (name: string) => { contents: unknown[] };
      };
      data: PlotSheetData;
   } | null {
      const journal = game.journal?.get(journalId);
      if (!journal) return null;
      const data = getPlotSheetFlag(journal);
      if (!data) return null;
      return { journal, data };
   }

   static async saveSheet(journalId: string, data: PlotSheetData): Promise<void> {
      const journal = game.journal?.get(journalId);
      if (!journal) {
         throw new Error(localize("DMEMU.Plot.MissingSheet"));
      }
      await journal.setFlag(MODULE_ID, PLOT_SHEET_FLAG, data);
      await this.#syncSummaryPage(journal, data);
   }

   static async renameSheet(journalId: string, name: string): Promise<void> {
      const journal = game.journal?.get(journalId);
      if (!journal) return;
      await journal.update({ name: name.trim() || journal.name });
   }

   /** Change sheet type: rebuild track/nodes from preset; keep scope; warn via return if data loss. */
   static retypeSheet(data: PlotSheetData, sheetType: PlotSheetTypeId): PlotSheetData {
      const next = createPlotSheetData(sheetType, data.scope);
      for (const cat of next.nodeCategories) {
         const prev = data.nodeCategories.find((c) => c.id === cat.id);
         if (!prev) continue;
         for (let i = 0; i < cat.slots.length; i++) {
            if (prev.slots[i]?.text) cat.slots[i].text = prev.slots[i].text;
         }
      }
      next.track.checked = Math.min(data.track.checked, next.track.boxes);
      return next;
   }

   static advanceTrack(data: PlotSheetData): PlotSheetData {
      if (data.track.boxes <= 0) return data;
      const checked = Math.min(data.track.boxes, data.track.checked + 1);
      return { ...data, track: { ...data.track, checked } };
   }

   static setTrackChecked(data: PlotSheetData, checked: number): PlotSheetData {
      const n = Math.max(0, Math.min(data.track.boxes, checked));
      return { ...data, track: { ...data.track, checked: n } };
   }

   static async #syncSummaryPage(
      journal: {
         pages?: { contents?: unknown[] };
         getEmbeddedCollection?: (name: string) => { contents: unknown[] };
         createEmbeddedDocuments?: (type: string, data: object[]) => Promise<unknown>;
      },
      data: PlotSheetData
   ): Promise<void> {
      const pages =
         journal.pages?.contents ??
         journal.getEmbeddedCollection?.("pages")?.contents ??
         [];
      const summary = (pages as { getFlag?: (s: string, k: string) => unknown; update?: (d: object) => Promise<unknown>; name?: string }[]).find(
         (p) => p.getFlag?.(MODULE_ID, PAGE_ROLE_FLAG) === SUMMARY_ROLE
      );
      const html = renderPlotSheetSummaryHtml(data);
      if (summary?.update) {
         await summary.update({
            name: localize("DMEMU.Plot.SummaryPageName"),
            "text.content": html,
         });
         return;
      }
      // Older sheets created before summary sync: add a Summary page once.
      if (typeof journal.createEmbeddedDocuments === "function") {
         await journal.createEmbeddedDocuments("JournalEntryPage", [
            {
               name: localize("DMEMU.Plot.SummaryPageName"),
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
