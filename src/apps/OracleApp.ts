import { MODULE_ID } from "../constants.js";
import { LIKELIHOODS, PERSPECTIVES, Likelihood, YesNoPerspective } from "../oracle/data/yesNoMatrices.js";
import { ENRICHMENT_GROUPS } from "../oracle/enrichmentTables.js";
import { YesNoOracleService, YesNoRollResult } from "../oracle/YesNoOracleService.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

type OracleTabId = "yesno" | "descriptive" | "story" | "quantifier";

interface EnrichmentTableView {
   id: string;
   label: string;
   hint: string;
   tableName: string;
}

interface EnrichmentGroupView {
   id: string;
   label: string;
   hint: string;
   tables: EnrichmentTableView[];
}

interface OracleAppContext {
   about: string;
   tabs: { id: OracleTabId; label: string; active: boolean }[];
   isYesNoTab: boolean;
   perspectives: { id: YesNoPerspective; label: string; hint: string; selected: boolean }[];
   likelihoods: { id: Likelihood; label: string; selected: boolean }[];
   perspectiveHint: string;
   question: string;
   biasResults: YesNoRollResult[] | null;
   activeGroup: EnrichmentGroupView | null;
}

/**
 * DMEmu Yes/No (and enrichment) oracle window.
 */
export class OracleApp extends HandlebarsApplicationMixin(ApplicationV2) {
   perspective: YesNoPerspective = "deterministic";
   likelihood: Likelihood = "neutral";
   question = "";
   biasResults: YesNoRollResult[] | null = null;
   activeTab: OracleTabId = "yesno";

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
         width: 520,
         height: "auto" as const,
      },
      form: {
         submitOnChange: false,
         closeOnSubmit: false,
      },
      actions: {
         setTab: OracleApp.onSetTab,
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
      const tabDefs: { id: OracleTabId; labelKey: string }[] = [
         { id: "yesno", labelKey: "DMEMU.Oracle.App.TabYesNo" },
         { id: "descriptive", labelKey: "DMEMU.Oracle.App.TabDescriptive" },
         { id: "story", labelKey: "DMEMU.Oracle.App.TabStory" },
         { id: "quantifier", labelKey: "DMEMU.Oracle.App.TabQuantifier" },
      ];

      const activeGroupDef = ENRICHMENT_GROUPS.find((g) => g.id === this.activeTab) ?? null;
      const activeGroup: EnrichmentGroupView | null = activeGroupDef
         ? {
              id: activeGroupDef.id,
              label: game.i18n.localize(`DMEMU.Oracle.Enrichment.Group.${activeGroupDef.i18nKey}`),
              hint: game.i18n.localize(`DMEMU.Oracle.Enrichment.Group.${activeGroupDef.i18nKey}Hint`),
              tables: activeGroupDef.tables.map((t) => ({
                 id: t.id,
                 label: game.i18n.localize(`DMEMU.Oracle.Enrichment.${t.i18nKey}`),
                 hint: game.i18n.localize(`DMEMU.Oracle.Enrichment.${t.i18nKey}Hint`),
                 tableName: t.tableName,
              })),
           }
         : null;

      return {
         about: game.i18n.localize("DMEMU.Oracle.About"),
         tabs: tabDefs.map((t) => ({
            id: t.id,
            label: game.i18n.localize(t.labelKey),
            active: t.id === this.activeTab,
         })),
         isYesNoTab: this.activeTab === "yesno",
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
         biasResults: this.activeTab === "yesno" ? this.biasResults : null,
         activeGroup,
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

   static async onSetTab(this: OracleApp, _event: Event, target: HTMLElement): Promise<void> {
      const tab = target.dataset.tab as OracleTabId | undefined;
      if (!tab || tab === this.activeTab) return;
      if (this.activeTab === "yesno") {
         this.readForm();
      }
      this.activeTab = tab;
      this.render();
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
