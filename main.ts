import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";
import { FlashcardData } from "./sm2";





export default class SpacedRepetitionGardenPlugin extends Plugin {
    flashcard_data: Record<string, FlashcardData> = {};
    streak_counter: number = 0;
    total_reviews: number = 0;
    successful_recalls: number = 0;

    async onload() {
        console.log("LEAF SPAWNED");
        console.log("spaced repitition garden plugin loading...");
    }










    async onunload() {
        console.log("garden plugin unloaded. RIP plants.");
    }
}