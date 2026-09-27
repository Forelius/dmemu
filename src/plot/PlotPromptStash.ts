/**
 * In-memory stash of the last prompt text (generator / beat / oracle)
 * so the Plot Sheet can paste into a node slot.
 */
export class PlotPromptStash {
   static #text = "";

   static set(text: string): void {
      this.#text = (text ?? "").trim();
   }

   static get(): string {
      return this.#text;
   }

   static clear(): void {
      this.#text = "";
   }
}
