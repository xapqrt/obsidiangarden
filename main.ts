import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, MarkdownView, Notice  } from "obsidian";
import { FlashcardData, SM2Engine } from "./sm2";
import { GardenView, GARDEN_VIEW_TYPE } from "./view";





export interface GardenPluginSettings {
    flashcard_data: Record<string, FlashcardData>;
    streak_counter: number;
    last_review_date: string;
    total_reviews: number;
    successful_recalls: number;
}

const DEFAULT_SETTINGS: GardenPluginSettings = {
    flashcard_data: {},
    streak_counter: 0,
    last_review_date: "",
    total_reviews: 0,
    successful_recalls: 0,
};

export default class SpacedRepetitionGardenPlugin extends Plugin {
    settings!: GardenPluginSettings;
    scanTimeout: any = null;
    
    async onload() {
        console.log("spaced repetition garden plugin loading...");
        await this.loadSettings();
    
        this.app.workspace.onLayoutReady(async () => {
            await this.scanVault();
        });
   
        this.registerEvent(
            this.app.vault.on("modify", () => {
                this.debouncedScan();
            })
        );

        this.registerView(
            GARDEN_VIEW_TYPE,
            (leaf) => new GardenView(leaf, this)
        );
   
        this.addRibbonIcon("flower", "Spaced Repetition Garden", async () => {
            await this.activateView();
        });
    
        this.addSettingTab(new GardenSettingTab(this.app, this));
          this.addCommand({
            id: "plant-seed",
            name: "Plant Seed (Convert to Flashcard)",
            editorCallback: async (editor, view) => {
                const file = view.file;
                if (!file) return;
                const cursor = editor.getCursor();
                const lineText = editor.getLine(cursor.line);

                // 1. Heading
                if (lineText.trim().startsWith("#")) {
                    const headingMatch = lineText.match(/^(#+)\s+(.*?)(?:\s+\^seed-([a-z0-9]+))?$/);
                    if (headingMatch) {
                        if (headingMatch[3]) {
                            new Notice("This heading is already a seed!");
                            return;
                        }
                        const newId = this.generateId();
                        editor.setLine(cursor.line, `${lineText.trim()} ^seed-${newId}`);
                        new Notice("Planted heading seed!");
                        await this.scanVault();
                    }
                    return;
                }

                // 2. Inline
                if (lineText.includes("::")) {
                    if (lineText.includes("^seed-")) {
                        new Notice("This seed is already planted!");
                        return;
                    }
                    const newId = this.generateId();
                    editor.setLine(cursor.line, `${lineText.trim()} ^seed-${newId}`);
                    new Notice("Planted inline seed!");
                    await this.scanVault();
                    return;
                }

                // 3. Entire note
                const cache = this.app.metadataCache.getFileCache(file);
                if (cache?.frontmatter && cache.frontmatter["seed-id"]) {
                    new Notice("This note is already a seed!");
                    return;
                }
                const newId = this.generateId();
                await this.app.fileManager.processFrontMatter(file, (fm) => {
                    fm["seed-id"] = newId;
                });
                new Notice("Planted note seed!");
                await this.scanVault();
            }
        });
    }
   
   
   







async onunload() {
        console.log("garden plugin unloaded. RIP plants.");
    }

async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(GARDEN_VIEW_TYPE)[0];
        if (!leaf) {
                  const the_leaf = workspace.getRightLeaf(false);
        if (the_leaf) {
                   await the_leaf.setViewState({
            type: GARDEN_VIEW_TYPE,
             active: true,
        });
          leaf = the_leaf;
    }
        }
      if (leaf) {
            workspace.revealLeaf(leaf);
      }
    }

async loadSettings() {
    let data = {};
    try {
        if (await this.app.vault.adapter.exists("garden-data.json")) {
            data = JSON.parse(await this.app.vault.adapter.read("garden-data.json"));
        } else {
            data = await this.loadData();
        }
    } catch(e) {
        data = await this.loadData();
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
}

async saveSettings() {
    await this.saveData(this.settings);
    try {
        await this.app.vault.adapter.write("garden-data.json", JSON.stringify(this.settings, null, 2));
    } catch(e) {}
}

parseFlashcardsFromText(text: string): { front: string; back: string; id: string; rawLine: string }[] {
    const lines = text.split("\n");
    const cards: { front: string; back: string; id: string; rawLine: string }[] = [];
    const cardRegex = /^(.*?)::(.*?)(?:\s+\^seed-([a-z0-9]+))?$/;

    for (const line of lines) {
        const match = line.trim().match(cardRegex);
        if (match) {
             const front = match[1].trim();
             const back = match[2].trim();
             const id = match[3] ? match[3].trim() : this.generateId();
                cards.push({ front, back, id, rawLine: line });
        }
    }
    return cards;
}

generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

 debouncedScan() {
        if (this.scanTimeout) clearTimeout(this.scanTimeout);
          this.scanTimeout = setTimeout(() => {
            this.scanVault();
          }, 1000);
        }

async scanVault() {
    const files = this.app.vault.getMarkdownFiles();
    const activeIds = new Set<string>();

    for (const file of files) {
        const content = await this.app.vault.read(file);
        const cache = this.app.metadataCache.getFileCache(file);

        // 1. Note-level
        const frontmatter = cache?.frontmatter;
        if (frontmatter && frontmatter["seed-id"]) {
            const id = String(frontmatter["seed-id"]).trim();
            activeIds.add(id);
            const front = file.basename;
            let back = content;
            if (cache.frontmatterPosition) {
                const endLine = cache.frontmatterPosition.end.line;
                back = content.split("\n").slice(endLine + 1).join("\n").trim();
            }
            if (!this.settings.flashcard_data[id]) {
                this.settings.flashcard_data[id] = SM2Engine.getNewCard(id, front, back);
            } else {
                this.settings.flashcard_data[id].front = front;
                this.settings.flashcard_data[id].back = back;
            }
        }

        // 2. Headings and Inline
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Heading
            const headingMatch = line.match(/^(#+)\s+(.*?)(?:\s+\^seed-([a-z0-9]+))?$/);
            if (headingMatch && headingMatch[3]) {
                const level = headingMatch[1].length;
                const id = headingMatch[3];
                activeIds.add(id);
                const backLines: string[] = [];
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j];
                    const nextHeading = nextLine.match(/^(#+)\s+/);
                    if (nextHeading && nextHeading[1].length <= level) break;
                    backLines.push(nextLine);
                }
                const back = backLines.join("\n").trim();
                const front = headingMatch[2].trim();

                if (!this.settings.flashcard_data[id]) {
                    this.settings.flashcard_data[id] = SM2Engine.getNewCard(id, front, back);
                } else {
                    this.settings.flashcard_data[id].front = front;
                    this.settings.flashcard_data[id].back = back;
                }
                continue;
            }

            // Inline
            const inlineMatch = line.trim().match(/^(.*?)::(.*?)(?:\s+\^seed-([a-z0-9]+))?$/);
            if (inlineMatch && inlineMatch[3]) {
                const id = inlineMatch[3];
                activeIds.add(id);
                const front = inlineMatch[1].trim();
                const back = inlineMatch[2].trim();
                if (!this.settings.flashcard_data[id]) {
                    this.settings.flashcard_data[id] = SM2Engine.getNewCard(id, front, back);
                } else {
                    this.settings.flashcard_data[id].front = front;
                    this.settings.flashcard_data[id].back = back;
                }
            }
        }
    }

    for (const id in this.settings.flashcard_data) {
        if (!activeIds.has(id)) {
            delete this.settings.flashcard_data[id];
        }
    }

    await this.saveSettings();
    console.log("Vault scanned. Total active garden cards:", Object.keys(this.settings.flashcard_data).length);

    const leaves = this.app.workspace.getLeavesOfType(GARDEN_VIEW_TYPE);
    for (const leaf of leaves) {
        if (leaf.view instanceof GardenView) {
            (leaf.view as GardenView).refresh();
        }
    }
}

 async openCardInVault(cardId: string) {
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
        const content = await this.app.vault.read(file);
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.frontmatter && String(cache.frontmatter["seed-id"]).trim() === cardId) {
            await this.app.workspace.getMostRecentLeaf()?.openFile(file);
            break;
        }
        if (content.includes(`^seed-${cardId}`)) {
            const leaf = this.app.workspace.getMostRecentLeaf();
            if (leaf) {
                await leaf.openFile(file);
                const lines = content.split("\n");
                const lineIdx = lines.findIndex((line) => line.includes(`^seed-${cardId}`));
                if (lineIdx !== -1) {
                    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                    if (editor) {
                        editor.setCursor({ line: lineIdx, ch: 0 });
                        editor.scrollIntoView(
                                 { from: { line: lineIdx, ch: 0 }, to: { line: lineIdx, ch: 0 } },
                                true
                        );
                    }
                }
            }
            break;
        }
    }
}
    }

    class GardenSettingTab extends PluginSettingTab {
        plugin: SpacedRepetitionGardenPlugin;

        constructor(app: App, plugin: SpacedRepetitionGardenPlugin) {
            super(app, plugin);
            this.plugin = plugin;
        }

        display(): void {
            const { containerEl } = this;
            containerEl.empty();

            containerEl.createEl("h2", { text: "Spaced Repetition Garden Settings" });

            new Setting(containerEl)
                .setName("Reset Garden Database")
                .setDesc("Warning: This clears all card metadata, scheduling, and streak metrics!") 
                .addButton((button) =>
                      button
                    .setButtonText("Reset Database")
                    .setWarning()
                    .onClick(async () => {
                                if (confirm("Are you sure you want to delete all plant metrics? This cannot be undone.")) {
                                    this.plugin.settings.flashcard_data = {};
                                this.plugin.settings.streak_counter = 0;
                              this.plugin.settings.last_review_date = "";
                               this.plugin.settings.total_reviews = 0;
                               this.plugin.settings.successful_recalls = 0;
                                await this.plugin.saveSettings();
                                    await this.plugin.scanVault();
                                   console.log("Garden reset.");
        }
           })
       );
     }
  }                                                  