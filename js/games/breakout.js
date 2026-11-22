(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.breakout = {
    id: 'breakout',
    title: 'Brick Breaker',
    description: 'Bounce the energy ball to smash all neon bricks and advance levels!',
    categories: ['Arcade', 'Classic'],
    controls: 'Mouse / Touch or Left/Right Arrows',
    badge: 'Arcade',
    icon: '💥',
    accent: 'linear-gradient(135deg, #f43f5e, #fb923c)',

    mount(container) {
      const W = 640;
      const H = 420;
      const ROW_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8'];

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <span class="game-hud" id="brk-score">Score: 0</span>
        <span class="game-hud" id="brk-lives">Lives: 3</span>
        <button class="game-btn" id="brk-reset">Restart</button>
      `;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(canvas);

      const scoreEl = toolbar.querySelector('#brk-score');
      const livesEl = toolbar.querySelector('#brk-lives');
      const resetBtn = toolbar.querySelector('#brk-reset');

      let paddle, ball, bricks, score, lives, gameOver, keys = {}, animId;

      function buildBricks() {
        const list = [];
        const cols = 9;
        const rows = 5;
        const bw = 60;
        const bh = 18;
        const pad = 8;
        const offsetX = (W - (cols * bw + (cols - 1) * pad)) / 2;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            list.push({
              x: offsetX + c * (bw + pad),
              y: 44 + r * (bh + pad),
              w: bw,
              h: bh,
              color: ROW_COLORS[r],
              alive: true
            });
          }
        }
        return list;
      }

      function resetBall() {
        ball = { x: W / 2, y: H - 52, vx: (Math.random() > 0.5 ? 1 : -1) * 4.2, vy: -4.6, r: 8 };
      }

      function init() {
        paddle = { x: W / 2 - 50, y: H - 28, w: 100, h: 12 };
        bricks = buildBricks();
        score = 0;
        lives = 3;
        gameOver = false;
        resetBall();
        updateHud();
      }

      function updateHud() {
        scoreEl.textContent = `Score: ${score}`;
        livesEl.textContent = `Lives: ${lives}`;
      }

      function update() {
        if (gameOver) return;

        if (keys.ArrowLeft || keys.KeyA) paddle.x -= 7.2;
        if (keys.ArrowRight || keys.KeyD) paddle.x += 7.2;
        paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
        if (ball.y - ball.r < 0) ball.vy *= -1;

        if (
          ball.vy > 0 &&
          ball.y + ball.r >= paddle.y &&
          ball.y - ball.r <= paddle.y + paddle.h &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.w
        ) {
          const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const speed = Math.min(9.5, Math.hypot(ball.vx, ball.vy) * 1.02);
          const angle = hit * 1.05;
          ball.vx = Math.sin(angle) * speed;
          ball.vy = -Math.cos(angle) * speed;
        }

        for (const b of bricks) {
          if (!b.alive) continue;
          if (
            ball.x + ball.r > b.x &&
            ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y &&
            ball.y - ball.r < b.y + b.h
          ) {
            b.alive = false;
            ball.vy *= -1;
            score += 20;
            updateHud();
            break;
          }
        }

        if (bricks.every((b) => !b.alive)) {
          bricks = buildBricks();
          resetBall();
        }

        if (ball.y - ball.r > H) {
          lives--;
          updateHud();
          if (lives <= 0) gameOver = true;
          else resetBall();
        }
      }

      function draw() {
        ctx.fillStyle = '#090f24';
        ctx.fillRect(0, 0, W, H);

        for (const b of bricks) {
          if (!b.alive) continue;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        if (gameOver) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', W / 2, H / 2 - 8);
          ctx.font = '15px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('Click Restart to play again', W / 2, H / 2 + 22);
        }
      }

      function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
      }

      function movePointer(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = ((clientX - rect.left) * canvas.width) / rect.width;
        paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
      }

      function onKeyDown(e) {
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
          e.preventDefault();
          keys[e.code] = true;
        }
      }
      function onKeyUp(e) {
        keys[e.code] = false;
      }

      canvas.addEventListener('mousemove', movePointer);
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); movePointer(e); }, { passive: false });
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      resetBtn.addEventListener('click', init);

      init();
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }
  };
})();
