(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.tactical = {
    id: 'tactical',
    title: 'Tactical Breach',
    description: 'A Rainbow Six Siege-inspired target-practice mini-game: clear the room before targets escape.',
    categories: ['Popular', 'Arcade'],
    controls: 'Click or tap targets',
    badge: 'New',
    icon: '🎯',
    accent: 'linear-gradient(135deg, #475569, #0f766e)',

    mount(container) {
      const W = 680;
      const H = 400;
      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = '<span class="game-hud">Score: 0</span><span class="game-hud">Escapes: 0 / 5</span><button class="game-btn">Restart</button>';
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');
      container.append(toolbar, canvas);

      const [scoreEl, missesEl] = toolbar.querySelectorAll('.game-hud');
      const restartBtn = toolbar.querySelector('button');
      let targets = [];
      let score = 0;
      let misses = 0;
      let frame = 0;
      let ended = false;
      let animId;

      function reset() {
        targets = [];
        score = 0;
        misses = 0;
        frame = 0;
        ended = false;
        scoreEl.textContent = 'Score: 0';
        missesEl.textContent = 'Escapes: 0 / 5';
      }

      function update() {
        if (ended) return;
        frame++;
        if (frame % 72 === 0) {
          targets.push({
            x: W + 22,
            y: 58 + Math.random() * (H - 116),
            r: 19,
            speed: 1.8 + Math.random() * 1.5
          });
        }
        targets.forEach((target) => { target.x -= target.speed; });
        const remaining = [];
        targets.forEach((target) => {
          if (target.x + target.r < 0) misses++;
          else remaining.push(target);
        });
        targets = remaining;
        missesEl.textContent = `Escapes: ${misses} / 5`;
        if (misses >= 5) ended = true;
      }

      function draw() {
        ctx.fillStyle = '#101827';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.13)';
        for (let x = 0; x < W; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        targets.forEach((target) => {
          ctx.fillStyle = '#fb7185';
          ctx.beginPath(); ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffe4e6';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(target.x, target.y, target.r * 0.55, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(target.x - 26, target.y); ctx.lineTo(target.x + 26, target.y);
          ctx.moveTo(target.x, target.y - 26); ctx.lineTo(target.x, target.y + 26);
          ctx.stroke();
        });
        if (ended) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.76)'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('TRAINING OVER', W / 2, H / 2);
          ctx.font = '16px sans-serif'; ctx.fillStyle = '#7dd3fc';
          ctx.fillText('Press Restart to try again', W / 2, H / 2 + 28);
        }
      }

      function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
      }

      function onClick(event) {
        if (ended) return;
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * W / rect.width;
        const y = (event.clientY - rect.top) * H / rect.height;
        const index = targets.findIndex((target) => Math.hypot(target.x - x, target.y - y) < target.r + 4);
        if (index !== -1) {
          targets.splice(index, 1);
          score += 1;
          scoreEl.textContent = `Score: ${score}`;
        }
      }

      canvas.addEventListener('click', onClick);
      restartBtn.addEventListener('click', reset);
      reset();
      animId = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('click', onClick);
      };
    }
  };
})();
