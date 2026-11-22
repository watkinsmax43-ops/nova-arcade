(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.dash = {
    id: 'dash',
    title: 'Neon Dash',
    description: 'Jump over neon spikes, ride blocks, and survive the endless rhythm dash!',
    categories: ['Popular', 'Arcade'],
    controls: 'Space / Up Arrow / Click / Tap to jump',
    badge: 'Popular',
    icon: '⚡',
    accent: 'linear-gradient(135deg, #06b6d4, #3b82f6)',

    mount(container) {
      const W = 760;
      const H = 360;
      const GROUND = H - 56;

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <span class="game-hud" id="dash-score">Score: 0</span>
        <span class="game-hud" id="dash-best">Best: ${localStorage.getItem('nova_dash_best') || 0}</span>
        <button class="game-btn" id="dash-restart">Restart</button>
      `;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(canvas);

      const scoreEl = toolbar.querySelector('#dash-score');
      const bestEl = toolbar.querySelector('#dash-best');
      const restartBtn = toolbar.querySelector('#dash-restart');

      let player, obstacles, particles, speed, score, best, dead, spawnTimer, animId;
      best = Number(localStorage.getItem('nova_dash_best') || 0);

      function reset() {
        player = { x: 110, y: GROUND - 34, size: 34, vy: 0, rot: 0, onGround: true };
        obstacles = [];
        particles = [];
        speed = 6.2;
        score = 0;
        dead = false;
        spawnTimer = 45;
      }

      function jump() {
        if (dead) {
          reset();
          return;
        }
        if (player.onGround) {
          player.vy = -12.8;
          player.onGround = false;
        }
      }

      function spawnPattern() {
        const r = Math.random();
        if (r < 0.38) {
          obstacles.push({ type: 'spike', x: W + 20, y: GROUND, w: 30, h: 34 });
        } else if (r < 0.68) {
          obstacles.push({ type: 'spike', x: W + 20, y: GROUND, w: 28, h: 34 });
          obstacles.push({ type: 'spike', x: W + 50, y: GROUND, w: 28, h: 34 });
        } else if (r < 0.88) {
          obstacles.push({ type: 'block', x: W + 20, y: GROUND - 40, w: 46, h: 40 });
        } else {
          obstacles.push({ type: 'block', x: W + 20, y: GROUND - 42, w: 60, h: 42 });
          obstacles.push({ type: 'spike', x: W + 115, y: GROUND, w: 28, h: 32 });
        }
      }

      function update() {
        if (dead) return;

        score += 1;
        speed = Math.min(11.5, 6.2 + score * 0.0022);
        scoreEl.textContent = `Score: ${Math.floor(score / 6)}`;

        // Gravity
        player.vy += 0.68;
        player.y += player.vy;
        player.onGround = false;

        if (player.y + player.size >= GROUND) {
          player.y = GROUND - player.size;
          player.vy = 0;
          player.onGround = true;
        }

        // Trail particles
        if (Math.random() < 0.6) {
          particles.push({
            x: player.x,
            y: player.y + player.size * 0.7,
            vx: -speed * 0.5,
            vy: (Math.random() - 0.5) * 1.4,
            life: 18
          });
        }
        particles = particles.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          return p.life > 0;
        });

        spawnTimer -= 1;
        if (spawnTimer <= 0) {
          spawnPattern();
          spawnTimer = Math.max(34, Math.floor(68 - speed * 2.5 + Math.random() * 24));
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.x -= speed;

          if (o.type === 'spike') {
            // Forgiving triangle hitbox
            const px = player.x + 6;
            const pw = player.size - 12;
            const py = player.y + 4;
            const ph = player.size - 4;
            if (px < o.x + o.w - 6 && px + pw > o.x + 6 && py + ph > o.y - o.h + 8) {
              triggerDeath();
            }
          } else if (o.type === 'block') {
            const hitX = player.x + player.size > o.x + 4 && player.x < o.x + o.w - 4;
            const hitY = player.y + player.size > o.y && player.y < o.y + o.h;
            if (hitX && hitY) {
              // Allow landing cleanly on top
              if (player.vy >= 0 && player.y + player.size - player.vy <= o.y + 12) {
                player.y = o.y - player.size;
                player.vy = 0;
                player.onGround = true;
              } else {
                triggerDeath();
              }
            }
          }

          if (o.x + o.w < -40) obstacles.splice(i, 1);
        }

        if (!player.onGround) {
          player.rot += 0.14;
        } else {
          player.rot = Math.round(player.rot / (Math.PI / 2)) * (Math.PI / 2);
        }
      }

      function triggerDeath() {
        dead = true;
        const finalScore = Math.floor(score / 6);
        if (finalScore > best) {
          best = finalScore;
          localStorage.setItem('nova_dash_best', best);
          bestEl.textContent = `Best: ${best}`;
        }
      }

      function draw() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a');
        bg.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Moving background grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 1;
        const offset = (score * 2) % 40;
        for (let x = -offset; x < W; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND); ctx.stroke();
        }

        // Ground
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(W, GROUND);
        ctx.stroke();

        // Particles
        for (const p of particles) {
          ctx.fillStyle = `rgba(56, 189, 248, ${p.life / 18})`;
          ctx.fillRect(p.x, p.y, 6, 6);
        }

        // Obstacles
        for (const o of obstacles) {
          if (o.type === 'spike') {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(o.x + o.w / 2, o.y - o.h);
            ctx.lineTo(o.x + o.w, o.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fda4af';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeStyle = '#ddd6fe';
            ctx.lineWidth = 2;
            ctx.strokeRect(o.x, o.y, o.w, o.h);
          }
        }

        // Player cube
        ctx.save();
        ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
        ctx.rotate(player.rot);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
        ctx.strokeStyle = '#ecfeff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, -7, 6, 6);
        ctx.fillRect(5, -7, 6, 6);
        ctx.restore();

        if (dead) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 30px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CRASHED!', W / 2, H / 2 - 14);
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('Press Space or Click to Retry', W / 2, H / 2 + 20);
        }
      }

      function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
      }

      function onKey(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          jump();
        }
      }

      canvas.addEventListener('mousedown', jump);
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });
      window.addEventListener('keydown', onKey);
      restartBtn.addEventListener('click', reset);

      reset();
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKey);
      };
    }
  };
})();
