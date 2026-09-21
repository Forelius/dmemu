/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
   const game: any;
   const CONFIG: any;
   const Hooks: {
      once(hook: string, fn: (...args: any[]) => any): number;
      on(hook: string, fn: (...args: any[]) => any): number;
      off(hook: string, fn: (...args: any[]) => any): void;
      callAll(hook: string, ...args: any[]): boolean;
   };
}
