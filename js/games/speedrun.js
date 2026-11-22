(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.speedrun = {
    id: 'speedrun',
    title: 'Sonic Speed Run',
    description: 'A Sonic-style speed run: race through a bright course, scoop up rings, and leap over hazards.',
    categories: ['Popular', 'Arcade'],
    controls: 'Space / Up Arrow / Click / Tap to jump',
    badge: 'New',
    icon: '💨',
    accent: 'linear-gradient(135deg, #0284c7, #facc15)',

    mount(container) {
      const W = 760;
      const H = 360;
      const GROUND = H - 54;
      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = '<span class="game-hud">Rings: 0</span><span class="game-hud">Distance: 0</span><button class="game-btn">Restart</button>';
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');
      container.append(toolbar, canvas);
      const [ringsEl, distanceEl] = toolbar.querySelectorAll('.game-hud');
      const restartBtn = toolbar.querySelector('button');
      let runner, hazards, rings, score, distance, dead, timer, animId;

      function reset() {
        runner = { x: 115, y: GROUND - 32, vy: 0, size: 32, grounded: true };
        hazards = [];
        rings = [];
        score = 0;
        distance = 0;
        dead = false;
        timer = 0;
        ringsEl.textContent = 'Rings: 0';
        distanceEl.textContent = 'Distance: 0';
      }

      function jump() {
        if (dead) { reset(); return; }
        if (runner.grounded) {
          runner.vy = -12.4;
          runner.grounded = false;
        }
      }

      function update() {
        if (dead) return;
        distance += 1;
        timer++;
        runner.vy += 0.62;
        runner.y += runner.vy;
        runner.grounded = false;
        if (runner.y + runner.size >= GROUND) {
          runner.y = GROUND - runner.size;
          runner.vy = 0;
          runner.grounded = true;
        }
        if (timer % 86 === 0) {
          hazards.push({ x: W + 20, w: 25, h: 33 });
          if (Math.random() < 0.8) {
            const ringY = GROUND - 85 - Math.random() * 95;
            for (let i = 0; i < 4; i++) rings.push({ x: W + 50 + i * 27, y: ringY, taken: false });
          }
        }
        hazards.forEach((hazard) => { hazard.x -= 5.8; });
        rings.forEach((ring) => { ring.x -= 5.8; });
        hazards = hazards.filter((hazard) => hazard.x + hazard.w > 0);
        rings = rings.filter((ring) => ring.x > -12 && !ring.taken);
        hazards.forEach((hazard) => {
          if (runner.x + runner.size - 6 > hazard.x + 3 &&
              runner.x + 6 < hazard.x + hazard.w - 3 &&
              runner.y + runner.size - 4 > GROUND - hazard.h) dead = true;
        });
        rings.forEach((ring) => {
          if (Math.hypot(runner.x + runner.size / 2 - ring.x, runner.y + runner.size / 2 - ring.y) < 27) {
            ring.taken = true;
            score++;
            ringsEl.textContent = `Rings: ${score}`;
          }
        });
        distanceEl.textContent = `Distance: ${Math.floor(distance / 6)}m`;
      }

      function draw() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0ea5e9'); bg.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.14)';
        for (let x = 24 - (distance * 2 % 140); x < W; x += 140) {
          ctx.beginPath(); ctx.ellipse(x, 78, 35, 10, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#166534'; ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = '#a3e635'; ctx.fillRect(0, GROUND, W, 8);
        rings.forEach((ring) => {
          ctx.strokeStyle = '#fde047'; ctx.lineWidth = 5; ctx.beginPath();
          ctx.arc(ring.x, ring.y, 10, 0, Math.PI * 2); ctx.stroke();
        });
        hazards.forEach((hazard) => {
          ctx.fillStyle = '#f97316';
          ctx.beginPath(); ctx.moveTo(hazard.x, GROUND); ctx.lineTo(hazard.x + hazard.w / 2, GROUND - hazard.h);
          ctx.lineTo(hazard.x + hazard.w, GROUND); ctx.closePath(); ctx.fill();
        });
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(runner.x + runner.size / 2, runner.y + runner.size / 2, runner.size / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(runner.x + 22, runner.y + 10, 4, 0, Math.PI * 2); ctx.fill();
        if (dead) {
          ctx.fillStyle = 'rgba(2, 6, 23, .72)'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('WIPEOUT!', W / 2, H / 2 - 10);
          ctx.font = '16px sans-serif'; ctx.fillStyle = '#fde047'; ctx.fillText('Jump or press Restart to run again', W / 2, H / 2 + 22);
        }
      }

      function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
      function onKey(event) {
        if (['Space', 'ArrowUp'].includes(event.code)) { event.preventDefault(); jump(); }
      }
      function onTap(event) { event.preventDefault(); jump(); }
      canvas.addEventListener('pointerdown', onTap);
      window.addEventListener('keydown', onKey);
      restartBtn.addEventListener('click', reset);
      reset();
      animId = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('pointerdown', onTap);
        window.removeEventListener('keydown', onKey);
      };
    }
  };
})();
