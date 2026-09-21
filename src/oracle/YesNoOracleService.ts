import { MODULE_ID } from "../constants.js";
import {
   Likelihood,
   LIKELIHOODS,
   PERSPECTIVES,
   resolveYesNoBand,
   YesNoPerspective,
} from "./data/yesNoMatrices.js";

export interface YesNoRollRequest {
   perspective: YesNoPerspective;
   likelihood: Likelihood;
   question?: string;
}

export interface YesNoRollResult {
   perspective: YesNoPerspective;
   likelihood: Likelihood;
   question: string;
   roll: number;
   answerKey: string;
   answer: string;
   perspectiveLabel: string;
   likelihoodLabel: string;
}

export type ChatVisibility = "self" | "gm" | "everyone";

function localize(key: string): string {
   return game.i18n.localize(key);
}

function answerI18nKey(answerSuffix: string): string {
   return `DMEMU.Oracle.Answer.${answerSuffix}`;
}

export class YesNoOracleService {
   static isPerspective(value: string): value is YesNoPerspective {
      return (PERSPECTIVES as string[]).includes(value);
   }

   static isLikelihood(value: string): value is Likelihood {
      return (LIKELIHOODS as string[]).includes(value);
   }

   /** Roll once against the granular Yes/No matrix. */
   static async roll(request: YesNoRollRequest): Promise<YesNoRollResult> {
      const roll = await new Roll("1d100").evaluate();
      const total = Number(roll.total);
      const band = resolveYesNoBand(request.perspective, request.likelihood, total);
      return this.#toResult(request, total, band.answer);
   }

   /** PUM bias rule: roll twice; caller presents both for the user to choose. */
   static async rollTwice(request: YesNoRollRequest): Promise<[YesNoRollResult, YesNoRollResult]> {
      const a = await this.roll(request);
      const b = await this.roll(request);
      return [a, b];
   }

   static async postToChat(result: YesNoRollResult): Promise<void> {
      const visibility = (game.settings.get(MODULE_ID, "oracleChatVisibility") as ChatVisibility) ?? "self";
      const content = this.#formatChatHtml(result);
      const speaker = ChatMessage.getSpeaker();
      const data: Record<string, unknown> = {
         content,
         speaker,
         flavor: localize("DMEMU.Oracle.Chat.Flavor"),
         flags: {
            [MODULE_ID]: {
               type: "yesNo",
               perspective: result.perspective,
               likelihood: result.likelihood,
               roll: result.roll,
               answerKey: result.answerKey,
            },
         },
      };

      if (visibility === "self") {
         data.whisper = [game.user.id];
      } else if (visibility === "gm") {
         const whispers = game.users.filter((u: { isGM: boolean }) => u.isGM).map((u: { id: string }) => u.id);
         if (!whispers.includes(game.user.id)) {
            whispers.push(game.user.id);
         }
         data.whisper = whispers;
      }

      await ChatMessage.create(data);
   }

   static #toResult(request: YesNoRollRequest, roll: number, answerSuffix: string): YesNoRollResult {
      return {
         perspective: request.perspective,
         likelihood: request.likelihood,
         question: (request.question ?? "").trim(),
         roll,
         answerKey: answerSuffix,
         answer: localize(answerI18nKey(answerSuffix)),
         perspectiveLabel: localize(`DMEMU.Oracle.Perspective.${request.perspective}`),
         likelihoodLabel: localize(`DMEMU.Oracle.Likelihood.${request.likelihood}`),
      };
   }

   static #formatChatHtml(result: YesNoRollResult): string {
      const esc = foundry.utils.escapeHTML.bind(foundry.utils);
      const q = result.question
         ? `<p class="dmemu-oracle-question"><strong>${localize("DMEMU.Oracle.Chat.Question")}</strong> ${esc(result.question)}</p>`
         : "";
      return `
         <div class="dmemu-oracle-chat">
            <p class="dmemu-oracle-meta">${esc(result.perspectiveLabel)} · ${esc(result.likelihoodLabel)} · d100=${result.roll}</p>
            ${q}
            <p class="dmemu-oracle-answer"><strong>${localize("DMEMU.Oracle.Chat.Answer")}</strong> ${esc(result.answer)}</p>
         </div>
      `.trim();
   }
}
