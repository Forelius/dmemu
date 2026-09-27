/** Generator RollTables wired into the Generators app. */

export interface GeneratorTableDef {
   id: string;
   /** i18n key suffix under DMEMU.Generators.Table */
   i18nKey: string;
   tableName: string;
}

export interface GeneratorComboDef {
   id: string;
   /** i18n key suffix under DMEMU.Generators.Combo */
   i18nKey: string;
   tableIds: string[];
}

export interface GeneratorGroupDef {
   id: string;
   /** i18n key suffix under DMEMU.Generators.Group */
   i18nKey: string;
   tables: GeneratorTableDef[];
   combos?: GeneratorComboDef[];
}

/**
 * Seeding / world / character generator tables.
 * `tableName` must match the RollTable `name` in packsrc.
 */
export const GENERATOR_GROUPS: GeneratorGroupDef[] = [
   {
      id: "seed",
      i18nKey: "Seed",
      combos: [
         {
            id: "plotSeed",
            i18nKey: "PlotSeed",
            tableIds: ["plotHook", "motivation", "mission", "initialLead", "caveat", "opposition"],
         },
         {
            id: "worldTruths",
            i18nKey: "WorldTruths",
            tableIds: ["locationArchetype", "backgroundProblem"],
         },
      ],
      tables: [
         { id: "locationArchetype", i18nKey: "LocationArchetype", tableName: "Generator — Location archetype" },
         { id: "backgroundProblem", i18nKey: "BackgroundProblem", tableName: "Generator — Background problem" },
         { id: "plotHook", i18nKey: "PlotHook", tableName: "Generator — Plot hook" },
         { id: "motivation", i18nKey: "Motivation", tableName: "Generator — Motivation" },
         { id: "mission", i18nKey: "Mission", tableName: "Generator — Mission" },
         { id: "initialLead", i18nKey: "InitialLead", tableName: "Generator — Initial lead" },
         { id: "caveat", i18nKey: "Caveat", tableName: "Generator — Caveat" },
         { id: "opposition", i18nKey: "Opposition", tableName: "Generator — Opposition" },
      ],
   },
   {
      id: "world",
      i18nKey: "World",
      combos: [
         {
            id: "faction",
            i18nKey: "Faction",
            tableIds: ["factionFocus", "factionNeeds", "factionSociety", "factionPolitics", "factionBeliefs"],
         },
         {
            id: "location",
            i18nKey: "Location",
            tableIds: ["locationFeature", "locationWorth", "locationContent", "locationPurpose"],
         },
         {
            id: "object",
            i18nKey: "Object",
            tableIds: ["objectFunction", "objectState", "objectForm"],
         },
         {
            id: "nemesis",
            i18nKey: "Nemesis",
            tableIds: ["nemesisImpression", "nemesisDeeds", "nemesisIntentions"],
         },
         {
            id: "creature",
            i18nKey: "Creature",
            tableIds: ["creatureType", "creatureBehavior", "creatureAbility"],
         },
      ],
      tables: [
         { id: "factionFocus", i18nKey: "FactionFocus", tableName: "Generator — Faction focus" },
         { id: "factionNeeds", i18nKey: "FactionNeeds", tableName: "Generator — Faction surpluses or needs" },
         { id: "factionSociety", i18nKey: "FactionSociety", tableName: "Generator — Faction society" },
         { id: "factionPolitics", i18nKey: "FactionPolitics", tableName: "Generator — Faction politics" },
         { id: "factionBeliefs", i18nKey: "FactionBeliefs", tableName: "Generator — Faction beliefs" },
         { id: "locationFeature", i18nKey: "LocationFeature", tableName: "Generator — Location feature" },
         { id: "locationWorth", i18nKey: "LocationWorth", tableName: "Generator — Location worth" },
         { id: "locationContent", i18nKey: "LocationContent", tableName: "Generator — Location content" },
         { id: "locationPurpose", i18nKey: "LocationPurpose", tableName: "Generator — Location purpose" },
         { id: "objectFunction", i18nKey: "ObjectFunction", tableName: "Generator — Object function" },
         { id: "objectState", i18nKey: "ObjectState", tableName: "Generator — Object state" },
         { id: "objectForm", i18nKey: "ObjectForm", tableName: "Generator — Object form" },
         { id: "nemesisImpression", i18nKey: "NemesisImpression", tableName: "Generator — Nemesis impression" },
         { id: "nemesisDeeds", i18nKey: "NemesisDeeds", tableName: "Generator — Nemesis past deeds" },
         { id: "nemesisIntentions", i18nKey: "NemesisIntentions", tableName: "Generator — Nemesis intentions" },
         { id: "creatureType", i18nKey: "CreatureType", tableName: "Generator — Creature type" },
         { id: "creatureBehavior", i18nKey: "CreatureBehavior", tableName: "Generator — Creature behavior" },
         { id: "creatureAbility", i18nKey: "CreatureAbility", tableName: "Generator — Creature ability" },
      ],
   },
   {
      id: "characters",
      i18nKey: "Characters",
      combos: [
         {
            id: "characterTraits",
            i18nKey: "CharacterTraits",
            tableIds: ["charEdge", "charWeapon", "charFlaw", "charPossessions"],
         },
         {
            id: "characterScene",
            i18nKey: "CharacterScene",
            tableIds: ["charImpression", "charIntentions", "charActivity", "charPast"],
         },
      ],
      tables: [
         { id: "charEdge", i18nKey: "CharEdge", tableName: "Generator — Character edge" },
         { id: "charWeapon", i18nKey: "CharWeapon", tableName: "Generator — Character weapon" },
         { id: "charFlaw", i18nKey: "CharFlaw", tableName: "Generator — Character flaw" },
         { id: "charPossessions", i18nKey: "CharPossessions", tableName: "Generator — Character possessions" },
         { id: "charImpression", i18nKey: "CharImpression", tableName: "Generator — Character impression" },
         { id: "charIntentions", i18nKey: "CharIntentions", tableName: "Generator — Character intentions" },
         { id: "charActivity", i18nKey: "CharActivity", tableName: "Generator — Character activity" },
         { id: "charPast", i18nKey: "CharPast", tableName: "Generator — Character past" },
         { id: "archetype1", i18nKey: "Archetype1", tableName: "Generator — Character archetype 1" },
         { id: "archetype2", i18nKey: "Archetype2", tableName: "Generator — Character archetype 2" },
         { id: "goodPurposes", i18nKey: "GoodPurposes", tableName: "Generator — Good purposes" },
         { id: "evilPurposes", i18nKey: "EvilPurposes", tableName: "Generator — Evil purposes" },
         { id: "goodIntentions", i18nKey: "GoodIntentions", tableName: "Generator — Good intentions" },
         { id: "evilIntentions", i18nKey: "EvilIntentions", tableName: "Generator — Evil intentions" },
      ],
   },
];

export function findGeneratorTable(id: string): GeneratorTableDef | undefined {
   for (const group of GENERATOR_GROUPS) {
      const hit = group.tables.find((t) => t.id === id);
      if (hit) return hit;
   }
   return undefined;
}
