(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.game2048 = {
    id: 'game2048',
    title: '2048',
    description: 'Slide and merge matching numbers to reach the 2048 tile!',
    categories: ['Popular', 'Puzzle'],
    controls: 'Arrow Keys / WASD or Swipe',
    badge: 'Puzzle',
    icon: '🔢',
    accent: 'linear-gradient(135deg, #f59e0b, #ea580c)',

    mount(container) {
      const TILE_COLORS = {
        0: '#1e293b', 2: '#e2e8f0', 4: '#fed7aa', 8: '#fb923c',
        16: '#f97316', 32: '#ef4444', 64: '#dc2626', 128: '#fde047',
        256: '#facc15', 512: '#eab308', 1024: '#38bdf8', 2048: '#a855f7'
      };

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <span class="game-hud" id="g2048-score">Score: 0</span>
        <span class="game-hud" id="g2048-best">Best: ${localStorage.getItem('nova_2048_best') || 0}</span>
        <button class="game-btn" id="g2048-reset">New Game</button>
      `;

      const boardEl = document.createElement('div');
      boardEl.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 82px);
        grid-template-rows: repeat(4, 82px);
        gap: 10px;
        background: #0f172a;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.14);
        user-select: none;
        touch-action: none;
      `;

      const statusEl = document.createElement('p');
      statusEl.style.cssText = 'margin-top: 12px; font-weight: 700; color: #38bdf8; min-height: 22px;';

      container.appendChild(toolbar);
      container.appendChild(boardEl);
      container.appendChild(statusEl);

      const scoreEl = toolbar.querySelector('#g2048-score');
      const bestEl = toolbar.querySelector('#g2048-best');
      const resetBtn = toolbar.querySelector('#g2048-reset');

      let grid = [];
      let score = 0;
      let best = Number(localStorage.getItem('nova_2048_best') || 0);
      let won = false;
      let touchStart = null;

      function init() {
        grid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
        score = 0;
        won = false;
        statusEl.textContent = '';
        spawnTile();
        spawnTile();
        render();
      }

      function spawnTile() {
        const empty = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) empty.push({ r, c });
          }
        }
        if (empty.length === 0) return;
        const pick = empty[Math.floor(Math.random() * empty.length)];
        grid[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;
      }

      function slideLine(line) {
        const filtered = line.filter((v) => v !== 0);
        const out = [];
        for (let i = 0; i < filtered.length; i++) {
          if (filtered[i] === filtered[i + 1]) {
            const val = filtered[i] * 2;
            out.push(val);
            score += val;
            if (val === 2048 && !won) {
              won = true;
              statusEl.textContent = '🎉 You reached 2048! Keep going!';
            }
            i++;
          } else {
            out.push(filtered[i]);
          }
        }
        while (out.length < 4) out.push(0);
        return out;
      }

      function move(dir) {
        const prev = JSON.stringify(grid);
        if (dir === 'left') {
          for (let r = 0; r < 4; r++) grid[r] = slideLine(grid[r]);
        } else if (dir === 'right') {
          for (let r = 0; r < 4; r++) grid[r] = slideLine([...grid[r]].reverse()).reverse();
        } else if (dir === 'up') {
          for (let c = 0; c < 4; c++) {
            const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            const slid = slideLine(col);
            for (let r = 0; r < 4; r++) grid[r][c] = slid[r];
          }
        } else if (dir === 'down') {
          for (let c = 0; c < 4; c++) {
            const col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
            const slid = slideLine(col);
            for (let r = 0; r < 4; r++) grid[3 - r][c] = slid[r];
          }
        }

        if (JSON.stringify(grid) !== prev) {
          spawnTile();
          if (score > best) {
            best = score;
            localStorage.setItem('nova_2048_best', best);
          }
          render();
          if (isGameOver()) {
            statusEl.textContent = 'Game Over! Click New Game to try again.';
          }
        }
      }

      function isGameOver() {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return false;
            if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
            if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
          }
        }
        return true;
      }

      function render() {
        scoreEl.textContent = `Score: ${score}`;
        bestEl.textContent = `Best: ${best}`;
        boardEl.innerHTML = '';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const val = grid[r][c];
            const tile = document.createElement('div');
            const bg = TILE_COLORS[val] || '#ec4899';
            tile.style.cssText = `
              display: grid;
              place-items: center;
              border-radius: 10px;
              font-weight: 800;
              font-size: ${val >= 1024 ? '1.35rem' : val >= 128 ? '1.6rem' : '1.9rem'};
              background: ${bg};
              color: ${val <= 4 && val > 0 ? '#0f172a' : '#ffffff'};
            `;
            tile.textContent = val > 0 ? String(val) : '';
            boardEl.appendChild(tile);
          }
        }
      }

      function onKey(e) {
        const map = {
          ArrowLeft: 'left', KeyA: 'left',
          ArrowRight: 'right', KeyD: 'right',
          ArrowUp: 'up', KeyW: 'up',
          ArrowDown: 'down', KeyS: 'down'
        };
        if (map[e.code]) {
          e.preventDefault();
          move(map[e.code]);
        }
      }

      function onTouchStart(e) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }

      function onTouchEnd(e) {
        if (!touchStart) return;
        const dx = e.changedTouches[0].clientX - touchStart.x;
        const dy = e.changedTouches[0].clientY - touchStart.y;
        touchStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
        else move(dy > 0 ? 'down' : 'up');
      }

      window.addEventListener('keydown', onKey);
      boardEl.addEventListener('touchstart', onTouchStart, { passive: true });
      boardEl.addEventListener('touchend', onTouchEnd, { passive: true });
      resetBtn.addEventListener('click', init);

      init();

      return () => {
        window.removeEventListener('keydown', onKey);
      };
    }
  };
})();
