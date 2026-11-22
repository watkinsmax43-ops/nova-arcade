(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.pong2p = {
    id: 'pong2p',
    title: 'Neon Pong',
    description: 'Fast-paced retro paddle showdown! Play 2-Player on one keyboard or Vs Computer.',
    categories: ['Popular', '2 Player', 'Vs Computer', 'Arcade'],
    controls: 'P1: W/S | P2: Up/Down (or Up/Down in 1P)',
    badge: '2P / CPU',
    icon: '🏓',
    accent: 'linear-gradient(135deg, #ec4899, #8b5cf6)',

    mount(container) {
      const W = 720;
      const H = 400;

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <button class="game-btn active" data-mode="cpu">Vs Computer</button>
        <button class="game-btn" data-mode="2p">2 Players</button>
        <span class="game-hud" id="pong-hud">0 : 0</span>
        <button class="game-btn" id="pong-reset">Reset</button>
      `;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(canvas);

      const hud = toolbar.querySelector('#pong-hud');
      const modeBtns = toolbar.querySelectorAll('[data-mode]');
      const resetBtn = toolbar.querySelector('#pong-reset');

      let mode = 'cpu';
      let keys = {};
      let p1, p2, ball, s1, s2, winner, animId;

      function resetMatch() {
        s1 = 0;
        s2 = 0;
        winner = null;
        p1 = { y: H / 2 - 42, h: 84 };
        p2 = { y: H / 2 - 42, h: 84 };
        serveBall(1);
      }

      function serveBall(dir) {
        const angle = (Math.random() - 0.5) * 0.9;
        const speed = 6.2;
        ball = {
          x: W / 2,
          y: H / 2,
          vx: Math.cos(angle) * speed * dir,
          vy: Math.sin(angle) * speed,
          r: 8
        };
      }

      function update() {
        if (winner) return;

        // Player 1 movement
        const p1Up = keys.KeyW || (mode === 'cpu' && keys.ArrowUp);
        const p1Down = keys.KeyS || (mode === 'cpu' && keys.ArrowDown);
        if (p1Up) p1.y -= 6.8;
        if (p1Down) p1.y += 6.8;
        p1.y = Math.max(8, Math.min(H - p1.h - 8, p1.y));

        // Player 2 / Computer movement
        if (mode === '2p') {
          if (keys.ArrowUp) p2.y -= 6.8;
          if (keys.ArrowDown) p2.y += 6.8;
        } else {
          const target = ball.y - p2.h / 2;
          const diff = target - p2.y;
          p2.y += Math.sign(diff) * Math.min(Math.abs(diff), 5.2);
        }
        p2.y = Math.max(8, Math.min(H - p2.h - 8, p2.y));

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y - ball.r <= 0 || ball.y + ball.r >= H) {
          ball.vy *= -1;
          ball.y = Math.max(ball.r, Math.min(H - ball.r, ball.y));
        }

        // Paddle collisions
        if (ball.vx < 0 && ball.x - ball.r <= 28 && ball.x - ball.r >= 14 && ball.y >= p1.y && ball.y <= p1.y + p1.h) {
          const hit = (ball.y - (p1.y + p1.h / 2)) / (p1.h / 2);
          const sp = Math.min(12.5, Math.hypot(ball.vx, ball.vy) * 1.06);
          const ang = hit * 0.95;
          ball.vx = Math.cos(ang) * sp;
          ball.vy = Math.sin(ang) * sp;
          ball.x = 29 + ball.r;
        }

        if (ball.vx > 0 && ball.x + ball.r >= W - 28 && ball.x + ball.r <= W - 14 && ball.y >= p2.y && ball.y <= p2.y + p2.h) {
          const hit = (ball.y - (p2.y + p2.h / 2)) / (p2.h / 2);
          const sp = Math.min(12.5, Math.hypot(ball.vx, ball.vy) * 1.06);
          const ang = hit * 0.95;
          ball.vx = -Math.cos(ang) * sp;
          ball.vy = Math.sin(ang) * sp;
          ball.x = W - 29 - ball.r;
        }

        if (ball.x < 0) {
          s2++;
          if (s2 >= 7) winner = mode === 'cpu' ? 'Computer' : 'Player 2';
          else serveBall(1);
        } else if (ball.x > W) {
          s1++;
          if (s1 >= 7) winner = 'Player 1';
          else serveBall(-1);
        }

        hud.textContent = `${s1} : ${s2} (First to 7)`;
      }

      function draw() {
        ctx.fillStyle = '#070b19';
        ctx.fillRect(0, 0, W, H);

        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(16, p1.y, 12, p1.h);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(W - 28, p2.y, 12, p2.h);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        if (winner) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 30px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🏆 ${winner} Wins!`, W / 2, H / 2 - 10);
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('Click Reset to play again', W / 2, H / 2 + 24);
        }
      }

      function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
      }

      function onKeyDown(e) {
        if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
          e.preventDefault();
          keys[e.code] = true;
        }
      }
      function onKeyUp(e) {
        keys[e.code] = false;
      }

      modeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          modeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          mode = btn.dataset.mode;
          resetMatch();
        });
      });
      resetBtn.addEventListener('click', resetMatch);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      resetMatch();
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }
  };
})();
