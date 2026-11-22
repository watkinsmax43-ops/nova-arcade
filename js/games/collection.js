(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  const WIDTH = 640;
  const HEIGHT = 400;
  const themes = [
    ['Neon', '🌈'], ['Cosmic', '🌌'], ['Crystal', '💎'], ['Jungle', '🌿'],
    ['Arctic', '❄️'], ['Lava', '🌋'], ['Turbo', '🏎️'], ['Pixel', '👾'],
    ['Shadow', '🌑'], ['Solar', '☀️'], ['Lunar', '🌙'], ['Mystic', '🔮'],
    ['Robo', '🤖'], ['Ocean', '🌊'], ['Thunder', '⚡'], ['Candy', '🍬'],
    ['Retro', '🕹️'], ['Galaxy', '🪐'], ['Desert', '🏜️'], ['Cyber', '💻'],
    ['Cloud', '☁️'], ['Dragon', '🐉'], ['Emerald', '🟢'], ['Frost', '🧊'],
    ['Comet', '☄️'], ['Star', '⭐'], ['Midnight', '🌃'], ['Bubble', '🫧'],
    ['Golden', '🏆'], ['Quantum', '🌀'],
    ['Vapor', '🌫️'], ['Solaris', '🌞'], ['Monsoon', '🌧️'], ['Tundra', '🧊'],
    ['Aurora', '🌌'], ['Cinder', '🔥'], ['Marble', '⚪'], ['Velvet', '🟣'],
    ['Storm', '⛈️'], ['Phantom', '👻'], ['Prism', '🔷'], ['Orbit', '🛰️'],
    ['Meteor', '☄️'], ['Astro', '👨‍🚀'], ['Nova', '💥'], ['Nebula', '🌠'],
    ['Starlight', '✨'], ['Moonstone', '🌙'], ['Topaz', '🟡'], ['Sapphire', '🔵'],
    ['Ruby', '🔴'], ['Amber', '🟠'], ['Pearl', '⚪'], ['Onyx', '⚫'],
    ['Willow', '🌳'], ['Bamboo', '🎋'], ['Coral', '🪸'], ['Tidal', '🌊'],
    ['Lagoon', '🏝️'], ['Sequoia', '🌲'], ['Cobalt', '🔹'], ['Crimson', '🟥'],
    ['Indigo', '🟪'], ['Magenta', '💟'], ['Silver', '🥈'], ['Bronze', '🥉'],
    ['Copper', '🟤'], ['Jade', '🟢'], ['Opal', '💠'], ['Flame', '🔥'],
    ['Blizzard', '🌨️'], ['Cyclone', '🌀'], ['Mirage', '🏜️'], ['Oasis', '🌴'],
    ['Canyon', '⛰️'], ['Volcano', '🌋'], ['Rainforest', '🌴'], ['Savanna', '🦒'],
    ['Alpine', '🏔️'], ['Glacier', '🧊'], ['Monochrome', '🎱'], ['Synthwave', '📼'],
    ['Joystick', '🕹️'], ['Future', '🛸'], ['Steampunk', '⚙️'], ['Clockwork', '⏱️'],
    ['Airship', '🎈'], ['Mecha', '🦾'], ['Botanical', '🌱'], ['Wildwood', '🦌'],
    ['Mint', '🌿'], ['Quartz', '💠'], ['Basil', '🌱'], ['Echo', '📣'],
    ['Volt', '🔋'], ['Redwood', '🌲'], ['Saffron', '🟠'], ['Citrus', '🍋'],
    ['Pine', '🌲'], ['Kelp', '🌿'], ['Thundercloud', '🌩️'], ['Firefly', '✨'],
    ['Mosaic', '🎨'], ['Origami', '🦢'], ['Paper', '📃'], ['Circuit', '🔌'],
    ['Asteroid', '🌑'], ['Sundown', '🌆'], ['Polar', '🐻‍❄️'], ['Wildflower', '🌼'],
    ['Saltwater', '🪼'], ['Blueberry', '🫐'], ['Tangerine', '🍊'], ['Macaron', '🍡'],
    ['Horizon', '🌅'], ['Tropical', '🌺'], ['Magma', '🌋'], ['Bonsai', '🪴']
  ];

  function makeStage(container, width, height, labels) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const stats = labels.map(() => {
      const stat = document.createElement('span');
      stat.className = 'game-hud';
      toolbar.appendChild(stat);
      return stat;
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

  function keyListener(handler) {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }

  function pointOnCanvas(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  function runner(container, theme, level) {
    const { canvas, ctx, stats, restart } = makeStage(container, 720, 360, ['Score: 0', 'Best: 0']);
    const ground = 306;
    let player, obstacles, score, frame, ended, animId;
    function reset() {
      player = { x: 104, y: ground - 30, vy: 0, onGround: true };
      obstacles = [];
      score = 0;
      frame = 0;
      ended = false;
      stats[0].textContent = 'Score: 0';
      stats[1].textContent = `Speed: ${Math.min(10, 4 + level * 0.15).toFixed(1)}`;
    }
    function jump() {
      if (ended) { reset(); return; }
      if (player.onGround) {
        player.vy = -11.2 - Math.min(1.5, level * 0.025);
        player.onGround = false;
      }
    }
    function update() {
      if (ended) return;
      frame++;
      const speed = 4 + Math.min(5, level * 0.15);
      player.vy += 0.58;
      player.y += player.vy;
      player.onGround = false;
      if (player.y + 30 >= ground) {
        player.y = ground - 30;
        player.vy = 0;
        player.onGround = true;
      }
      if (frame % Math.max(42, 94 - level) === 0) {
        obstacles.push({ x: 740, w: 22 + level % 12, h: 26 + level % 18 });
      }
      obstacles.forEach((obstacle) => { obstacle.x -= speed; });
      obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.w > 0);
      if (obstacles.some((obstacle) =>
        player.x + 25 > obstacle.x && player.x + 5 < obstacle.x + obstacle.w &&
        player.y + 30 > ground - obstacle.h
      )) ended = true;
      score++;
      stats[0].textContent = `Score: ${Math.floor(score / 5)}`;
    }
    function draw() {
      ctx.fillStyle = `hsl(${theme.hue}, 55%, 13%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `hsla(${theme.hue}, 90%, 65%, .2)`;
      for (let x = 20 - frame % 40; x < canvas.width; x += 40) {
        ctx.fillRect(x, 0, 2, ground);
      }
      ctx.fillStyle = '#164e3e';
      ctx.fillRect(0, ground, canvas.width, canvas.height - ground);
      ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`;
      ctx.fillRect(0, ground, canvas.width, 5);
      obstacles.forEach((obstacle) => {
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(obstacle.x, ground - obstacle.h, obstacle.w, obstacle.h);
      });
      ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`;
      ctx.fillRect(player.x, player.y, 30, 30);
      if (ended) {
        ctx.fillStyle = 'rgba(2, 6, 23, .75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RUN OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '15px sans-serif';
        ctx.fillText('Jump or press Restart to run again', canvas.width / 2, canvas.height / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKey(event) {
      if (['Space', 'ArrowUp'].includes(event.code)) { event.preventDefault(); jump(); }
    }
    function onPointer(event) { event.preventDefault(); jump(); }
    canvas.addEventListener('pointerdown', onPointer);
    const removeKey = keyListener(onKey);
    restart.addEventListener('click', reset);
    reset();
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      removeKey();
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }

  function targetPractice(container, theme, level) {
    const { canvas, ctx, stats, restart } = makeStage(container, 640, 400, ['Hits: 0', 'Escapes: 0 / 5']);
    let targets, hits, escapes, frame, ended, animId;
    function reset() {
      targets = [];
      hits = 0;
      escapes = 0;
      frame = 0;
      ended = false;
      stats[0].textContent = 'Hits: 0';
      stats[1].textContent = 'Escapes: 0 / 5';
    }
    function update() {
      if (ended) return;
      frame++;
      if (frame % Math.max(36, 74 - level) === 0) {
        targets.push({
          x: canvas.width + 20,
          y: 38 + Math.random() * (canvas.height - 76),
          r: Math.max(12, 21 - Math.floor(level / 8)),
          speed: 1.4 + level * 0.045
        });
      }
      targets.forEach((target) => { target.x -= target.speed; });
      targets = targets.filter((target) => {
        if (target.x + target.r < 0) { escapes++; return false; }
        return true;
      });
      stats[1].textContent = `Escapes: ${escapes} / 5`;
      if (escapes >= 5) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#101827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = `hsla(${theme.hue}, 90%, 70%, .18)`;
      for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      targets.forEach((target) => {
        ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`;
        ctx.beginPath(); ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(target.x, target.y, target.r * 0.5, 0, Math.PI * 2); ctx.stroke();
      });
      if (ended) {
        ctx.fillStyle = 'rgba(2, 6, 23, .75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('PRACTICE OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart to play again', canvas.width / 2, canvas.height / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onClick(event) {
      if (ended) return;
      const point = pointOnCanvas(canvas, event);
      const index = targets.findIndex((target) => Math.hypot(target.x - point.x, target.y - point.y) < target.r + 4);
      if (index >= 0) {
        targets.splice(index, 1);
        hits++;
        stats[0].textContent = `Hits: ${hits}`;
      }
    }
    canvas.addEventListener('click', onClick);
    restart.addEventListener('click', reset);
    reset();
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onClick);
    };
  }

  function dodge(container, theme, level) {
    const { canvas, ctx, stats, restart } = makeStage(container, 640, 400, ['Survival: 0', 'Best: Avoid every meteor']);
    let player, hazards, frame, ended, animId, keys;
    function reset() {
      player = { x: 320, y: 330, r: 13 };
      hazards = [];
      frame = 0;
      ended = false;
      keys = {};
      stats[0].textContent = 'Survival: 0';
    }
    function update() {
      if (ended) return;
      frame++;
      const speed = 3.4 + Math.min(3, level * 0.08);
      if (keys.ArrowLeft || keys.KeyA) player.x -= speed;
      if (keys.ArrowRight || keys.KeyD) player.x += speed;
      if (keys.ArrowUp || keys.KeyW) player.y -= speed;
      if (keys.ArrowDown || keys.KeyS) player.y += speed;
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
      if (frame % Math.max(12, 34 - Math.floor(level / 2)) === 0) {
        hazards.push({ x: Math.random() * canvas.width, y: -16, r: 9 + Math.random() * 9, vy: 2 + Math.random() * 2 + level * 0.06 });
      }
      hazards.forEach((hazard) => { hazard.y += hazard.vy; });
      hazards = hazards.filter((hazard) => hazard.y - hazard.r < canvas.height);
      if (hazards.some((hazard) => Math.hypot(hazard.x - player.x, hazard.y - player.y) < hazard.r + player.r)) ended = true;
      stats[0].textContent = `Survival: ${Math.floor(frame / 30)}s`;
    }
    function draw() {
      ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `hsla(${theme.hue}, 90%, 65%, .12)`;
      for (let y = 10; y < canvas.height; y += 30) ctx.fillRect(0, y, canvas.width, 1);
      hazards.forEach((hazard) => {
        ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`;
      ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
      if (ended) {
        ctx.fillStyle = 'rgba(2, 6, 23, .75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('METEOR HIT!', canvas.width / 2, canvas.height / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Move or press Restart to try again', canvas.width / 2, canvas.height / 2 + 28);
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
    reset();
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  function collect(container, theme, level) {
    const { canvas, ctx, stats, restart } = makeStage(container, 576, 384, ['Gems: 0', 'Move: WASD / Arrows']);
    const cell = 24;
    const columns = canvas.width / cell;
    const rows = canvas.height / cell;
    let player, gem, score;
    function newGem() {
      let next;
      do {
        next = { x: Math.floor(Math.random() * columns), y: Math.floor(Math.random() * rows) };
      } while (next.x === player.x && next.y === player.y);
      return next;
    }
    function reset() {
      player = { x: Math.floor(columns / 2), y: Math.floor(rows / 2) };
      score = 0;
      gem = newGem();
      stats[0].textContent = 'Gems: 0';
      draw();
    }
    function move(event) {
      const directions = {
        ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
        ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1]
      };
      const direction = directions[event.code];
      if (!direction) return;
      event.preventDefault();
      player.x = (player.x + direction[0] + columns) % columns;
      player.y = (player.y + direction[1] + rows) % rows;
      if (player.x === gem.x && player.y === gem.y) {
        score++;
        gem = newGem();
        stats[0].textContent = `Gems: ${score}`;
      }
      draw();
    }
    function draw() {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,.07)';
      for (let x = 0; x <= canvas.width; x += cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y <= canvas.height; y += cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(gem.x * cell + cell / 2, gem.y * cell + cell / 2, cell * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`;
      ctx.fillRect(player.x * cell + 3, player.y * cell + 3, cell - 6, cell - 6);
    }
    function onKey(event) { move(event); }
    window.addEventListener('keydown', onKey);
    restart.addEventListener('click', reset);
    reset();
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }

  function shooter(container, theme, level) {
    const { canvas, ctx, stats, restart } = makeStage(container, 640, 400, ['Score: 0', 'Lives: 3']);
    let player, shots, enemies, score, lives, frame, ended, animId, keys;
    function reset() {
      player = { x: 320, y: 360 };
      shots = [];
      enemies = [];
      score = 0;
      lives = 3;
      frame = 0;
      ended = false;
      keys = {};
      stats[0].textContent = 'Score: 0';
      stats[1].textContent = 'Lives: 3';
    }
    function update() {
      if (ended) return;
      frame++;
      if (keys.ArrowLeft || keys.KeyA) player.x -= 5;
      if (keys.ArrowRight || keys.KeyD) player.x += 5;
      player.x = Math.max(15, Math.min(canvas.width - 15, player.x));
      if (keys.Space && frame % 12 === 0) shots.push({ x: player.x, y: player.y - 12 });
      if (frame % Math.max(22, 52 - level) === 0) {
        enemies.push({ x: 20 + Math.random() * (canvas.width - 40), y: -15, r: 12, vy: 1.4 + level * 0.05 });
      }
      shots.forEach((shot) => { shot.y -= 7; });
      enemies.forEach((enemy) => { enemy.y += enemy.vy; });
      shots = shots.filter((shot) => shot.y > 0);
      for (let i = enemies.length - 1; i >= 0; i--) {
        const hit = shots.findIndex((shot) => Math.hypot(shot.x - enemies[i].x, shot.y - enemies[i].y) < enemies[i].r + 6);
        if (hit !== -1) {
          enemies.splice(i, 1);
          shots.splice(hit, 1);
          score++;
        } else if (enemies[i].y > canvas.height) {
          enemies.splice(i, 1);
          lives--;
        }
      }
      stats[0].textContent = `Score: ${score}`;
      stats[1].textContent = `Lives: ${lives}`;
      if (lives <= 0) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#080f25'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `hsla(${theme.hue}, 80%, 75%, .6)`;
      for (let i = 0; i < 28; i++) ctx.fillRect((i * 97) % canvas.width, (i * 53) % canvas.height, 2, 2);
      ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`;
      ctx.beginPath(); ctx.moveTo(player.x, player.y - 16); ctx.lineTo(player.x - 13, player.y + 12); ctx.lineTo(player.x + 13, player.y + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fde047'; shots.forEach((shot) => ctx.fillRect(shot.x - 2, shot.y - 7, 4, 12));
      ctx.fillStyle = '#fb7185'; enemies.forEach((enemy) => { ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2); ctx.fill(); });
      if (ended) {
        ctx.fillStyle = 'rgba(2, 6, 23, .75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SHIP DISABLED', canvas.width / 2, canvas.height / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart to launch again', canvas.width / 2, canvas.height / 2 + 28);
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

  function paddle(container, theme, level) {
    const { canvas, ctx, stats, restart } = makeStage(container, 640, 400, ['Bricks: 0', 'Lives: 3']);
    let paddle, ball, bricks, lives, ended, animId, keys;
    function reset() {
      paddle = { x: canvas.width / 2 - 48, y: canvas.height - 25, w: 96, h: 10 };
      ball = { x: canvas.width / 2, y: canvas.height - 45, vx: 3 + level * 0.04, vy: -4 };
      bricks = [];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) bricks.push({ x: 26 + col * 74, y: 42 + row * 25, w: 64, h: 16, alive: true });
      }
      lives = 3;
      ended = false;
      keys = {};
      updateHud();
    }
    function updateHud() {
      stats[0].textContent = `Bricks: ${bricks.filter((brick) => brick.alive).length}`;
      stats[1].textContent = `Lives: ${lives}`;
    }
    function update() {
      if (ended) return;
      if (keys.ArrowLeft || keys.KeyA) paddle.x -= 6;
      if (keys.ArrowRight || keys.KeyD) paddle.x += 6;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.x < 7 || ball.x > canvas.width - 7) ball.vx *= -1;
      if (ball.y < 7) ball.vy = Math.abs(ball.vy);
      if (ball.vy > 0 && ball.y + 7 >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += ((ball.x - paddle.x - paddle.w / 2) / 18);
      }
      const hit = bricks.find((brick) => brick.alive &&
        ball.x > brick.x && ball.x < brick.x + brick.w &&
        ball.y > brick.y && ball.y < brick.y + brick.h
      );
      if (hit) { hit.alive = false; ball.vy *= -1; updateHud(); }
      if (bricks.every((brick) => !brick.alive)) {
        for (const brick of bricks) brick.alive = true;
        ball.vy *= 1.08;
        updateHud();
      }
      if (ball.y > canvas.height) {
        lives--;
        ball = { x: canvas.width / 2, y: canvas.height - 45, vx: 3, vy: -4 };
        updateHud();
        if (lives <= 0) ended = true;
      }
    }
    function draw() {
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      bricks.forEach((brick, i) => {
        if (!brick.alive) return;
        ctx.fillStyle = `hsl(${(theme.hue + i * 18) % 360}, 80%, 60%)`;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      });
      ctx.fillStyle = `hsl(${theme.hue}, 90%, 65%)`; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill();
      if (ended) {
        ctx.fillStyle = 'rgba(2, 6, 23, .75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('OUT OF LIVES', canvas.width / 2, canvas.height / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Press Restart to play again', canvas.width / 2, canvas.height / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
    }
    function onKeyUp(event) { keys[event.code] = false; }
    function onPointer(event) {
      const point = pointOnCanvas(canvas, event);
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, point.x - paddle.w / 2));
    }
    canvas.addEventListener('pointermove', onPointer);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restart.addEventListener('click', reset);
    reset();
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', onPointer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  function memory(container, theme, level) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const status = document.createElement('span');
    status.className = 'game-hud';
    const restart = document.createElement('button');
    restart.className = 'game-btn';
    restart.textContent = 'Restart';
    toolbar.append(status, restart);
    const board = document.createElement('div');
    board.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(54px,82px));gap:10px;justify-content:center;width:100%;';
    container.append(toolbar, board);
    const symbols = ['🍀', '🚀', '🎈', '🎵', '🍓', '🐳', '🧩', '🌟'];
    let first, second, lock, matches, moves, timeoutId;
    function reset() {
      if (timeoutId) clearTimeout(timeoutId);
      first = null;
      second = null;
      lock = false;
      matches = 0;
      moves = 0;
      status.textContent = 'Pairs: 0 / 8 · Moves: 0';
      const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
      board.replaceChildren();
      cards.forEach((symbol) => {
        const card = document.createElement('button');
        card.className = 'game-btn';
        card.textContent = '?';
        card.setAttribute('aria-label', 'Hidden card');
        card.style.cssText = `font-size:clamp(1.4rem,5vw,2.4rem);min-height:74px;background:linear-gradient(135deg,hsl(${theme.hue},60%,35%),#1e293b);`;
        card.addEventListener('click', () => {
          if (lock || card === first || card.dataset.matched) return;
          card.textContent = symbol;
          card.setAttribute('aria-label', symbol);
          if (!first) { first = card; return; }
          second = card;
          moves++;
          if (first.textContent === second.textContent) {
            first.dataset.matched = 'true';
            second.dataset.matched = 'true';
            first = null;
            second = null;
            matches++;
            status.textContent = matches === 8
              ? `You won in ${moves} moves!`
              : `Pairs: ${matches} / 8 · Moves: ${moves}`;
          } else {
            lock = true;
            timeoutId = setTimeout(() => {
              first.textContent = '?';
              second.textContent = '?';
              first.setAttribute('aria-label', 'Hidden card');
              second.setAttribute('aria-label', 'Hidden card');
              first = null;
              second = null;
              lock = false;
            }, Math.max(350, 850 - level * 10));
            status.textContent = `Pairs: ${matches} / 8 · Moves: ${moves}`;
          }
        });
        board.appendChild(card);
      });
    }
    restart.addEventListener('click', reset);
    reset();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }

  function quickMath(container, theme, level) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const scoreEl = document.createElement('span');
    scoreEl.className = 'game-hud';
    const timeEl = document.createElement('span');
    timeEl.className = 'game-hud';
    const restart = document.createElement('button');
    restart.className = 'game-btn';
    restart.textContent = 'Restart';
    toolbar.append(scoreEl, timeEl, restart);
    const question = document.createElement('h3');
    question.style.cssText = 'font-size:clamp(2rem,8vw,4rem);margin:24px;color:#f8fafc;text-align:center;';
    const choices = document.createElement('div');
    choices.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:12px;';
    container.append(toolbar, question, choices);
    let score, seconds, answer, timerId, ended;
    function nextQuestion() {
      const a = 2 + Math.floor(Math.random() * (8 + level));
      const b = 2 + Math.floor(Math.random() * (8 + level));
      const operation = Math.floor(Math.random() * 3);
      const left = operation === 2 ? Math.min(a, 10) : a;
      const right = operation === 2 ? Math.min(b, 10) : b;
      answer = operation === 0 ? left + right : operation === 1 ? left - right : left * right;
      question.textContent = `${left} ${['+', '-', '×'][operation]} ${right} = ?`;
      const options = new Set([answer]);
      while (options.size < 3) options.add(answer + Math.floor(Math.random() * 15) - 7);
      choices.replaceChildren();
      [...options].sort(() => Math.random() - 0.5).forEach((value) => {
        const button = document.createElement('button');
        button.className = 'game-btn';
        button.textContent = String(value);
        button.style.cssText = `font-size:1.35rem;min-width:92px;padding:14px 20px;background:linear-gradient(135deg,hsl(${theme.hue},65%,42%),#334155);`;
        button.addEventListener('click', () => {
          if (ended) return;
          if (value === answer) {
            score++;
            scoreEl.textContent = `Score: ${score}`;
            nextQuestion();
          } else {
            button.disabled = true;
            button.style.opacity = '0.45';
          }
        });
        choices.appendChild(button);
      });
    }
    function reset() {
      clearInterval(timerId);
      score = 0;
      seconds = 45;
      ended = false;
      scoreEl.textContent = 'Score: 0';
      timeEl.textContent = 'Time: 45s';
      nextQuestion();
      timerId = setInterval(() => {
        seconds--;
        timeEl.textContent = `Time: ${seconds}s`;
        if (seconds <= 0) {
          ended = true;
          clearInterval(timerId);
          question.textContent = `Time! Final score: ${score}`;
          choices.replaceChildren();
        }
      }, 1000);
    }
    restart.addEventListener('click', reset);
    reset();
    return () => clearInterval(timerId);
  }

  const modes = [
    { id: 'dash', name: 'Dash', icon: '🏃', category: 'Arcade', controls: 'Space / Up Arrow / Click to jump', description: 'Jump over barriers and keep your run going.', mount: runner },
    { id: 'target', name: 'Target Trial', icon: '🎯', category: 'Arcade', controls: 'Click or tap moving targets', description: 'Hit moving targets before they escape.', mount: targetPractice },
    { id: 'dodge', name: 'Meteor Dodge', icon: '☄️', category: 'Arcade', controls: 'WASD / Arrow Keys to move', description: 'Dodge the falling hazards for as long as you can.', mount: dodge },
    { id: 'collect', name: 'Gem Hunt', icon: '💎', category: 'Arcade', controls: 'WASD / Arrow Keys to move', description: 'Explore the grid and collect as many gems as possible.', mount: collect },
    { id: 'shooter', name: 'Space Blaster', icon: '🚀', category: 'Arcade', controls: 'A / D or Left / Right to move; Space to fire', description: 'Blast the descending invaders before you run out of lives.', mount: shooter },
    { id: 'paddle', name: 'Brick Bounce', icon: '🧱', category: 'Arcade', controls: 'Mouse / Touch or Left / Right Arrows', description: 'Keep the ball in play and clear the colored bricks.', mount: paddle },
    { id: 'memory', name: 'Memory Match', icon: '🧠', category: 'Puzzle', controls: 'Click or tap cards to find pairs', description: 'Flip cards and match every pair in as few moves as possible.', mount: memory },
    { id: 'math', name: 'Math Rush', icon: '➗', category: 'Puzzle', controls: 'Click the correct answer before time runs out', description: 'Solve quick arithmetic questions and beat the clock.', mount: quickMath }
  ];

  for (let index = 0; index < 941; index++) {
    const themeIndex = Math.floor(index / modes.length);
    const mode = modes[index % modes.length];
    const [themeName, themeIcon] = themes[themeIndex];
    const id = `challenge-${themeName.toLowerCase()}-${mode.id}`;
    const hue = (themeIndex * 47 + (index % modes.length) * 29) % 360;
    const theme = { name: themeName, icon: themeIcon, hue };
    const game = {
      id,
      title: `${themeName} ${mode.name}`,
      description: `${themeName} challenge: ${mode.description}`,
      categories: mode.category === 'Puzzle' ? ['Puzzle'] : ['Arcade'],
      controls: mode.controls,
      badge: themeIndex < 3 ? 'New' : '',
      icon: mode.icon,
      accent: `linear-gradient(135deg, hsl(${hue}, 75%, 52%), hsl(${(hue + 55) % 360}, 70%, 35%))`,
      mount(container) {
        return mode.mount(container, theme, themeIndex + 1);
      }
    };
    window.ArcadeGames[id] = game;
  }
})();
