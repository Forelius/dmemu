import { MODULE_ID } from "../constants.js";
import { applyOracleChatVisibility } from "../oracle/oracleChat.js";
import { PlotPromptStash } from "../plot/PlotPromptStash.js";
import { GENERATOR_GROUPS, GeneratorComboDef, findGeneratorTable } from "./generatorTables.js";

export interface GeneratorPartResult {
   id: string;
   label: string;
   tableName: string;
   roll: number;
   text: string;
}

export interface GeneratorComboResult {
   id: string;
   label: string;
   parts: GeneratorPartResult[];
}

function localize(key: string): string {
   return game.i18n.localize(key);
}

function getRollTablesPack(): {
   getDocuments: () => Promise<unknown>;
   contents: { name: string }[];
} | null {
   return game.packs.get(`${MODULE_ID}.rollTables`) ?? null;
}

type DrawCapable = {
   name: string;
   draw: (opts: { displayChat: boolean }) => Promise<{
      results: { text?: string; name?: string }[];
      roll?: { total: number };
   }>;
};

async function findDrawCapable(tableName: string): Promise<DrawCapable | null> {
   const pack = getRollTablesPack();
   if (!pack) {
      return null;
   }
   await pack.getDocuments();
   const found = pack.contents.find((t: { name: string }) => t.name === tableName);
   return (found as unknown as DrawCapable | undefined) ?? null;
}

async function drawTableSilent(tableName: string): Promise<{ roll: number; text: string }> {
   const table = await findDrawCapable(tableName);
   if (!table) {
      const pack = getRollTablesPack();
      throw new Error(localize(pack ? "DMEMU.Generators.TableMissing" : "DMEMU.Generators.PackMissing"));
   }
   const draw = await table.draw({ displayChat: false });
   const row = draw.results?.[0];
   const text = (row?.text || row?.name || "").trim();
   const roll = Number(draw.roll?.total ?? 0);
   return { roll, text };
}

/**
 * Prompt-only generators: single draws or combined multi-table prompts to chat.
 */
export class GeneratorService {
   static findCombo(comboId: string): GeneratorComboDef | undefined {
      for (const group of GENERATOR_GROUPS) {
         const hit = group.combos?.find((c) => c.id === comboId);
         if (hit) return hit;
      }
      return undefined;
   }

   static async rollCombo(comboId: string): Promise<GeneratorComboResult> {
      const combo = this.findCombo(comboId);
      if (!combo) {
         throw new Error(localize("DMEMU.Generators.TableMissing"));
      }
      const parts: GeneratorPartResult[] = [];
      for (const tableId of combo.tableIds) {
         const def = findGeneratorTable(tableId);
         if (!def) {
            throw new Error(localize("DMEMU.Generators.TableMissing"));
         }
         const { roll, text } = await drawTableSilent(def.tableName);
         parts.push({
            id: def.id,
            label: localize(`DMEMU.Generators.Table.${def.i18nKey}`),
            tableName: def.tableName,
            roll,
            text,
         });
      }
      return {
         id: combo.id,
         label: localize(`DMEMU.Generators.Combo.${combo.i18nKey}`),
         parts,
      };
   }

   static async postComboToChat(result: GeneratorComboResult): Promise<void> {
      const esc = foundry.utils.escapeHTML.bind(foundry.utils);
      const rows = result.parts
         .map(
            (p) =>
               `<p class="dmemu-gen-part"><strong>${esc(p.label)}</strong> (${p.roll}): ${esc(p.text)}</p>`
         )
         .join("");
      const content = `
         <div class="dmemu-oracle-chat">
            <p class="dmemu-oracle-answer"><strong>${esc(result.label)}</strong></p>
            <p class="hint">${localize("DMEMU.Generators.ChatHint")}</p>
            ${rows}
         </div>
      `.trim();
      const data: Record<string, unknown> = {
         content,
         speaker: ChatMessage.getSpeaker(),
         flavor: localize("DMEMU.Generators.ChatFlavor"),
         flags: {
            [MODULE_ID]: {
               type: "generatorCombo",
               comboId: result.id,
               parts: result.parts.map((p) => ({ id: p.id, roll: p.roll, text: p.text })),
            },
         },
      };
      applyOracleChatVisibility(data);
      await ChatMessage.create(data);
      const stashText = result.parts.map((p) => p.text).filter(Boolean).join(" · ");
      if (stashText) PlotPromptStash.set(stashText);
   }

   static async rollComboAndPost(comboId: string): Promise<GeneratorComboResult> {
      const result = await this.rollCombo(comboId);
      await this.postComboToChat(result);
      return result;
   }

   static async drawSingle(tableName: string): Promise<void> {
      if (!getRollTablesPack()) {
         ui.notifications.warn(localize("DMEMU.Generators.PackMissing"));
         return;
      }
      const table = await findDrawCapable(tableName);
      if (!table) {
         ui.notifications.warn(localize("DMEMU.Generators.TableMissing"));
         return;
      }
      const draw = await table.draw({ displayChat: true });
      const row = draw.results?.[0];
      const text = (row?.text || row?.name || "").trim();
      if (text) PlotPromptStash.set(text);
   }
}
