(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.meattoss = {
    id: 'meattoss',
    title: 'Throw Meat for Food',
    description: 'Toss tasty snacks to hungry customers and see how many you can feed.',
    categories: ['Arcade', 'Popular'],
    controls: 'Drag backward from the chef, then release to throw',
    badge: 'New',
    icon: '🍖',
    accent: 'linear-gradient(135deg, #f97316, #be123c)',

    mount(container) {
      const W = 680;
      const H = 400;
      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = '<span class="game-hud">Fed: 0</span><span class="game-hud">Misses: 0 / 5</span><button class="game-btn">Restart</button>';
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');
      container.append(toolbar, canvas);
      const [scoreEl, missesEl] = toolbar.querySelectorAll('.game-hud');
      const restartBtn = toolbar.querySelector('button');
      const chef = { x: 76, y: H - 60 };
      let food, customers, score, misses, frame, dragging, dragPoint, ended, animId;

      function reset() {
        food = [];
        customers = [];
        score = 0;
        misses = 0;
        frame = 0;
        dragging = false;
        dragPoint = null;
        ended = false;
        scoreEl.textContent = 'Fed: 0';
        missesEl.textContent = 'Misses: 0 / 5';
      }
      function canvasPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
      }
      function update() {
        if (ended) return;
        frame++;
        if (frame % 115 === 0) {
          customers.push({ x: W + 35, y: 115 + Math.random() * 175, r: 22, speed: 0.7 + Math.random() * 0.5 });
        }
        customers.forEach((customer) => { customer.x -= customer.speed; });
        customers = customers.filter((customer) => {
          if (customer.x + customer.r < 0) { misses++; return false; }
          return true;
        });
        food.forEach((piece) => {
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.vy += 0.22;
          piece.life--;
          const customerIndex = customers.findIndex((customer) => Math.hypot(piece.x - customer.x, piece.y - customer.y) < customer.r + 10);
          if (customerIndex !== -1) {
            customers.splice(customerIndex, 1);
            piece.done = true;
            score++;
            scoreEl.textContent = `Fed: ${score}`;
          }
          if (piece.y > H - 28 || piece.x > W + 20 || piece.life <= 0) {
            piece.done = true;
            piece.missed = true;
          }
        });
        const missedPieces = food.filter((piece) => piece.done && piece.missed).length;
        misses += missedPieces;
        food = food.filter((piece) => !piece.done);
        missesEl.textContent = `Misses: ${misses} / 5`;
        if (misses >= 5) ended = true;
      }
      function throwFood(point) {
        const pullX = chef.x - point.x;
        const pullY = chef.y - point.y;
        const scale = Math.min(12, Math.hypot(pullX, pullY) / 12);
        if (scale < 1) return;
        food.push({
          x: chef.x + 12,
          y: chef.y - 8,
          vx: Math.max(2, Math.min(11, pullX / 10)),
          vy: Math.max(-10, Math.min(-2, pullY / 10)),
          life: 150
        });
      }
      function draw() {
        ctx.fillStyle = '#3f1d2b'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, H - 42, W, 42);
        ctx.fillStyle = '#fdba74'; ctx.fillRect(0, 55, W, 8);
        ctx.fillStyle = '#f97316'; ctx.fillRect(35, H - 92, 82, 50);
        ctx.fillStyle = '#fff7ed'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CHEF', chef.x, H - 104);
        customers.forEach((customer) => {
          ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(customer.x, customer.y, customer.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#7c2d12'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', customer.x, customer.y + 5);
        });
        food.forEach((piece) => {
          ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.ellipse(piece.x, piece.y, 11, 7, -0.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fde68a'; ctx.fillRect(piece.x + 7, piece.y - 3, 5, 6);
        });
        if (dragging && dragPoint) {
          ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(chef.x, chef.y); ctx.lineTo(dragPoint.x, dragPoint.y); ctx.stroke(); ctx.setLineDash([]);
        }
        if (ended) {
          ctx.fillStyle = 'rgba(2, 6, 23, .76)'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('KITCHEN CLOSED!', W / 2, H / 2 - 10);
          ctx.font = '16px sans-serif'; ctx.fillStyle = '#fdba74'; ctx.fillText('Press Restart to serve again', W / 2, H / 2 + 22);
        }
      }
      function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
      function onPointerDown(event) {
        const point = canvasPoint(event);
        if (Math.hypot(point.x - chef.x, point.y - chef.y) <= 68) {
          dragging = true;
          dragPoint = point;
          canvas.setPointerCapture(event.pointerId);
        }
      }
      function onPointerMove(event) { if (dragging) dragPoint = canvasPoint(event); }
      function onPointerUp(event) {
        if (!dragging) return;
        throwFood(canvasPoint(event));
        dragging = false;
        dragPoint = null;
      }
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      restartBtn.addEventListener('click', reset);
      reset();
      animId = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
      };
    }
  };
})();
