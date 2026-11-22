# Nova Arcade — Unblocked Browser Games

A 100% static HTML, CSS, and Vanilla JavaScript arcade website with 1,000 playable entries. It includes original arcade games, 941 themed challenge variants across eight mini-game mechanics, sandbox/clicker/action games, 20 themed racers, plus skating, soccer, blackjack, brawling, city, stealth, and shop-management games. Entries referencing commercial games are original, unofficial mini-games, not full ports or endorsements.

## Deploy to GitHub Pages (Free)

1. Create a new repository on GitHub (for example, `nova-arcade`).
2. Upload all files and folders (`index.html`, `style.css`, `README.md`, and the `js/` folder) to the `main` branch.
   - Via Git CLI:
     ```bash
     git init
     git add .
     git commit -m "Initial commit: Nova Arcade"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/nova-arcade.git
     git push -u origin main
     ```
3. On GitHub, go to your repository's **Settings** -> **Pages**.
4. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` and `/ (root)`
5. Click **Save**. After ~1 minute, your site will be live at:
   `https://YOUR_USERNAME.github.io/nova-arcade/`