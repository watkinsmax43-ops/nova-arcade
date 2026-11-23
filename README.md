# Nova Arcade

A static HTML, CSS, and JavaScript arcade. The current game is 8 Ball, playable with two local players or against the AI.

## Deploy to GitHub Pages (Free)

1. Create a new repository on GitHub (for example, `nova-arcade`).
2. Upload all files and folders, including `index.html`, `8ball.html`, the CSS files, and the `js/` folder, to the `main` branch.
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