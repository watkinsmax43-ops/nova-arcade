(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.flappy = {
    id: 'flappy',
    title: 'Cyber Bird',
    description: 'Tap to flap through glowing laser gates and set a new high score!',
    categories: ['Popular', 'Arcade'],
    controls: 'Space / Click / Tap to flap',
    badge: 'Arcade',
    icon: '🐦',
    accent: 'linear-gradient(135deg, #38bdf8, #2563eb)',

    mount(container) {
      const W = 440;
      const H = 500;

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <span class="game-hud" id="flp-score">Score: 0</span>
        <span class="game-hud" id="flp-best">Best: ${localStorage.getItem('nova_flappy_best') || 0}</span>
        <button class="game-btn" id="flp-reset">Restart</button>
      `;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(canvas);

      const scoreEl = toolbar.querySelector('#flp-score');
      const bestEl = toolbar.querySelector('#flp-best');
      const resetBtn = toolbar.querySelector('#flp-reset');

      let bird, pipes, score, best, started, dead, frame, animId;
      best = Number(localStorage.getItem('nova_flappy_best') || 0);

      function init() {
        bird = { x: 110, y: H / 2, vy: 0, r: 14 };
        pipes = [];
        score = 0;
        started = false;
        dead = false;
        frame = 0;
        scoreEl.textContent = 'Score: 0';
      }

      function flap() {
        if (dead) {
          init();
          return;
        }
        started = true;
        bird.vy = -7.6;
      }

      function update() {
        if (!started || dead) return;

        frame++;
        bird.vy += 0.42;
        bird.y += bird.vy;

        if (bird.y + bird.r >= H || bird.y - bird.r <= 0) {
          die();
        }

        if (frame % 95 === 0) {
          const gap = 136;
          const topH = 60 + Math.random() * (H - gap - 120);
          pipes.push({ x: W + 20, top: topH, gap, w: 54, passed: false });
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i];
          p.x -= 3.1;

          if (!p.passed && p.x + p.w < bird.x) {
            p.passed = true;
            score++;
            scoreEl.textContent = `Score: ${score}`;
          }

          if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w) {
            if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) {
              die();
            }
          }

          if (p.x + p.w < -20) pipes.splice(i, 1);
        }
      }

      function die() {
        dead = true;
        if (score > best) {
          best = score;
          localStorage.setItem('nova_flappy_best', best);
          bestEl.textContent = `Best: ${best}`;
        }
      }

      function draw() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0c1436');
        bg.addColorStop(1, '#1d2b64');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        for (const p of pipes) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(p.x, 0, p.w, p.top);
          ctx.fillRect(p.x, p.top + p.gap, p.w, H - (p.top + p.gap));
          ctx.strokeStyle = '#6ee7b7';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, 0, p.w, p.top);
          ctx.strokeRect(p.x, p.top + p.gap, p.w, H - (p.top + p.gap));
        }

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(bird.x + 5, bird.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        if (!started) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Click or Press Space to Fly!', W / 2, H / 2 - 48);
        } else if (dead) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', W / 2, H / 2 - 12);
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('Click or Space to Retry', W / 2, H / 2 + 20);
        }
      }

      function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
      }

      function onKey(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          flap();
        }
      }

      canvas.addEventListener('mousedown', flap);
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
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
