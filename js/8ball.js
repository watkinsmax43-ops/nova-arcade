(() => {
  const canvas = document.getElementById('pool-table');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('game-status');
  const playerStatusEl = document.getElementById('player-status');
  const twoPlayerButton = document.getElementById('two-player-mode');
  const aiButton = document.getElementById('ai-mode');
  const newGameButton = document.getElementById('new-game');

  const TABLE_WIDTH = canvas.width;
  const TABLE_HEIGHT = canvas.height;
  const BALL_RADIUS = 13;
  const POCKET_RADIUS = 29;
  const FRICTION = 0.986;
  const STOP_SPEED = 0.045;
  const MAX_SHOT_SPEED = 19;
  const POCKETS = [
    { x: 0, y: 0 },
    { x: TABLE_WIDTH / 2, y: 0 },
    { x: TABLE_WIDTH, y: 0 },
    { x: 0, y: TABLE_HEIGHT },
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
    { x: TABLE_WIDTH, y: TABLE_HEIGHT }
  ];
  const COLORS = {
    1: '#f1c40f', 2: '#2980b9', 3: '#e74c3c', 4: '#8e44ad',
    5: '#e67e22', 6: '#27ae60', 7: '#c0392b', 8: '#111111',
    9: '#f1c40f', 10: '#2980b9', 11: '#e74c3c', 12: '#8e44ad',
    13: '#e67e22', 14: '#27ae60', 15: '#c0392b'
  };
  const cueStart = { x: 205, y: TABLE_HEIGHT / 2 };

  let balls = [];
  let mode = null;
  let currentPlayer = 0;
  let groups = [null, null];
  let pocketedThisTurn = [];
  let scratchThisTurn = false;
  let eightPocketedThisTurn = false;
  let shotInProgress = false;
  let gameOver = false;
  let aiThinking = false;
  let aiming = false;
  let aimPoint = null;
  let aiTimer = null;
  let lastFrameTime = 0;

  function makeBall(x, y, number) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      number,
      group: number === 0 || number === 8 ? null : number < 8 ? 'solids' : 'stripes',
      pocketed: false
    };
  }

  function rackBalls() {
    balls = [makeBall(cueStart.x, cueStart.y, 0)];
    const rackOrder = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 7, 14, 15];
    let index = 0;
    const startX = 650;
    const startY = TABLE_HEIGHT / 2;
    const columnSpacing = BALL_RADIUS * 1.78;
    const rowSpacing = BALL_RADIUS * 2.05;

    for (let column = 0; column < 5; column += 1) {
      for (let row = 0; row <= column; row += 1) {
        const number = rackOrder[index];
        index += 1;
        const x = startX + column * columnSpacing;
        const y = startY + (row - column / 2) * rowSpacing;
        balls.push(makeBall(x, y, number));
      }
    }
  }

  function playerName(player) {
    if (mode === 'ai' && player === 1) return 'AI';
    return `Player ${player + 1}`;
  }

  function remainingBalls(group) {
    return balls.filter((ball) => !ball.pocketed && ball.group === group).length;
  }

  function updatePlayerStatus() {
    const label = (player) => {
      const name = playerName(player);
      if (!groups[player]) return `${name}: open`;
      const groupName = groups[player] === 'solids' ? 'solids' : 'stripes';
      return `${name}: ${groupName} (${remainingBalls(groups[player])} left)`;
    };
    playerStatusEl.textContent = `${label(0)} · ${label(1)}`;
  }

  function setIdleStatus() {
    updatePlayerStatus();
    if (!mode) {
      statusEl.textContent = 'Choose a mode to begin.';
    } else if (gameOver) {
      return;
    } else if (aiThinking) {
      statusEl.textContent = 'AI is lining up a shot…';
    } else {
      statusEl.textContent = `${playerName(currentPlayer)}'s turn — drag back from the cue ball to shoot.`;
    }
  }

  function startGame(selectedMode) {
    if (aiTimer !== null) {
      window.clearTimeout(aiTimer);
      aiTimer = null;
    }
    mode = selectedMode;
    currentPlayer = 0;
    groups = [null, null];
    pocketedThisTurn = [];
    scratchThisTurn = false;
    eightPocketedThisTurn = false;
    shotInProgress = false;
    gameOver = false;
    aiThinking = false;
    aiming = false;
    aimPoint = null;
    rackBalls();
    twoPlayerButton.setAttribute('aria-pressed', String(mode === 'two-player'));
    aiButton.setAttribute('aria-pressed', String(mode === 'ai'));
    setIdleStatus();
  }

  function isMoving() {
    return balls.some((ball) =>
      !ball.pocketed && Math.hypot(ball.vx, ball.vy) > STOP_SPEED
    );
  }

  function pocketBall(ball) {
    ball.pocketed = true;
    ball.vx = 0;
    ball.vy = 0;
    if (ball.number === 0) {
      scratchThisTurn = true;
    } else if (ball.number === 8) {
      eightPocketedThisTurn = true;
    } else {
      pocketedThisTurn.push(ball);
    }
  }

  function updateBall(ball, frameScale) {
    if (ball.pocketed) return;

    ball.x += ball.vx * frameScale;
    ball.y += ball.vy * frameScale;
    const friction = Math.pow(FRICTION, frameScale);
    ball.vx *= friction;
    ball.vy *= friction;

    if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
      ball.vx = 0;
      ball.vy = 0;
    }

    for (const pocket of POCKETS) {
      if (Math.hypot(ball.x - pocket.x, ball.y - pocket.y) < POCKET_RADIUS) {
        pocketBall(ball);
        return;
      }
    }

    if (ball.x < BALL_RADIUS) {
      ball.x = BALL_RADIUS;
      ball.vx = Math.abs(ball.vx) * 0.92;
    } else if (ball.x > TABLE_WIDTH - BALL_RADIUS) {
      ball.x = TABLE_WIDTH - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx) * 0.92;
    }
    if (ball.y < BALL_RADIUS) {
      ball.y = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * 0.92;
    } else if (ball.y > TABLE_HEIGHT - BALL_RADIUS) {
      ball.y = TABLE_HEIGHT - BALL_RADIUS;
      ball.vy = -Math.abs(ball.vy) * 0.92;
    }
  }

  function resolveCollisions() {
    for (let i = 0; i < balls.length; i += 1) {
      const first = balls[i];
      if (first.pocketed) continue;

      for (let j = i + 1; j < balls.length; j += 1) {
        const second = balls[j];
        if (second.pocketed) continue;
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = BALL_RADIUS * 2;
        if (distance >= minDistance) continue;

        const nx = distance > 0 ? dx / distance : 1;
        const ny = distance > 0 ? dy / distance : 0;
        const overlap = minDistance - distance;
        first.x -= nx * overlap / 2;
        first.y -= ny * overlap / 2;
        second.x += nx * overlap / 2;
        second.y += ny * overlap / 2;

        const relativeSpeed = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
        if (relativeSpeed < 0) {
          first.vx += relativeSpeed * nx;
          first.vy += relativeSpeed * ny;
          second.vx -= relativeSpeed * nx;
          second.vy -= relativeSpeed * ny;
        }
      }
    }
  }

  function drawBall(ball) {
    if (ball.pocketed) return;
    const color = ball.number === 0 ? '#ffffff' : COLORS[ball.number];

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ball.number > 8 ? '#ffffff' : color;
    ctx.fill();

    if (ball.number > 8) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillRect(ball.x - BALL_RADIUS, ball.y - BALL_RADIUS * 0.42, BALL_RADIUS * 2, BALL_RADIUS * 0.84);
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    if (ball.number > 0) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 5.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ball.number), ball.x, ball.y);
    }
  }

  function drawTable() {
    ctx.fillStyle = '#0e6b36';
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    ctx.fillStyle = '#080808';
    for (const pocket of POCKETS) {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    balls.forEach(drawBall);
    if (aiming && aimPoint && balls[0] && !balls[0].pocketed) {
      const cue = balls[0];
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + (cue.x - aimPoint.x) * 2, cue.y + (cue.y - aimPoint.y) * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function pointOnSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
  }

  function chooseAiShot() {
    const cue = balls[0];
    const remaining = balls.filter((ball) => !ball.pocketed && ball.number > 0);
    let targets = remaining.filter((ball) => ball.number !== 8);

    if (groups[1]) {
      const ownBalls = targets.filter((ball) => ball.group === groups[1]);
      targets = ownBalls.length ? ownBalls : remaining.filter((ball) => ball.number === 8);
    }

    let best = null;
    for (const target of targets) {
      for (const pocket of POCKETS) {
        const pocketDx = pocket.x - target.x;
        const pocketDy = pocket.y - target.y;
        const pocketDistance = Math.hypot(pocketDx, pocketDy);
        if (pocketDistance === 0) continue;
        const towardPocketX = pocketDx / pocketDistance;
        const towardPocketY = pocketDy / pocketDistance;
        const contact = {
          x: target.x - towardPocketX * BALL_RADIUS * 2,
          y: target.y - towardPocketY * BALL_RADIUS * 2
        };
        const cueDistance = Math.hypot(contact.x - cue.x, contact.y - cue.y);
        let blocked = 0;
        for (const other of balls) {
          if (other.pocketed || other === cue || other === target) continue;
          if (pointOnSegmentDistance(other, cue, contact) < BALL_RADIUS * 2.2) blocked += 1;
        }
        const score = cueDistance + pocketDistance * 0.65 + blocked * 180;
        if (!best || score < best.score) best = { contact, score };
      }
    }

    if (!best) return null;
    const dx = best.contact.x - cue.x;
    const dy = best.contact.y - cue.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return null;
    return {
      vx: dx / distance * Math.min(15, 8 + distance * 0.012),
      vy: dy / distance * Math.min(15, 8 + distance * 0.012)
    };
  }

  function scheduleAiTurn() {
    if (mode !== 'ai' || currentPlayer !== 1 || gameOver) return;
    aiThinking = true;
    setIdleStatus();
    aiTimer = window.setTimeout(() => {
      aiTimer = null;
      if (gameOver || mode !== 'ai' || currentPlayer !== 1) return;
      aiThinking = false;
      const shot = chooseAiShot();
      if (!shot) {
        gameOver = true;
        statusEl.textContent = 'No legal shot available. Start a new game to play again.';
        return;
      }
      beginShot(shot.vx, shot.vy);
    }, 750);
  }

  function finishShot() {
    shotInProgress = false;

    if (eightPocketedThisTurn) {
      const shooter = currentPlayer;
      const legalEight = groups[shooter] !== null && remainingBalls(groups[shooter]) === 0;
      const winner = legalEight ? shooter : 1 - shooter;
      gameOver = true;
      statusEl.textContent = legalEight
        ? `${playerName(winner)} wins! The 8-ball is down.`
        : `${playerName(winner)} wins — the 8-ball was pocketed too early.`;
      updatePlayerStatus();
      return;
    }

    if (scratchThisTurn) {
      const cue = balls[0];
      const openSpot = findCueSpot();
      cue.x = openSpot.x;
      cue.y = openSpot.y;
      cue.vx = 0;
      cue.vy = 0;
      cue.pocketed = false;
      currentPlayer = 1 - currentPlayer;
    } else {
      if (!groups[currentPlayer] && pocketedThisTurn.length > 0) {
        const firstGroup = pocketedThisTurn[0].group;
        groups[currentPlayer] = firstGroup;
        groups[1 - currentPlayer] = firstGroup === 'solids' ? 'stripes' : 'solids';
      }
      const pocketedOwnBall = pocketedThisTurn.some((ball) => ball.group === groups[currentPlayer]);
      if (!pocketedOwnBall) currentPlayer = 1 - currentPlayer;
    }

    pocketedThisTurn = [];
    scratchThisTurn = false;
    eightPocketedThisTurn = false;
    setIdleStatus();
    scheduleAiTurn();
  }

  function findCueSpot() {
    for (let x = 150; x <= 370; x += BALL_RADIUS * 2.2) {
      for (let y = BALL_RADIUS * 2; y <= TABLE_HEIGHT - BALL_RADIUS * 2; y += BALL_RADIUS * 2.2) {
        const clear = balls.every((ball) =>
          ball.pocketed || ball.number === 0 || Math.hypot(ball.x - x, ball.y - y) >= BALL_RADIUS * 2.2
        );
        if (clear) return { x, y };
      }
    }
    return cueStart;
  }

  function beginShot(vx, vy) {
    const cue = balls[0];
    if (!mode || !cue || cue.pocketed || isMoving() || gameOver) return;
    pocketedThisTurn = [];
    scratchThisTurn = false;
    eightPocketedThisTurn = false;
    shotInProgress = true;
    cue.vx = vx;
    cue.vy = vy;
    statusEl.textContent = `${playerName(currentPlayer)} shoots…`;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * TABLE_WIDTH / rect.width,
      y: (event.clientY - rect.top) * TABLE_HEIGHT / rect.height
    };
  }

  function canAim() {
    return mode && !gameOver && !aiThinking && !shotInProgress &&
      !(mode === 'ai' && currentPlayer === 1) && !isMoving();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!canAim()) return;
    const point = canvasPoint(event);
    const cue = balls[0];
    if (!cue || cue.pocketed || Math.hypot(point.x - cue.x, point.y - cue.y) > BALL_RADIUS * 2.5) return;
    event.preventDefault();
    aiming = true;
    aimPoint = point;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!aiming) return;
    aimPoint = canvasPoint(event);
  });

  canvas.addEventListener('pointerup', (event) => {
    if (!aiming) return;
    aimPoint = canvasPoint(event);
    aiming = false;
    const cue = balls[0];
    const dx = cue.x - aimPoint.x;
    const dy = cue.y - aimPoint.y;
    const distance = Math.hypot(dx, dy);
    aimPoint = null;
    if (distance < 5) return;
    const speed = Math.min(MAX_SHOT_SPEED, distance * 0.16);
    beginShot(dx / distance * speed, dy / distance * speed);
  });

  canvas.addEventListener('pointercancel', () => {
    aiming = false;
    aimPoint = null;
  });

  twoPlayerButton.addEventListener('click', () => startGame('two-player'));
  aiButton.addEventListener('click', () => startGame('ai'));
  newGameButton.addEventListener('click', () => {
    if (!mode) {
      statusEl.textContent = 'Choose a mode before starting a new game.';
      return;
    }
    startGame(mode);
  });

  function frame(timestamp) {
    const frameScale = lastFrameTime ? Math.min((timestamp - lastFrameTime) / (1000 / 60), 2) : 1;
    lastFrameTime = timestamp;

    if (mode && !gameOver && !aiThinking) {
      balls.forEach((ball) => updateBall(ball, frameScale));
      resolveCollisions();
      if (shotInProgress && !isMoving()) finishShot();
    }

    drawTable();
    window.requestAnimationFrame(frame);
  }

  rackBalls();
  updatePlayerStatus();
  window.requestAnimationFrame(frame);
})();
