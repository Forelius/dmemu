import { MODULE_ID } from "../constants.js";
import { applyOracleChatVisibility } from "../oracle/oracleChat.js";
import { PLOT_BEAT_TABLES } from "./presets.js";
import { PlotPromptStash } from "./PlotPromptStash.js";
import { PlotNodeCategoryId, PlotSheetData } from "./types.js";

export type BeatInvoke =
   | { kind: "none" }
   | { kind: "draw"; table: keyof typeof PLOT_BEAT_TABLES }
   | { kind: "node"; categoryId: PlotNodeCategoryId };

export interface PlotBeatDrawResult {
   label: string;
   tableName: string;
   roll: number;
   text: string;
   invoke: BeatInvoke;
   /** Follow-up draw when invoke is draw:* */
   followUp?: { label: string; tableName: string; roll: number; text: string };
   /** Resolved node text when invoke is node:* */
   node?: { categoryId: PlotNodeCategoryId; categoryLabel: string; slotIndex: number; text: string };
}

function localize(key: string): string {
   return game.i18n.localize(key);
}

type DrawCapable = {
   name: string;
   draw: (opts: { displayChat: boolean }) => Promise<{
      results: { text?: string; name?: string; flags?: Record<string, unknown> }[];
      roll?: { total: number };
   }>;
};

function getRollTablesPack(): {
   getDocuments: () => Promise<unknown>;
   contents: { name: string }[];
} | null {
   return game.packs.get(`${MODULE_ID}.rollTables`) ?? null;
}

async function findTable(tableName: string): Promise<DrawCapable | null> {
   const pack = getRollTablesPack();
   if (!pack) return null;
   await pack.getDocuments();
   const found = pack.contents.find((t: { name: string }) => t.name === tableName);
   return (found as unknown as DrawCapable | undefined) ?? null;
}

function parseInvoke(flags: Record<string, unknown> | undefined): BeatInvoke {
   const dmemu = flags?.[MODULE_ID] as { invoke?: string } | undefined;
   const raw = dmemu?.invoke;
   if (!raw) return { kind: "none" };
   if (raw.startsWith("draw:")) {
      const key = raw.slice(5) as keyof typeof PLOT_BEAT_TABLES;
      if (key in PLOT_BEAT_TABLES) return { kind: "draw", table: key };
   }
   if (raw.startsWith("node:")) {
      return { kind: "node", categoryId: raw.slice(5) as PlotNodeCategoryId };
   }
   return { kind: "none" };
}

async function drawNamed(tableName: string): Promise<{ roll: number; text: string; invoke: BeatInvoke }> {
   const table = await findTable(tableName);
   if (!table) {
      throw new Error(localize("DMEMU.Plot.TableMissing"));
   }
   const draw = await table.draw({ displayChat: false });
   const row = draw.results?.[0];
   const text = (row?.text || row?.name || "").trim();
   const roll = Number(draw.roll?.total ?? 0);
   const invoke = parseInvoke(row?.flags as Record<string, unknown> | undefined);
   return { roll, text, invoke };
}

const ABCD_KEYS: (keyof typeof PLOT_BEAT_TABLES)[] = [
   "complication",
   "catalyst",
   "challenge",
   "situation",
];

function abcdLabel(key: keyof typeof PLOT_BEAT_TABLES): string {
   const map: Record<string, string> = {
      complication: "DMEMU.Plot.Beat.Complication",
      catalyst: "DMEMU.Plot.Beat.Catalyst",
      challenge: "DMEMU.Plot.Beat.Challenge",
      situation: "DMEMU.Plot.Beat.Situation",
      modifiedProposal: "DMEMU.Plot.Beat.ModifiedProposal",
   };
   return localize(map[key] ?? key);
}

function pickNodeSlot(
   sheet: PlotSheetData,
   categoryId: PlotNodeCategoryId
): { slotIndex: number; text: string; categoryLabel: string } | null {
   const cat = sheet.nodeCategories.find((c) => c.id === categoryId);
   if (!cat) return null;
   const filled = cat.slots
      .map((s, i) => ({ i, text: s.text.trim() }))
      .filter((s) => s.text.length > 0);
   if (!filled.length) {
      return {
         slotIndex: -1,
         text: "",
         categoryLabel: localize(`DMEMU.Plot.NodeCategory.${cat.i18nKey}`),
      };
   }
   const pick = filled[Math.floor(Math.random() * filled.length)];
   return {
      slotIndex: pick.i,
      text: pick.text,
      categoryLabel: localize(`DMEMU.Plot.NodeCategory.${cat.i18nKey}`),
   };
}

/**
 * Plot beat draws (random prompt / modified proposal) with optional node resolution.
 */
export class PlotBeatService {
   /** Random prompt: pick ABCD column with 1d4, then draw that 1d10 table. */
   static async rollRandomPrompt(_sheet?: PlotSheetData | null): Promise<PlotBeatDrawResult> {
      if (!getRollTablesPack()) {
         throw new Error(localize("DMEMU.Plot.PackMissing"));
      }
      const colRoll = await new Roll("1d4").evaluate();
      const key = ABCD_KEYS[Number(colRoll.total) - 1];
      const tableName = PLOT_BEAT_TABLES[key];
      const { roll, text } = await drawNamed(tableName);
      return {
         label: `${localize("DMEMU.Plot.Beat.RandomPrompt")} — ${abcdLabel(key)}`,
         tableName,
         roll,
         text,
         invoke: { kind: "none" },
      };
   }

   static async rollModifiedProposal(sheet?: PlotSheetData | null): Promise<PlotBeatDrawResult> {
      if (!getRollTablesPack()) {
         throw new Error(localize("DMEMU.Plot.PackMissing"));
      }
      const tableName = PLOT_BEAT_TABLES.modifiedProposal;
      const primary = await drawNamed(tableName);
      const result: PlotBeatDrawResult = {
         label: localize("DMEMU.Plot.Beat.ModifiedProposal"),
         tableName,
         roll: primary.roll,
         text: primary.text,
         invoke: primary.invoke,
      };

      if (primary.invoke.kind === "draw") {
         const followName = PLOT_BEAT_TABLES[primary.invoke.table];
         const follow = await drawNamed(followName);
         result.followUp = {
            label: abcdLabel(primary.invoke.table),
            tableName: followName,
            roll: follow.roll,
            text: follow.text,
         };
      } else if (primary.invoke.kind === "node" && sheet) {
         const node = pickNodeSlot(sheet, primary.invoke.categoryId);
         if (node) {
            result.node = {
               categoryId: primary.invoke.categoryId,
               categoryLabel: node.categoryLabel,
               slotIndex: node.slotIndex,
               text: node.text,
            };
         }
      }
      return result;
   }

   static async postToChat(result: PlotBeatDrawResult): Promise<void> {
      const esc = foundry.utils.escapeHTML.bind(foundry.utils);
      const parts: string[] = [
         `<p class="dmemu-oracle-answer"><strong>${esc(result.label)}</strong></p>`,
         `<p class="dmemu-gen-part">${esc(result.text)} <span class="dmemu-oracle-meta">(${result.roll})</span></p>`,
      ];
      if (result.followUp) {
         parts.push(
            `<p class="dmemu-gen-part"><strong>${esc(result.followUp.label)}</strong> (${result.followUp.roll}): ${esc(result.followUp.text)}</p>`
         );
      }
      if (result.node) {
         if (result.node.text) {
            parts.push(
               `<p class="dmemu-gen-part"><strong>${esc(result.node.categoryLabel)}</strong>: ${esc(result.node.text)}</p>`
            );
         } else {
            parts.push(
               `<p class="hint">${localize("DMEMU.Plot.Beat.NodeEmpty").replace(
                  "{category}",
                  result.node.categoryLabel
               )}</p>`
            );
         }
      }
      parts.push(`<p class="hint">${localize("DMEMU.Plot.Beat.ChatHint")}</p>`);
      const data: Record<string, unknown> = {
         content: `<div class="dmemu-oracle-chat">${parts.join("")}</div>`,
         speaker: ChatMessage.getSpeaker(),
         flavor: localize("DMEMU.Plot.Beat.ChatFlavor"),
         flags: { [MODULE_ID]: { type: "plotBeat", text: result.text, roll: result.roll } },
      };
      applyOracleChatVisibility(data);
      await ChatMessage.create(data);
      PlotPromptStash.set(result.followUp?.text || result.text);
   }
}
