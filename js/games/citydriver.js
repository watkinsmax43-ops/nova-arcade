(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.citydriver = {
    id: 'citydriver',
    title: 'Grand City Driver',
    description: 'A GTA 5-style city-driving mini-game: cruise the highway, change lanes, and dodge traffic.',
    categories: ['Popular', 'Arcade'],
    controls: 'A / D or Left / Right Arrow to steer',
    badge: 'New',
    icon: '🚘',
    accent: 'linear-gradient(135deg, #334155, #7c3aed)',

    mount(container) {
      const W = 560;
      const H = 440;
      const laneW = 116;
      const roadX = (W - laneW * 3) / 2;
      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = '<span class="game-hud">Distance: 0m</span><span class="game-hud">Best: 0m</span><button class="game-btn">Restart</button>';
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');
      container.append(toolbar, canvas);
      const [distanceEl, bestEl] = toolbar.querySelectorAll('.game-hud');
      const restartBtn = toolbar.querySelector('button');
      let carLane, traffic, distance, lineOffset, ended, keys, animId, frame;
      let best = Number(localStorage.getItem('nova_citydriver_best') || 0);
      bestEl.textContent = `Best: ${best}m`;

      function reset() {
        carLane = 1;
        traffic = [];
        distance = 0;
        lineOffset = 0;
        frame = 0;
        ended = false;
        keys = {};
        distanceEl.textContent = 'Distance: 0m';
      }
      function update() {
        if (ended) return;
        frame++;
        if ((keys.ArrowLeft || keys.KeyA) && carLane > 0) { carLane--; keys.ArrowLeft = keys.KeyA = false; }
        if ((keys.ArrowRight || keys.KeyD) && carLane < 2) { carLane++; keys.ArrowRight = keys.KeyD = false; }
        const speed = 3.3 + Math.min(3, distance / 700);
        lineOffset = (lineOffset + speed * 2) % 70;
        distance += speed / 6;
        distanceEl.textContent = `Distance: ${Math.floor(distance)}m`;
        if (frame % 56 === 0) {
          const lane = Math.floor(Math.random() * 3);
          traffic.push({ lane, y: -70, color: ['#f97316', '#22c55e', '#a78bfa'][Math.floor(Math.random() * 3)] });
        }
        traffic.forEach((vehicle) => { vehicle.y += speed * 2; });
        traffic = traffic.filter((vehicle) => vehicle.y < H + 70);
        if (traffic.some((vehicle) => vehicle.lane === carLane && vehicle.y > H - 118 && vehicle.y < H - 35)) {
          ended = true;
          if (Math.floor(distance) > best) {
            best = Math.floor(distance);
            localStorage.setItem('nova_citydriver_best', best);
            bestEl.textContent = `Best: ${best}m`;
          }
        }
      }
      function drawCar(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x - 23, y - 34, 46, 68);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(x - 16, y - 24, 32, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - 28, y - 23, 6, 18); ctx.fillRect(x + 22, y - 23, 6, 18);
        ctx.fillRect(x - 28, y + 13, 6, 18); ctx.fillRect(x + 22, y + 13, 6, 18);
      }
      function draw() {
        ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#27272a'; ctx.fillRect(roadX, 0, laneW * 3, H);
        ctx.fillStyle = '#facc15'; ctx.fillRect(roadX + 5, 0, 4, H); ctx.fillRect(roadX + laneW * 3 - 9, 0, 4, H);
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.setLineDash([25, 22]);
        ctx.lineDashOffset = -lineOffset;
        for (let lane = 1; lane < 3; lane++) {
          ctx.beginPath(); ctx.moveTo(roadX + laneW * lane, 0); ctx.lineTo(roadX + laneW * lane, H); ctx.stroke();
        }
        ctx.setLineDash([]);
        traffic.forEach((vehicle) => drawCar(roadX + laneW * (vehicle.lane + 0.5), vehicle.y, vehicle.color));
        drawCar(roadX + laneW * (carLane + 0.5), H - 83, '#38bdf8');
        if (ended) {
          ctx.fillStyle = 'rgba(2, 6, 23, .72)'; ctx.fillRect(roadX, 0, laneW * 3, H);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CRASH!', W / 2, H / 2 - 8);
          ctx.font = '15px sans-serif'; ctx.fillStyle = '#7dd3fc'; ctx.fillText('Press Restart to drive again', W / 2, H / 2 + 22);
        }
      }
      function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
      function onKeyDown(event) {
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
          event.preventDefault();
          keys[event.code] = true;
        }
      }
      function onKeyUp(event) { keys[event.code] = false; }
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      restartBtn.addEventListener('click', reset);
      reset();
      animId = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }
  };
})();
