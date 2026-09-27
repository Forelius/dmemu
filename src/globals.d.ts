/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
   const game: any;
   const CONFIG: any;
   const ui: any;
   const foundry: any;
   const Roll: {
      new (formula: string): {
         evaluate(): Promise<{ total: number }>;
         total: number;
      };
   };
   const ChatMessage: {
      create(data: Record<string, unknown>): Promise<unknown>;
      getSpeaker(options?: Record<string, unknown>): unknown;
   };
   const JournalEntry: {
      create(data: Record<string, unknown>): Promise<{ id: string } | undefined>;
   };
   const Hooks: {
      once(hook: string, fn: (...args: any[]) => any): number;
      on(hook: string, fn: (...args: any[]) => any): number;
      off(hook: string, fn: (...args: any[]) => any): void;
      callAll(hook: string, ...args: any[]): boolean;
   };
}
