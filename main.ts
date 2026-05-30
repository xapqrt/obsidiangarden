import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";
import { FlashcardData, SM2Engine } from "./sm2";





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

    async onload() {
        console.log("LEAF SPAWNED");
        console.log("spaced repitition garden plugin loading...");
        await this.onloadSettings();
    
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