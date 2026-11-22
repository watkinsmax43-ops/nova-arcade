(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  function makeCanvasStage(container, width, height, labels) {
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
    return { canvas, ctx: canvas.getContext('2d'), stats, restart };
  }

  function canvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  function addGame(id, title, description, categories, controls, icon, accent, mount) {
    window.ArcadeGames[id] = { id, title, description, categories, controls, icon, accent, mount };
  }

  function blockMiner(container) {
    const W = 576, H = 352, CELL = 32, COLS = W / CELL, ROWS = H / CELL;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Dirt: 0', 'Gems: 0']);
    let world, player, dirt, gems, facing;
    function reset() {
      world = Array.from({ length: ROWS }, (_, y) =>
        Array.from({ length: COLS }, (_, x) => {
          if (y < 3) return 0;
          if (y === 3) return 1;
          if (y < 6) return 2;
          return (x * 7 + y * 11) % 17 === 0 ? 4 : 3;
        })
      );
      player = { x: 2, y: 2 };
      dirt = 0;
      gems = 0;
      facing = { x: 1, y: 0 };
      updateHud();
      draw();
    }
    function updateHud() {
      stats[0].textContent = `Dirt: ${dirt}`;
      stats[1].textContent = `Gems: ${gems}`;
    }
    function move(dx, dy) {
      facing = { x: dx, y: dy };
      const nx = player.x + dx, ny = player.y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && world[ny][nx] === 0) {
        player = { x: nx, y: ny };
      }
      draw();
    }
    function onKey(event) {
      const directions = {
        ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
        ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1]
      };
      if (directions[event.code]) {
        event.preventDefault();
        move(...directions[event.code]);
      } else if (event.code === 'Space') {
        event.preventDefault();
        const x = player.x + facing.x, y = player.y + facing.y;
        if (dirt > 0 && x >= 0 && x < COLS && y >= 0 && y < ROWS && world[y][x] === 0) {
          world[y][x] = 2;
          dirt--;
          updateHud();
          draw();
        }
      }
    }
    function onClick(event) {
      const point = canvasPoint(canvas, event);
      const x = Math.floor(point.x / CELL), y = Math.floor(point.y / CELL);
      if (Math.abs(x - player.x) + Math.abs(y - player.y) > 1 || world[y]?.[x] === undefined || world[y][x] === 0) return;
      const type = world[y][x];
      world[y][x] = 0;
      facing = { x: Math.sign(x - player.x), y: Math.sign(y - player.y) };
      if (type === 4) gems++;
      else dirt++;
      updateHud();
      draw();
    }
    function draw() {
      const colors = ['#0f172a', '#65a30d', '#92400e', '#64748b', '#22d3ee'];
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
      world.forEach((row, y) => row.forEach((tile, x) => {
        if (!tile) return;
        ctx.fillStyle = colors[tile];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(0,0,0,.25)';
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
        if (tile === 4) {
          ctx.fillStyle = '#cffafe';
          ctx.fillRect(x * CELL + 12, y * CELL + 12, 8, 8);
        }
      }));
      ctx.fillStyle = '#facc15';
      ctx.fillRect(player.x * CELL + 6, player.y * CELL + 6, CELL - 12, CELL - 12);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClick);
    restart.addEventListener('click', reset);
    reset();
    return () => {
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
    };
  }

  function cookieClicker(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const cookiesEl = document.createElement('span');
    cookiesEl.className = 'game-hud';
    const rateEl = document.createElement('span');
    rateEl.className = 'game-hud';
    toolbar.append(cookiesEl, rateEl);
    const cookie = document.createElement('button');
    cookie.className = 'game-btn';
    cookie.textContent = '🍪';
    cookie.setAttribute('aria-label', 'Bake one cookie');
    cookie.style.cssText = 'font-size:clamp(5rem,16vw,9rem);background:transparent;border:0;filter:drop-shadow(0 10px 18px #7c2d12);';
    const shop = document.createElement('div');
    shop.className = 'game-toolbar';
    const baker = document.createElement('button');
    baker.className = 'game-btn';
    const oven = document.createElement('button');
    oven.className = 'game-btn';
    shop.append(baker, oven);
    container.append(toolbar, cookie, shop);
    let cookies = 0, bakers = 0, ovens = 0, timer;
    function update() {
      cookiesEl.textContent = `${Math.floor(cookies)} cookies`;
      rateEl.textContent = `${bakers + ovens * 5} per second`;
      baker.textContent = `Hire baker (${10 + bakers * 10})`;
      oven.textContent = `Upgrade oven (${50 + ovens * 50})`;
      baker.disabled = cookies < 10 + bakers * 10;
      oven.disabled = cookies < 50 + ovens * 50;
    }
    function reset() {
      clearInterval(timer);
      cookies = 0; bakers = 0; ovens = 0;
      update();
      timer = setInterval(() => { cookies += bakers + ovens * 5; update(); }, 1000);
    }
    cookie.addEventListener('click', () => { cookies++; update(); });
    baker.addEventListener('click', () => {
      const cost = 10 + bakers * 10;
      if (cookies < cost) return;
      cookies -= cost; bakers++; update();
    });
    oven.addEventListener('click', () => {
      const cost = 50 + ovens * 50;
      if (cookies < cost) return;
      cookies -= cost; ovens++; update();
    });
    const restart = document.createElement('button');
    restart.className = 'game-btn';
    restart.textContent = 'Restart';
    toolbar.appendChild(restart);
    restart.addEventListener('click', reset);
    reset();
    return () => clearInterval(timer);
  }

  function obby(container) {
    const W = 720, H = 400;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Checkpoint: 1', 'Distance: 0%']);
    const platforms = [];
    for (let i = 0; i < 22; i++) {
      platforms.push({ x: i * 165, y: H - 60 - (i % 3) * 28, w: 115 + (i % 2) * 25, h: 20 });
    }
    let player, keys, camera, ended, animId, checkpoint;
    function reset() {
      player = { x: 34, y: H - 100, vy: 0, w: 24, h: 32, grounded: false };
      keys = {};
      camera = 0;
      checkpoint = 1;
      ended = false;
      stats[0].textContent = 'Checkpoint: 1';
      stats[1].textContent = 'Distance: 0%';
    }
    function update() {
      if (ended) return;
      if (keys.ArrowLeft || keys.KeyA) player.x -= 3.2;
      if (keys.ArrowRight || keys.KeyD) player.x += 3.2;
      if (keys.Space && player.grounded) { player.vy = -10.5; player.grounded = false; }
      const oldBottom = player.y + player.h;
      player.vy += 0.48;
      player.y += player.vy;
      player.grounded = false;
      platforms.forEach((platform) => {
        if (player.vy >= 0 && oldBottom <= platform.y && player.y + player.h >= platform.y &&
            player.x + player.w > platform.x && player.x < platform.x + platform.w) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
          checkpoint = Math.max(checkpoint, Math.floor(player.x / 500) + 1);
        }
      });
      if (player.y > H + 50) {
        player.x = Math.max(34, (checkpoint - 1) * 500 + 40);
        player.y = H - 140;
        player.vy = 0;
      }
      player.x = Math.max(0, Math.min(platforms[platforms.length - 1].x + 120, player.x));
      camera = Math.max(0, player.x - 180);
      stats[0].textContent = `Checkpoint: ${checkpoint}`;
      stats[1].textContent = `Distance: ${Math.min(100, Math.floor(player.x / 34))}%`;
      if (player.x >= platforms[platforms.length - 1].x + 80) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c4b5fd';
      for (let i = 0; i < 8; i++) ctx.fillRect((i * 131 - camera * 0.25) % W, 55 + i % 3 * 28, 48, 14);
      ctx.save(); ctx.translate(-camera, 0);
      platforms.forEach((platform, i) => {
        ctx.fillStyle = i % 4 === 3 ? '#f472b6' : '#22c55e';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.fillRect(platform.x, platform.y + platform.h - 5, platform.w, 5);
      });
      ctx.fillStyle = '#facc15'; ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.restore();
      if (ended) {
        ctx.fillStyle = 'rgba(15,23,42,.75)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('OBBY COMPLETE!', W / 2, H / 2);
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
    reset();
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  function cityHeist(container) {
    const W = 640, H = 420;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Loot: $0', 'Health: 3']);
    let car, loot, cops, keys, health, money, frame, ended, animId;
    function spawnLoot() { return { x: 35 + Math.random() * (W - 70), y: 35 + Math.random() * (H - 70) }; }
    function reset() {
      car = { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0 };
      loot = spawnLoot();
      cops = [];
      keys = {};
      health = 3;
      money = 0;
      frame = 0;
      ended = false;
      stats[0].textContent = 'Loot: $0';
      stats[1].textContent = 'Health: 3';
    }
    function update() {
      if (ended) return;
      frame++;
      const accel = 0.18;
      if (keys.ArrowUp || keys.KeyW) car.vy -= accel;
      if (keys.ArrowDown || keys.KeyS) car.vy += accel;
      if (keys.ArrowLeft || keys.KeyA) car.vx -= accel;
      if (keys.ArrowRight || keys.KeyD) car.vx += accel;
      car.vx *= 0.97; car.vy *= 0.97;
      car.x = Math.max(18, Math.min(W - 18, car.x + car.vx));
      car.y = Math.max(18, Math.min(H - 18, car.y + car.vy));
      if (Math.hypot(car.vx, car.vy) > 0.3) car.angle = Math.atan2(car.vy, car.vx);
      if (Math.hypot(car.x - loot.x, car.y - loot.y) < 23) {
        money += 100;
        loot = spawnLoot();
        stats[0].textContent = `Loot: $${money}`;
        if (money % 500 === 0) cops.push({ x: Math.random() < 0.5 ? 10 : W - 10, y: Math.random() * H });
      }
      cops.forEach((cop) => {
        const angle = Math.atan2(car.y - cop.y, car.x - cop.x);
        cop.x += Math.cos(angle) * 1.15;
        cop.y += Math.sin(angle) * 1.15;
        if (Math.hypot(car.x - cop.x, car.y - cop.y) < 24 && frame % 45 === 0) health--;
      });
      stats[1].textContent = `Health: ${health}`;
      if (health <= 0) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#334155';
      for (let x = 30; x < W; x += 120) ctx.fillRect(x, 0, 48, H);
      for (let y = 30; y < H; y += 110) ctx.fillRect(0, y, W, 42);
      ctx.fillStyle = '#facc15'; ctx.fillRect(loot.x - 8, loot.y - 8, 16, 16);
      cops.forEach((cop) => {
        ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(cop.x, cop.y, 11, 0, Math.PI * 2); ctx.fill();
      });
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-15, -9, 30, 18);
      ctx.fillStyle = '#bfdbfe'; ctx.fillRect(1, -7, 8, 14);
      ctx.restore();
      if (ended) {
        ctx.fillStyle = 'rgba(15,23,42,.75)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GETAWAY OVER', W / 2, H / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart to try another escape', W / 2, H / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
    }
    function onKeyUp(event) { keys[event.code] = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restart.addEventListener('click', reset);
    reset();
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  function petHatch(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const gemsEl = document.createElement('span'); gemsEl.className = 'game-hud';
    const petsEl = document.createElement('span'); petsEl.className = 'game-hud';
    const rateEl = document.createElement('span'); rateEl.className = 'game-hud';
    toolbar.append(gemsEl, petsEl, rateEl);
    const treat = document.createElement('button');
    treat.className = 'game-btn';
    treat.textContent = '🍬 Give a treat (+1 gem)';
    const egg = document.createElement('button');
    egg.className = 'game-btn';
    egg.textContent = '🥚 Hatch a pet (10 gems)';
    const shop = document.createElement('div');
    shop.className = 'game-toolbar';
    shop.append(treat, egg);
    const pets = document.createElement('div');
    pets.style.cssText = 'font-size:3rem;text-align:center;min-height:100px;padding:20px;';
    container.append(toolbar, pets, shop);
    let gems = 0, petList = [], timer;
    function update() {
      gemsEl.textContent = `Gems: ${gems}`;
      petsEl.textContent = `Pets: ${petList.length}`;
      rateEl.textContent = `Finds ${petList.length} gems / sec`;
      egg.disabled = gems < 10;
      pets.textContent = petList.length ? petList.join(' ') : 'Your pet collection is waiting!';
    }
    function reset() {
      clearInterval(timer);
      gems = 0; petList = [];
      update();
      timer = setInterval(() => { gems += petList.length; update(); }, 1000);
    }
    treat.addEventListener('click', () => { gems++; update(); });
    egg.addEventListener('click', () => {
      if (gems < 10) return;
      gems -= 10;
      petList.push(['🐱', '🐶', '🐸', '🦊', '🐼'][Math.floor(Math.random() * 5)]);
      update();
    });
    const restart = document.createElement('button');
    restart.className = 'game-btn'; restart.textContent = 'Restart'; toolbar.appendChild(restart);
    restart.addEventListener('click', reset);
    reset();
    return () => clearInterval(timer);
  }

  function racer3d(container) {
    const W = 640, H = 420;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Distance: 0', 'Crashes: 0 / 3']);
    let lane, obstacles, distance, crashes, frame, ended, keys, animId;
    function reset() {
      lane = 0; obstacles = []; distance = 0; crashes = 0; frame = 0; ended = false; keys = {};
      stats[0].textContent = 'Distance: 0';
      stats[1].textContent = 'Crashes: 0 / 3';
    }
    function update() {
      if (ended) return;
      frame++;
      if ((keys.ArrowLeft || keys.KeyA) && frame % 9 === 0) lane = Math.max(-1, lane - 1);
      if ((keys.ArrowRight || keys.KeyD) && frame % 9 === 0) lane = Math.min(1, lane + 1);
      if (frame % 47 === 0) obstacles.push({ lane: Math.floor(Math.random() * 3) - 1, depth: 1 });
      obstacles.forEach((obstacle) => { obstacle.depth -= 0.012; });
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].depth <= 0.08) {
          if (obstacles[i].lane === lane) crashes++;
          obstacles.splice(i, 1);
        }
      }
      distance++;
      stats[0].textContent = `Distance: ${Math.floor(distance / 4)}m`;
      stats[1].textContent = `Crashes: ${crashes} / 3`;
      if (crashes >= 3) ended = true;
    }
    function draw() {
      const horizon = 88;
      ctx.fillStyle = '#93c5fd'; ctx.fillRect(0, 0, W, horizon);
      ctx.fillStyle = '#166534'; ctx.fillRect(0, horizon, W, H - horizon);
      ctx.fillStyle = '#27272a';
      ctx.beginPath(); ctx.moveTo(W / 2 - 35, horizon); ctx.lineTo(W / 2 + 35, horizon); ctx.lineTo(W - 25, H); ctx.lineTo(25, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3;
      for (let divider = -1; divider <= 1; divider += 2) {
        ctx.beginPath(); ctx.moveTo(W / 2 + divider * 12, horizon); ctx.lineTo(W / 2 + divider * 245, H); ctx.stroke();
      }
      obstacles.forEach((obstacle) => {
        const t = 1 - obstacle.depth;
        const roadHalf = 35 + t * 245;
        const x = W / 2 + obstacle.lane * roadHalf * 0.62;
        const y = horizon + t * (H - horizon);
        const size = 8 + t * 42;
        ctx.fillStyle = '#fb7185'; ctx.fillRect(x - size / 2, y - size, size, size);
      });
      const playerX = W / 2 + lane * 155;
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(playerX - 18, H - 58, 36, 44);
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RACE OVER', W / 2, H / 2);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
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

  function towerDefense(container) {
    const W = 640, H = 400;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Coins: 60', 'Lives: 10']);
    let towers, enemies, shots, coins, lives, frame, ended, animId;
    function reset() {
      towers = []; enemies = []; shots = []; coins = 60; lives = 10; frame = 0; ended = false;
      stats[0].textContent = 'Coins: 60'; stats[1].textContent = 'Lives: 10';
    }
    function update() {
      if (ended) return;
      frame++;
      if (frame % 75 === 0) enemies.push({ x: -12, y: 195, hp: 2 + Math.floor(frame / 900), speed: 1.1 + Math.min(1, frame / 2400) });
      enemies.forEach((enemy) => { enemy.x += enemy.speed; });
      enemies = enemies.filter((enemy) => {
        if (enemy.hp <= 0) { coins += 8; return false; }
        if (enemy.x > W + 12) { lives--; return false; }
        return true;
      });
      towers.forEach((tower) => {
        tower.cooldown--;
        const target = enemies.find((enemy) => Math.hypot(enemy.x - tower.x, enemy.y - tower.y) < 150);
        if (target && tower.cooldown <= 0) {
          shots.push({ x: tower.x, y: tower.y, target });
          tower.cooldown = 35;
        }
      });
      shots = shots.filter((shot) => {
        if (!enemies.includes(shot.target)) return false;
        const angle = Math.atan2(shot.target.y - shot.y, shot.target.x - shot.x);
        shot.x += Math.cos(angle) * 6; shot.y += Math.sin(angle) * 6;
        if (Math.hypot(shot.target.x - shot.x, shot.target.y - shot.y) < 8) {
          shot.target.hp--;
          return false;
        }
        return true;
      });
      stats[0].textContent = `Coins: ${coins}`;
      stats[1].textContent = `Lives: ${lives}`;
      if (lives <= 0) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#a16207'; ctx.fillRect(0, 174, W, 44);
      ctx.strokeStyle = '#fde68a'; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(0, 196); ctx.lineTo(W, 196); ctx.stroke(); ctx.setLineDash([]);
      towers.forEach((tower) => {
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(tower.x - 12, tower.y - 12, 24, 24);
        ctx.strokeStyle = 'rgba(125,211,252,.2)'; ctx.beginPath(); ctx.arc(tower.x, tower.y, 150, 0, Math.PI * 2); ctx.stroke();
      });
      enemies.forEach((enemy) => {
        ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(enemy.x, enemy.y, 10, 0, Math.PI * 2); ctx.fill();
      });
      shots.forEach((shot) => {
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2); ctx.fill();
      });
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BASE OVERRUN', W / 2, H / 2);
      }
    }
    function onClick(event) {
      if (ended || coins < 20) return;
      const point = canvasPoint(canvas, event);
      if (point.y > 160 && point.y < 230) return;
      if (towers.some((tower) => Math.hypot(tower.x - point.x, tower.y - point.y) < 28)) return;
      towers.push({ x: point.x, y: point.y, cooldown: 0 });
      coins -= 20;
      stats[0].textContent = `Coins: ${coins}`;
    }
    canvas.addEventListener('click', onClick);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(function loop() { update(); draw(); animId = requestAnimationFrame(loop); });
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onClick);
    };
  }

  function rhythm(container) {
    const W = 640, H = 300;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Score: 0', 'Misses: 0 / 5']);
    let notes, score, misses, frame, ended, animId;
    function reset() {
      notes = []; score = 0; misses = 0; frame = 0; ended = false;
      stats[0].textContent = 'Score: 0'; stats[1].textContent = 'Misses: 0 / 5';
    }
    function hit() {
      if (ended) return;
      let closest = -1, distance = Infinity;
      notes.forEach((note, i) => {
        const d = Math.abs(note.x - 520);
        if (d < distance) { distance = d; closest = i; }
      });
      if (closest >= 0 && distance < 34) { notes.splice(closest, 1); score++; }
      else misses++;
      stats[0].textContent = `Score: ${score}`;
      stats[1].textContent = `Misses: ${misses} / 5`;
      if (misses >= 5) ended = true;
    }
    function update() {
      if (ended) return;
      frame++;
      if (frame % 62 === 0) notes.push({ x: -16, lane: frame % 2 ? 110 : 190 });
      notes.forEach((note) => { note.x += 4.2; });
      notes = notes.filter((note) => {
        if (note.x > W + 15) { misses++; return false; }
        return true;
      });
      stats[1].textContent = `Misses: ${misses} / 5`;
      if (misses >= 5) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#18102e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#334155'; ctx.fillRect(0, 82, W, 145);
      ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(520, 78); ctx.lineTo(520, 232); ctx.stroke();
      notes.forEach((note) => {
        ctx.fillStyle = '#f0abfc'; ctx.beginPath(); ctx.arc(note.x, note.lane, 14, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SPACE / TAP', 520, 260);
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.fillText('BEAT DROPPED', W / 2, H / 2);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKey(event) { if (event.code === 'Space') { event.preventDefault(); hit(); } }
    function onClick() { hit(); }
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClick);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
    };
  }

  function fishing(container) {
    const W = 640, H = 400;
    const { canvas, ctx, stats, restart } = makeCanvasStage(container, W, H, ['Fish: 0', 'Misses: 0 / 5']);
    let fish, caught, misses, frame, ended, animId;
    function reset() {
      fish = []; caught = 0; misses = 0; frame = 0; ended = false;
      stats[0].textContent = 'Fish: 0'; stats[1].textContent = 'Misses: 0 / 5';
    }
    function update() {
      if (ended) return;
      frame++;
      if (frame % 50 === 0) fish.push({ x: -20, y: 70 + Math.random() * 280, speed: 1.5 + Math.random() * 2, r: 12 + Math.random() * 8 });
      fish.forEach((item) => { item.x += item.speed; });
      fish = fish.filter((item) => {
        if (item.x > W + item.r) { misses++; return false; }
        return true;
      });
      stats[1].textContent = `Misses: ${misses} / 5`;
      if (misses >= 5) ended = true;
      if (misses >= 5) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, 0, W, H);
      for (let y = 30; y < H; y += 36) {
        ctx.strokeStyle = 'rgba(186,230,253,.12)'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 6); ctx.stroke();
      }
      fish.forEach((item) => {
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.ellipse(item.x, item.y, item.r, item.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(item.x - item.r, item.y); ctx.lineTo(item.x - item.r - 10, item.y - 7); ctx.lineTo(item.x - item.r - 10, item.y + 7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(item.x + 5, item.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      });
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.7)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('FISHING TRIP OVER', W / 2, H / 2);
      }
    }
    function onClick(event) {
      if (ended) return;
      const point = canvasPoint(canvas, event);
      const index = fish.findIndex((item) => Math.hypot(item.x - point.x, item.y - point.y) < item.r + 10);
      if (index >= 0) {
        fish.splice(index, 1); caught++; stats[0].textContent = `Fish: ${caught}`;
      } else {
        misses++; stats[1].textContent = `Misses: ${misses} / 5`;
        if (misses >= 5) ended = true;
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    canvas.addEventListener('click', onClick);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onClick);
    };
  }

  function dungeonClicker(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const goldEl = document.createElement('span'); goldEl.className = 'game-hud';
    const levelEl = document.createElement('span'); levelEl.className = 'game-hud';
    toolbar.append(goldEl, levelEl);
    const monster = document.createElement('button');
    monster.className = 'game-btn';
    monster.style.cssText = 'font-size:clamp(4rem,14vw,7rem);background:transparent;border:0;';
    const shop = document.createElement('div');
    shop.className = 'game-toolbar';
    const sword = document.createElement('button'); sword.className = 'game-btn';
    const potion = document.createElement('button'); potion.className = 'game-btn';
    shop.append(sword, potion);
    const restart = document.createElement('button'); restart.className = 'game-btn'; restart.textContent = 'Restart';
    toolbar.appendChild(restart);
    const status = document.createElement('p'); status.className = 'game-hud';
    container.append(toolbar, monster, status, shop);
    let gold, damage, level, hp, potions;
    function update() {
      goldEl.textContent = `Gold: ${gold}`;
      levelEl.textContent = `Dungeon level: ${level}`;
      monster.textContent = '👹';
      status.textContent = `Monster HP: ${Math.max(0, hp)} / ${level * 12}`;
      sword.textContent = `Sharpen sword (+2 damage) — ${20 + damage * 10} gold`;
      potion.textContent = `Health potion (+1 damage this fight) — ${15 + potions * 5} gold`;
      sword.disabled = gold < 20 + damage * 10;
      potion.disabled = gold < 15 + potions * 5;
    }
    function reset() { gold = 0; damage = 1; level = 1; potions = 0; hp = 12; update(); }
    monster.addEventListener('click', () => {
      hp -= damage + potions;
      if (hp <= 0) { gold += level * 10; level++; potions = 0; hp = level * 12; }
      update();
    });
    sword.addEventListener('click', () => {
      const cost = 20 + damage * 10;
      if (gold < cost) return;
      gold -= cost; damage += 2; update();
    });
    potion.addEventListener('click', () => {
      const cost = 15 + potions * 5;
      if (gold < cost) return;
      gold -= cost; potions++; update();
    });
    restart.addEventListener('click', reset);
    reset();
    return () => {};
  }

  addGame('blockminer', 'Block Miner Sandbox', 'Mine a tiny block world, collect gems, and place dirt to build your own path.', ['Arcade'], 'WASD to move, click an adjacent block to mine, Space to place dirt', '⛏️', 'linear-gradient(135deg,#65a30d,#78350f)', blockMiner);
  addGame('cookiegalaxy', 'Cookie Galaxy Clicker', 'Bake cookies, hire automatic bakers, and upgrade your ovens to grow a cookie empire.', ['Popular', 'Arcade'], 'Click the cookie and buy upgrades', '🍪', 'linear-gradient(135deg,#f59e0b,#7c2d12)', cookieClicker);
  addGame('obbytower', 'Blocky Obby Tower', 'Jump across floating platforms, hit checkpoints, and reach the end of the obstacle course.', ['Arcade'], 'A / D or Left / Right to move; Space to jump', '🧗', 'linear-gradient(135deg,#38bdf8,#a855f7)', obby);
  addGame('cityheist', 'City Heist Getaway', 'Drive around a top-down city, grab the loot, and evade the patrol cars.', ['Popular', 'Arcade'], 'WASD / Arrow Keys to drive', '🚓', 'linear-gradient(135deg,#ef4444,#334155)', cityHeist);
  addGame('pethatch', 'Pet Hatch Simulator', 'Earn gems with treats, hatch surprise pets, and let your collection find gems over time.', ['Arcade'], 'Click treats to earn gems, then hatch an egg', '🐣', 'linear-gradient(135deg,#f472b6,#7c3aed)', petHatch);
  addGame('neon3dracer', 'Neon 3D Racer', 'A pseudo-3D perspective racer: switch lanes and dodge traffic as the road rushes toward you.', ['Arcade'], 'A / D or Left / Right to change lanes', '🏁', 'linear-gradient(135deg,#06b6d4,#1e1b4b)', racer3d);
  addGame('towerdefense', 'Tiny Tower Defense', 'Place towers beside the road and stop each wave before it reaches your base.', ['Arcade'], 'Click open ground to place a tower (20 coins)', '🏰', 'linear-gradient(135deg,#22c55e,#854d0e)', towerDefense);
  addGame('rhythmrush', 'Rhythm Rush', 'Tap notes as they cross the hit line and keep your streak alive.', ['Arcade'], 'Space / Click when a note reaches the line', '🎵', 'linear-gradient(135deg,#a855f7,#0f172a)', rhythm);
  addGame('deepseafishing', 'Deep Sea Fishing', 'Click swimming fish to catch them before they escape. Avoid missed casts!', ['Arcade'], 'Click or tap a fish to catch it', '🎣', 'linear-gradient(135deg,#0284c7,#164e63)', fishing);
  addGame('dungeonclicker', 'Dungeon Clicker', 'Click monsters for gold, sharpen your sword, and push through endless dungeon levels.', ['Arcade'], 'Click the monster to attack and spend gold on upgrades', '⚔️', 'linear-gradient(135deg,#9333ea,#1e293b)', dungeonClicker);
})();
