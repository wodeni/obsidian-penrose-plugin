import path from "path";
import { defineConfig } from "vite";
import builtins from "builtin-modules";
import topLevelAwait from "vite-plugin-top-level-await";

const prod = process.argv[2] === "production";

export default defineConfig(() => {
  return {
    plugins: [topLevelAwait()],
    watch: !prod,
    build: {
      target: "node12",
      sourcemap: prod ? false : true,
      minify: prod,
      commonjsOptions: {
        ignoreTryCatch: false,
        requireReturnsDefault: true,
      },
      // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
      lib: {
        entry: path.resolve(__dirname, "./main.ts"),
        formats: ["es" as const],
      },
      css: {},
      rollupOptions: {
        output: {
          // Overwrite default Vite output fileName
          entryFileNames: "main.js",
          assetFileNames: "styles.css",
        },
        external: [
          "obsidian",
          "electron",
          "codemirror",
          "@codemirror/autocomplete",
          "@codemirror/closebrackets",
          "@codemirror/collab",
          "@codemirror/commands",
          "@codemirror/comment",
          "@codemirror/fold",
          "@codemirror/gutter",
          "@codemirror/highlight",
          "@codemirror/history",
          "@codemirror/language",
          "@codemirror/lint",
          "@codemirror/matchbrackets",
          "@codemirror/panel",
          "@codemirror/rangeset",
          "@codemirror/rectangular-selection",
          "@codemirror/search",
          "@codemirror/state",
          "@codemirror/stream-parser",
          "@codemirror/text",
          "@codemirror/tooltip",
          "@codemirror/view",
          "@lezer/common",
          "@lezer/lr",
          "@lezer/highlight",
          ...builtins,
        ],
      },
      // Use root as the output dir
      emptyOutDir: false,
      outDir: ".",
    },
  };
});
