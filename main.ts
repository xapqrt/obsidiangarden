import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";
import { FlashcardData } from "./sm2";





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
}