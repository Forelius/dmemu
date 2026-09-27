import { MODULE_ID } from "../constants.js";
import { GENERATOR_GROUPS } from "../generators/generatorTables.js";
import { GeneratorService } from "../generators/GeneratorService.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

type GeneratorTabId = "seed" | "world" | "characters";

interface TableView {
   id: string;
   label: string;
   hint: string;
   tableName: string;
}

interface ComboView {
   id: string;
   label: string;
   hint: string;
}

interface GroupView {
   id: string;
   label: string;
   hint: string;
   combos: ComboView[];
   tables: TableView[];
}

interface GeneratorsAppContext {
   about: string;
   tabs: { id: GeneratorTabId; label: string; active: boolean }[];
   activeGroup: GroupView | null;
}

/**
 * Prompt-only generators window (seed / world / characters).
 */
export class GeneratorsApp extends HandlebarsApplicationMixin(ApplicationV2) {
   activeTab: GeneratorTabId = "seed";

   static DEFAULT_OPTIONS = {
      id: "dmemu-generators",
      classes: ["dmemu", "dmemu-generators"],
      tag: "form",
      window: {
         resizable: true,
         minimizable: true,
         contentClasses: ["standard-form", "dmemu-oracle-body"],
      },
      position: {
         width: 560,
         height: "auto" as const,
      },
      form: {
         submitOnChange: false,
         closeOnSubmit: false,
      },
      actions: {
         setTab: GeneratorsApp.onSetTab,
         drawTable: GeneratorsApp.onDrawTable,
         rollCombo: GeneratorsApp.onRollCombo,
      },
   };

   static PARTS = {
      main: {
         template: `modules/${MODULE_ID}/templates/apps/generators.hbs`,
      },
   };

   get title(): string {
      return game.i18n.localize("DMEMU.Generators.App.Title");
   }

   async _prepareContext(_options: unknown): Promise<GeneratorsAppContext> {
      const tabDefs: { id: GeneratorTabId; labelKey: string }[] = [
         { id: "seed", labelKey: "DMEMU.Generators.App.TabSeed" },
         { id: "world", labelKey: "DMEMU.Generators.App.TabWorld" },
         { id: "characters", labelKey: "DMEMU.Generators.App.TabCharacters" },
      ];

      const groupDef = GENERATOR_GROUPS.find((g) => g.id === this.activeTab) ?? null;
      const activeGroup: GroupView | null = groupDef
         ? {
              id: groupDef.id,
              label: game.i18n.localize(`DMEMU.Generators.Group.${groupDef.i18nKey}`),
              hint: game.i18n.localize(`DMEMU.Generators.Group.${groupDef.i18nKey}Hint`),
              combos: (groupDef.combos ?? []).map((c) => ({
                 id: c.id,
                 label: game.i18n.localize(`DMEMU.Generators.Combo.${c.i18nKey}`),
                 hint: game.i18n.localize(`DMEMU.Generators.Combo.${c.i18nKey}Hint`),
              })),
              tables: groupDef.tables.map((t) => ({
                 id: t.id,
                 label: game.i18n.localize(`DMEMU.Generators.Table.${t.i18nKey}`),
                 hint: game.i18n.localize(`DMEMU.Generators.Table.${t.i18nKey}Hint`),
                 tableName: t.tableName,
              })),
           }
         : null;

      return {
         about: game.i18n.localize("DMEMU.Generators.About"),
         tabs: tabDefs.map((t) => ({
            id: t.id,
            label: game.i18n.localize(t.labelKey),
            active: t.id === this.activeTab,
         })),
         activeGroup,
      };
   }

   static async onSetTab(this: GeneratorsApp, _event: Event, target: HTMLElement): Promise<void> {
      const tab = target.dataset.tab as GeneratorTabId | undefined;
      if (!tab || tab === this.activeTab) return;
      this.activeTab = tab;
      this.render();
   }

   static async onDrawTable(this: GeneratorsApp, _event: Event, target: HTMLElement): Promise<void> {
      const tableName = target.dataset.tableName;
      if (!tableName) return;
      await GeneratorService.drawSingle(tableName);
   }

   static async onRollCombo(this: GeneratorsApp, _event: Event, target: HTMLElement): Promise<void> {
      const comboId = target.dataset.comboId;
      if (!comboId) return;
      try {
         await GeneratorService.rollComboAndPost(comboId);
      } catch (err) {
         const message = err instanceof Error ? err.message : String(err);
         ui.notifications.warn(message);
      }
   }
}
