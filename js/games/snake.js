(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.snake = {
    id: 'snake',
    title: 'Neon Snake',
    description: 'Eat glowing orbs to grow longer without crashing into yourself!',
    categories: ['Arcade', 'Popular'],
    controls: 'Arrow Keys or WASD',
    badge: 'Arcade',
    icon: '🐍',
    accent: 'linear-gradient(135deg, #22c55e, #0d9488)',

    mount(container) {
      const GRID = 20;
      const CELL = 20;

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <span class="game-hud" id="snk-score">Score: 0</span>
        <span class="game-hud" id="snk-best">Best: ${localStorage.getItem('nova_snake_best') || 0}</span>
        <button class="game-btn" id="snk-wrap">Walls: Solid</button>
        <button class="game-btn" id="snk-reset">Restart</button>
      `;

      const canvas = document.createElement('canvas');
      canvas.width = GRID * CELL;
      canvas.height = GRID * CELL;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(canvas);

      const scoreEl = toolbar.querySelector('#snk-score');
      const bestEl = toolbar.querySelector('#snk-best');
      const wrapBtn = toolbar.querySelector('#snk-wrap');
      const resetBtn = toolbar.querySelector('#snk-reset');

      let snake, dir, nextDir, food, score, best, dead, wrapWalls, timerId;
      best = Number(localStorage.getItem('nova_snake_best') || 0);
      wrapWalls = false;

      function spawnFood() {
        while (true) {
          const fx = Math.floor(Math.random() * GRID);
          const fy = Math.floor(Math.random() * GRID);
          if (!snake.some((s) => s.x === fx && s.y === fy)) {
            return { x: fx, y: fy };
          }
        }
      }

      function init() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        dead = false;
        food = spawnFood();
        scoreEl.textContent = 'Score: 0';
        draw();
      }

      function tick() {
        if (dead) return;
        dir = nextDir;
        let hx = snake[0].x + dir.x;
        let hy = snake[0].y + dir.y;

        if (wrapWalls) {
          hx = (hx + GRID) % GRID;
          hy = (hy + GRID) % GRID;
        } else if (hx < 0 || hx >= GRID || hy < 0 || hy >= GRID) {
          dead = true;
          draw();
          return;
        }

        if (snake.some((s) => s.x === hx && s.y === hy)) {
          dead = true;
          draw();
          return;
        }

        snake.unshift({ x: hx, y: hy });
        if (hx === food.x && hy === food.y) {
          score += 10;
          scoreEl.textContent = `Score: ${score}`;
          if (score > best) {
            best = score;
            localStorage.setItem('nova_snake_best', best);
            bestEl.textContent = `Best: ${best}`;
          }
          food = spawnFood();
        } else {
          snake.pop();
        }
        draw();
      }

      function draw() {
        ctx.fillStyle = '#060c1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Food
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Snake
        snake.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? '#4ade80' : '#16a34a';
          ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
        });

        if (dead) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#4ade80';
          ctx.fillText('Press Space or Click Restart', canvas.width / 2, canvas.height / 2 + 20);
        }
      }

      function onKey(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (dead && e.code === 'Space') {
          init();
          return;
        }
        if ((e.code === 'ArrowUp' || e.code === 'KeyW') && dir.y !== 1) nextDir = { x: 0, y: -1 };
        if ((e.code === 'ArrowDown' || e.code === 'KeyS') && dir.y !== -1) nextDir = { x: 0, y: 1 };
        if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && dir.x !== 1) nextDir = { x: -1, y: 0 };
        if ((e.code === 'ArrowRight' || e.code === 'KeyD') && dir.x !== -1) nextDir = { x: 1, y: 0 };
      }

      wrapBtn.addEventListener('click', () => {
        wrapWalls = !wrapWalls;
        wrapBtn.textContent = wrapWalls ? 'Walls: Wrap' : 'Walls: Solid';
      });
      resetBtn.addEventListener('click', init);
      window.addEventListener('keydown', onKey);

      init();
      timerId = setInterval(tick, 105);

      return () => {
        clearInterval(timerId);
        window.removeEventListener('keydown', onKey);
      };
    }
  };
})();
