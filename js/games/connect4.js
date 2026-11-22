(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.connect4 = {
    id: 'connect4',
    title: 'Connect 4',
    description: 'Drop colored discs and connect 4 in a row! Play Vs Computer or 2-Player Local.',
    categories: ['Popular', '2 Player', 'Vs Computer', 'Puzzle'],
    controls: 'Click a column to drop a disc',
    badge: '2P / CPU',
    icon: '🔴',
    accent: 'linear-gradient(135deg, #ef4444, #f59e0b)',

    mount(container) {
      const ROWS = 6;
      const COLS = 7;

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <button class="game-btn active" data-mode="cpu">Vs Computer</button>
        <button class="game-btn" data-mode="2p">2 Players</button>
        <span class="game-hud" id="c4-hud">Red's Turn</span>
        <button class="game-btn" id="c4-reset">New Game</button>
      `;

      const boardWrap = document.createElement('div');
      boardWrap.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 52px);
        gap: 8px;
        background: #1d4ed8;
        padding: 14px;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        border: 3px solid #3b82f6;
      `;

      container.appendChild(toolbar);
      container.appendChild(boardWrap);

      const hud = toolbar.querySelector('#c4-hud');
      const modeBtns = toolbar.querySelectorAll('[data-mode]');
      const resetBtn = toolbar.querySelector('#c4-reset');

      let mode = 'cpu';
      let board = [];
      let turn = 1; // 1 = Red, 2 = Yellow (CPU)
      let gameOver = false;
      let winCells = [];
      let cpuTimer = null;

      function init() {
        clearTimeout(cpuTimer);
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        turn = 1;
        gameOver = false;
        winCells = [];
        updateHud();
        render();
      }

      function updateHud(msg) {
        if (msg) {
          hud.textContent = msg;
          return;
        }
        const who = turn === 1 ? 'Red (P1)' : mode === 'cpu' ? 'Yellow (CPU)' : 'Yellow (P2)';
        hud.textContent = `${who}'s Turn`;
      }

      function findDropRow(col) {
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][col] === 0) return r;
        }
        return -1;
      }

      function checkWin(player) {
        const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (board[r][c] !== player) continue;
            for (const [dr, dc] of dirs) {
              const cells = [[r, c]];
              for (let k = 1; k < 4; k++) {
                const nr = r + dr * k;
                const nc = c + dc * k;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                  cells.push([nr, nc]);
                } else break;
              }
              if (cells.length === 4) return cells;
            }
          }
        }
        return null;
      }

      function isDraw() {
        return board[0].every((v) => v !== 0);
      }

      function chooseCpuCol() {
        const valid = [];
        for (let c = 0; c < COLS; c++) {
          if (findDropRow(c) !== -1) valid.push(c);
        }
        // 1. Winning move
        for (const c of valid) {
          const r = findDropRow(c);
          board[r][c] = 2;
          const w = checkWin(2);
          board[r][c] = 0;
          if (w) return c;
        }
        // 2. Block player winning move
        for (const c of valid) {
          const r = findDropRow(c);
          board[r][c] = 1;
          const w = checkWin(1);
          board[r][c] = 0;
          if (w) return c;
        }
        // 3. Prefer center columns
        valid.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
        return valid[0];
      }

      function dropDisc(col) {
        if (gameOver) return;
        const row = findDropRow(col);
        if (row === -1) return;

        board[row][col] = turn;
        const win = checkWin(turn);
        if (win) {
          winCells = win;
          gameOver = true;
          const winnerName = turn === 1 ? 'Red (P1)' : mode === 'cpu' ? 'Computer' : 'Yellow (P2)';
          updateHud(`🏆 ${winnerName} Wins!`);
          render();
          return;
        }
        if (isDraw()) {
          gameOver = true;
          updateHud('🤝 Draw Game!');
          render();
          return;
        }

        turn = turn === 1 ? 2 : 1;
        updateHud();
        render();

        if (mode === 'cpu' && turn === 2 && !gameOver) {
          cpuTimer = setTimeout(() => {
            dropDisc(chooseCpuCol());
          }, 380);
        }
      }

      function render() {
        boardWrap.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('button');
            const val = board[r][c];
            const isWin = winCells.some(([wr, wc]) => wr === r && wc === c);
            cell.style.cssText = `
              width: 52px;
              height: 52px;
              border-radius: 50%;
              border: ${isWin ? '3px solid #ffffff' : 'none'};
              cursor: ${gameOver ? 'default' : 'pointer'};
              background: ${val === 1 ? '#ef4444' : val === 2 ? '#facc15' : '#0f172a'};
              box-shadow: inset 0 4px 8px rgba(0,0,0,0.45);
              transition: transform 0.12s;
            `;
            cell.addEventListener('click', () => {
              if (mode === 'cpu' && turn === 2) return;
              dropDisc(c);
            });
            boardWrap.appendChild(cell);
          }
        }
      }

      modeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          modeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          mode = btn.dataset.mode;
          init();
        });
      });

      resetBtn.addEventListener('click', init);
      init();

      return () => clearTimeout(cpuTimer);
    }
  };
})();
