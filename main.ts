import { compile, optimize, showError, toSVG } from "@penrose/core/bundle";
import { App, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";

interface PenroseSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: PenroseSettings = {
  mySetting: "default",
};

export default class PenrosePlugin extends Plugin {
  settings: PenroseSettings;
  async onload() {
    await this.loadSettings();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new PenroseSettingTab(this.app, this));

    // register the code block processor for penrose
    this.registerMarkdownCodeBlockProcessor(
      "penrose",
      async (source: string, el, ctx) => {
        // get the trio by reading file links in the metadata
        const trio = await getTrio(source, async (path: string) => {
          const file = this.app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile) {
            try {
              const fileContents = await this.app.vault.read(file);
              return fileContents;
            } catch (error) {
              const msg = `Error reading file ${path}: ${error}`;
              console.error(msg);
              el.appendChild(document.createTextNode(msg));
              return "";
            }
          } else {
            const msg = `Error reading file ${path}`;
            el.appendChild(document.createTextNode(msg));
            return "";
          }
        });

        // do the actual compilation and layout, reporting errors as we go
        const compiled = await compile(trio);
        if (compiled.isErr()) {
          console.error(compiled.error);
          el.appendChild(document.createTextNode(showError(compiled.error)));
        } else {
          const optimized = optimize(compiled.value);
          if (optimized.isErr()) {
            console.error(optimized.error);
            el.appendChild(document.createTextNode(showError(optimized.error)));
          } else {
            const rendered = await toSVG(
              optimized.value,
              async () => undefined,
              "penrose-obsidian",
            );
            el.appendChild(rendered);
          }
        }
      },
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

type Meta = {
  style: string;
  domain: string;
  variation: string;
};

// helper function that extracts metadata of domain path, style path, and variation from a substance source
const extractMetadata = async (substance: string): Promise<Meta> => {
  // Regular expressions for each key
  const domainRegex = /--\s*domain:(.*)/;
  const styleRegex = /--\s*style:(.*)/;
  const variationRegex = /--\s*variation:(.*)/;

  // Split the program into lines
  const lines = substance.split("\n");

  // Initialize an object to store the results
  let domain = "";
  let style = "";
  let variation = "";

  // Iterate over each line and extract the values
  lines.forEach(async (line) => {
    const domainMatch = line.match(domainRegex);
    if (domainMatch) {
      domain = domainMatch[1].trim();
    }

    const styleMatch = line.match(styleRegex);
    if (styleMatch) {
      style = styleMatch[1].trim();
    }

    const variationMatch = line.match(variationRegex);
    if (variationMatch) {
      variation = variationMatch[1].trim();
    }
  });
  return { style, domain, variation };
};

// from a substance file, extract the metadata and read the domain and style files by following the links in the metadata
const getTrio = async (
  source: string,
  readFile: (path: string) => Promise<string>,
): Promise<{
  substance: string;
  style: string;
  domain: string;
  variation: string;
}> => {
  const res = await extractMetadata(source);
  const style = await readFile(res.style);
  const domain = await readFile(res.domain);
  return {
    substance: source,
    style,
    domain,
    variation: res.variation,
  };
};

// NOTE: unused for now but left here in case we need more configuration
class PenroseSettingTab extends PluginSettingTab {
  plugin: PenrosePlugin;

  constructor(app: App, plugin: PenrosePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("")
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
