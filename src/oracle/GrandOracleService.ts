import { MODULE_ID } from "../constants.js";
import { applyOracleChatVisibility } from "./oracleChat.js";
import { GRAND_ORACLE_PARTS, GrandOraclePartDef } from "./grandOracleTables.js";

export interface GrandOraclePartResult {
   id: GrandOraclePartDef["id"];
   label: string;
   tableName: string;
   roll: number;
   text: string;
}

export interface GrandOracleResult {
   parts: GrandOraclePartResult[];
}

function localize(key: string): string {
   return game.i18n.localize(key);
}

function getRollTablesPack(): { getDocuments: () => Promise<unknown>; contents: { name: string }[] } | null {
   return game.packs.get(`${MODULE_ID}.rollTables`) ?? null;
}

/**
 * GUM Grand Oracle: roll Action + Adjective + Subject and interpret as one prompt.
 */
export class GrandOracleService {
   static async rollCombined(): Promise<GrandOracleResult> {
      const pack = getRollTablesPack();
      if (!pack) {
         throw new Error(localize("DMEMU.Oracle.Enrichment.PackMissing"));
      }
      await pack.getDocuments();

      const parts: GrandOraclePartResult[] = [];
      for (const def of GRAND_ORACLE_PARTS) {
         const found = pack.contents.find((t: { name: string }) => t.name === def.tableName);
         const table = found as unknown as
            | {
                 name: string;
                 draw: (opts: { displayChat: boolean }) => Promise<{
                    results: { text?: string; name?: string }[];
                    roll?: { total: number };
                 }>;
              }
            | undefined;
         if (!table) {
            throw new Error(localize("DMEMU.Oracle.Enrichment.TableMissing"));
         }
         const draw = await table.draw({ displayChat: false });
         const row = draw.results?.[0];
         const text = (row?.text || row?.name || "").trim();
         const roll = Number(draw.roll?.total ?? 0);
         parts.push({
            id: def.id,
            label: localize(`DMEMU.Oracle.Grand.${def.i18nKey}`),
            tableName: def.tableName,
            roll,
            text,
         });
      }
      return { parts };
   }

   static async postToChat(result: GrandOracleResult): Promise<void> {
      const content = this.#formatChatHtml(result);
      const data: Record<string, unknown> = {
         content,
         speaker: ChatMessage.getSpeaker(),
         flavor: localize("DMEMU.Oracle.Grand.ChatFlavor"),
         flags: {
            [MODULE_ID]: {
               type: "grandOracle",
               parts: result.parts.map((p) => ({ id: p.id, roll: p.roll, text: p.text })),
            },
         },
      };
      applyOracleChatVisibility(data);
      await ChatMessage.create(data);
   }

   static async rollAndPost(): Promise<GrandOracleResult> {
      const result = await this.rollCombined();
      await this.postToChat(result);
      return result;
   }

   static #formatChatHtml(result: GrandOracleResult): string {
      const esc = foundry.utils.escapeHTML.bind(foundry.utils);
      const rows = result.parts
         .map(
            (p) =>
               `<p class="dmemu-oracle-grand-part"><strong>${esc(p.label)}</strong> (d100=${p.roll}): ${esc(p.text)}</p>`
         )
         .join("");
      return `
         <div class="dmemu-oracle-chat">
            <p class="dmemu-oracle-answer"><strong>${localize("DMEMU.Oracle.Grand.Prompt")}</strong></p>
            ${rows}
            <p class="hint">${localize("DMEMU.Oracle.Grand.ChatHint")}</p>
         </div>
      `.trim();
   }
}
