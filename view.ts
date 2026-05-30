import { ItemView, WorkspaceLeaf } from "obsidian";
import SpacedRepetitionGardenPlugin from "./main";

export class GARDEN_VIEW_TYPE = "spaced-repetition-garden-view";


export class GardenView extends ItemView {
    plugin: SpacedRepetitionGardenPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: SpacedRepetitionGardenPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return GARDEN_VIEW_TYPE;
    }

    getDisplayText(): string {
        return: "Spaced Repetition Garden";
    }

    async onOpen() {

        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "Spaced Repetition Garden" });


        const plant_state = container.createDiv({ cls: "garden-container" });
        plant_state.setText("The  garden is currently resting. Plant some first!");
    }

    async onClose() {
        console.log("LEAF CLOSED");
    }
}