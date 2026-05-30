import { ItemView, WorkspaceLeaf, setTooltip, Modal  } from "obsidian";
import SpacedRepetitionGardenPlugin from "./main";
import { FlashcardData } from "./sm2";

export const GARDEN_VIEW_TYPE = "spaced-repetition-garden-view";


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
    
     this.refresh();
    }
    
    refresh();
    const cards= Object.values(this.plugin.settings.flashcard_data);
    const nowStr = new Date().toISOString();
    const dueCount = cards.filter(c => c.dueDate <= nowStr).length;
    
    const duelEl = document.getElementById("garden-due-count");
    if (duelEl) duelEl.setText(dueCount.toString());
    
    const streakEl = document.getElementById("garden-streak-count");
    if (streakEl) streakEl.insertAdjacentText(`${this.plugin.settings.streak_counter} days`);
    
    const total = this.plugin.settings.total_reviews;
    const successful = this.plugin.settings.successful_recalls;
    const rate = total > 0 ? Math.round((successful / total) * 100) : 100;
    
    const retenionEl = document.getElementById("garden-retention");
    if (retenionEl) retentionEl.setText(`${rate}%`);
    
    const gridEl = this.containerEl.querySelector(".garden-grid") as HTMLElement;
       if (gridEl) {
    this.renderGarden(gridEl);
       }
    }

    renderGarden(container: HTMLElement) {
        container.empty();
        const cards = Object.values(this.plugin.settings.flashcard_data);
  
      if (cards.length === 0) {
        container.createEl("p", {
          text: "Your garden is empty.Write 'Front::Back' on any line in a note and trigger 'Plant Seed'!",
          cls: "garden-status-placeholder"
        });
  return;
    }
  
  const now = new Date();
  
  for (const card of cards) {
  const dueDate = new Date(card.dueDate);
  const isOverdue = dueDate <= now;
  
  let statusClass = "plant-seed";
  let emoji = "🫘";
  
  if (card.repetitions > 0 && isOverdue) {
  statusClass = "plant-wilted";
  emoji = "🥀";
  } else if (card.repetitions === 1) {
  statusClass = "plant-growing";
  emoji = "🌱";
  } else if (card.repetitions > 1) {
  statusClass = "plant-flower";
  emoji = "🌸";
  }
  
  const plantEl = container.createDiv({ cls: `plant-item ${statusClass}` });
  plantEl.createDiv({ text: emoji, cls: "plant-icon" });
  setTooltip(plantEl, `Seed: ${card.front}`);
  
  plantEl.addEventListener("click", () => {
  this.openReviewModal(card);
  });
}
} 
  
openReviewModal(card: any ) { 
 new  ReviewModal(this.app, card, this.plugin, () => {
    this.refresh();
 }).open();
}
  
        async onClose() {
        console.log("LEAF CLOSED");
    }
}

export class ReviewModal extends Modal {
    card: FlashcardData;
    plugin: SpacedRepetitionGardenPlugin;
    onReviewComplete: () => void;

    constructor(app: any, card: FlashcardData, plugin: SpacedRepetitionGardenPlugin, onReviewComplete: () => void) {
        super(app);
        this.card = card;
        this.plugin = plugin;
        this.onReviewComplete = onReviewComplete;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("garden-review-modal")

        contentEl.createEl("h3", { text: "Reviewing Plant Seed" });

        const cardBox = contentEl.createDiv({ cls: "review-card-box" });
        cardBox.createEl({ text: this.card.front, cls: "review-card-front" });
        
        const answerBox = cardBox.createDiv({ cls:"review-card-back review-hiddem" });
        answerBox.createDiv({ text: this.card.back });

        const buttonContainer = contentEl.createDiv({ cls: "review-buttons-container" });
  
  const showBtn = buttonContainer.createEl("button", { text: "Show Answer", cls: "review-btn-primary" });
  showBtn.addEventListener("click", () => {
  answerBox.removeClass("review-hidden");
  showBtn.remove();
  this.renderReviewButtons(buttonContainer);
  });
}
  
  renderReviewButtons(container: HTMLElement) {
  
      container.createEl("button", { text: "Hard", cls: "review-btn review-btn-hard" });
    container.createEl("button", { text: "Good", cls: "review-btn review-btn-good" });
     container.createEl("button", { text: "Easy", cls: "review-btn review-btn-easy" })
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}