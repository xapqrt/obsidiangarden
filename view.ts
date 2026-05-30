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
      

     const statsHeader = container.createDiv({ cls: "garden-stats-header" });
    
    const dueStat = statsHeader.createDiv({ cls: "garden-stat" });
    dueStat.createEl("span", { text: "Due Today", cls: "stat-label" });
    dueStat.createEl("span", { text: "0", cls: "stat-value", id: "garden-due-count" });

    const streakStat = statsHeader.createDiv({ cls: "garden-stat" });
    streakStat.createEl("span", { text: "Streak", cls: "stat-label" });
    streakStat.createEl("span", { text: "0 days", cls: "stat-value", id: "garden-streak-count" });

    const retentionStat = statsHeader.createDiv({ cls: "garden-stat" });
    retentionStat.createEl("span", { text: "Retention", cls: "stat-label" });
    retentionStat.createEl("span", { text: "100%", cls: "stat-value", id: "garden-retention" });


     const plant_state = container.createDiv({ cls: "garden-grid" });
     this.renderGarden(plant_state);
    }

    renderGarden(container: HTMLElement) {
        container.empty();

        container.createEl("p", { text: "Planting grid is active. Ready to grow!", cls: "garden-status-placeholder" });
    }
    
    async onClose() {
        console.log("LEAF CLOSED");
    }
}