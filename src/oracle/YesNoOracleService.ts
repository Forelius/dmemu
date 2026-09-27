import { MODULE_ID } from "../constants.js";
import { applyOracleChatVisibility } from "./oracleChat.js";
import { PlotPromptStash } from "../plot/PlotPromptStash.js";
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
   answerDescription: string;
   perspectiveLabel: string;
   likelihoodLabel: string;
}

function localize(key: string): string {
   return game.i18n.localize(key);
}

function answerLabelKey(answerSuffix: string): string {
   return `DMEMU.Oracle.Answer.${answerSuffix}.label`;
}

function answerDescriptionKey(answerSuffix: string): string {
   return `DMEMU.Oracle.Answer.${answerSuffix}.description`;
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
      const content = this.#formatChatHtml(result);
      const data: Record<string, unknown> = {
         content,
         speaker: ChatMessage.getSpeaker(),
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
      applyOracleChatVisibility(data);
      await ChatMessage.create(data);
      if (result.answer) PlotPromptStash.set(result.answer);
   }

   static #toResult(request: YesNoRollRequest, roll: number, answerSuffix: string): YesNoRollResult {
      return {
         perspective: request.perspective,
         likelihood: request.likelihood,
         question: (request.question ?? "").trim(),
         roll,
         answerKey: answerSuffix,
         answer: localize(answerLabelKey(answerSuffix)),
         answerDescription: localize(answerDescriptionKey(answerSuffix)),
         perspectiveLabel: localize(`DMEMU.Oracle.Perspective.${request.perspective}`),
         likelihoodLabel: localize(`DMEMU.Oracle.Likelihood.${request.likelihood}`),
      };
   }

   static #formatChatHtml(result: YesNoRollResult): string {
      const esc = foundry.utils.escapeHTML.bind(foundry.utils);
      const q = result.question
         ? `<p class="dmemu-oracle-question"><strong>${localize("DMEMU.Oracle.Chat.Question")}</strong> ${esc(result.question)}</p>`
         : "";
      const desc = result.answerDescription
         ? `<p class="dmemu-oracle-answer-desc hint">${esc(result.answerDescription)}</p>`
         : "";
      return `
         <div class="dmemu-oracle-chat">
            <p class="dmemu-oracle-meta">${esc(result.perspectiveLabel)} · ${esc(result.likelihoodLabel)} · d100=${result.roll}</p>
            ${q}
            <p class="dmemu-oracle-answer"><strong>${localize("DMEMU.Oracle.Chat.Answer")}</strong> ${esc(result.answer)}</p>
            ${desc}
         </div>
      `.trim();
   }
}
