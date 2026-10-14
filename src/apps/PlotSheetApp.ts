import { MODULE_ID } from "../constants.js";
import { CampaignService } from "../plot/CampaignService.js";
import { CampaignData } from "../plot/campaignTypes.js";
import { PlotBeatService } from "../plot/PlotBeatService.js";
import { PlotPromptStash } from "../plot/PlotPromptStash.js";
import { PLOT_SHEET_PRESETS, PLOT_SHEET_TYPE_IDS } from "../plot/presets.js";
import { PlotSheetService } from "../plot/PlotSheetService.js";
import { PlotNodeCategoryId, PlotSheetData, PlotSheetTypeId } from "../plot/types.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

type PlotTabId = "campaign" | "sheet" | "play" | "nodes";

interface TrackBoxView {
   index: number;
   label: number;
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
   hasCampaign: boolean;
   hasSheet: boolean;
   tabs: { id: PlotTabId; label: string; active: boolean }[];
   isCampaignTab: boolean;
   isSheetTab: boolean;
   isPlayTab: boolean;
   isNodesTab: boolean;
   campaignList: { id: string; name: string; selected: boolean }[];
   campaignName: string;
   universe: string;
   protagonists: string;
   sheetList: { id: string; name: string; typeLabel: string; selected: boolean }[];
   sheetTypes: { id: string; label: string; selected: boolean }[];
   name: string;
   scope: string;
   mission: string;
   sheetTypeLabel: string;
   hasTrack: boolean;
   trackBoxes: TrackBoxView[];
   trackProgress: string;
   nodeCategories: NodeCategoryView[];
   stashPreview: string;
   hasStash: boolean;
}

/**
 * Campaign + plot sheet hub: prep, track, nodes, and beat draws.
 */
export class PlotSheetApp extends HandlebarsApplicationMixin(ApplicationV2) {
   campaignId: string | null = null;
   campaignDraft: CampaignData | null = null;
   journalId: string | null = null;
   draft: PlotSheetData | null = null;
   highlight: { categoryId: string; slotIndex: number } | null = null;
   activeTab: PlotTabId = "campaign";

   static DEFAULT_OPTIONS = {
      id: "dmemu-plot-sheet",
      classes: ["dmemu", "dmemu-plot-sheet"],
      tag: "form",
      window: {
         resizable: true,
         minimizable: true,
         contentClasses: ["standard-form", "dmemu-oracle-body", "dmemu-plot-window"],
      },
      position: {
         width: 720,
         height: 720,
      },
      form: {
         submitOnChange: false,
         closeOnSubmit: false,
      },
      actions: {
         setTab: PlotSheetApp.onSetTab,
         openCreateCampaignDialog: PlotSheetApp.onOpenCreateCampaignDialog,
         saveCampaign: PlotSheetApp.onSaveCampaign,
         openCreateDialog: PlotSheetApp.onOpenCreateDialog,
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
      await this.#ensureSheetCampaignLink();
      this.#syncCampaignDraft();
      this.#syncDraftFromJournal();
      this.#clampActiveTab();

      const campaigns = CampaignService.listCampaigns();
      const sheets = this.campaignId
         ? PlotSheetService.listSheetsForCampaign(this.campaignId)
         : [];
      const data = this.draft;
      const campaign = this.campaignDraft;
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
                  label: index + 1,
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

      const sheetJournal = this.journalId ? game.journal?.get(this.journalId) : null;
      const campaignJournal = this.campaignId ? game.journal?.get(this.campaignId) : null;

      const tabDefs: { id: PlotTabId; labelKey: string; requiresCampaign?: boolean; requiresSheet?: boolean }[] = [
         { id: "campaign", labelKey: "DMEMU.Plot.App.TabCampaign" },
         { id: "sheet", labelKey: "DMEMU.Plot.App.TabSheet", requiresCampaign: true },
         { id: "play", labelKey: "DMEMU.Plot.App.TabPlay", requiresSheet: true },
         { id: "nodes", labelKey: "DMEMU.Plot.App.TabNodes", requiresSheet: true },
      ];

      return {
         about: game.i18n.localize("DMEMU.Plot.About"),
         hasCampaign: !!campaign,
         hasSheet: !!data,
         tabs: tabDefs
            .filter((t) => {
               if (t.requiresSheet && !data) return false;
               if (t.requiresCampaign && !campaign) return false;
               return true;
            })
            .map((t) => ({
               id: t.id,
               label: game.i18n.localize(t.labelKey),
               active: t.id === this.activeTab,
            })),
         isCampaignTab: this.activeTab === "campaign",
         isSheetTab: this.activeTab === "sheet",
         isPlayTab: this.activeTab === "play",
         isNodesTab: this.activeTab === "nodes",
         campaignList: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            selected: c.id === this.campaignId,
         })),
         campaignName: campaignJournal?.name ?? "",
         universe: campaign?.universe ?? "",
         protagonists: campaign?.protagonists ?? "",
         sheetList: sheets.map((s) => ({
            id: s.id,
            name: s.name,
            typeLabel: game.i18n.localize(`DMEMU.Plot.SheetType.${PLOT_SHEET_PRESETS[s.sheetType].i18nKey}`),
            selected: s.id === this.journalId,
         })),
         sheetTypes: PLOT_SHEET_TYPE_IDS.map((id) => ({
            id,
            label: game.i18n.localize(`DMEMU.Plot.SheetType.${PLOT_SHEET_PRESETS[id].i18nKey}`),
            selected: id === (data?.sheetType ?? "standard"),
         })),
         name: sheetJournal?.name ?? "",
         scope: data?.scope ?? "",
         mission: data?.mission ?? "",
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

      root.querySelector<HTMLSelectElement>('[name="campaignSelect"]')?.addEventListener("change", (ev) => {
         const id = (ev.target as HTMLSelectElement).value;
         if (!id) return;
         this.#readFormIntoDrafts();
         this.campaignId = id;
         this.campaignDraft = null;
         this.#clearSheetIfNotInCampaign();
         this.render();
      });

      root.querySelector<HTMLSelectElement>('[name="sheetSelect"]')?.addEventListener("change", (ev) => {
         const id = (ev.target as HTMLSelectElement).value;
         if (!id) return;
         void this.#selectSheet(id);
      });
   }

   async #ensureSheetCampaignLink(): Promise<void> {
      if (!this.journalId) return;
      const data = await PlotSheetService.ensureCampaignLink(this.journalId);
      if (!data) {
         this.journalId = null;
         this.draft = null;
         return;
      }
      if (!this.campaignId) this.campaignId = data.campaignId;
      if (this.campaignId !== data.campaignId) {
         this.campaignId = data.campaignId;
         this.campaignDraft = null;
      }
   }

   #clampActiveTab(): void {
      if (!this.campaignDraft && this.activeTab !== "campaign") {
         this.activeTab = "campaign";
         return;
      }
      if (!this.draft && (this.activeTab === "play" || this.activeTab === "nodes")) {
         this.activeTab = this.campaignDraft ? "sheet" : "campaign";
      }
   }

   #clearSheetIfNotInCampaign(): void {
      if (!this.journalId || !this.campaignId) {
         if (!this.campaignId) {
            this.journalId = null;
            this.draft = null;
         }
         return;
      }
      const sheets = PlotSheetService.listSheetsForCampaign(this.campaignId);
      if (!sheets.some((s) => s.id === this.journalId)) {
         this.journalId = null;
         this.draft = null;
         this.highlight = null;
      }
   }

   #syncCampaignDraft(): void {
      if (!this.campaignId) {
         this.campaignDraft = null;
         return;
      }
      if (this.campaignDraft) return;
      const loaded = CampaignService.getCampaign(this.campaignId);
      this.campaignDraft = loaded ? foundry.utils.deepClone(loaded.data) : null;
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

   #readFormIntoDrafts(): void {
      const root = this.element as HTMLElement | undefined;
      if (!root) return;

      if (this.campaignDraft) {
         const universe = root.querySelector<HTMLTextAreaElement>('[name="universe"]')?.value;
         if (universe !== undefined) this.campaignDraft.universe = universe;
         const protagonists = root.querySelector<HTMLTextAreaElement>('[name="protagonists"]')?.value;
         if (protagonists !== undefined) this.campaignDraft.protagonists = protagonists;
      }

      if (!this.draft) return;
      const scope = root.querySelector<HTMLTextAreaElement>('[name="scope"]')?.value;
      if (scope !== undefined) this.draft.scope = scope;
      const mission = root.querySelector<HTMLTextAreaElement>('[name="mission"]')?.value;
      if (mission !== undefined) this.draft.mission = mission;
      for (const cat of this.draft.nodeCategories) {
         for (let i = 0; i < cat.slots.length; i++) {
            const el = root.querySelector<HTMLInputElement>(`[name="node-${cat.id}-${i}"]`);
            if (el) cat.slots[i].text = el.value;
         }
      }
   }

   async #selectSheet(id: string): Promise<void> {
      this.#readFormIntoDrafts();
      this.journalId = id;
      this.draft = null;
      this.highlight = null;
      await this.#ensureSheetCampaignLink();
      this.render();
   }

   static async onSetTab(this: PlotSheetApp, _event: Event, target: HTMLElement): Promise<void> {
      const tab = target.dataset.tab as PlotTabId | undefined;
      if (!tab || tab === this.activeTab) return;
      if (tab !== "campaign" && !this.campaignDraft) return;
      if ((tab === "play" || tab === "nodes") && !this.draft) return;
      this.#readFormIntoDrafts();
      this.activeTab = tab;
      this.render();
   }

   static async onOpenCreateCampaignDialog(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      const defaultName = game.i18n.localize("DMEMU.Campaign.DefaultName");
      const fd = await foundry.applications.api.DialogV2.input({
         window: { title: "DMEMU.Campaign.App.CreateDialogTitle" },
         classes: ["dmemu"],
         position: { width: 400 },
         content: `
            <div class="form-group">
               <label for="dmemu-campaign-create-name">${game.i18n.localize("DMEMU.Campaign.App.Name")}</label>
               <input id="dmemu-campaign-create-name" type="text" name="name" value="" placeholder="${defaultName}" autofocus />
            </div>
         `,
         ok: {
            label: "DMEMU.Campaign.App.Create",
            icon: "fas fa-plus",
         },
      });

      if (!fd) return;

      const name = String(fd.name ?? "").trim() || defaultName;
      try {
         this.#readFormIntoDrafts();
         const id = await CampaignService.createCampaign(name);
         this.campaignId = id;
         this.campaignDraft = null;
         this.journalId = null;
         this.draft = null;
         this.highlight = null;
         this.activeTab = "campaign";
         this.render();
      } catch (err) {
         ui.notifications.warn(err instanceof Error ? err.message : String(err));
      }
   }

   static async onSaveCampaign(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.campaignId || !this.campaignDraft) return;
      this.#readFormIntoDrafts();
      const root = this.element as HTMLElement | undefined;
      const name = root?.querySelector<HTMLInputElement>('[name="campaignName"]')?.value;
      if (name) await CampaignService.renameCampaign(this.campaignId, name);
      await CampaignService.saveCampaign(this.campaignId, this.campaignDraft);
      ui.notifications.info(game.i18n.localize("DMEMU.Campaign.Saved"));
   }

   static async onOpenCreateDialog(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.campaignId) {
         ui.notifications.warn(game.i18n.localize("DMEMU.Campaign.NeedCampaignForSheet"));
         return;
      }

      const defaultName = game.i18n.localize("DMEMU.Plot.DefaultName");
      const typeOptions = PLOT_SHEET_TYPE_IDS.map((id) => {
         const label = game.i18n.localize(`DMEMU.Plot.SheetType.${PLOT_SHEET_PRESETS[id].i18nKey}`);
         const selected = id === "standard" ? " selected" : "";
         return `<option value="${id}"${selected}>${label}</option>`;
      }).join("");

      const fd = await foundry.applications.api.DialogV2.input({
         window: { title: "DMEMU.Plot.App.CreateDialogTitle" },
         classes: ["dmemu"],
         position: { width: 400 },
         content: `
            <div class="form-group">
               <label for="dmemu-plot-create-name">${game.i18n.localize("DMEMU.Plot.App.Name")}</label>
               <input id="dmemu-plot-create-name" type="text" name="name" value="" placeholder="${defaultName}" autofocus />
            </div>
            <div class="form-group">
               <label for="dmemu-plot-create-type">${game.i18n.localize("DMEMU.Plot.App.SheetType")}</label>
               <select id="dmemu-plot-create-type" name="sheetType">${typeOptions}</select>
            </div>
         `,
         ok: {
            label: "DMEMU.Plot.App.Create",
            icon: "fas fa-plus",
         },
      });

      if (!fd) return;

      const name = String(fd.name ?? "").trim() || defaultName;
      const type = (String(fd.sheetType ?? "standard") as PlotSheetTypeId) || "standard";
      try {
         this.#readFormIntoDrafts();
         if (this.campaignId && this.campaignDraft) {
            await CampaignService.saveCampaign(this.campaignId, this.campaignDraft);
         }
         const id = await PlotSheetService.createSheet(name, type, this.campaignId!);
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
      this.#readFormIntoDrafts();
      const root = this.element as HTMLElement | undefined;
      const name = root?.querySelector<HTMLInputElement>('[name="sheetName"]')?.value;
      if (name) await PlotSheetService.renameSheet(this.journalId, name);
      await PlotSheetService.saveSheet(this.journalId, this.draft);
      ui.notifications.info(game.i18n.localize("DMEMU.Plot.Saved"));
   }

   static async onChangeType(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDrafts();
      const root = this.element as HTMLElement | undefined;
      const type = root?.querySelector<HTMLSelectElement>('[name="sheetType"]')?.value as PlotSheetTypeId;
      if (!type || type === this.draft.sheetType) return;
      this.draft = PlotSheetService.retypeSheet(this.draft, type);
      this.highlight = null;
      this.render();
   }

   static async onToggleBox(this: PlotSheetApp, _event: Event, target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDrafts();
      const index = Number(target.dataset.index ?? "-1");
      if (index < 0) return;
      const currentlyChecked = index < this.draft.track.checked;
      this.draft = PlotSheetService.setTrackChecked(
         this.draft,
         currentlyChecked ? index : index + 1
      );
      this.render();
   }

   static async onConfirmAdvance(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDrafts();
      this.draft = PlotSheetService.advanceTrack(this.draft);
      if (this.journalId) await PlotSheetService.saveSheet(this.journalId, this.draft);
      this.render();
   }

   static async onRandomPrompt(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      this.#readFormIntoDrafts();
      try {
         const result = await PlotBeatService.rollRandomPrompt(this.draft);
         PlotPromptStash.set(result.text);
         await PlotBeatService.postToChat(result);
         this.render();
      } catch (err) {
         ui.notifications.warn(err instanceof Error ? err.message : String(err));
      }
   }

   static async onModifiedProposal(this: PlotSheetApp, _event: Event, _target: HTMLElement): Promise<void> {
      this.#readFormIntoDrafts();
      try {
         const result = await PlotBeatService.rollModifiedProposal(this.draft);
         PlotPromptStash.set(result.followUp?.text || result.text);
         if (result.node && result.node.slotIndex >= 0) {
            this.highlight = { categoryId: result.node.categoryId, slotIndex: result.node.slotIndex };
            this.activeTab = "nodes";
         }
         await PlotBeatService.postToChat(result);
         this.render();
      } catch (err) {
         ui.notifications.warn(err instanceof Error ? err.message : String(err));
      }
   }

   static async onPasteStash(this: PlotSheetApp, _event: Event, target: HTMLElement): Promise<void> {
      if (!this.draft) return;
      this.#readFormIntoDrafts();
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
      this.#readFormIntoDrafts();
      const categoryId = target.dataset.categoryId as PlotNodeCategoryId | undefined;
      const slotIndex = Number(target.dataset.slotIndex ?? "-1");
      const cat = this.draft.nodeCategories.find((c) => c.id === categoryId);
      if (!cat || slotIndex < 0 || slotIndex >= cat.slots.length) return;
      cat.slots[slotIndex].text = "";
      this.render();
   }
}
