(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.storm = {
    id: 'storm',
    title: 'Storm Survival',
    description: 'A Fortnite-style mini battle arena: stay inside the shrinking safe zone and outlast the bots.',
    categories: ['Popular', 'Arcade'],
    controls: 'WASD / Arrow Keys to move, click / Space to fire',
    badge: 'New',
    icon: '🌩️',
    accent: 'linear-gradient(135deg, #7c3aed, #0f172a)',

    mount(container) {
      const W = 620;
      const H = 440;
      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = '<span class="game-hud">Health: 3</span><span class="game-hud">Bots left: 0</span><button class="game-btn">Restart</button>';
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');
      container.append(toolbar, canvas);
      const [healthEl, botsEl] = toolbar.querySelectorAll('.game-hud');
      const restartBtn = toolbar.querySelector('button');
      let player, bots, shots, health, frame, radius, spawned, kills, ended, won, keys, pointer, animId;

      function reset() {
        player = { x: W / 2, y: H / 2, r: 12 };
        bots = [];
        shots = [];
        health = 3;
        frame = 0;
        radius = 195;
        spawned = 0;
        kills = 0;
        ended = false;
        won = false;
        keys = {};
        pointer = { x: W / 2, y: H / 2 - 100 };
        healthEl.textContent = 'Health: 3';
        botsEl.textContent = 'Bots left: 7';
      }
      function shoot() {
        if (ended) return;
        const angle = Math.atan2(pointer.y - player.y, pointer.x - player.x);
        shots.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7 });
      }
      function update() {
        if (ended) return;
        frame++;
        if (frame % 90 === 0 && spawned < 7) {
          const angle = Math.random() * Math.PI * 2;
          bots.push({ x: W / 2 + Math.cos(angle) * (radius * 0.72), y: H / 2 + Math.sin(angle) * (radius * 0.72), r: 11 });
          spawned++;
        }
        radius = Math.max(70, 195 - frame * 0.035);
        let dx = 0, dy = 0;
        if (keys.ArrowLeft || keys.KeyA) dx--;
        if (keys.ArrowRight || keys.KeyD) dx++;
        if (keys.ArrowUp || keys.KeyW) dy--;
        if (keys.ArrowDown || keys.KeyS) dy++;
        if (dx || dy) {
          const length = Math.hypot(dx, dy);
          player.x += dx / length * 3.2;
          player.y += dy / length * 3.2;
        }
        player.x = Math.max(player.r, Math.min(W - player.r, player.x));
        player.y = Math.max(player.r, Math.min(H - player.r, player.y));
        if (Math.hypot(player.x - W / 2, player.y - H / 2) > radius - player.r) {
          if (frame % 35 === 0) health--;
        }
        bots.forEach((bot) => {
          const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
          bot.x += Math.cos(angle) * 0.8;
          bot.y += Math.sin(angle) * 0.8;
          if (Math.hypot(player.x - bot.x, player.y - bot.y) < player.r + bot.r && frame % 28 === 0) health--;
        });
        shots.forEach((shot) => { shot.x += shot.vx; shot.y += shot.vy; });
        shots = shots.filter((shot) => shot.x >= 0 && shot.x <= W && shot.y >= 0 && shot.y <= H);
        for (let i = bots.length - 1; i >= 0; i--) {
          const hitShot = shots.findIndex((shot) =>
            Math.hypot(shot.x - bots[i].x, shot.y - bots[i].y) < bots[i].r + 5
          );
          if (hitShot !== -1) {
            bots.splice(i, 1);
            shots.splice(hitShot, 1);
            kills++;
          }
        }
        healthEl.textContent = `Health: ${Math.max(0, health)}`;
        botsEl.textContent = `Bots left: ${7 - kills}`;
        if (health <= 0) ended = true;
        if (kills === 7) { ended = true; won = true; }
      }
      function draw() {
        ctx.fillStyle = '#14202c'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(139, 92, 246, .22)';
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.beginPath(); ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#1e3a36'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2); ctx.stroke();
        bots.forEach((bot) => {
          ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(bot.x, bot.y, bot.r, 0, Math.PI * 2); ctx.fill();
        });
        shots.forEach((shot) => {
          ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
        if (ended) {
          ctx.fillStyle = 'rgba(2, 6, 23, .72)'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(won ? 'YOU SURVIVED!' : 'ELIMINATED', W / 2, H / 2 - 8);
          ctx.font = '15px sans-serif'; ctx.fillStyle = '#c4b5fd'; ctx.fillText('Press Restart to drop back in', W / 2, H / 2 + 22);
        }
      }
      function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
      function onKeyDown(event) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
        keys[event.code] = true;
        if (event.code === 'Space' && !event.repeat) shoot();
      }
      function onKeyUp(event) { keys[event.code] = false; }
      function onPointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        pointer = { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
      }
      function onPointerDown(event) { onPointerMove(event); shoot(); }
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      restartBtn.addEventListener('click', reset);
      reset();
      animId = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }
  };
})();
