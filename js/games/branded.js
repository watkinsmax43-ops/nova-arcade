(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  function makeStage(container, width, height, labels) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const stats = labels.map(() => {
      const el = document.createElement('span');
      el.className = 'game-hud';
      toolbar.appendChild(el);
      return el;
    });
    const restart = document.createElement('button');
    restart.className = 'game-btn';
    restart.textContent = 'Restart';
    toolbar.appendChild(restart);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = 'game-canvas';
    container.append(toolbar, canvas);
    return { canvas, ctx: canvas.getContext('2d'), stats, restart, toolbar };
  }

  function addGame(id, title, description, controls, icon, accent, mount) {
    window.ArcadeGames[id] = {
      id,
      title,
      description,
      categories: ['Popular', 'Arcade'],
      controls,
      icon,
      accent,
      mount
    };
  }

  function fruitAdventure(container) {
    const W = 640, H = 420;
    const { canvas, ctx, stats, restart } = makeStage(container, W, H, ['Fruit: 0', 'Defeated: 0 / 10']);
    let player, enemies, fruit, keys, health, fruitCount, defeated, frame, ended, won, animId;
    function reset() {
      player = { x: W / 2, y: H / 2, r: 14 };
      enemies = [];
      for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * 2 / 5;
        enemies.push({ x: W / 2 + Math.cos(angle) * 170, y: H / 2 + Math.sin(angle) * 140, r: 13 });
      }
      fruit = { x: 90, y: 90 };
      keys = {};
      health = 3;
      fruitCount = 0;
      defeated = 0;
      frame = 0;
      ended = false;
      won = false;
      stats[0].textContent = 'Fruit: 0 · HP: 3';
      stats[1].textContent = 'Defeated: 0 / 10';
    }
    function attack() {
      if (ended) return;
      let nearest = -1, nearestDistance = 70;
      enemies.forEach((enemy, index) => {
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
      });
      if (nearest >= 0) {
        enemies.splice(nearest, 1);
        defeated++;
        if (defeated < 10) {
          const angle = Math.random() * Math.PI * 2;
          enemies.push({ x: angle < Math.PI ? 30 : W - 30, y: 45 + Math.random() * (H - 90), r: 13 });
        } else {
          ended = true;
          won = true;
        }
        stats[1].textContent = `Defeated: ${defeated} / 10`;
      }
    }
    function update() {
      if (ended) return;
      frame++;
      let dx = 0, dy = 0;
      if (keys.ArrowLeft || keys.KeyA) dx--;
      if (keys.ArrowRight || keys.KeyD) dx++;
      if (keys.ArrowUp || keys.KeyW) dy--;
      if (keys.ArrowDown || keys.KeyS) dy++;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        player.x += dx / length * 3;
        player.y += dy / length * 3;
      }
      player.x = Math.max(player.r, Math.min(W - player.r, player.x));
      player.y = Math.max(player.r, Math.min(H - player.r, player.y));
      if (keys.Space && frame % 20 === 0) attack();
      enemies.forEach((enemy) => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * 0.65;
        enemy.y += Math.sin(angle) * 0.65;
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.r + enemy.r && frame % 55 === 0) health--;
      });
      if (Math.hypot(player.x - fruit.x, player.y - fruit.y) < 25) {
        fruit = { x: 35 + Math.random() * (W - 70), y: 35 + Math.random() * (H - 70) };
        health = Math.min(3, health + 1);
        fruitCount++;
      }
      stats[0].textContent = `Fruit: ${fruitCount} · HP: ${health}`;
      if (health <= 0) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#166534';
      for (let y = 20; y < H; y += 40) for (let x = 20; x < W; x += 40) ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(fruit.x, fruit.y, 10, 0, Math.PI * 2); ctx.fill();
      enemies.forEach((enemy) => {
        ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(enemy.x - 5, enemy.y - 2, 3, 3); ctx.fillRect(enemy.x + 3, enemy.y - 2, 3, 3);
      });
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(won ? 'ISLAND CLEARED!' : 'ADVENTURE OVER', W / 2, H / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart to set sail again', W / 2, H / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
      if (event.code === 'Space' && !event.repeat) attack();
    }
    function onKeyUp(event) { keys[event.code] = false; }
    canvas.addEventListener('click', attack);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', attack);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  function beeGarden(container) {
    const W = 640, H = 420;
    const { canvas, ctx, stats, restart, toolbar } = makeStage(container, W, H, ['Honey: 0', 'Pollen: 0 / 10']);
    const upgrade = document.createElement('button');
    upgrade.className = 'game-btn';
    upgrade.textContent = 'Upgrade bag (50 honey)';
    toolbar.appendChild(upgrade);
    let player, flowers, pollen, honey, capacity, keys, animId, flowerTimers;
    const hive = { x: 52, y: H / 2, r: 28 };
    function reset() {
      flowerTimers.forEach(clearTimeout);
      flowerTimers = [];
      player = { x: 95, y: H / 2, r: 12 };
      flowers = Array.from({ length: 14 }, (_, i) => ({
        x: 145 + (i % 5) * 100,
        y: 55 + Math.floor(i / 5) * 115 + Math.random() * 40,
        full: true
      }));
      pollen = 0; honey = 0; capacity = 10; keys = {};
      updateHud();
    }
    function updateHud() {
      stats[0].textContent = `Honey: ${honey}`;
      stats[1].textContent = `Pollen: ${pollen} / ${capacity}`;
      upgrade.disabled = honey < 50;
    }
    function update() {
      let dx = 0, dy = 0;
      if (keys.ArrowLeft || keys.KeyA) dx--;
      if (keys.ArrowRight || keys.KeyD) dx++;
      if (keys.ArrowUp || keys.KeyW) dy--;
      if (keys.ArrowDown || keys.KeyS) dy++;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        player.x = Math.max(player.r, Math.min(W - player.r, player.x + dx / length * 3));
        player.y = Math.max(player.r, Math.min(H - player.r, player.y + dy / length * 3));
      }
      if (pollen >= capacity && Math.hypot(player.x - hive.x, player.y - hive.y) < hive.r + 18) {
        honey += pollen;
        pollen = 0;
        updateHud();
      }
      flowers.forEach((flower) => {
        if (flower.full && pollen < capacity && Math.hypot(player.x - flower.x, player.y - flower.y) < 23) {
          flower.full = false;
          pollen++;
          updateHud();
          flowerTimers.push(setTimeout(() => { flower.full = true; }, 2500));
        }
      });
    }
    function draw() {
      ctx.fillStyle = '#365314'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#854d0e'; ctx.beginPath(); ctx.arc(hive.x, hive.y, hive.r, 0, Math.PI * 2); ctx.fill();
      flowers.forEach((flower) => {
        ctx.fillStyle = flower.full ? '#f0abfc' : '#64748b';
        ctx.beginPath(); ctx.arc(flower.x, flower.y, 10, 0, Math.PI * 2); ctx.fill();
        if (flower.full) {
          ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(flower.x, flower.y, 3, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const angle = performance.now() / 500 + i * Math.PI * 2 / 3;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.arc(player.x + Math.cos(angle) * 25, player.y + Math.sin(angle) * 17, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
    }
    function onKeyUp(event) { keys[event.code] = false; }
    function onUpgrade() {
      if (honey < 50) return;
      honey -= 50; capacity += 5; updateHud();
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    upgrade.addEventListener('click', onUpgrade);
    restart.addEventListener('click', reset);
    flowerTimers = [];
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      upgrade.removeEventListener('click', onUpgrade);
      flowerTimers.forEach(clearTimeout);
    };
  }

  function ballVsBall(container) {
    const W = 640, H = 420;
    const { canvas, ctx, stats, restart } = makeStage(container, W, H, ['Blue: 0', 'Orange: 0']);
    const center = { x: W / 2, y: H / 2 };
    const radius = 158;
    let blue, orange, blueScore, orangeScore, keys, ended, animId;
    function resetRound() {
      blue = { x: center.x - 45, y: center.y, vx: 0, vy: 0, r: 17 };
      orange = { x: center.x + 45, y: center.y, vx: 0, vy: 0, r: 17 };
    }
    function reset() {
      blueScore = 0; orangeScore = 0; keys = {}; ended = false;
      stats[0].textContent = 'Blue: 0'; stats[1].textContent = 'Orange: 0';
      resetRound();
    }
    function update() {
      if (ended) return;
      const acceleration = 0.22;
      if (keys.KeyA) blue.vx -= acceleration;
      if (keys.KeyD) blue.vx += acceleration;
      if (keys.KeyW) blue.vy -= acceleration;
      if (keys.KeyS) blue.vy += acceleration;
      if (keys.ArrowLeft) orange.vx -= acceleration;
      if (keys.ArrowRight) orange.vx += acceleration;
      if (keys.ArrowUp) orange.vy -= acceleration;
      if (keys.ArrowDown) orange.vy += acceleration;
      [blue, orange].forEach((ball) => {
        ball.vx *= 0.985; ball.vy *= 0.985;
        ball.x += ball.vx; ball.y += ball.vy;
      });
      const dx = orange.x - blue.x, dy = orange.y - blue.y;
      const distance = Math.hypot(dx, dy);
      if (distance < blue.r + orange.r && distance > 0) {
        const nx = dx / distance, ny = dy / distance;
        const push = (blue.r + orange.r - distance) / 2;
        blue.x -= nx * push; blue.y -= ny * push;
        orange.x += nx * push; orange.y += ny * push;
        blue.vx -= nx * 1.4; blue.vy -= ny * 1.4;
        orange.vx += nx * 1.4; orange.vy += ny * 1.4;
      }
      for (const [ball, player] of [[blue, 'blue'], [orange, 'orange']]) {
        if (Math.hypot(ball.x - center.x, ball.y - center.y) > radius) {
          if (player === 'blue') orangeScore++; else blueScore++;
          stats[0].textContent = `Blue: ${blueScore}`;
          stats[1].textContent = `Orange: ${orangeScore}`;
          resetRound();
          if (blueScore >= 5 || orangeScore >= 5) ended = true;
          break;
        }
      }
    }
    function draw() {
      ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#dcfce7'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(center.x, center.y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(center.x, center.y - radius); ctx.lineTo(center.x, center.y + radius); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(blue.x, blue.y, blue.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(orange.x, orange.y, orange.r, 0, Math.PI * 2); ctx.fill();
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(blueScore > orangeScore ? 'BLUE WINS!' : 'ORANGE WINS!', W / 2, H / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart for a rematch', W / 2, H / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
    }
    function onKeyUp(event) { keys[event.code] = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  function racer(container, configuration) {
    const W = 640, H = 420;
    const { canvas, ctx, stats, restart } = makeStage(container, W, H, ['Distance: 0m', 'Crashes: 0 / 3']);
    let lane, obstacles, distance, crashes, frame, ended, keys, animId;
    function reset() {
      lane = 0; obstacles = []; distance = 0; crashes = 0; frame = 0; ended = false; keys = {};
      stats[0].textContent = 'Distance: 0m';
      stats[1].textContent = 'Crashes: 0 / 3';
    }
    function update() {
      if (ended) return;
      frame++;
      const boost = keys.Space ? 1.45 : 1;
      if ((keys.ArrowLeft || keys.KeyA) && frame % 9 === 0) lane = Math.max(-1, lane - 1);
      if ((keys.ArrowRight || keys.KeyD) && frame % 9 === 0) lane = Math.min(1, lane + 1);
      if (frame % configuration.spawnRate === 0) obstacles.push({ lane: Math.floor(Math.random() * 3) - 1, depth: 1 });
      obstacles.forEach((obstacle) => { obstacle.depth -= configuration.pace * boost; });
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].depth <= 0.08) {
          if (obstacles[i].lane === lane) crashes++;
          obstacles.splice(i, 1);
        }
      }
      distance += boost;
      stats[0].textContent = `Distance: ${Math.floor(distance / 4)}m`;
      stats[1].textContent = `Crashes: ${crashes} / 3`;
      if (crashes >= 3) ended = true;
    }
    function draw() {
      const horizon = 88;
      ctx.fillStyle = configuration.sky; ctx.fillRect(0, 0, W, horizon);
      ctx.fillStyle = configuration.ground; ctx.fillRect(0, horizon, W, H - horizon);
      ctx.fillStyle = configuration.road;
      ctx.beginPath(); ctx.moveTo(W / 2 - 35, horizon); ctx.lineTo(W / 2 + 35, horizon); ctx.lineTo(W - 25, H); ctx.lineTo(25, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(W / 2 + side * 12, horizon); ctx.lineTo(W / 2 + side * 245, H); ctx.stroke();
      }
      obstacles.forEach((obstacle) => {
        const t = 1 - obstacle.depth;
        const roadHalf = 35 + t * 245;
        const x = W / 2 + obstacle.lane * roadHalf * 0.62;
        const y = horizon + t * (H - horizon);
        const size = 8 + t * 42;
        ctx.fillStyle = configuration.obstacle;
        ctx.fillRect(x - size / 2, y - size, size, size);
      });
      const playerX = W / 2 + lane * 155;
      ctx.fillStyle = configuration.vehicle;
      ctx.fillRect(playerX - 18, H - 58, 36, 44);
      if (keys.Space) {
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BOOST!', playerX, H - 68);
      }
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RACE OVER', W / 2, H / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart to race again', W / 2, H / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
    }
    function onKeyUp(event) { keys[event.code] = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  addGame(
    'fruit-island-adventure',
    'Fruit Island Adventure',
    'An unofficial Blox Fruits-inspired island quest: explore, collect fruit, and battle training dummies.',
    'WASD / Arrow Keys to move; Space / Click to attack',
    '🍍',
    'linear-gradient(135deg,#f97316,#16a34a)',
    fruitAdventure
  );
  addGame(
    'bee-garden-simulator',
    'Bee Garden Simulator',
    'An unofficial Bee Swarm Simulator-inspired mini-game: gather pollen, return to your hive, and grow your honey.',
    'WASD / Arrow Keys to move between flowers and the hive',
    '🐝',
    'linear-gradient(135deg,#facc15,#15803d)',
    beeGarden
  );
  addGame(
    'ball-vs-ball',
    'Ball vs Ball',
    'A local two-player arena: bump the other ball out of the ring and race to five points.',
    'Blue: WASD · Orange: Arrow Keys',
    '⚽',
    'linear-gradient(135deg,#38bdf8,#f97316)',
    ballVsBall
  );

  const raceThemes = [
    { name: 'Cyberpunk 2077: Neon Run', hue: 305, pace: 0.011, spawnRate: 42, sky: '#271044', ground: '#581c87', road: '#18181b', vehicle: '#f0abfc', obstacle: '#22d3ee' },
    { name: 'Rocket League: Goal Rush', hue: 195, pace: 0.010, spawnRate: 48, sky: '#0c4a6e', ground: '#0369a1', road: '#1e293b', vehicle: '#f97316', obstacle: '#facc15' },
    { name: 'Descenders: Downhill Dash', hue: 115, pace: 0.012, spawnRate: 43, sky: '#7dd3fc', ground: '#166534', road: '#57534e', vehicle: '#f8fafc', obstacle: '#a16207' },
    { name: 'Descenders Next: Snowline Ride', hue: 210, pace: 0.011, spawnRate: 44, sky: '#bae6fd', ground: '#e2e8f0', road: '#64748b', vehicle: '#1d4ed8', obstacle: '#0f172a' },
    { name: 'GTA 6: Vice City Escape', hue: 335, pace: 0.010, spawnRate: 47, sky: '#f9a8d4', ground: '#0f766e', road: '#27272a', vehicle: '#fb7185', obstacle: '#fef08a' },
    { name: 'Forza Horizon: Open Road', hue: 25, pace: 0.012, spawnRate: 41, sky: '#fdba74', ground: '#65a30d', road: '#3f3f46', vehicle: '#38bdf8', obstacle: '#f43f5e' },
    { name: 'Need for Speed: Street Sprint', hue: 355, pace: 0.013, spawnRate: 39, sky: '#1f2937', ground: '#334155', road: '#09090b', vehicle: '#ef4444', obstacle: '#facc15' },
    { name: 'F1: Apex Lap', hue: 5, pace: 0.014, spawnRate: 38, sky: '#bae6fd', ground: '#15803d', road: '#27272a', vehicle: '#dc2626', obstacle: '#fff' },
    { name: 'Gran Turismo: Track Trial', hue: 215, pace: 0.010, spawnRate: 50, sky: '#93c5fd', ground: '#16a34a', road: '#475569', vehicle: '#e2e8f0', obstacle: '#f97316' },
    { name: 'Asphalt: Nitro Chase', hue: 265, pace: 0.013, spawnRate: 40, sky: '#312e81', ground: '#4c1d95', road: '#18181b', vehicle: '#a78bfa', obstacle: '#22d3ee' },
    { name: 'Mario Kart: Rainbow Circuit', hue: 45, pace: 0.011, spawnRate: 46, sky: '#bfdbfe', ground: '#22c55e', road: '#52525b', vehicle: '#facc15', obstacle: '#ec4899' },
    { name: 'Sonic Racing: Ring Road', hue: 205, pace: 0.014, spawnRate: 38, sky: '#38bdf8', ground: '#16a34a', road: '#334155', vehicle: '#facc15', obstacle: '#ef4444' },
    { name: 'Hot Wheels: Loop Legends', hue: 15, pace: 0.014, spawnRate: 37, sky: '#7dd3fc', ground: '#ea580c', road: '#27272a', vehicle: '#fb923c', obstacle: '#38bdf8' },
    { name: 'Trackmania: Time Attack', hue: 165, pace: 0.013, spawnRate: 39, sky: '#67e8f9', ground: '#0f766e', road: '#3f3f46', vehicle: '#f8fafc', obstacle: '#f472b6' },
    { name: 'Wipeout: Anti-Gravity Sprint', hue: 185, pace: 0.015, spawnRate: 36, sky: '#164e63', ground: '#155e75', road: '#111827', vehicle: '#22d3ee', obstacle: '#f0abfc' },
    { name: 'Burnout: Crash Course', hue: 30, pace: 0.013, spawnRate: 40, sky: '#f97316', ground: '#7c2d12', road: '#292524', vehicle: '#facc15', obstacle: '#ef4444' },
    { name: 'The Crew: Coastline Run', hue: 195, pace: 0.011, spawnRate: 45, sky: '#7dd3fc', ground: '#0e7490', road: '#52525b', vehicle: '#fb7185', obstacle: '#facc15' },
    { name: 'DiRT Rally: Gravel Rush', hue: 35, pace: 0.012, spawnRate: 42, sky: '#d6d3d1', ground: '#a16207', road: '#57534e', vehicle: '#f97316', obstacle: '#22c55e' },
    { name: 'Riders Republic: Bike Park', hue: 95, pace: 0.012, spawnRate: 43, sky: '#bae6fd', ground: '#15803d', road: '#78716c', vehicle: '#facc15', obstacle: '#fb7185' },
    { name: 'Midnight Club: Neon Drift', hue: 275, pace: 0.014, spawnRate: 38, sky: '#1e1b4b', ground: '#312e81', road: '#18181b', vehicle: '#c084fc', obstacle: '#f43f5e' }
  ];

  raceThemes.forEach((configuration, index) => {
    const id = `brand-racer-${index + 1}`;
    addGame(
      id,
      `${configuration.name} (Unofficial)`,
      `An original arcade racing mini-game inspired by ${configuration.name.split(':')[0]}; no official assets or gameplay are included.`,
      'A / D or Left / Right to switch lanes; Space to boost',
      '🏎️',
      `linear-gradient(135deg,${configuration.vehicle},${configuration.ground})`,
      (container) => racer(container, configuration)
    );
  });
})();
