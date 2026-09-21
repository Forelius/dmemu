/** Enrichment / story / quantifier RollTables wired into the Oracle app. */

export interface EnrichmentTableDef {
   id: string;
   /** i18n key suffix under DMEMU.Oracle.Enrichment */
   i18nKey: string;
   tableName: string;
}

export interface EnrichmentGroupDef {
   id: string;
   /** i18n key suffix under DMEMU.Oracle.Enrichment.Group */
   i18nKey: string;
   tables: EnrichmentTableDef[];
}

/**
 * PUM descriptive → story → quantifier tables.
 * `tableName` must match the RollTable `name` in packsrc.
 */
export const ENRICHMENT_GROUPS: EnrichmentGroupDef[] = [
   {
      id: "descriptive",
      i18nKey: "Descriptive",
      tables: [
         { id: "notice", i18nKey: "Notice", tableName: "Oracle — Notice (perceive)" },
         { id: "someone", i18nKey: "Someone", tableName: "Oracle — Someone (who)" },
         { id: "place", i18nKey: "Place", tableName: "Oracle — Place (where)" },
         { id: "object", i18nKey: "Object", tableName: "Oracle — Object (what for)" },
         { id: "hazard", i18nKey: "Hazard", tableName: "Oracle — Hazard (type)" },
         { id: "mood", i18nKey: "Mood", tableName: "Oracle — Mood (feel)" },
         { id: "description", i18nKey: "Description", tableName: "Oracle — Description (looks)" },
      ],
   },
   {
      id: "story",
      i18nKey: "Story",
      tables: [
         { id: "focus", i18nKey: "Focus", tableName: "Oracle — Focus (what)" },
         { id: "reason", i18nKey: "Reason", tableName: "Oracle — Reason (why)" },
         { id: "intent", i18nKey: "Intent", tableName: "Oracle — Intent (want)" },
         { id: "activity", i18nKey: "Activity", tableName: "Oracle — Activity (doing)" },
         { id: "discovery", i18nKey: "Discovery", tableName: "Oracle — Discovery (find)" },
         { id: "problem", i18nKey: "Problem", tableName: "Oracle — Problem (risk)" },
         { id: "explain", i18nKey: "Explain", tableName: "Oracle — Explain (how)" },
      ],
   },
   {
      id: "quantifier",
      i18nKey: "Quantifier",
      tables: [
         { id: "howMany", i18nKey: "HowMany", tableName: "Oracle — How many/much" },
         { id: "howGood", i18nKey: "HowGood", tableName: "Oracle — How good/well" },
         { id: "howHard", i18nKey: "HowHard", tableName: "Oracle — How hard/tough" },
      ],
   },
];
