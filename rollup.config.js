// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
   input: "src/index.ts",
   output: [
      {
         file: "./module/dmemu.js",
         format: "es",
         sourcemap: true,
      },
      {
         file: "./module/dmemu.min.js",
         format: "es",
         sourcemap: true,
         plugins: [terser()],
      },
   ],
   plugins: [typescript()],
};
