# Spaced Repetition Garden

Obsidian plugin that turns your notes and headings into flashcards visualized as a living garden panel. Cards reviewed on time bloom into flowers, while neglected ones wilt.

## How to Test

### 1. Build and Install
1. Run `npm install` in this directory.
2. Run `npm run build` to compile the plugin to `main.js`.
3. Copy `manifest.json`, `main.js`, and `style.css` to `<your-vault>/.obsidian/plugins/spaced-repetition-garden/`.
4. Open Obsidian -> Settings -> Community Plugins -> Turn on "Spaced Repetition Garden".

### 2. Create Flashcards (Plant Seeds)
You can plant seeds from any note using the command palette:
* **Inline Card:** Write `Front :: Back` on a line, put your cursor on it, and run the `Plant Seed (Convert to Flashcard)` command.
* **Heading Card:** Write `## Heading Topic` and some description text underneath it, place your cursor on the heading, and run the command.
* **Note Card:** Put your cursor on a blank line in a note, and run the command. It will write `seed-id` to the frontmatter of that note.

### 3. Review in Garden View
1. Click the **flower** 🌸 icon on the left ribbon bar to open the garden panel.
2. Single-click any seed 🫘 to open the review modal. Show the answer and select Hard, Good, or Easy.
3. Double-click a plant to jump directly to its note in the editor.
4. Card data and scheduling are saved in your vault inside `garden-data.json`.
