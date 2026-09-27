import { MODULE_ID } from "../constants.js";

export type ChatVisibility = "self" | "gm" | "everyone";

/** Apply client oracle chat visibility (self / GMs / everyone) to ChatMessage create data. */
export function applyOracleChatVisibility(data: Record<string, unknown>): void {
   const visibility = (game.settings.get(MODULE_ID, "oracleChatVisibility") as ChatVisibility) ?? "self";
   if (visibility === "self") {
      data.whisper = [game.user.id];
   } else if (visibility === "gm") {
      const whispers = game.users.filter((u: { isGM: boolean }) => u.isGM).map((u: { id: string }) => u.id);
      if (!whispers.includes(game.user.id)) {
         whispers.push(game.user.id);
      }
      data.whisper = whispers;
   }
}
