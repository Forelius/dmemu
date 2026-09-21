import { MODULE_ID } from "../constants.js";
import { LIKELIHOODS, PERSPECTIVES, Likelihood, YesNoPerspective } from "../oracle/data/yesNoMatrices.js";
import { YesNoOracleService, YesNoRollResult } from "../oracle/YesNoOracleService.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface OracleAppContext {
   perspectives: { id: YesNoPerspective; label: string; hint: string; selected: boolean }[];
   likelihoods: { id: Likelihood; label: string; selected: boolean }[];
   perspectiveHint: string;
   question: string;
   biasResults: YesNoRollResult[] | null;
   enrichment: { id: string; label: string; hint: string; tableName: string }[];
   about: string;
}

/**
 * DMEmu Yes/No (and enrichment) oracle window.
 */
export class OracleApp extends HandlebarsApplicationMixin(ApplicationV2) {
   perspective: YesNoPerspective = "deterministic";
   likelihood: Likelihood = "neutral";
   question = "";
   biasResults: YesNoRollResult[] | null = null;

   static DEFAULT_OPTIONS = {
      id: "dmemu-oracle",
      classes: ["dmemu", "dmemu-oracle"],
      tag: "form",
      window: {
         resizable: true,
         minimizable: true,
         contentClasses: ["standard-form", "dmemu-oracle-body"],
      },
      position: {
         width: 480,
         height: "auto" as const,
      },
      form: {
         submitOnChange: false,
         closeOnSubmit: false,
      },
      actions: {
         roll: OracleApp.onRoll,
         rollBias: OracleApp.onRollBias,
         pickBias: OracleApp.onPickBias,
         drawEnrichment: OracleApp.onDrawEnrichment,
      },
   };

   static PARTS = {
      main: {
         template: `modules/${MODULE_ID}/templates/apps/oracle.hbs`,
      },
   };

   get title(): string {
      return game.i18n.localize("DMEMU.Oracle.App.Title");
   }

   async _prepareContext(_options: unknown): Promise<OracleAppContext> {
      return {
         perspectives: PERSPECTIVES.map((id) => ({
            id,
            label: game.i18n.localize(`DMEMU.Oracle.Perspective.${id}`),
            hint: game.i18n.localize(`DMEMU.Oracle.PerspectiveHint.${id}`),
            selected: id === this.perspective,
         })),
         likelihoods: LIKELIHOODS.map((id) => ({
            id,
            label: game.i18n.localize(`DMEMU.Oracle.Likelihood.${id}`),
            selected: id === this.likelihood,
         })),
         perspectiveHint: game.i18n.localize(`DMEMU.Oracle.PerspectiveHint.${this.perspective}`),
         question: this.question,
         biasResults: this.biasResults,
         enrichment: [
            {
               id: "notice",
               label: game.i18n.localize("DMEMU.Oracle.Enrichment.Notice"),
               hint: game.i18n.localize("DMEMU.Oracle.Enrichment.NoticeHint"),
               tableName: "Oracle — Notice (perceive)",
            },
            {
               id: "focus",
               label: game.i18n.localize("DMEMU.Oracle.Enrichment.Focus"),
               hint: game.i18n.localize("DMEMU.Oracle.Enrichment.FocusHint"),
               tableName: "Oracle — Focus (what)",
            },
         ],
         about: game.i18n.localize("DMEMU.Oracle.About"),
      };
   }

   _onRender(_context: unknown, _options: unknown): void {
      const root = this.element as HTMLElement | undefined;
      if (!root) return;
      root.querySelector<HTMLSelectElement>('[name="perspective"]')?.addEventListener("change", (ev) => {
         const value = (ev.target as HTMLSelectElement).value;
         if (YesNoOracleService.isPerspective(value)) {
            this.perspective = value;
            this.render();
         }
      });
      root.querySelector<HTMLSelectElement>('[name="likelihood"]')?.addEventListener("change", (ev) => {
         const value = (ev.target as HTMLSelectElement).value;
         if (YesNoOracleService.isLikelihood(value)) {
            this.likelihood = value;
         }
      });
      root.querySelector<HTMLTextAreaElement>('[name="question"]')?.addEventListener("change", (ev) => {
         this.question = (ev.target as HTMLTextAreaElement).value;
      });
   }

   readForm(): void {
      const root = this.element as HTMLElement | undefined;
      if (!root) return;
      const perspective = root.querySelector<HTMLSelectElement>('[name="perspective"]')?.value;
      const likelihood = root.querySelector<HTMLSelectElement>('[name="likelihood"]')?.value;
      const question = root.querySelector<HTMLTextAreaElement>('[name="question"]')?.value ?? "";
      if (perspective && YesNoOracleService.isPerspective(perspective)) {
         this.perspective = perspective;
      }
      if (likelihood && YesNoOracleService.isLikelihood(likelihood)) {
         this.likelihood = likelihood;
      }
      this.question = question;
   }

   static async onRoll(this: OracleApp, _event: Event, _target: HTMLElement): Promise<void> {
      this.readForm();
      this.biasResults = null;
      const result = await YesNoOracleService.roll({
         perspective: this.perspective,
         likelihood: this.likelihood,
         question: this.question,
      });
      await YesNoOracleService.postToChat(result);
      this.render();
   }

   static async onRollBias(this: OracleApp, _event: Event, _target: HTMLElement): Promise<void> {
      this.readForm();
      this.biasResults = [...(await YesNoOracleService.rollTwice({
         perspective: this.perspective,
         likelihood: this.likelihood,
         question: this.question,
      }))];
      this.render();
   }

   static async onPickBias(this: OracleApp, _event: Event, target: HTMLElement): Promise<void> {
      const index = Number(target.dataset.index ?? "-1");
      if (!this.biasResults || index < 0 || index >= this.biasResults.length) return;
      const result = this.biasResults[index];
      this.biasResults = null;
      await YesNoOracleService.postToChat(result);
      this.render();
   }

   static async onDrawEnrichment(this: OracleApp, _event: Event, target: HTMLElement): Promise<void> {
      const tableName = target.dataset.tableName;
      if (!tableName) return;
      const pack = game.packs.get(`${MODULE_ID}.rollTables`);
      if (!pack) {
         ui.notifications.warn(game.i18n.localize("DMEMU.Oracle.Enrichment.PackMissing"));
         return;
      }
      await pack.getDocuments();
      const table = pack.contents.find((t: { name: string }) => t.name === tableName);
      if (!table) {
         ui.notifications.warn(game.i18n.localize("DMEMU.Oracle.Enrichment.TableMissing"));
         return;
      }
      await table.draw({ displayChat: true });
   }
}
