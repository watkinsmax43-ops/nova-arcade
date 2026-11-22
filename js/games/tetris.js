(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.tetris = {
    id: 'tetris',
    title: 'Block Drop',
    description: 'Stack falling blocks, clear full lines, and beat your high score!',
    categories: ['Popular', 'Puzzle', 'Arcade'],
    controls: 'Arrows: Move/Rotate | Space: Hard Drop',
    badge: 'Classic',
    icon: '🧱',
    accent: 'linear-gradient(135deg, #6366f1, #a855f7)',

    mount(container) {
      const COLS = 10;
      const ROWS = 20;
      const SIZE = 22;

      const SHAPES = [
        null,
        [[1, 1, 1, 1]],
        [[2, 2], [2, 2]],
        [[0, 3, 0], [3, 3, 3]],
        [[0, 4, 4], [4, 4, 0]],
        [[5, 5, 0], [0, 5, 5]],
        [[6, 0, 0], [6, 6, 6]],
        [[0, 0, 7], [7, 7, 7]]
      ];

      const COLORS = [
        '#0f172a', '#22d3ee', '#facc15', '#a855f7',
        '#22c55e', '#ef4444', '#3b82f6', '#f97316'
      ];

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <span class="game-hud" id="tet-score">Score: 0</span>
        <span class="game-hud" id="tet-lines">Lines: 0</span>
        <button class="game-btn" id="tet-reset">Restart</button>
      `;

      const canvas = document.createElement('canvas');
      canvas.width = COLS * SIZE;
      canvas.height = ROWS * SIZE;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(canvas);

      const scoreEl = toolbar.querySelector('#tet-score');
      const linesEl = toolbar.querySelector('#tet-lines');
      const resetBtn = toolbar.querySelector('#tet-reset');

      let board, piece, score, lines, dropCounter, lastTime, gameOver, animId;

      function randomPiece() {
        const type = Math.floor(Math.random() * 7) + 1;
        const matrix = SHAPES[type].map((row) => [...row]);
        return {
          matrix,
          x: Math.floor((COLS - matrix[0].length) / 2),
          y: 0
        };
      }

      function init() {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        score = 0;
        lines = 0;
        dropCounter = 0;
        lastTime = 0;
        gameOver = false;
        piece = randomPiece();
        updateHud();
      }

      function updateHud() {
        scoreEl.textContent = `Score: ${score}`;
        linesEl.textContent = `Lines: ${lines}`;
      }

      function collide(mat, px, py) {
        for (let r = 0; r < mat.length; r++) {
          for (let c = 0; c < mat[r].length; c++) {
            if (!mat[r][c]) continue;
            const nx = px + c;
            const ny = py + r;
            if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
            if (ny >= 0 && board[ny][nx]) return true;
          }
        }
        return false;
      }

      function merge() {
        piece.matrix.forEach((row, r) => {
          row.forEach((val, c) => {
            if (val && piece.y + r >= 0) {
              board[piece.y + r][piece.x + c] = val;
            }
          });
        });
      }

      function sweepLines() {
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].every((v) => v !== 0)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            r++;
          }
        }
        if (cleared > 0) {
          lines += cleared;
          score += [0, 100, 300, 500, 800][cleared] || 800;
          updateHud();
        }
      }

      function rotateMatrix(mat) {
        return mat[0].map((_, c) => mat.map((row) => row[c]).reverse());
      }

      function dropPiece() {
        piece.y++;
        if (collide(piece.matrix, piece.x, piece.y)) {
          piece.y--;
          merge();
          sweepLines();
          piece = randomPiece();
          if (collide(piece.matrix, piece.x, piece.y)) {
            gameOver = true;
          }
        }
        dropCounter = 0;
      }

      function drawCell(x, y, colorIdx, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS[colorIdx];
        ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, SIZE - 2);
        ctx.restore();
      }

      function draw() {
        ctx.fillStyle = '#070b18';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (board[r][c]) drawCell(c, r, board[r][c]);
          }
        }

        if (!gameOver) {
          // Ghost piece
          let gy = piece.y;
          while (!collide(piece.matrix, piece.x, gy + 1)) gy++;
          piece.matrix.forEach((row, r) => {
            row.forEach((val, c) => {
              if (val) drawCell(piece.x + c, gy + r, val, 0.22);
            });
          });

          // Active piece
          piece.matrix.forEach((row, r) => {
            row.forEach((val, c) => {
              if (val) drawCell(piece.x + c, piece.y + r, val, 1);
            });
          });
        } else {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
      }

      function loop(time = 0) {
        const dt = time - lastTime;
        lastTime = time;
        if (!gameOver) {
          dropCounter += dt;
          const interval = Math.max(120, 620 - lines * 14);
          if (dropCounter > interval) dropPiece();
        }
        draw();
        animId = requestAnimationFrame(loop);
      }

      function onKey(e) {
        if (gameOver) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (e.code === 'ArrowLeft' && !collide(piece.matrix, piece.x - 1, piece.y)) piece.x--;
        else if (e.code === 'ArrowRight' && !collide(piece.matrix, piece.x + 1, piece.y)) piece.x++;
        else if (e.code === 'ArrowDown') dropPiece();
        else if (e.code === 'ArrowUp') {
          const rotated = rotateMatrix(piece.matrix);
          if (!collide(rotated, piece.x, piece.y)) piece.matrix = rotated;
        } else if (e.code === 'Space') {
          while (!collide(piece.matrix, piece.x, piece.y + 1)) piece.y++;
          dropPiece();
        }
      }

      window.addEventListener('keydown', onKey);
      resetBtn.addEventListener('click', init);
      init();
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKey);
      };
    }
  };
})();
