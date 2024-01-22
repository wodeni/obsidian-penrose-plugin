import { compile, optimize, showError, toSVG } from "@penrose/core/bundle";
import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";

// Remember to rename these classes and interfaces!

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

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      "dice",
      "Sample Plugin",
      (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        new Notice("This is a notice!");
      },
    );
    // Perform additional things with the ribbon
    ribbonIconEl.addClass("my-plugin-ribbon-class");

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText("Status Bar Text");

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "open-sample-modal-simple",
      name: "Open sample modal (simple)",
      callback: () => {
        new SampleModal(this.app).open();
      },
    });
    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: "sample-editor-command",
      name: "Sample editor command",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        // console.log(editor.getSelection());
        editor.replaceSelection("Sample Editor Command");
      },
    });
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: "open-sample-modal-complex",
      name: "Open sample modal (complex)",
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new SampleModal(this.app).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      //   console.log("click", evt);
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
    );

    this.registerMarkdownCodeBlockProcessor(
      "penrose",
      async (source: string, el, ctx) => {
        const trio = await getTrio(source, async (path: string) => {
          const file = this.app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile) {
            try {
              const fileContents = await this.app.vault.read(file);
              console.log(`read file ${path}`);
              return fileContents;
            } catch (error) {
              console.log("Error reading file:", error);
              return ""; // TODO: error
            }
          } else {
            console.log("Error reading file", path, file);
            return ""; // TODO: error
          }
        });
        console.log("trio", trio);

        const compiled = await compile(trio);
        if (compiled.isErr()) {
          console.log(compiled.error);
          el.appendChild(document.createTextNode(showError(compiled.error)));
        } else {
          const optimized = optimize(compiled.value);
          if (optimized.isErr()) {
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

const extractMetadata = async (substance: string): Promise<Meta> => {
  // Regular expressions for each key
  const domainRegex = /--\s*domain:\s*(.*)\s*/;
  const styleRegex = /--\s*style:\s*(.*)\s*/;
  const variationRegex = /--\s*variation:\s*(.*)\s*/;

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

class SampleModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Woah!");
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class SampleSettingTab extends PluginSettingTab {
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
