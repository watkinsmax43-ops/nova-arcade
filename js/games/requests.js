(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  function makeCanvas(container, width, height, labels) {
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

  function point(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  function register(id, title, description, controls, icon, accent, mount) {
    window.ArcadeGames[id] = {
      id,
      title,
      description,
      categories: ['Arcade', 'Popular'],
      controls,
      icon,
      accent,
      mount
    };
  }

  function skatepark(container) {
    const W = 720, H = 360, ground = 292;
    const { canvas, ctx, stats, restart } = makeCanvas(container, W, H, ['Score: 0', 'Combo: 0']);
    let skater, obstacles, keys, score, frame, ended, animId;
    function reset() {
      skater = { x: 120, y: ground - 28, vy: 0, onGround: true, combo: 0 };
      obstacles = []; keys = {}; score = 0; frame = 0; ended = false;
      stats[0].textContent = 'Score: 0'; stats[1].textContent = 'Combo: 0';
    }
    function update() {
      if (ended) return;
      frame++;
      if (keys.ArrowLeft || keys.KeyA) skater.x = Math.max(50, skater.x - 2);
      if (keys.ArrowRight || keys.KeyD) skater.x = Math.min(230, skater.x + 2);
      const oldBottom = skater.y + 28;
      skater.vy += 0.55;
      skater.y += skater.vy;
      skater.onGround = false;
      if (skater.y + 28 >= ground) {
        skater.y = ground - 28;
        if (!skater.onGround && skater.combo > 0) score += skater.combo * 100;
        skater.vy = 0; skater.onGround = true; skater.combo = 0;
        stats[0].textContent = `Score: ${score}`;
        stats[1].textContent = 'Combo: 0';
      }
      if (frame % 78 === 0) obstacles.push({ x: W + 30, w: 30, h: 26 + Math.random() * 30 });
      obstacles.forEach((obstacle) => { obstacle.x -= 5; });
      obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.w > 0);
      if (obstacles.some((obstacle) => skater.x + 28 > obstacle.x && skater.x < obstacle.x + obstacle.w &&
          oldBottom >= ground - obstacle.h && skater.y + 28 >= ground - obstacle.h)) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#64748b'; ctx.fillRect(0, ground, W, H - ground);
      ctx.fillStyle = '#334155'; ctx.fillRect(0, ground - 12, W, 12);
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(330, ground); ctx.lineTo(420, ground - 55); ctx.lineTo(500, ground); ctx.closePath(); ctx.fill();
      obstacles.forEach((obstacle) => { ctx.fillStyle = '#f97316'; ctx.fillRect(obstacle.x, ground - obstacle.h, obstacle.w, obstacle.h); });
      ctx.fillStyle = '#1e293b'; ctx.fillRect(skater.x + 5, skater.y + 12, 28, 5);
      ctx.fillStyle = '#f43f5e'; ctx.fillRect(skater.x + 9, skater.y - 7, 18, 19);
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(skater.x + 18, skater.y - 12, 8, 0, Math.PI * 2); ctx.fill();
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BAIL!', W / 2, H / 2);
        ctx.font = '15px sans-serif'; ctx.fillText('Jump / trick or press Restart', W / 2, H / 2 + 28);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['Space', 'ArrowUp'].includes(event.code)) {
        event.preventDefault();
        if (skater.onGround) { skater.vy = -11; skater.onGround = false; }
        else {
          skater.combo++;
          stats[1].textContent = `Combo: ${skater.combo}`;
        }
      }
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

  function penaltyShootout(container) {
    const W = 640, H = 400;
    const { canvas, ctx, stats, restart } = makeCanvas(container, W, H, ['Goals: 0', 'Shots: 0 / 5']);
    let frame, goalieX, goals, shots, ended, aim, animId;
    function reset() {
      frame = 0; goalieX = W / 2; goals = 0; shots = 0; ended = false; aim = { x: W / 2, y: 170 };
      stats[0].textContent = 'Goals: 0'; stats[1].textContent = 'Shots: 0 / 5';
    }
    function update() {
      frame++;
      goalieX = W / 2 + Math.sin(frame * 0.035) * 125;
    }
    function draw() {
      ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(100, 50, 440, 235);
      ctx.fillStyle = '#fff'; ctx.fillRect(110, 60, 420, 215);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 7; ctx.strokeRect(110, 60, 420, 215);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(goalieX - 28, 210, 56, 20);
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(goalieX, 196, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(320, 340, 11, 0, Math.PI * 2); ctx.fill();
      if (!ended) {
        ctx.strokeStyle = 'rgba(15,23,42,.35)'; ctx.beginPath(); ctx.moveTo(320, 340); ctx.lineTo(aim.x, aim.y); ctx.stroke();
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(aim.x, aim.y, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(2,6,23,.75)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`SHOOTOUT OVER · ${goals} GOALS`, W / 2, H / 2);
      }
    }
    function onMove(event) { aim = point(canvas, event); }
    function onShot(event) {
      if (ended) return;
      const shot = point(canvas, event);
      shots++;
      const inGoal = shot.x > 118 && shot.x < 522 && shot.y > 68 && shot.y < 268;
      const saved = Math.hypot(shot.x - goalieX, shot.y - 220) < 70;
      if (inGoal && !saved) goals++;
      stats[0].textContent = `Goals: ${goals}`;
      stats[1].textContent = `Shots: ${shots} / 5`;
      if (shots >= 5) ended = true;
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('click', onShot);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('click', onShot);
    };
  }

  function blackjack(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const winsEl = document.createElement('span'); winsEl.className = 'game-hud';
    const result = document.createElement('span'); result.className = 'game-hud';
    const restart = document.createElement('button'); restart.className = 'game-btn'; restart.textContent = 'New hand';
    toolbar.append(winsEl, result, restart);
    const dealerLabel = document.createElement('h3');
    const dealerCards = document.createElement('p');
    const playerLabel = document.createElement('h3');
    const playerCards = document.createElement('p');
    const actions = document.createElement('div');
    actions.className = 'game-toolbar';
    const hit = document.createElement('button'); hit.className = 'game-btn'; hit.textContent = 'Hit';
    const stand = document.createElement('button'); stand.className = 'game-btn'; stand.textContent = 'Stand';
    actions.append(hit, stand);
    container.append(toolbar, dealerLabel, dealerCards, playerLabel, playerCards, actions);
    const suits = ['♠', '♥', '♦', '♣'];
    let deck, dealer, player, active, wins;
    function drawCard() { return deck.pop(); }
    function value(cards) {
      let total = cards.reduce((sum, card) => sum + Math.min(card.rank, 10), 0);
      let aces = cards.filter((card) => card.rank === 1).length;
      while (aces > 0 && total + 10 <= 21) { total += 10; aces--; }
      return total;
    }
    function finish(message) {
      active = false;
      result.textContent = message;
      render();
    }
    function render() {
      winsEl.textContent = `Hands won: ${wins}`;
      dealerLabel.textContent = active ? 'Dealer' : `Dealer · ${value(dealer)}`;
      dealerCards.textContent = dealer.map((card) => `${card.label}${card.suit}`).join('  ');
      playerLabel.textContent = `You · ${value(player)}`;
      playerCards.textContent = player.map((card) => `${card.label}${card.suit}`).join('  ');
      hit.disabled = !active;
      stand.disabled = !active;
    }
    function newHand(keepWins) {
      if (!keepWins) wins = 0;
      deck = [];
      for (const suit of suits) for (let rank = 1; rank <= 13; rank++) {
        deck.push({ rank, suit, label: rank === 1 ? 'A' : rank > 10 ? ['J', 'Q', 'K'][rank - 11] : String(rank) });
      }
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      dealer = [drawCard(), drawCard()];
      player = [drawCard(), drawCard()];
      active = true;
      result.textContent = 'Try to get close to 21 without going over.';
      if (value(player) === 21) {
        wins++;
        finish('Blackjack! You win.');
      } else render();
    }
    hit.addEventListener('click', () => {
      if (!active) return;
      player.push(drawCard());
      if (value(player) > 21) finish('Bust — dealer wins.');
      else render();
    });
    stand.addEventListener('click', () => {
      if (!active) return;
      while (value(dealer) < 17) dealer.push(drawCard());
      const playerScore = value(player), dealerScore = value(dealer);
      if (dealerScore > 21 || playerScore > dealerScore) { wins++; finish('You win this hand!'); }
      else if (playerScore === dealerScore) finish('Push — it is a tie.');
      else finish('Dealer wins this hand.');
    });
    restart.addEventListener('click', () => newHand(true));
    newHand(false);
    return () => {};
  }

  function wobbleArena(container) {
    const W = 640, H = 400, floor = 315;
    const { canvas, ctx, stats, restart } = makeCanvas(container, W, H, ['Blue: 0', 'Red: 0']);
    let blue, red, keys, blueScore, redScore, ended, animId;
    function resetRound() {
      blue = { x: 220, y: floor - 32, vx: 0, vy: 0, r: 18 };
      red = { x: 420, y: floor - 32, vx: 0, vy: 0, r: 18 };
    }
    function reset() {
      keys = {}; blueScore = 0; redScore = 0; ended = false;
      stats[0].textContent = 'Blue: 0'; stats[1].textContent = 'Red: 0';
      resetRound();
    }
    function update() {
      if (ended) return;
      for (const [ball, left, right, jump] of [[blue, 'KeyA', 'KeyD', 'KeyW'], [red, 'ArrowLeft', 'ArrowRight', 'ArrowUp']]) {
        if (keys[left]) ball.vx -= 0.35;
        if (keys[right]) ball.vx += 0.35;
        if (keys[jump] && ball.y + ball.r >= floor) ball.vy = -8;
        ball.vy += 0.38;
        ball.x += ball.vx; ball.y += ball.vy;
        ball.vx *= 0.97;
        if (ball.y + ball.r > floor) { ball.y = floor - ball.r; ball.vy = 0; }
      }
      const dx = red.x - blue.x, dy = red.y - blue.y;
      const distance = Math.hypot(dx, dy);
      if (distance < blue.r + red.r && distance > 0) {
        const push = (blue.r + red.r - distance) * 0.11;
        blue.vx -= dx / distance * push;
        red.vx += dx / distance * push;
      }
      if (blue.x < 35 || blue.x > W - 35 || blue.y > H) { redScore++; resetRound(); }
      else if (red.x < 35 || red.x > W - 35 || red.y > H) { blueScore++; resetRound(); }
      stats[0].textContent = `Blue: ${blueScore}`;
      stats[1].textContent = `Red: ${redScore}`;
      if (blueScore >= 3 || redScore >= 3) ended = true;
    }
    function drawPlayer(ball, color) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(ball.x, ball.y, ball.r, ball.r * 1.1 + Math.sin(ball.x) * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x - 5, ball.y - 4, 4, 0, Math.PI * 2); ctx.arc(ball.x + 5, ball.y - 4, 4, 0, Math.PI * 2); ctx.fill();
    }
    function draw() {
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#475569'; ctx.fillRect(0, floor, W, H - floor);
      ctx.fillStyle = '#facc15'; ctx.fillRect(0, floor - 5, W, 5);
      drawPlayer(blue, '#38bdf8'); drawPlayer(red, '#fb7185');
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(blueScore > redScore ? 'BLUE WINS!' : 'RED WINS!', W / 2, H / 2);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.code)) event.preventDefault();
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

  function cityStory(container, mode) {
    const W = 620, H = 400;
    const { canvas, ctx, stats, restart } = makeCanvas(container, W, H, ['Loot: 0', 'Crashes: 0 / 3']);
    let lane, traffic, loot, score, crashes, frame, ended, animId, keys;
    function reset() {
      lane = 1; traffic = []; loot = []; score = 0; crashes = 0; frame = 0; ended = false;
      keys = {};
      for (let i = 0; i < 4; i++) loot.push({ lane: Math.floor(Math.random() * 3), y: -160 - i * 120 });
      stats[0].textContent = 'Loot: 0'; stats[1].textContent = 'Crashes: 0 / 3';
    }
    function update() {
      if (ended) return;
      frame++;
      if (keys.ArrowLeft || keys.KeyA) { lane = Math.max(0, lane - 1); keys.ArrowLeft = keys.KeyA = false; }
      if (keys.ArrowRight || keys.KeyD) { lane = Math.min(2, lane + 1); keys.ArrowRight = keys.KeyD = false; }
      if (frame % (mode === 'heist' ? 45 : 55) === 0) traffic.push({ lane: Math.floor(Math.random() * 3), y: -30 });
      const speed = mode === 'race' ? 6 : 4;
      traffic.forEach((car) => { car.y += speed; });
      loot.forEach((item) => { item.y += speed; });
      for (let i = traffic.length - 1; i >= 0; i--) {
        if (traffic[i].lane === lane && traffic[i].y > H - 115 && traffic[i].y < H - 45) crashes++;
        if (traffic[i].y > H + 30) traffic.splice(i, 1);
      }
      for (let i = loot.length - 1; i >= 0; i--) {
        if (loot[i].lane === lane && loot[i].y > H - 120 && loot[i].y < H - 45) {
          loot.splice(i, 1); score++;
          loot.push({ lane: Math.floor(Math.random() * 3), y: -80 });
        } else if (loot[i].y > H + 20) {
          loot[i] = { lane: Math.floor(Math.random() * 3), y: -100 };
        }
      }
      stats[0].textContent = `${mode === 'heist' ? 'Bags' : mode === 'race' ? 'Checkpoints' : 'Loot'}: ${score}`;
      stats[1].textContent = `Crashes: ${Math.min(3, crashes)} / 3`;
      if (crashes >= 3) ended = true;
    }
    function draw() {
      ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#27272a'; ctx.fillRect(112, 0, 396, H);
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
      ctx.beginPath(); ctx.moveTo(244, 0); ctx.lineTo(244, H); ctx.moveTo(376, 0); ctx.lineTo(376, H); ctx.stroke(); ctx.setLineDash([]);
      loot.forEach((item) => {
        ctx.fillStyle = mode === 'heist' ? '#facc15' : '#22d3ee';
        ctx.fillRect(178 + item.lane * 132, item.y, 18, 18);
      });
      traffic.forEach((car) => {
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(166 + car.lane * 132, car.y, 42, 64);
      });
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(160 + lane * 132, H - 80, 54, 72);
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MISSION OVER', W / 2, H / 2);
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

  function stealth(container, variant) {
    const W = 640, H = 384, CELL = 32, COLS = 20, ROWS = 12;
    const { canvas, ctx, stats, restart } = makeCanvas(container, W, H, ['Relics: 0', `Caught: 0 / 3`]);
    let player, guards, relics, walls, turns, caught, ended, won, animId;
    function keyOf(x, y) { return `${x},${y}`; }
    function reset() {
      player = { x: 1, y: 1 };
      walls = new Set();
      for (let y = 1; y < ROWS - 1; y++) {
        for (const x of [5, 10, 15]) if (y !== (x + 2) % 8 + 2) walls.add(keyOf(x, y));
      }
      guards = [
        { x: 7, y: 3, dir: 1 },
        { x: 12, y: 8, dir: -1 }
      ];
      relics = variant === 'rooftop' ? [] : [{ x: 4, y: 9 }, { x: 8, y: 2 }, { x: 13, y: 9 }, { x: 17, y: 3 }];
      turns = 0; caught = 0; ended = false; won = false;
      stats[0].textContent = `Relics: 0 / ${variant === 'rooftop' ? 0 : 4}`;
      stats[1].textContent = 'Caught: 0 / 3';
      draw();
    }
    function move(dx, dy) {
      if (ended) return;
      const nx = Math.max(1, Math.min(COLS - 2, player.x + dx));
      const ny = Math.max(1, Math.min(ROWS - 2, player.y + dy));
      if (walls.has(keyOf(nx, ny))) return;
      player = { x: nx, y: ny };
      const index = relics.findIndex((relic) => relic.x === nx && relic.y === ny);
      if (index >= 0) relics.splice(index, 1);
      turns++;
      if (turns % 2 === 0) guards.forEach((guard) => {
        const nextX = guard.x + guard.dir;
        if (nextX < 1 || nextX > COLS - 2 || walls.has(keyOf(nextX, guard.y))) guard.dir *= -1;
        else guard.x = nextX;
      });
      const detected = guards.some((guard) => Math.abs(guard.x - player.x) + Math.abs(guard.y - player.y) <= 1);
      if (detected) {
        caught++;
        player = { x: 1, y: 1 };
        stats[1].textContent = `Caught: ${caught} / 3`;
        if (caught >= 3) ended = true;
      }
      const relicGoal = variant === 'rooftop' || relics.length === 0;
      stats[0].textContent = variant === 'rooftop' ? 'Reach the exit' : `Relics: ${4 - relics.length} / 4`;
      if (player.x === COLS - 2 && player.y === ROWS - 2 && relicGoal && !ended) {
        ended = true; won = true;
      }
      draw();
    }
    function draw() {
      ctx.fillStyle = '#172554'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#334155';
      walls.forEach((entry) => {
        const [x, y] = entry.split(',').map(Number);
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      });
      ctx.fillStyle = '#22c55e'; ctx.fillRect((COLS - 2) * CELL, (ROWS - 2) * CELL, CELL, CELL);
      relics.forEach((relic) => {
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(relic.x * CELL + 16, relic.y * CELL + 16, 8, 0, Math.PI * 2); ctx.fill();
      });
      guards.forEach((guard) => {
        ctx.fillStyle = '#fb7185'; ctx.fillRect(guard.x * CELL + 6, guard.y * CELL + 6, 20, 20);
        ctx.strokeStyle = 'rgba(248,113,113,.4)'; ctx.beginPath(); ctx.arc(guard.x * CELL + 16, guard.y * CELL + 16, 44, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(player.x * CELL + 7, player.y * CELL + 7, 18, 18);
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.74)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(won ? 'MISSION COMPLETE!' : 'SPOTTED!', W / 2, H / 2);
      }
    }
    function onKey(event) {
      const directions = {
        ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
        ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1]
      };
      if (!directions[event.code]) return;
      event.preventDefault();
      move(...directions[event.code]);
    }
    window.addEventListener('keydown', onKey);
    restart.addEventListener('click', reset);
    reset();
    return () => window.removeEventListener('keydown', onKey);
  }

  function nightMarket(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    const cashEl = document.createElement('span'); cashEl.className = 'game-hud';
    const stockEl = document.createElement('span'); stockEl.className = 'game-hud';
    const dayEl = document.createElement('span'); dayEl.className = 'game-hud';
    const restart = document.createElement('button'); restart.className = 'game-btn'; restart.textContent = 'Restart';
    toolbar.append(cashEl, stockEl, dayEl, restart);
    const prompt = document.createElement('h3');
    prompt.style.cssText = 'text-align:center;margin:20px;';
    const actions = document.createElement('div');
    actions.className = 'game-toolbar';
    const buy = document.createElement('button'); buy.className = 'game-btn';
    const sell = document.createElement('button'); sell.className = 'game-btn';
    actions.append(buy, sell);
    container.append(toolbar, prompt, actions);
    let cash, stock, day, price;
    function update() {
      cashEl.textContent = `Cash: $${cash}`;
      stockEl.textContent = `Stock: ${stock}`;
      dayEl.textContent = `Night: ${day} / 10`;
      prompt.textContent = `Today's legal specialty: ${price < 8 ? 'street noodles' : 'arcade gadgets'} · Sale price $${price}`;
      buy.textContent = 'Buy stock ($5 each)';
      sell.textContent = `Serve a customer (+$${price})`;
      buy.disabled = cash < 5;
      sell.disabled = stock < 1;
      if (day > 10) prompt.textContent = `Market closed! Final cash: $${cash}`;
    }
    function reset() { cash = 30; stock = 0; day = 1; price = 7; update(); }
    buy.addEventListener('click', () => {
      if (cash < 5 || day > 10) return;
      cash -= 5; stock++; update();
    });
    sell.addEventListener('click', () => {
      if (!stock || day > 10) return;
      stock--; cash += price; day++;
      price = 5 + Math.floor(Math.random() * 8);
      update();
    });
    restart.addEventListener('click', reset);
    reset();
    return () => {};
  }

  function penaltyKeeper(container) {
    const W = 640, H = 400;
    const { canvas, ctx, stats, restart } = makeCanvas(container, W, H, ['Saves: 0', 'Goals allowed: 0 / 3']);
    let keeperX, ball, saves, goals, frame, ended, animId, keys;
    function reset() {
      keeperX = W / 2; ball = null; saves = 0; goals = 0; frame = 0; ended = false; keys = {};
      stats[0].textContent = 'Saves: 0'; stats[1].textContent = 'Goals allowed: 0 / 3';
    }
    function update() {
      if (ended) return;
      frame++;
      if (keys.ArrowLeft || keys.KeyA) keeperX = Math.max(130, keeperX - 4);
      if (keys.ArrowRight || keys.KeyD) keeperX = Math.min(510, keeperX + 4);
      if (!ball && frame % 100 === 0) ball = { x: 170 + Math.random() * 300, y: 90, vx: (Math.random() - 0.5) * 1.2 };
      if (!ball) return;
      ball.y += 3.2; ball.x += ball.vx;
      if (ball.y > 282) {
        if (Math.abs(ball.x - keeperX) < 48) saves++;
        else goals++;
        ball = null;
        stats[0].textContent = `Saves: ${saves}`;
        stats[1].textContent = `Goals allowed: ${goals} / 3`;
        if (goals >= 3) ended = true;
      }
    }
    function draw() {
      ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeRect(100, 45, 440, 245);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(keeperX - 35, 260, 70, 18);
      if (ball) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2); ctx.fill();
      }
      if (ended) {
        ctx.fillStyle = 'rgba(2,6,23,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`MATCH OVER · ${saves} SAVES`, W / 2, H / 2);
      }
    }
    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }
    function onKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
    }
    function onKeyUp(event) { keys[event.code] = false; }
    function onPointer(event) {
      const p = point(canvas, event);
      keeperX = Math.max(130, Math.min(510, p.x));
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointer);
    restart.addEventListener('click', reset);
    reset(); animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointer);
    };
  }

  register('skatepark-trick-run', 'Skatepark Trick Run', 'An unofficial Skate 3-style skateboarding mini-game: jump obstacles, chain tricks, and land clean.', 'Space / Up to jump and trick; A / D to balance', '🛹', 'linear-gradient(135deg,#f97316,#475569)', skatepark);
  register('fc27-penalty-shootout', 'FC 27 Penalty Shootout', 'An unofficial football penalty mini-game inspired by FC-style soccer games; aim carefully past the moving keeper.', 'Move the pointer to aim, then click to shoot', '⚽', 'linear-gradient(135deg,#22c55e,#1d4ed8)', penaltyShootout);
  register('blackjack-21', 'Blackjack 21', 'Play a quick, no-money blackjack hand against the dealer. Get close to 21 without going over.', 'Click Hit or Stand', '🃏', 'linear-gradient(135deg,#15803d,#0f172a)', blackjack);
  register('wobbly-brawl-arena', 'Wobbly Brawl Arena', 'An unofficial Gang Beasts-style local brawler: wobble, shove, and knock your rival off the platform.', 'Blue: WASD · Red: Arrow Keys', '🥊', 'linear-gradient(135deg,#38bdf8,#fb7185)', wobbleArena);
  register('city-stories-roam', 'City Stories: Free Roam', 'A fresh top-down city-driving challenge inspired by open-world crime games; collect checkpoints and dodge traffic.', 'A / D or Left / Right to switch lanes', '🚗', 'linear-gradient(135deg,#64748b,#0f172a)', (container) => cityStory(container, 'roam'));
  register('city-stories-heist', 'City Stories: Getaway', 'An original getaway-driving mini-game inspired by the GTA series; collect bags and avoid traffic.', 'A / D or Left / Right to switch lanes', '🚨', 'linear-gradient(135deg,#ef4444,#334155)', (container) => cityStory(container, 'heist'));
  register('city-stories-racer', 'City Stories: Street Racer', 'Race through a blocky city route in an unofficial open-world-inspired arcade challenge.', 'A / D or Left / Right to switch lanes', '🏁', 'linear-gradient(135deg,#f97316,#1e293b)', (container) => cityStory(container, 'race'));
  register('shadow-rooftop-run', 'Shadow Creed: Rooftop Run', 'An original rooftop parkour challenge inspired by Assassin’s Creed-style stealth adventures; reach the exit unseen.', 'WASD / Arrow Keys to move one tile', '🏃', 'linear-gradient(135deg,#78716c,#1e293b)', (container) => stealth(container, 'rooftop'));
  register('shadow-stealth-maze', 'Shadow Creed: Stealth Maze', 'Sneak past guards in an original grid maze inspired by Assassin’s Creed-style stealth-action adventures.', 'WASD / Arrow Keys to move one tile', '🗝️', 'linear-gradient(135deg,#a855f7,#0f172a)', (container) => stealth(container, 'stealth'));
  register('shadow-relic-hunt', 'Shadow Creed: Relic Hunt', 'Collect every relic, avoid patrols, and escape in an original stealth-puzzle mini-game inspired by Assassin’s Creed.', 'WASD / Arrow Keys to move one tile', '🏺', 'linear-gradient(135deg,#d97706,#292524)', (container) => stealth(container, 'relics'));
  register('night-market-tycoon', 'Night Market Tycoon', 'A Schedule 1-style shop-management mini-game using only legal fictional goods: stock noodles and gadgets, then serve customers.', 'Click buttons to buy stock and serve customers', '🏪', 'linear-gradient(135deg,#8b5cf6,#f59e0b)', nightMarket);
  register('fc27-penalty-keeper', 'FC 27 Penalty Keeper', 'An unofficial soccer goalkeeper mini-game: read the shot and move into position to make saves.', 'Mouse / Touch or A / D to move the keeper', '🧤', 'linear-gradient(135deg,#16a34a,#0f766e)', penaltyKeeper);
})();
