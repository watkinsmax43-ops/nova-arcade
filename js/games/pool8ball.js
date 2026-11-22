(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames.pool8ball = {
    id: 'pool8ball',
    title: '8-Ball Pool',
    description: 'Pot your solids or stripes and sink the 8-ball to win! Play Vs Computer or 2-Player Local.',
    categories: ['Popular', '2 Player', 'Vs Computer', 'Arcade'],
    controls: 'Aim with mouse/touch, click & drag back to shoot',
    badge: '2P / CPU',
    icon: '🎱',
    accent: 'linear-gradient(135deg, #10b981, #064e3b)',

    mount(container) {
      const W = 840;
      const H = 460;
      const RAIL = 38;
      const BALL_R = 11;
      const POCKET_R = 20;

      const POCKETS = [
        { x: RAIL + 2, y: RAIL + 2 },
        { x: W / 2, y: RAIL - 2 },
        { x: W - RAIL - 2, y: RAIL + 2 },
        { x: RAIL + 2, y: H - RAIL - 2 },
        { x: W / 2, y: H - RAIL + 2 },
        { x: W - RAIL - 2, y: H - RAIL - 2 }
      ];

      const COLORS = {
        0: '#f8fafc',
        1: '#facc15', 2: '#2563eb', 3: '#dc2626', 4: '#7c3aed',
        5: '#f97316', 6: '#16a34a', 7: '#881337', 8: '#111827',
        9: '#facc15', 10: '#2563eb', 11: '#dc2626', 12: '#7c3aed',
        13: '#f97316', 14: '#16a34a', 15: '#881337'
      };

      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      toolbar.innerHTML = `
        <button class="game-btn active" data-mode="cpu">Vs Computer</button>
        <button class="game-btn" data-mode="2p">2 Players (Local)</button>
        <span class="game-hud" id="pool-hud">Player 1's Turn</span>
        <button class="game-btn" id="pool-reset">New Rack</button>
      `;

      const subHud = document.createElement('div');
      subHud.className = 'game-hud';
      subHud.style.marginBottom = '10px';
      subHud.style.fontSize = '0.84rem';
      subHud.textContent = 'Table Open — Aim & drag back anywhere to shoot!';

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.className = 'game-canvas';
      const ctx = canvas.getContext('2d');

      container.appendChild(toolbar);
      container.appendChild(subHud);
      container.appendChild(canvas);

      const hudEl = toolbar.querySelector('#pool-hud');
      const resetBtn = toolbar.querySelector('#pool-reset');
      const modeBtns = toolbar.querySelectorAll('[data-mode]');

      let mode = 'cpu'; // 'cpu' | '2p'
      let balls = [];
      let turn = 1; // 1 or 2 (2 is Computer in cpu mode)
      let groups = { 1: null, 2: null }; // 'solid' | 'stripe' | null
      let gameOver = false;
      let winner = null;
      let ballInHand = false;
      let isMoving = false;
      let shotPotted = [];
      let firstHitNum = null;

      let aimAngle = 0;
      let isDragging = false;
      let dragStart = null;
      let dragPower = 0;
      let pointerPos = { x: W / 2, y: H / 2 };

      let cpuTimeout = null;
      let cpuAnimating = false;
      let animId = null;

      function getGroup(num) {
        if (num >= 1 && num <= 7) return 'solid';
        if (num >= 9 && num <= 15) return 'stripe';
        if (num === 8) return 'eight';
        return 'cue';
      }

      function createRack() {
        clearTimeout(cpuTimeout);
        cpuAnimating = false;
        balls = [];
        turn = 1;
        groups = { 1: null, 2: null };
        gameOver = false;
        winner = null;
        ballInHand = false;
        isMoving = false;
        isDragging = false;
        dragPower = 0;

        // Cue ball
        balls.push({ num: 0, x: 220, y: H / 2, vx: 0, vy: 0, active: true });

        // Standard triangle rack order with 8 in the middle of row 3
        const solids = [1, 2, 3, 4, 5, 6, 7];
        const stripes = [9, 10, 11, 12, 13, 14, 15];
        const mix = [];
        for (let i = 0; i < 7; i++) {
          mix.push(solids[i], stripes[i]);
        }

        const startX = 605;
        const startY = H / 2;
        const dx = BALL_R * 1.76;
        const dy = BALL_R * 2.04;
        let idx = 0;

        for (let row = 0; row < 5; row++) {
          for (let col = 0; col <= row; col++) {
            const x = startX + row * dx;
            const y = startY - (row * dy) / 2 + col * dy;
            let num;
            if (row === 2 && col === 1) {
              num = 8;
            } else {
              num = mix[idx++];
            }
            balls.push({ num, x, y, vx: 0, vy: 0, active: true });
          }
        }
        updateHud('Table Open — Aim & drag back to break!');
      }

      function pName(t) {
        if (t === 1) return 'Player 1';
        return mode === 'cpu' ? 'Computer' : 'Player 2';
      }

      function remainingInGroup(group) {
        return balls.filter((b) => b.active && getGroup(b.num) === group).length;
      }

      function updateHud(msg) {
        if (gameOver) {
          hudEl.textContent = `🏆 ${pName(winner)} Wins!`;
        } else {
          const g1 = groups[1] ? ` (${groups[1].toUpperCase()})` : '';
          const g2 = groups[2] ? ` (${groups[2].toUpperCase()})` : '';
          hudEl.textContent = `${pName(turn)}'s Turn${turn === 1 ? g1 : g2}`;
        }
        if (msg) subHud.textContent = msg;
      }

      function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * sx,
          y: (clientY - rect.top) * sy
        };
      }

      function isCuePlacementValid(x, y) {
        if (x < RAIL + BALL_R + 2 || x > W - RAIL - BALL_R - 2) return false;
        if (y < RAIL + BALL_R + 2 || y > H - RAIL - BALL_R - 2) return false;
        for (const b of balls) {
          if (!b.active || b.num === 0) continue;
          if (Math.hypot(x - b.x, y - b.y) < BALL_R * 2 + 2) return false;
        }
        return true;
      }

      function shootCue(angle, powerRatio) {
        const cue = balls[0];
        if (!cue.active) return;
        const speed = 4 + powerRatio * 20;
        cue.vx = Math.cos(angle) * speed;
        cue.vy = Math.sin(angle) * speed;
        isMoving = true;
        shotPotted = [];
        firstHitNum = null;
        ballInHand = false;
      }

      function handleShotEnd() {
        isMoving = false;
        const cue = balls[0];
        const scratched = shotPotted.includes(0);
        const pottedEight = shotPotted.includes(8);
        const numberedPotted = shotPotted.filter((n) => n !== 0 && n !== 8);

        if (scratched) {
          cue.active = true;
          cue.vx = 0;
          cue.vy = 0;
          cue.x = 220;
          cue.y = H / 2;
          while (!isCuePlacementValid(cue.x, cue.y)) {
            cue.x += 12;
            if (cue.x > W - RAIL - 40) {
              cue.x = 180;
              cue.y += 20;
            }
          }
        }

        // Check 8-ball win/loss
        if (pottedEight) {
          const myGroup = groups[turn];
          const cleared = myGroup && remainingInGroup(myGroup) === 0;
          gameOver = true;
          if (cleared && !scratched) {
            winner = turn;
            updateHud(`${pName(turn)} legally sank the 8-ball!`);
          } else {
            winner = turn === 1 ? 2 : 1;
            updateHud(`8-ball fouled! ${pName(winner)} wins!`);
          }
          return;
        }

        // Assign groups if open table and no scratch
        let assignedNow = false;
        if (!groups[1] && !scratched && numberedPotted.length > 0) {
          const firstG = getGroup(numberedPotted[0]);
          groups[turn] = firstG;
          groups[turn === 1 ? 2 : 1] = firstG === 'solid' ? 'stripe' : 'solid';
          assignedNow = true;
        }

        // Check foul
        let foul = scratched;
        if (!foul && groups[turn]) {
          if (firstHitNum === null) {
            foul = true;
          } else {
            const targetNeeded = remainingInGroup(groups[turn]) === 0 ? 'eight' : groups[turn];
            if (getGroup(firstHitNum) !== targetNeeded) {
              foul = true;
            }
          }
        }

        if (foul) {
          turn = turn === 1 ? 2 : 1;
          ballInHand = true;
          updateHud(`Foul! ${pName(turn)} gets Ball in Hand (click table to place cue ball).`);
          if (mode === 'cpu' && turn === 2) {
            scheduleCpuTurn();
          }
          return;
        }

        const myGroup = groups[turn];
        const sankOwn = myGroup
          ? numberedPotted.some((n) => getGroup(n) === myGroup)
          : numberedPotted.length > 0;

        if (sankOwn || assignedNow) {
          updateHud(`${pName(turn)} potted a ball! Shoot again.`);
        } else {
          turn = turn === 1 ? 2 : 1;
          updateHud(`${pName(turn)}'s turn.`);
        }

        if (mode === 'cpu' && turn === 2 && !gameOver) {
          scheduleCpuTurn();
        }
      }

      // Deterministic Geometry Computer Opponent
      function pathClear(x1, y1, x2, y2, ignoreNums) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 1) return true;
        const ux = dx / len;
        const uy = dy / len;

        for (const b of balls) {
          if (!b.active || ignoreNums.includes(b.num)) continue;
          const px = b.x - x1;
          const py = b.y - y1;
          const proj = px * ux + py * uy;
          if (proj <= 0 || proj >= len) continue;
          const dist = Math.abs(px * uy - py * ux);
          if (dist < BALL_R * 2.05) return false;
        }
        return true;
      }

      function chooseCpuShot() {
        const cue = balls[0];
        let targets = [];
        const cpuGroup = groups[2];
        if (!cpuGroup) {
          targets = balls.filter((b) => b.active && b.num !== 0 && b.num !== 8);
        } else if (remainingInGroup(cpuGroup) > 0) {
          targets = balls.filter((b) => b.active && getGroup(b.num) === cpuGroup);
        } else {
          targets = balls.filter((b) => b.active && b.num === 8);
        }

        // Handle ball in hand for CPU
        if (ballInHand) {
          for (const t of targets) {
            for (const p of POCKETS) {
              const pDx = t.x - p.x;
              const pDy = t.y - p.y;
              const pLen = Math.hypot(pDx, pDy);
              const px = t.x + (pDx / pLen) * 90;
              const py = t.y + (pDy / pLen) * 90;
              if (isCuePlacementValid(px, py) && pathClear(t.x, t.y, p.x, p.y, [0, t.num])) {
                cue.x = px;
                cue.y = py;
                ballInHand = false;
                break;
              }
            }
            if (!ballInHand) break;
          }
          if (ballInHand) {
            cue.x = 220;
            cue.y = H / 2;
            while (!isCuePlacementValid(cue.x, cue.y)) cue.y += 24;
            ballInHand = false;
          }
        }

        let bestShot = null;
        let bestScore = -Infinity;

        for (const t of targets) {
          for (const p of POCKETS) {
            const toPocketX = p.x - t.x;
            const toPocketY = p.y - t.y;
            const distTP = Math.hypot(toPocketX, toPocketY);
            const ux = toPocketX / distTP;
            const uy = toPocketY / distTP;

            const ghostX = t.x - ux * (BALL_R * 2);
            const ghostY = t.y - uy * (BALL_R * 2);

            if (ghostX < RAIL + BALL_R || ghostX > W - RAIL - BALL_R) continue;
            if (ghostY < RAIL + BALL_R || ghostY > H - RAIL - BALL_R) continue;

            const toGhostX = ghostX - cue.x;
            const toGhostY = ghostY - cue.y;
            const distCG = Math.hypot(toGhostX, toGhostY);
            if (distCG < 1) continue;

            const dot = (toGhostX / distCG) * ux + (toGhostY / distCG) * uy;
            if (dot <= 0.2) continue; // Too steep of a cut angle

            const clear1 = pathClear(cue.x, cue.y, ghostX, ghostY, [0, t.num]);
            const clear2 = pathClear(t.x, t.y, p.x, p.y, [0, t.num]);
            if (!clear1 || !clear2) continue;

            const score = dot * 120 - (distTP + distCG) * 0.08;
            if (score > bestScore) {
              bestScore = score;
              bestShot = {
                angle: Math.atan2(toGhostY, toGhostX),
                power: Math.min(0.85, 0.35 + (distTP + distCG) / 900)
              };
            }
          }
        }

        if (!bestShot && targets.length > 0) {
          const t = targets[0];
          bestShot = {
            angle: Math.atan2(t.y - cue.y, t.x - cue.x),
            power: 0.6
          };
        }

        if (bestShot) {
          // Slight natural variance so CPU is fun to play against
          const jitter = (Math.random() - 0.5) * 0.035;
          return { angle: bestShot.angle + jitter, power: bestShot.power };
        }
        return { angle: 0, power: 0.7 };
      }

      function scheduleCpuTurn() {
        clearTimeout(cpuTimeout);
        cpuAnimating = true;
        updateHud('Computer is lining up a shot...');
        cpuTimeout = setTimeout(() => {
          if (gameOver || mode !== 'cpu' || turn !== 2) return;
          const shot = chooseCpuShot();
          aimAngle = shot.angle;
          cpuTimeout = setTimeout(() => {
            cpuAnimating = false;
            shootCue(shot.angle, shot.power);
          }, 450);
        }, 650);
      }

      function stepPhysics() {
        if (!isMoving) return;

        const SUBSTEPS = 5;
        const FRICTION = Math.pow(0.986, 1 / SUBSTEPS);
        let anyMoving = false;

        for (let step = 0; step < SUBSTEPS; step++) {
          for (const b of balls) {
            if (!b.active) continue;
            b.x += b.vx / SUBSTEPS;
            b.y += b.vy / SUBSTEPS;
            b.vx *= FRICTION;
            b.vy *= FRICTION;

            // Pocket check
            let pocketed = false;
            for (const p of POCKETS) {
              if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET_R) {
                b.active = false;
                b.vx = 0;
                b.vy = 0;
                shotPotted.push(b.num);
                pocketed = true;
                break;
              }
            }
            if (pocketed) continue;

            // Rail bounce
            if (b.x - BALL_R < RAIL) {
              b.x = RAIL + BALL_R;
              b.vx = Math.abs(b.vx) * 0.84;
            } else if (b.x + BALL_R > W - RAIL) {
              b.x = W - RAIL - BALL_R;
              b.vx = -Math.abs(b.vx) * 0.84;
            }

            if (b.y - BALL_R < RAIL) {
              b.y = RAIL + BALL_R;
              b.vy = Math.abs(b.vy) * 0.84;
            } else if (b.y + BALL_R > H - RAIL) {
              b.y = H - RAIL - BALL_R;
              b.vy = -Math.abs(b.vy) * 0.84;
            }
          }

          // Ball-to-ball collisions
          for (let i = 0; i < balls.length; i++) {
            const a = balls[i];
            if (!a.active) continue;
            for (let j = i + 1; j < balls.length; j++) {
              const b = balls[j];
              if (!b.active) continue;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist = Math.hypot(dx, dy);
              const minDist = BALL_R * 2;
              if (dist > 0 && dist < minDist) {
                if (firstHitNum === null && (a.num === 0 || b.num === 0)) {
                  firstHitNum = a.num === 0 ? b.num : a.num;
                }
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = (minDist - dist) / 2;
                a.x -= nx * overlap;
                a.y -= ny * overlap;
                b.x += nx * overlap;
                b.y += ny * overlap;

                const dvx = a.vx - b.vx;
                const dvy = a.vy - b.vy;
                const impact = dvx * nx + dvy * ny;
                if (impact > 0) {
                  a.vx -= impact * nx * 0.96;
                  a.vy -= impact * ny * 0.96;
                  b.vx += impact * nx * 0.96;
                  b.vy += impact * ny * 0.96;
                }
              }
            }
          }
        }

        for (const b of balls) {
          if (!b.active) continue;
          if (Math.hypot(b.vx, b.vy) < 0.07) {
            b.vx = 0;
            b.vy = 0;
          } else {
            anyMoving = true;
          }
        }

        if (!anyMoving) {
          handleShotEnd();
        }
      }

      function drawTable() {
        // Outer wood frame
        const woodGrad = ctx.createLinearGradient(0, 0, W, H);
        woodGrad.addColorStop(0, '#5c2d16');
        woodGrad.addColorStop(1, '#3d1c0c');
        ctx.fillStyle = woodGrad;
        ctx.fillRect(0, 0, W, H);

        // Felt
        const feltGrad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.6);
        feltGrad.addColorStop(0, '#13854e');
        feltGrad.addColorStop(1, '#0a5733');
        ctx.fillStyle = feltGrad;
        ctx.fillRect(RAIL, RAIL, W - RAIL * 2, H - RAIL * 2);

        // Cushion inner shadow border
        ctx.strokeStyle = '#073b22';
        ctx.lineWidth = 5;
        ctx.strokeRect(RAIL, RAIL, W - RAIL * 2, H - RAIL * 2);

        // Head string & foot spot
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(220, RAIL);
        ctx.lineTo(220, H - RAIL);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.arc(605, H / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Rail diamonds
        ctx.fillStyle = '#e2c286';
        for (let i = 1; i <= 3; i++) {
          const lx = RAIL + ((W / 2 - RAIL) * i) / 4;
          const rx = W / 2 + ((W / 2 - RAIL) * i) / 4;
          [lx, rx].forEach((dx) => {
            ctx.beginPath(); ctx.arc(dx, RAIL / 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(dx, H - RAIL / 2, 3, 0, Math.PI * 2); ctx.fill();
          });
        }

        // Pockets
        for (const p of POCKETS) {
          ctx.fillStyle = '#05080d';
          ctx.beginPath();
          ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      function drawBalls() {
        for (const b of balls) {
          if (!b.active) continue;

          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.32)';
          ctx.beginPath();
          ctx.arc(b.x + 2, b.y + 3, BALL_R, 0, Math.PI * 2);
          ctx.fill();

          if (b.num >= 9) {
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = COLORS[b.num];
            ctx.fillRect(b.x - BALL_R, b.y - BALL_R * 0.52, BALL_R * 2, BALL_R * 1.04);
            ctx.restore();
          } else {
            ctx.fillStyle = COLORS[b.num];
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
            ctx.fill();
          }

          if (b.num !== 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 7.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(b.num), b.x, b.y + 0.5);
          }

          // Gloss highlight
          ctx.fillStyle = 'rgba(255,255,255,0.28)';
          ctx.beginPath();
          ctx.arc(b.x - 3, b.y - 3.5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawAimAndCue() {
        const canHumanAim = !isMoving && !gameOver && !ballInHand && !(mode === 'cpu' && turn === 2);
        if (!canHumanAim && !cpuAnimating) return;

        const cue = balls[0];
        if (!cue.active) return;

        // Raycast aiming line
        const cos = Math.cos(aimAngle);
        const sin = Math.sin(aimAngle);
        let bestDist = 420;
        let hitBall = null;

        // Check rail distance
        if (cos > 0.001) bestDist = Math.min(bestDist, (W - RAIL - BALL_R - cue.x) / cos);
        if (cos < -0.001) bestDist = Math.min(bestDist, (RAIL + BALL_R - cue.x) / cos);
        if (sin > 0.001) bestDist = Math.min(bestDist, (H - RAIL - BALL_R - cue.y) / sin);
        if (sin < -0.001) bestDist = Math.min(bestDist, (RAIL + BALL_R - cue.y) / sin);

        // Check ball intersection
        for (const b of balls) {
          if (!b.active || b.num === 0) continue;
          const dx = b.x - cue.x;
          const dy = b.y - cue.y;
          const proj = dx * cos + dy * sin;
          if (proj <= 0) continue;
          const perpSq = dx * dx + dy * dy - proj * proj;
          const rSum = BALL_R * 2;
          if (perpSq < rSum * rSum) {
            const hitDist = proj - Math.sqrt(rSum * rSum - perpSq);
            if (hitDist > 0 && hitDist < bestDist) {
              bestDist = hitDist;
              hitBall = b;
            }
          }
        }

        const endX = cue.x + cos * bestDist;
        const endY = cue.y + sin * bestDist;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ghost target circle
        ctx.beginPath();
        ctx.arc(endX, endY, BALL_R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.stroke();

        // Target ball deflection guide
        if (hitBall) {
          const defAngle = Math.atan2(hitBall.y - endY, hitBall.x - endX);
          ctx.beginPath();
          ctx.moveTo(hitBall.x, hitBall.y);
          ctx.lineTo(hitBall.x + Math.cos(defAngle) * 48, hitBall.y + Math.sin(defAngle) * 48);
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();

        // Cue stick
        const pullBack = isDragging ? 18 + dragPower * 65 : 18;
        const stickLen = 190;
        const sx1 = cue.x - cos * pullBack;
        const sy1 = cue.y - sin * pullBack;
        const sx2 = cue.x - cos * (pullBack + stickLen);
        const sy2 = cue.y - sin * (pullBack + stickLen);

        ctx.lineCap = 'round';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx1 - cos * 12, sy1 - sin * 12);
        ctx.stroke();

        // Power bar when dragging
        if (isDragging && dragPower > 0.05) {
          ctx.fillStyle = 'rgba(15,23,42,0.85)';
          ctx.fillRect(W / 2 - 90, H - 24, 180, 12);
          const pGrad = ctx.createLinearGradient(W / 2 - 88, 0, W / 2 + 88, 0);
          pGrad.addColorStop(0, '#22c55e');
          pGrad.addColorStop(0.6, '#eab308');
          pGrad.addColorStop(1, '#ef4444');
          ctx.fillStyle = pGrad;
          ctx.fillRect(W / 2 - 88, H - 22, 176 * dragPower, 8);
        }
      }

      function drawBallInHandPreview() {
        if (!ballInHand || (mode === 'cpu' && turn === 2)) return;
        const valid = isCuePlacementValid(pointerPos.x, pointerPos.y);
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = valid ? '#ffffff' : '#ef4444';
        ctx.beginPath();
        ctx.arc(pointerPos.x, pointerPos.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function loop() {
        stepPhysics();
        drawTable();
        drawBalls();
        drawBallInHandPreview();
        drawAimAndCue();
        animId = requestAnimationFrame(loop);
      }

      function onPointerDown(e) {
        if (gameOver || isMoving || (mode === 'cpu' && turn === 2)) return;
        e.preventDefault();
        const pos = getCanvasPos(e);
        pointerPos = pos;

        if (ballInHand) {
          if (isCuePlacementValid(pos.x, pos.y)) {
            balls[0].x = pos.x;
            balls[0].y = pos.y;
            balls[0].active = true;
            ballInHand = false;
            updateHud(`${pName(turn)} placed the cue ball. Aim & drag to shoot!`);
          }
          return;
        }

        const cue = balls[0];
        aimAngle = Math.atan2(pos.y - cue.y, pos.x - cue.x);
        isDragging = true;
        dragStart = pos;
        dragPower = 0;
      }

      function onPointerMove(e) {
        const pos = getCanvasPos(e);
        pointerPos = pos;
        if (gameOver || isMoving || (mode === 'cpu' && turn === 2)) return;

        if (isDragging && dragStart) {
          const dist = Math.hypot(pos.x - dragStart.x, pos.y - dragStart.y);
          dragPower = Math.min(1, dist / 130);
        } else if (!ballInHand) {
          const cue = balls[0];
          aimAngle = Math.atan2(pos.y - cue.y, pos.x - cue.x);
        }
      }

      function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        if (dragPower >= 0.08) {
          shootCue(aimAngle, dragPower);
        }
        dragPower = 0;
      }

      modeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          modeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          mode = btn.dataset.mode;
          createRack();
        });
      });

      resetBtn.addEventListener('click', createRack);

      canvas.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      canvas.addEventListener('touchstart', onPointerDown, { passive: false });
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);

      createRack();
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        clearTimeout(cpuTimeout);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
      };
    }
  };
})();
