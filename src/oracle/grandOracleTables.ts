/** GUM Grand Oracle RollTables (Action / Adjective / Subject). */

export interface GrandOraclePartDef {
   id: "action" | "adjective" | "subject";
   /** i18n key suffix under DMEMU.Oracle.Grand */
   i18nKey: string;
   /** Must match RollTable `name` in packsrc. */
   tableName: string;
}

export const GRAND_ORACLE_PARTS: GrandOraclePartDef[] = [
   { id: "action", i18nKey: "Action", tableName: "Oracle — Action (do)" },
   { id: "adjective", i18nKey: "Adjective", tableName: "Oracle — Adjective (how)" },
   { id: "subject", i18nKey: "Subject", tableName: "Oracle — Subject (what)" },
];
