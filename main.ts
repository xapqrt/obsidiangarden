import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, MarkdownView  } from "obsidian";
import { FlashcardData, SM2Engine } from "./sm2";
import { GardenView, GardenViewType } from "./view";





export interface GardenPluginSettings {}
flashcard_data: Record<string, FlashcardData>;
streak_counter: number;
last_review_date: string;
total_reviews: number;
successful_recalls: number;
}

count DEAFULT_SETTINGS: GardenPluginSettings = {
  flashcard_data: {},
  streak_counter: 0,
  last_review_date: "",
  total_reviews: 0,
    successful_recalls: 0,
};

export default class SpacedRepetitionGardenPlugin extends Plugin {
    settings: GardenPluginSettings;
    scanTimeout: any = null;
    
    async onload() {
        console.log("LEAF SPAWNED");
        console.log("spaced repitition garden plugin loading...");
        await this.onloadSettings();
    
    this.app.workspace.onLayoutReady(async () => {
           await this.scanVault();
    });
   
     this.registerEvent{
            this.app.vault.on("modify", () => {
               this.debounceScan();
            });
        );

   this.registerView(
            GARDEN_VIEW_TYPE,
             (leaf) => GardenView(leaf, this)
    );
   
     this.addRibbonIcon("flower", "Spaced Repetition Garden", async () => {
        await this.activateView();
    });
    
   this.addSettingTab(new GardenSettingTab(this.app, this));
   
    this.addCommand({
        id: "plant-seed",
        name: "Plant Seed(Create Flashcard)",
        editorCallback: async (editor, view) => {
            const cursor = editor.getCursor();
            const lineText = editor.getLine(cursor.line);


            const frontmatter_junk = lineText.split("::");
            if (frontmatter_junk.length < 2) {
                    console.log("Not a valid seed format. Need Front :: Back");
                    return;
            }

            const front = frontmatter_junk[0].trim();
            const back = frontmatter_junk[1].trim();
           
            
            const idMatch = lineText.match(/\^seed-([a-z0-9]+)/);
            if (idMatch) {
                console.log("This seed is already planted!");
                return;
            }

            const newId = this.generateId();
            const newLine = `${lineText.trim()} ^seed-${newId}`;
            editor.setLine(cursor.line, newLine);


            const newCard = SM2Engine.getNewCard(newId, front, back);
            this.settings.flashcard_data[newId] = newCard;
            await this.saveSettings();
            console.log("Planted seed:", newId);
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
         this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
        await this.saveData(this.settings);
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
             const id = match[3] ? match[3].trim() : this.generateId(front, back);
                cards.push({ front, back, id, rawLine: line });
        }
    }
    return cards;
}

generateId(): string {
    return Math.random().toString(36).substr(2, 10);
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
        const cards = this.parseFlashcardsFromText(content);

        for (const card of cards) {
            if(card.id) {
                activeIds.add(card.id);
                if (!this.settings.flashcard_data[card.id]) {
                    this.settings.flashcard_data[card.id] = SM2Engine.getNewCard(card.id, card.front, card.back);
                } else {
                    this.settings.flashcard_data[card.id].front = card.front;
                    this.settings.flashcard_data[card.id].back = card.back;
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

 async.openCardInVault(cardId: string) {
    const file = this.app.vault.getMarkdownFiles();
    for (const file of files) {
        const content = await this.app.vault.read(file);
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

    class GardenSettingTab extends PluginsSettingTab {
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