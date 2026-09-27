import { MODULE_ID } from "../constants.js";
import { PlotBeatService } from "../plot/PlotBeatService.js";
import { PlotPromptStash } from "../plot/PlotPromptStash.js";
import { PLOT_SHEET_PRESETS, PLOT_SHEET_TYPE_IDS } from "../plot/presets.js";
import { PlotSheetService } from "../plot/PlotSheetService.js";
import { PlotNodeCategoryId, PlotSheetData, PlotSheetTypeId } from "../plot/types.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface TrackBoxView {
   index: number;
   checked: boolean;
   sectionLabel: string;
   isSectionStart: boolean;
}

interface NodeSlotView {
   categoryId: string;
   slotIndex: number;
   text: string;
   highlighted: boolean;
}

interface NodeCategoryView {
   id: string;
   label: string;
   slots: NodeSlotView[];
}

interface PlotSheetAppContext {
   about: string;
   hasSheet: boolean;
   sheetList: { id: string; name: string; selected: boolean }[];
   sheetTypes: { id: string; label: string; selected: boolean }[];
   createSheetTypes: { id: string; label: string; selected: boolean }[];
   name: string;
   scope: string;
   sheetTypeLabel: string;
   hasTrack: boolean;
   trackBoxes: TrackBoxView[];
   trackProgress: string;
   nodeCategories: NodeCategoryView[];
   stashPreview: string;
   hasStash: boolean;
}

/**
 * Persistent plot sheet: track, nodes, and beat draws.
 */
export class PlotSheetApp extends HandlebarsApplicationMixin(ApplicationV2) {
   journalId: string | null = null;
   draft: PlotSheetData | null = null;
   highlight: { categoryId: string; slotIndex: number } | null = null;
   newSheetType: PlotSheetTypeId = "standard";
   newSheetName = "";

   static DEFAULT_OPTIONS = {
      id: "dmemu-plot-sheet",
      classes: ["dmemu", "dmemu-plot-sheet"],
      tag: "form",
      window: {
         resizable: true,
         minimizable: true,
         contentClasses: ["standard-form", "dmemu-oracle-body"],
      },
      position: {
         width: 640,
         height: "auto" as const,
      },
      form: {
         submitOnChange: false,
         closeOnSubmit: false,
      },
      actions: {
         openSheet: PlotSheetApp.onOpenSheet,
         createSheet: PlotSheetApp.onCreateSheet,
         saveSheet: PlotSheetApp.onSaveSheet,
         changeType: PlotSheetApp.onChangeType,
         toggleBox: PlotSheetApp.onToggleBox,
         confirmAdvance: PlotSheetApp.onConfirmAdvance,
         randomPrompt: PlotSheetApp.onRandomPrompt,
         modifiedProposal: PlotSheetApp.onModifiedProposal,
         pasteStash: PlotSheetApp.onPasteStash,
         clearSlot: PlotSheetApp.onClearSlot,
      },
   };

   static PARTS = {
      main: {
         template: `modules/${MODULE_ID}/templates/apps/plot-sheet.hbs`,
      },
   };

   get title(): string {
      return game.i18n.localize("DMEMU.Plot.App.Title");
   }

   async _prepareContext(_options: unknown): Promise<PlotSheetAppContext> {
      this.#syncDraftFromJournal();
      const sheets = PlotSheetService.listSheets();
      const data = this.draft;
      const preset = data ? PLOT_SHEET_PRESETS[data.sheetType] : null;
      const stash = PlotPromptStash.get();

      const trackBoxes: TrackBoxView[] = [];
      if (data && preset?.hasTrack) {
         let offset = 0;
         for (let s = 0; s < data.track.sectionKeys.length; s++) {
            const size = data.track.sectionSizes[s] ?? 0;
            const sectionLabel = game.i18n.localize(`DMEMU.Plot.TrackSection.${data.track.sectionKeys[s]}`);
            for (let i = 0; i < size; i++) {
               const index = offset + i;
               trackBoxes.push({
                  index,
                  checked: index < data.track.checked,
                  sectionLabel,
                  isSectionStart: i === 0,
               });
            }
            offset += size;
         }
      }

      const nodeCategories: NodeCategoryView[] = (data?.nodeCategories ?? []).map((cat) => ({
         id: cat.id,
         label: game.i18n.localize(`DMEMU.Plot.NodeCategory.${cat.i18nKey}`),
         slots: cat.slots.map((slot, slotIndex) => ({
            categoryId: cat.id,
            slotIndex,
            text: slot.text,
            highlighted:
               !!this.highlight &&
               this.highlight.categoryId === cat.id &&
               this.highlight.slotIndex === slotIndex,
         })),
      }));

      const journal = this.journalId ? game.journal?.get(this.journalId) : null;

      return {
         about: game.i18n.localize("DMEMU.Plot.About"),
         hasSheet: !!data,
         sheetList: sheets.map((s) => ({
            id: s.id,
            name: s.name,
            selected: s.id === this.journalId,
         })),
         sheetTypes: PLOT_SHEET_TYPE_IDS.map((id) => ({
            id,
            label: game.i18n.localize(`DMEMU.Plot.SheetType.${PLOT_SHEET_PRESETS[id].i18nKey}`),
            selected: id === (data?.sheetType ?? "standard"),
         })),
         createSheetTypes: PLOT_SHEET_TYPE_IDS.map((id) => ({
            id,
            label: game.i18n.localize(`DMEMU.Plot.SheetType.${PLOT_SHEET_PRESETS[id].i18nKey}`),
            selected: id === this.newSheetType,
         })),
         name: journal?.name ?? this.newSheetName,
         scope: data?.scope ?? "",
         sheetTypeLabel: preset
            ? game.i18n.localize(`DMEMU.Plot.SheetType.${preset.i18nKey}`)
            : "",
         hasTrack: !!preset?.hasTrack,
         trackBoxes,
         trackProgress: data
            ? game.i18n
                 .localize("DMEMU.Plot.TrackProgress")
                 .replace("{checked}", String(data.track.checked))
                 .replace("{boxes}", String(data.track.boxes))
            : "",
         nodeCategories,
         stashPreview: stash ? stash.slice(0, 120) : "",
         hasStash: !!stash,
      };
   }

   _onRender(_context: unknown, _options: unknown): void {
      const root = this.element as HTMLElement | undefined;
      if (!root) return;
      root.querySelector<HTMLSelectElement>('[name="sheetSelect"]')?.addEventListener("change", (ev) => {
         const id = (ev.target as HTMLSelectElement).value;
         if (id) {
            this.journalId = id;
            this.draft = null;
            this.highlight = null;
            this.render();
         }
      });
      root.querySelector<HTMLSelectElement>('[name="newSheetType"]')?.addEventListener("change", (ev) => {
         this.newSheetType = (ev.target as HTMLSelectElement).value as PlotSheetTypeId;
      });
      root.querySelector<HTMLInputElement>('[name="newSheetName"]')?.addEventListener("change", (ev) => {
         this.newSheetName = (ev.target as HTMLInputElement).value;
      });
   }

   #syncDraftFromJournal(): void {
      if (!this.journalId) {
         this.draft = null;
         return;
      }
      if (this.draft) return;
      const loaded = PlotSheetService.getSheet(this.journalId);
      this.draft = loaded ? foundry.utils.deepClone(loaded.data) : null;
   }

   #readFormIntoDraft(): void {
      const root = this.element as HTMLElement | undefined;
      if (!root || !this.draft) return;
      const scope = root.querySelector<HTMLTextAreaElement>('[name="scope"]')?.value ?? "";
      this.draft.scope = scope;
      for (const cat of this.draft.nodeCategories) {
         for (let i = 0; i < cat.slots.length; i++) {
            const el = root.querySelector<HTMLInputElement>(
               `[name="node-${cat.id}-${i}"]`
            );
            if (el) cat.slots[i].text = el.value;
         }
      }
   }

   static async onOpenSheet(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      const root = this.element as HTMLElement | undefined;
      const id = root?.querySelector<HTMLSelectElement>('[name="sheetSelect"]')?.value;
      if (!id) return;
      this.journalId = id;
      this.draft = null;
      this.highlight = null;
      this.render();
   }

   static async onCreateSheet(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      const root = this.element as HTMLElement | undefined;
      const name =
         root?.querySelector<HTMLInputElement>('[name="newSheetName"]')?.value?.trim() ||
         game.i18n.localize("DMEMU.Plot.DefaultName");
      const type =
         (root?.querySelector<HTMLSelectElement>('[name="newSheetType"]')?.value as PlotSheetTypeId) ||
         "standard";
      try {
         const id = await PlotSheetService.createSheet(name, type);
         this.journalId = id;
         this.draft = null;
         this.highlight = null;
         this.render();
      } catch (err) {
         ui.notifications.warn(err instanceof Error ? err.message : String(err));
      }
   }

   static async onSaveSheet(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.journalId || !this.draft) return;
      this.#readFormIntoDraft();
      const root = this.element as HTMLElement | undefined;
      const name = root?.querySelector<HTMLInputElement>('[name="sheetName"]')?.value;
      if (name) await PlotSheetService.renameSheet(this.journalId, name);
      await PlotSheetService.saveSheet(this.journalId, this.draft);
      ui.notifications.info(game.i18n.localize("DMEMU.Plot.Saved"));
   }

   static async onChangeType(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDraft();
      const root = this.element as HTMLElement | undefined;
      const type = root?.querySelector<HTMLSelectElement>('[name="sheetType"]')?.value as PlotSheetTypeId;
      if (!type || type === this.draft.sheetType) return;
      this.draft = PlotSheetService.retypeSheet(this.draft, type);
      this.highlight = null;
      this.render();
   }

   static async onToggleBox(this: PlotSheetApp, _event: Event, target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDraft();
      const index = Number(target.dataset.index ?? "-1");
      if (index < 0) return;
      // Clicking box N means set checked to N+1 if unchecked, or N if checked (toggle end)
      const currentlyChecked = index < this.draft.track.checked;
      this.draft = PlotSheetService.setTrackChecked(
         this.draft,
         currentlyChecked ? index : index + 1
      );
      this.render();
   }

   static async onConfirmAdvance(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDraft();
      this.draft = PlotSheetService.advanceTrack(this.draft);
      if (this.journalId) await PlotSheetService.saveSheet(this.journalId, this.draft);
      this.render();
   }

   static async onRandomPrompt(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      this.#readFormIntoDraft();
      try {
         const result = await PlotBeatService.rollRandomPrompt(this.draft);
         PlotPromptStash.set(result.text);
         await PlotBeatService.postToChat(result);
      } catch (err) {
         ui.notifications.warn(err instanceof Error ? err.message : String(err));
      }
   }

   static async onModifiedProposal(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      this.#readFormIntoDraft();
      try {
         const result = await PlotBeatService.rollModifiedProposal(this.draft);
         PlotPromptStash.set(result.followUp?.text || result.text);
         if (result.node && result.node.slotIndex >= 0) {
            this.highlight = { categoryId: result.node.categoryId, slotIndex: result.node.slotIndex };
         }
         await PlotBeatService.postToChat(result);
         this.render();
      } catch (err) {
         ui.notifications.warn(err instanceof Error ? err.message : String(err));
      }
   }

   static async onPasteStash(this: PlotSheetApp, _event: Event, target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDraft();
      const text = PlotPromptStash.get();
      if (!text) {
         ui.notifications.warn(game.i18n.localize("DMEMU.Plot.StashEmpty"));
         return;
      }
      const categoryId = target.dataset.categoryId as PlotNodeCategoryId | undefined;
      const slotIndex = Number(target.dataset.slotIndex ?? "-1");
      const cat = this.draft.nodeCategories.find((c) => c.id === categoryId);
      if (!cat || slotIndex < 0 || slotIndex >= cat.slots.length) return;
      cat.slots[slotIndex].text = text;
      this.highlight = { categoryId: categoryId!, slotIndex };
      this.render();
   }

   static async onClearSlot(this: PlotSheetApp, _event: Event, target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDraft();
      const categoryId = target.dataset.categoryId as PlotNodeCategoryId | undefined;
      const slotIndex = Number(target.dataset.slotIndex ?? "-1");
      const cat = this.draft.nodeCategories.find((c) => c.id === categoryId);
      if (!cat || slotIndex < 0 || slotIndex >= cat.slots.length) return;
      cat.slots[slotIndex].text = "";
      this.render();
   }
}
