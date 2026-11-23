(() => {
  const canvas = document.getElementById('pool-table');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('game-status');
  const playerStatusEl = document.getElementById('player-status');
  const twoPlayerButton = document.getElementById('two-player-mode');
  const aiButton = document.getElementById('ai-mode');
  const newGameButton = document.getElementById('new-game');
  const powerMeter = document.getElementById('shot-power');
  const powerMeterFill = document.getElementById('shot-power-fill');

  const TABLE_WIDTH = 960;
  const TABLE_HEIGHT = 480;
  const BALL_RADIUS = 13;
  const POCKET_RADIUS = 30;
  const PLAY_LEFT = 46;
  const PLAY_RIGHT = TABLE_WIDTH - PLAY_LEFT;
  const PLAY_TOP = 46;
  const PLAY_BOTTOM = TABLE_HEIGHT - PLAY_TOP;
  const HEAD_STRING_X = TABLE_WIDTH * 0.25;
  const FIXED_STEP = 1 / 120;
  const FRICTION = 0.986;
  const BALL_RESTITUTION = 0.96;
  const CUSHION_RESTITUTION = 0.82;
  const STOP_SPEED = 0.035;
  const MAX_SHOT_SPEED = 22;
  const SHOT_POWER_SCALE = 0.14;
  const POCKETS = [
    { x: PLAY_LEFT + 2, y: PLAY_TOP + 2 },
    { x: TABLE_WIDTH / 2, y: PLAY_TOP + 2 },
    { x: PLAY_RIGHT - 2, y: PLAY_TOP + 2 },
    { x: PLAY_LEFT + 2, y: PLAY_BOTTOM - 2 },
    { x: TABLE_WIDTH / 2, y: PLAY_BOTTOM - 2 },
    { x: PLAY_RIGHT - 2, y: PLAY_BOTTOM - 2 }
  ];
  const COLORS = {
    1: '#f5ca24', 2: '#2878c7', 3: '#d93636', 4: '#7639a8',
    5: '#ed7d24', 6: '#278c50', 7: '#9e2929', 8: '#171717',
    9: '#f5ca24', 10: '#2878c7', 11: '#d93636', 12: '#7639a8',
    13: '#ed7d24', 14: '#278c50', 15: '#9e2929'
  };
  const cueStart = { x: 180, y: TABLE_HEIGHT / 2 };

  let balls = [];
  let mode = null;
  let currentPlayer = 0;
  let groups = [null, null];
  let pocketedThisTurn = [];
  let scratchThisTurn = false;
  let eightPocketedThisTurn = false;
  let eightPocketedOnBreak = false;
  let firstContactBall = null;
  let railHitsAfterContact = new Set();
  let shotInProgress = false;
  let breakShot = true;
  let shotsTaken = 0;
  let gameOver = false;
  let aiThinking = false;
  let cueInHand = false;
  let cueInHandKitchenOnly = false;
  let placingCue = false;
  let cuePlacementValid = false;
  let aiming = false;
  let aimPoint = null;
  let aiTimer = null;
  let lastFrameTime = null;
  let physicsAccumulator = 0;
  let foulMessage = '';
  let renderAlpha = 1;

  function configureCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = TABLE_WIDTH * pixelRatio;
    canvas.height = TABLE_HEIGHT * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function makeBall(x, y, number) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      previousX: x,
      previousY: y,
      number,
      group: number === 0 || number === 8 ? null : number < 8 ? 'solids' : 'stripes',
      pocketed: false
    };
  }

  function rackBalls() {
    balls = [makeBall(cueStart.x, cueStart.y, 0)];
    const rackOrder = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 7, 14, 15];
    let index = 0;
    const startX = 662;
    const startY = TABLE_HEIGHT / 2;
    const columnSpacing = BALL_RADIUS * Math.sqrt(3);
    const rowSpacing = BALL_RADIUS * 2;

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
    } else if (cueInHand) {
      const foul = foulMessage ? `Foul: ${foulMessage}. ` : '';
      const placement = cueInHandKitchenOnly ? 'behind the head string' : 'anywhere on the table';
      statusEl.textContent = `${foul}${playerName(currentPlayer)} has ball in hand — drag the cue ball ${placement}.`;
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
    eightPocketedOnBreak = false;
    firstContactBall = null;
    railHitsAfterContact = new Set();
    shotInProgress = false;
    breakShot = true;
    shotsTaken = 0;
    gameOver = false;
    aiThinking = false;
    cueInHand = false;
    cueInHandKitchenOnly = false;
    placingCue = false;
    cuePlacementValid = false;
    aiming = false;
    aimPoint = null;
    foulMessage = '';
    physicsAccumulator = 0;
    rackBalls();
    twoPlayerButton.setAttribute('aria-pressed', String(mode === 'two-player'));
    aiButton.setAttribute('aria-pressed', String(mode === 'ai'));
    setShotPower(0);
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

  function registerRailHit(ball) {
    if (firstContactBall !== null) {
      railHitsAfterContact.add(ball.number);
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

    const leftLimit = PLAY_LEFT + BALL_RADIUS;
    const rightLimit = PLAY_RIGHT - BALL_RADIUS;
    const topLimit = PLAY_TOP + BALL_RADIUS;
    const bottomLimit = PLAY_BOTTOM - BALL_RADIUS;

    if (ball.x < leftLimit) {
      ball.x = leftLimit;
      ball.vx = Math.abs(ball.vx) * CUSHION_RESTITUTION;
      registerRailHit(ball);
    } else if (ball.x > rightLimit) {
      ball.x = rightLimit;
      ball.vx = -Math.abs(ball.vx) * CUSHION_RESTITUTION;
      registerRailHit(ball);
    }
    if (ball.y < topLimit) {
      ball.y = topLimit;
      ball.vy = Math.abs(ball.vy) * CUSHION_RESTITUTION;
      registerRailHit(ball);
    } else if (ball.y > bottomLimit) {
      ball.y = bottomLimit;
      ball.vy = -Math.abs(ball.vy) * CUSHION_RESTITUTION;
      registerRailHit(ball);
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

        const relativeNormalSpeed = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
        if (relativeNormalSpeed >= 0) continue;

        const cueContact = first.number === 0 ? second : second.number === 0 ? first : null;
        if (cueContact && firstContactBall === null) {
          firstContactBall = cueContact.number;
        }

        const impulse = -(1 + BALL_RESTITUTION) * relativeNormalSpeed / 2;
        first.vx -= impulse * nx;
        first.vy -= impulse * ny;
        second.vx += impulse * nx;
        second.vy += impulse * ny;

        const tx = -ny;
        const ty = nx;
        const tangentSpeed = (second.vx - first.vx) * tx + (second.vy - first.vy) * ty;
        const tangentImpulse = Math.max(-0.035, Math.min(0.035, -tangentSpeed * 0.025));
        first.vx -= tangentImpulse * tx;
        first.vy -= tangentImpulse * ty;
        second.vx += tangentImpulse * tx;
        second.vy += tangentImpulse * ty;
      }
    }
  }

  function drawPocket(pocket) {
    const gradient = ctx.createRadialGradient(
      pocket.x - 5, pocket.y - 6, 2,
      pocket.x, pocket.y, POCKET_RADIUS
    );
    gradient.addColorStop(0, '#020403');
    gradient.addColorStop(0.72, '#080a08');
    gradient.addColorStop(1, '#282017');
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(25, 13, 8, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawBall(ball) {
    if (ball.pocketed) return;
    const x = ball.previousX + (ball.x - ball.previousX) * renderAlpha;
    const y = ball.previousY + (ball.y - ball.previousY) * renderAlpha;

    ctx.beginPath();
    ctx.ellipse(x + 2, y + 4, BALL_RADIUS * 0.94, BALL_RADIUS * 0.66, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    const baseColor = ball.number === 0 || ball.number > 8 ? '#f5f3e9' : COLORS[ball.number];
    const gradient = ctx.createRadialGradient(
      x - BALL_RADIUS * 0.38,
      y - BALL_RADIUS * 0.48,
      BALL_RADIUS * 0.08,
      x,
      y,
      BALL_RADIUS * 1.08
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.28, baseColor);
    gradient.addColorStop(0.82, ball.number === 8 ? '#303030' : baseColor);
    gradient.addColorStop(1, '#191919');

    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (ball.number > 8) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.clip();
      const stripe = ctx.createLinearGradient(0, y - BALL_RADIUS / 2, 0, y + BALL_RADIUS / 2);
      stripe.addColorStop(0, '#c9c7bc');
      stripe.addColorStop(0.28, COLORS[ball.number]);
      stripe.addColorStop(0.72, COLORS[ball.number]);
      stripe.addColorStop(1, '#8e8b82');
      ctx.fillStyle = stripe;
      ctx.fillRect(x - BALL_RADIUS, y - BALL_RADIUS * 0.48, BALL_RADIUS * 2, BALL_RADIUS * 0.96);
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    if (ball.number > 0) {
      ctx.beginPath();
      ctx.arc(x, y, 5.9, 0, Math.PI * 2);
      ctx.fillStyle = '#fffdf5';
      ctx.fill();
      ctx.fillStyle = '#151515';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ball.number), x, y + 0.2);
    }
  }

  function drawTableSurface() {
    const wood = ctx.createLinearGradient(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    wood.addColorStop(0, '#3c2417');
    wood.addColorStop(0.48, '#89562f');
    wood.addColorStop(1, '#482a19');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    const rail = ctx.createLinearGradient(0, 25, 0, 455);
    rail.addColorStop(0, '#b67a43');
    rail.addColorStop(0.08, '#674022');
    rail.addColorStop(0.5, '#85532e');
    rail.addColorStop(0.92, '#59371f');
    rail.addColorStop(1, '#a66c3b');
    ctx.fillStyle = rail;
    ctx.fillRect(18, 18, TABLE_WIDTH - 36, TABLE_HEIGHT - 36);

    ctx.strokeStyle = 'rgba(255, 220, 158, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, TABLE_WIDTH - 48, TABLE_HEIGHT - 48);

    ctx.fillStyle = '#1f6c3e';
    ctx.fillRect(PLAY_LEFT - 8, PLAY_TOP - 8, PLAY_RIGHT - PLAY_LEFT + 16, PLAY_BOTTOM - PLAY_TOP + 16);
    const felt = ctx.createLinearGradient(PLAY_LEFT, PLAY_TOP, PLAY_RIGHT, PLAY_BOTTOM);
    felt.addColorStop(0, '#16804a');
    felt.addColorStop(0.52, '#0f713e');
    felt.addColorStop(1, '#0b5b34');
    ctx.fillStyle = felt;
    ctx.fillRect(PLAY_LEFT, PLAY_TOP, PLAY_RIGHT - PLAY_LEFT, PLAY_BOTTOM - PLAY_TOP);

    ctx.save();
    ctx.beginPath();
    ctx.rect(PLAY_LEFT, PLAY_TOP, PLAY_RIGHT - PLAY_LEFT, PLAY_BOTTOM - PLAY_TOP);
    ctx.clip();
    ctx.strokeStyle = 'rgba(218, 255, 227, 0.025)';
    ctx.lineWidth = 1;
    for (let y = PLAY_TOP + 4; y < PLAY_BOTTOM; y += 7) {
      ctx.beginPath();
      ctx.moveTo(PLAY_LEFT, y);
      ctx.lineTo(PLAY_RIGHT, y + 1);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(240, 255, 244, 0.38)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(HEAD_STRING_X, PLAY_TOP + 2);
    ctx.lineTo(HEAD_STRING_X, PLAY_BOTTOM - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(HEAD_STRING_X, TABLE_HEIGHT / 2, 48, Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();

    const diamonds = [0.125, 0.25, 0.375, 0.625, 0.75, 0.875];
    ctx.fillStyle = '#e8c08a';
    for (const fraction of diamonds) {
      const x = TABLE_WIDTH * fraction;
      for (const y of [31, TABLE_HEIGHT - 31]) {
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 3, y);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x - 3, y);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (const fraction of diamonds) {
      const y = TABLE_HEIGHT * fraction;
      for (const x of [31, TABLE_WIDTH - 31]) {
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x, y + 3);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x, y - 3);
        ctx.closePath();
        ctx.fill();
      }
    }

    const headSpot = { x: HEAD_STRING_X, y: TABLE_HEIGHT / 2 };
    const footSpot = { x: TABLE_WIDTH * 0.72, y: TABLE_HEIGHT / 2 };
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (const spot of [headSpot, footSpot]) {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const pocket of POCKETS) drawPocket(pocket);
  }

  function distanceToRail(point, dx, dy) {
    let distance = Infinity;
    if (dx > 0) distance = Math.min(distance, (PLAY_RIGHT - BALL_RADIUS - point.x) / dx);
    if (dx < 0) distance = Math.min(distance, (PLAY_LEFT + BALL_RADIUS - point.x) / dx);
    if (dy > 0) distance = Math.min(distance, (PLAY_BOTTOM - BALL_RADIUS - point.y) / dy);
    if (dy < 0) distance = Math.min(distance, (PLAY_TOP + BALL_RADIUS - point.y) / dy);
    return Math.max(0, distance);
  }

  function aimTarget(cue, dx, dy) {
    let closest = null;
    for (const ball of balls) {
      if (ball.pocketed || ball.number === 0) continue;
      const relX = ball.x - cue.x;
      const relY = ball.y - cue.y;
      const along = relX * dx + relY * dy;
      if (along <= 0) continue;
      const perpendicular = Math.abs(relX * dy - relY * dx);
      if (perpendicular >= BALL_RADIUS * 2) continue;
      const hitDistance = along - Math.sqrt((BALL_RADIUS * 2) ** 2 - perpendicular ** 2);
      if (hitDistance >= 0 && (!closest || hitDistance < closest.distance)) {
        closest = { ball, distance: hitDistance };
      }
    }
    return closest;
  }

  function drawAim() {
    if (!aiming || !aimPoint || !balls[0] || balls[0].pocketed) return;
    const cue = balls[0];
    const pullX = cue.x - aimPoint.x;
    const pullY = cue.y - aimPoint.y;
    const pullDistance = Math.hypot(pullX, pullY);
    if (pullDistance < 0.01) return;
    const dx = pullX / pullDistance;
    const dy = pullY / pullDistance;
    const target = aimTarget(cue, dx, dy);
    const guideDistance = target ? target.distance : distanceToRail(cue, dx, dy);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(cue.x + dx * guideDistance, cue.y + dy * guideDistance);
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    if (target) {
      const hit = target.ball;
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      const runout = distanceToRail(hit, dx, dy);
      ctx.lineTo(hit.x + dx * runout, hit.y + dy * runout);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.58)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hit.x - dx * BALL_RADIUS * 2, hit.y - dy * BALL_RADIUS * 2, BALL_RADIUS * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.stroke();
    }

    const power = Math.min(MAX_SHOT_SPEED, pullDistance * SHOT_POWER_SCALE);
    const stickLength = 35 + power * 2.4;
    const startX = cue.x - dx * (BALL_RADIUS + 5);
    const startY = cue.y - dy * (BALL_RADIUS + 5);
    const endX = cue.x - dx * (BALL_RADIUS + stickLength);
    const endY = cue.y - dy * (BALL_RADIUS + stickLength);
    const stick = ctx.createLinearGradient(startX, startY, endX, endY);
    stick.addColorStop(0, '#d6a86e');
    stick.addColorStop(0.3, '#f2d5a5');
    stick.addColorStop(1, '#744522');
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = stick;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    setShotPower(power / MAX_SHOT_SPEED);
  }

  function drawCuePlacement() {
    if (!cueInHand) return;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    if (cueInHandKitchenOnly) {
      ctx.fillRect(PLAY_LEFT, PLAY_TOP, HEAD_STRING_X - PLAY_LEFT, PLAY_BOTTOM - PLAY_TOP);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(HEAD_STRING_X, PLAY_TOP);
      ctx.lineTo(HEAD_STRING_X, PLAY_BOTTOM);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillRect(PLAY_LEFT, PLAY_TOP, PLAY_RIGHT - PLAY_LEFT, PLAY_BOTTOM - PLAY_TOP);
    }
  }

  function drawTable() {
    drawTableSurface();
    drawCuePlacement();
    balls.forEach(drawBall);
    drawAim();
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
    const speed = Math.min(15, 8 + distance * 0.012);
    return { vx: dx / distance * speed, vy: dy / distance * speed };
  }

  function scheduleAiTurn() {
    if (mode !== 'ai' || currentPlayer !== 1 || gameOver) return;
    if (cueInHand) {
      const cue = balls[0];
      const spot = findCueSpot();
      cue.x = spot.x;
      cue.y = spot.y;
      cue.previousX = spot.x;
      cue.previousY = spot.y;
      cue.pocketed = false;
      cueInHand = false;
      cueInHandKitchenOnly = false;
    }
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

  function cueSpotIsClear(x, y) {
    const maxX = cueInHandKitchenOnly ? HEAD_STRING_X - BALL_RADIUS : PLAY_RIGHT - BALL_RADIUS;
    if (x < PLAY_LEFT + BALL_RADIUS || x > maxX || y < PLAY_TOP + BALL_RADIUS || y > PLAY_BOTTOM - BALL_RADIUS) return false;
    return balls.every((ball) =>
      ball.number === 0 || ball.pocketed ||
      Math.hypot(ball.x - x, ball.y - y) >= BALL_RADIUS * 2 + 1
    );
  }

  function findCueSpot() {
    const candidates = [];
    const maxX = cueInHandKitchenOnly ? HEAD_STRING_X - BALL_RADIUS : PLAY_RIGHT - BALL_RADIUS;
    for (let x = PLAY_LEFT + BALL_RADIUS + 2; x <= maxX; x += 8) {
      for (let y = PLAY_TOP + BALL_RADIUS + 2; y <= PLAY_BOTTOM - BALL_RADIUS; y += 8) {
        if (cueSpotIsClear(x, y)) {
          candidates.push({ x, y, distance: Math.hypot(x - cueStart.x, y - cueStart.y) });
        }
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0] || {
      x: cueInHandKitchenOnly ? PLAY_LEFT + BALL_RADIUS + 2 : TABLE_WIDTH / 2,
      y: TABLE_HEIGHT / 2
    };
  }

  function findEightBallSpot() {
    const eight = balls.find((ball) => ball.number === 8);
    const preferred = { x: TABLE_WIDTH * 0.72, y: TABLE_HEIGHT / 2 };
    const candidates = [];
    for (let x = PLAY_LEFT + BALL_RADIUS; x <= PLAY_RIGHT - BALL_RADIUS; x += 8) {
      for (let y = PLAY_TOP + BALL_RADIUS; y <= PLAY_BOTTOM - BALL_RADIUS; y += 8) {
        const clear = balls.every((ball) =>
          ball === eight || ball.pocketed ||
          Math.hypot(ball.x - x, ball.y - y) >= BALL_RADIUS * 2 + 1
        );
        if (clear) candidates.push({ x, y, distance: Math.hypot(x - preferred.x, y - preferred.y) });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0] || preferred;
  }

  function foulReason() {
    const firstBall = balls.find((ball) => ball.number === firstContactBall);
    if (scratchThisTurn) return 'the cue ball was pocketed';
    if (firstContactBall === null) return 'the cue ball did not hit a ball';

    if (groups[currentPlayer]) {
      const ownBallsLeft = remainingBalls(groups[currentPlayer]);
      const legalTarget = ownBallsLeft > 0
        ? firstBall && firstBall.group === groups[currentPlayer]
        : firstContactBall === 8;
      if (!legalTarget) return 'the cue ball hit the wrong ball first';
    } else if (firstContactBall === 8) {
      if (!breakShot) return 'the 8-ball was hit first on an open table';
    }

    if (breakShot) {
      const objectBallsToRail = [...railHitsAfterContact].filter((number) => number !== 0).length;
      if (pocketedThisTurn.length === 0 && !eightPocketedOnBreak && objectBallsToRail < 4) {
        return 'the break did not pocket a ball or send four balls to a rail';
      }
    } else if (pocketedThisTurn.length === 0 && railHitsAfterContact.size === 0) {
      return 'no ball reached a rail or pocket after contact';
    }
    return '';
  }

  function finishShot() {
    shotInProgress = false;
    const shooter = currentPlayer;

    if (breakShot && eightPocketedThisTurn) {
      eightPocketedOnBreak = true;
      const eight = balls.find((ball) => ball.number === 8);
      const spot = findEightBallSpot();
      eight.x = spot.x;
      eight.y = spot.y;
      eight.previousX = spot.x;
      eight.previousY = spot.y;
      eight.vx = 0;
      eight.vy = 0;
      eight.pocketed = false;
      eightPocketedThisTurn = false;
    }

    if (eightPocketedThisTurn) {
      const legalEight = !scratchThisTurn &&
        groups[shooter] !== null &&
        remainingBalls(groups[shooter]) === 0 &&
        firstContactBall === 8;
      const winner = legalEight ? shooter : 1 - shooter;
      gameOver = true;
      statusEl.textContent = legalEight
        ? `${playerName(winner)} wins! The 8-ball is down.`
        : `${playerName(winner)} wins — the 8-ball was pocketed illegally.`;
      updatePlayerStatus();
      return;
    }

    const foul = foulReason();
    shotsTaken += 1;

    if (foul) {
      foulMessage = foul;
      cueInHandKitchenOnly = scratchThisTurn && breakShot;
      if (scratchThisTurn) {
        const cue = balls[0];
        const spot = findCueSpot();
        cue.x = spot.x;
        cue.y = spot.y;
        cue.previousX = spot.x;
        cue.previousY = spot.y;
        cue.vx = 0;
        cue.vy = 0;
        cue.pocketed = false;
      }
      currentPlayer = 1 - currentPlayer;
      cueInHand = true;
    } else {
      foulMessage = '';
      if (!groups[currentPlayer] && pocketedThisTurn.length > 0) {
        const firstGroup = pocketedThisTurn[0].group;
        groups[currentPlayer] = firstGroup;
        groups[1 - currentPlayer] = firstGroup === 'solids' ? 'stripes' : 'solids';
      }
      const pocketedOwnBall = pocketedThisTurn.some((ball) => ball.group === groups[currentPlayer]);
      if (!pocketedOwnBall && !eightPocketedOnBreak) currentPlayer = 1 - currentPlayer;
    }

    breakShot = false;
    pocketedThisTurn = [];
    scratchThisTurn = false;
    eightPocketedThisTurn = false;
    eightPocketedOnBreak = false;
    firstContactBall = null;
    railHitsAfterContact = new Set();
    setIdleStatus();
    scheduleAiTurn();
  }

  function beginShot(vx, vy) {
    const cue = balls[0];
    if (!mode || !cue || cue.pocketed || cueInHand || isMoving() || gameOver) return;
    pocketedThisTurn = [];
    scratchThisTurn = false;
    eightPocketedThisTurn = false;
    eightPocketedOnBreak = false;
    firstContactBall = null;
    railHitsAfterContact = new Set();
    breakShot = shotsTaken === 0;
    shotInProgress = true;
    foulMessage = '';
    cue.vx = vx;
    cue.vy = vy;
    statusEl.textContent = `${playerName(currentPlayer)} shoots…`;
  }

  function canControlCue() {
    return mode && !gameOver && !aiThinking && !shotInProgress &&
      !(mode === 'ai' && currentPlayer === 1) && !isMoving();
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * TABLE_WIDTH / rect.width,
      y: (event.clientY - rect.top) * TABLE_HEIGHT / rect.height
    };
  }

  function setShotPower(value) {
    const percent = Math.max(0, Math.min(1, value)) * 100;
    powerMeterFill.style.width = `${percent}%`;
    powerMeter.setAttribute('aria-valuenow', String(Math.round(percent)));
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!canControlCue()) return;
    const point = canvasPoint(event);
    const cue = balls[0];
    if (!cue || cue.pocketed) return;
    event.preventDefault();

    if (cueInHand) {
      if (Math.hypot(point.x - cue.x, point.y - cue.y) > BALL_RADIUS * 2) return;
      placingCue = true;
      cuePlacementValid = true;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (Math.hypot(point.x - cue.x, point.y - cue.y) > BALL_RADIUS * 2.5) return;
    aiming = true;
    aimPoint = point;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    const point = canvasPoint(event);
    if (placingCue) {
      const cue = balls[0];
      const valid = cueSpotIsClear(point.x, point.y);
      cuePlacementValid = valid;
      if (valid) {
        cue.x = point.x;
        cue.y = point.y;
        cue.previousX = point.x;
        cue.previousY = point.y;
      }
      statusEl.textContent = valid
        ? cueInHandKitchenOnly
          ? 'Release to place the cue ball behind the head string.'
          : 'Release to place the cue ball.'
        : cueInHandKitchenOnly
          ? 'That spot is blocked or outside the kitchen.'
          : 'That spot is blocked or outside the table.';
    } else if (aiming) {
      aimPoint = point;
      const cue = balls[0];
      setShotPower(Math.hypot(point.x - cue.x, point.y - cue.y) * SHOT_POWER_SCALE / MAX_SHOT_SPEED);
    }
  });

  canvas.addEventListener('pointerup', (event) => {
    if (placingCue) {
      placingCue = false;
      if (cuePlacementValid) {
        cueInHand = false;
        cueInHandKitchenOnly = false;
        foulMessage = '';
        setIdleStatus();
      } else {
        statusEl.textContent = cueInHandKitchenOnly
          ? 'Choose an open spot behind the head string.'
          : 'Choose an open spot on the table.';
      }
      return;
    }
    if (!aiming) return;
    aimPoint = canvasPoint(event);
    aiming = false;
    const cue = balls[0];
    const dx = cue.x - aimPoint.x;
    const dy = cue.y - aimPoint.y;
    const distance = Math.hypot(dx, dy);
    aimPoint = null;
    if (distance < 5) {
      setShotPower(0);
      return;
    }
    const speed = Math.min(MAX_SHOT_SPEED, distance * SHOT_POWER_SCALE);
    beginShot(dx / distance * speed, dy / distance * speed);
    setShotPower(0);
  });

  canvas.addEventListener('pointercancel', () => {
    aiming = false;
    placingCue = false;
    cuePlacementValid = false;
    aimPoint = null;
    setShotPower(0);
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

  function physicsStep() {
    const frameScale = FIXED_STEP * 60;
    if (mode && !gameOver && !aiThinking) {
      balls.forEach((ball) => {
        ball.previousX = ball.x;
        ball.previousY = ball.y;
      });
      balls.forEach((ball) => updateBall(ball, frameScale));
      for (let pass = 0; pass < 2; pass += 1) resolveCollisions();
      if (shotInProgress && !isMoving()) finishShot();
    }
  }

  function frame(timestamp) {
    if (lastFrameTime !== null) {
      const elapsed = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
      physicsAccumulator += elapsed;
      while (physicsAccumulator >= FIXED_STEP) {
        physicsStep();
        physicsAccumulator -= FIXED_STEP;
      }
      renderAlpha = physicsAccumulator / FIXED_STEP;
    }
    lastFrameTime = timestamp;
    drawTable();
    window.requestAnimationFrame(frame);
  }

  configureCanvas();
  window.addEventListener('resize', configureCanvas);
  rackBalls();
  updatePlayerStatus();
  window.requestAnimationFrame(frame);
})();
