import { CampaignData } from "./campaignTypes.js";

function localize(key: string): string {
   return game.i18n.localize(key);
}

function esc(text: string): string {
   return foundry.utils.escapeHTML(text);
}

/**
 * Build HTML summary of campaign state for the journal Summary page.
 */
export function renderCampaignSummaryHtml(
   data: CampaignData,
   sheets: { name: string; sheetTypeLabel: string }[]
): string {
   const parts: string[] = [];

   parts.push(`<p class="hint">${localize("DMEMU.Campaign.Summary.AutoHint")}</p>`);
   parts.push(`<h2>${localize("DMEMU.Campaign.Summary.Overview")}</h2>`);

   const universe = (data.universe ?? "").trim();
   if (universe) {
      parts.push(`<p><strong>${localize("DMEMU.Campaign.App.Universe")}:</strong> ${esc(universe)}</p>`);
   } else {
      parts.push(`<p><em>${localize("DMEMU.Campaign.Summary.NoUniverse")}</em></p>`);
   }

   const protagonists = (data.protagonists ?? "").trim();
   if (protagonists) {
      parts.push(`<p><strong>${localize("DMEMU.Campaign.App.Protagonists")}:</strong> ${esc(protagonists)}</p>`);
   } else {
      parts.push(`<p><em>${localize("DMEMU.Campaign.Summary.NoProtagonists")}</em></p>`);
   }

   parts.push(`<h2>${localize("DMEMU.Campaign.Summary.Sheets")}</h2>`);
   if (!sheets.length) {
      parts.push(`<p><em>${localize("DMEMU.Campaign.Summary.NoSheets")}</em></p>`);
   } else {
      parts.push("<ul>");
      for (const s of sheets) {
         parts.push(`<li>${esc(s.name)} <span class="hint">(${esc(s.sheetTypeLabel)})</span></li>`);
      }
      parts.push("</ul>");
   }

   return parts.join("\n");
}
