import { MODULE_ID } from "../constants.js";
import { PLOT_SHEET_PRESETS } from "./presets.js";
import { PlotSheetData } from "./types.js";

function localize(key: string): string {
   return game.i18n.localize(key);
}

function esc(text: string): string {
   return foundry.utils.escapeHTML(text);
}

/**
 * Build HTML summary of plot sheet state for the journal Summary page.
 * Flags remain source of truth; this page is overwritten on save.
 */
export function renderPlotSheetSummaryHtml(data: PlotSheetData): string {
   const preset = PLOT_SHEET_PRESETS[data.sheetType];
   const typeLabel = localize(`DMEMU.Plot.SheetType.${preset.i18nKey}`);
   const parts: string[] = [];

   parts.push(`<p class="hint">${localize("DMEMU.Plot.Summary.AutoHint")}</p>`);
   parts.push(`<h2>${localize("DMEMU.Plot.Summary.Overview")}</h2>`);
   parts.push(`<p><strong>${localize("DMEMU.Plot.App.SheetType")}:</strong> ${esc(typeLabel)}</p>`);

   const scope = (data.scope ?? "").trim();
   if (scope) {
      parts.push(`<p><strong>${localize("DMEMU.Plot.App.Scope")}:</strong> ${esc(scope)}</p>`);
   } else {
      parts.push(`<p><em>${localize("DMEMU.Plot.Summary.NoScope")}</em></p>`);
   }

   if (preset.hasTrack && data.track.boxes > 0) {
      parts.push(`<h2>${localize("DMEMU.Plot.App.TrackLegend")}</h2>`);
      parts.push(
         `<p>${localize("DMEMU.Plot.TrackProgress")
            .replace("{checked}", String(data.track.checked))
            .replace("{boxes}", String(data.track.boxes))}</p>`
      );

      let offset = 0;
      const sectionBits: string[] = [];
      for (let s = 0; s < data.track.sectionKeys.length; s++) {
         const size = data.track.sectionSizes[s] ?? 0;
         const label = localize(`DMEMU.Plot.TrackSection.${data.track.sectionKeys[s]}`);
         const filled = Math.max(0, Math.min(size, data.track.checked - offset));
         sectionBits.push(`${esc(label)} ${filled}/${size}`);
         offset += size;
      }
      if (sectionBits.length) {
         parts.push(`<p>${sectionBits.join(" · ")}</p>`);
      }
   }

   parts.push(`<h2>${localize("DMEMU.Plot.Summary.Nodes")}</h2>`);
   let anyNode = false;
   for (const cat of data.nodeCategories) {
      const filled = cat.slots.map((s) => s.text.trim()).filter(Boolean);
      if (!filled.length) continue;
      anyNode = true;
      const catLabel = localize(`DMEMU.Plot.NodeCategory.${cat.i18nKey}`);
      parts.push(`<h3>${esc(catLabel)}</h3>`);
      parts.push("<ul>");
      for (const text of filled) {
         parts.push(`<li>${esc(text)}</li>`);
      }
      parts.push("</ul>");
   }
   if (!anyNode) {
      parts.push(`<p><em>${localize("DMEMU.Plot.Summary.NoNodes")}</em></p>`);
   }

   return parts.join("\n");
}
