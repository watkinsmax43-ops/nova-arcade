(function () {
      const canvas = document.getElementById('pool-canvas');
      const ctx = canvas.getContext('2d');

      const W = canvas.width;   // 900
      const H = canvas.height;  // 485
      const RAIL = 42;
      const BALL_R = 11.5;
      const COLLISION_FACTOR = 0.98;

      const POCKETS = [
        { x: RAIL + 3, y: RAIL + 3, r: 22 },
        { x: W / 2, y: RAIL - 2, r: 20 },
        { x: W - RAIL - 3, y: RAIL + 3, r: 22 },
        { x: RAIL + 3, y: H - RAIL - 3, r: 22 },
        { x: W / 2, y: H - RAIL + 2, r: 20 },
        { x: W - RAIL - 3, y: H - RAIL - 3, r: 22 }
      ];

      const THEMES = {
        blue: {
          feltLight: '#1d73b8',
          feltDark: '#0f497a',
          cushion: '#093052',
          woodA: '#6b3317',
          woodB: '#381809'
        },
        green: {
          feltLight: '#158f54',
          feltDark: '#0a5732',
          cushion: '#063b22',
          woodA: '#6b3317',
          woodB: '#381809'
        },
        purple: {
          feltLight: '#6d28d9',
          feltDark: '#3b0764',
          cushion: '#24043d',
          woodA: '#334155',
          woodB: '#0f172a'
        }
      };

      const BALL_COLORS = {
        0: '#f8fafc',
        1: '#facc15', 2: '#2563eb', 3: '#dc2626', 4: '#7c3aed',
        5: '#f97316', 6: '#16a34a', 7: '#9f1239', 8: '#111827',
        9: '#facc15', 10: '#2563eb', 11: '#dc2626', 12: '#7c3aed',
        13: '#f97316', 14: '#16a34a', 15: '#9f1239'
      };

      // DOM Elements
      const p1Card = document.getElementById('p1-card');
      const p2Card = document.getElementById('p2-card');
      const p1NameEl = document.getElementById('p1-name');
      const p2NameEl = document.getElementById('p2-name');
      const p2AvatarEl = document.getElementById('p2-avatar');
      const p1GroupEl = document.getElementById('p1-group');
      const p2GroupEl = document.getElementById('p2-group');
      const p1RackEl = document.getElementById('p1-rack');
      const p2RackEl = document.getElementById('p2-rack');

      const btnAi = document.getElementById('btn-ai');
      const btn2p = document.getElementById('btn-2p');
      const aiLevelEl = document.getElementById('ai-level');
      const themeEl = document.getElementById('table-theme');
      const btnSound = document.getElementById('btn-sound');
      const btnNew = document.getElementById('btn-new');

      const spinBtn = document.getElementById('spin-btn');
      const spinPopover = document.getElementById('spin-popover');
      const spinPad = document.getElementById('spin-pad');
      const spinDotMini = document.getElementById('spin-dot-mini');
      const spinDotBig = document.getElementById('spin-dot-big');
      const spinReadout = document.getElementById('spin-readout');
      const spinResetBtn = document.getElementById('spin-reset');

      const powerSlider = document.getElementById('power-slider');
      const powerFill = document.getElementById('power-fill');
      const miniCuePull = document.getElementById('mini-cue-pull');
      const powerPctEl = document.getElementById('power-pct');

      const toastEl = document.getElementById('toast-banner');
      const victoryOverlay = document.getElementById('victory-overlay');
      const victoryTitle = document.getElementById('victory-title');
      const victoryReason = document.getElementById('victory-reason');
      const playAgainBtn = document.getElementById('play-again-btn');

      // State
      let mode = 'ai'; // 'ai' | '2p'
      let aiLevel = 'medium';
      let currentTheme = 'blue';
      let soundOn = true;

      let balls = [];
      let pottingAnims = [];
      let turn = 1;
      let groups = { 1: null, 2: null };
      let isBreakShot = true;
      let gameOver = false;
      let winner = null;
      let ballInHand = false;
      let isMoving = false;
      let shotPotted = [];
      let firstHitNum = null;

      // Cue Spin: sx in [-1, 1], sy in [-1, 1] (+1 = top/follow, -1 = bottom/draw)
      let spinX = 0;
      let spinY = 0;

      // Aim & Shooting
      let aimAngle = 0;
      let activePower = 0;
      let draggingCanvas = false;
      let draggingPowerBar = false;
      let draggingCueBall = false;
      let dragStart = null;
      let powerBarStartY = 0;
      let pointerPos = { x: 235, y: H / 2 };

      // Cue strike animation
      let cueStrikeAnim = 0;
      let aiTimer = null;
      let aiPullInterval = null;
      let aiThinking = false;
      let toastTimer = null;

      // Audio
      let audioCtx = null;
      function playSound(type, intensity = 0.5) {
        if (!soundOn) return;
        try {
          if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          if (type === 'hit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(640 + intensity * 280, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.055);
            gain.gain.setValueAtTime(Math.min(0.28, 0.05 + intensity * 0.22), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          } else if (type === 'rail') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(175, now);
            osc.frequency.exponentialRampToValueAtTime(65, now + 0.07);
            gain.gain.setValueAtTime(Math.min(0.18, 0.04 + intensity * 0.12), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          } else if (type === 'pocket') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(290, now);
            osc.frequency.exponentialRampToValueAtTime(95, now + 0.17);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
          }
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
        } catch (e) {}
      }

      function showToast(msg, duration = 2600) {
        clearTimeout(toastTimer);
        toastEl.textContent = msg;
        toastEl.style.opacity = '1';
        if (duration > 0) {
          toastTimer = setTimeout(() => {
            toastEl.style.opacity = '0.78';
          }, duration);
        }
      }

      function getGroup(num) {
        if (num >= 1 && num <= 7) return 'solid';
        if (num >= 9 && num <= 15) return 'stripe';
        if (num === 8) return 'eight';
        return 'cue';
      }

      function remainingInGroup(group) {
        return balls.filter((b) => b.active && getGroup(b.num) === group).length;
      }

      function playerName(t) {
        if (t === 1) return 'Player 1';
        return mode === 'ai' ? `AI (${aiLevel[0].toUpperCase() + aiLevel.slice(1)})` : 'Player 2';
      }

      function updateSpinUI() {
        const px = 50 + spinX * 36;
        const py = 50 - spinY * 36;
        spinDotMini.style.left = `${px}%`;
        spinDotMini.style.top = `${py}%`;
        spinDotBig.style.left = `${px}%`;
        spinDotBig.style.top = `${py}%`;

        const parts = [];
        if (spinY > 0.2) parts.push('Topspin');
        else if (spinY < -0.2) parts.push('Backspin');
        if (spinX > 0.2) parts.push('Right');
        else if (spinX < -0.2) parts.push('Left');
        spinReadout.textContent = parts.length ? parts.join(' + ') : 'Center Hit';
      }

      function updatePowerBarUI(p) {
        const pct = Math.round(p * 100);
        powerFill.style.height = `${pct}%`;
        miniCuePull.style.top = `${6 + p * 125}px`;
        powerPctEl.textContent = `${pct}%`;
      }

      function resetSpin() {
        spinX = 0;
        spinY = 0;
        updateSpinUI();
      }

      function createRack() {
        clearTimeout(aiTimer);
        clearInterval(aiPullInterval);
        aiThinking = false;
        pottingAnims = [];
        balls = [];
        turn = 1;
        groups = { 1: null, 2: null };
        isBreakShot = true;
        gameOver = false;
        winner = null;
        ballInHand = false;
        isMoving = false;
        draggingCanvas = false;
        draggingPowerBar = false;
        draggingCueBall = false;
        activePower = 0;
        aimAngle = 0;
        resetSpin();
        updatePowerBarUI(0);
        victoryOverlay.classList.add('hidden');

        // Cue ball at head spot
        balls.push({
          num: 0, x: 235, y: H / 2, vx: 0, vy: 0, active: true,
          spinFwd: 0, spinSide: 0, spinCarryX: 0, spinCarryY: 0, shotDirX: 1, shotDirY: 0
        });

        const solids = [1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
        const stripes = [9, 10, 11, 12, 13, 14, 15].sort(() => Math.random() - 0.5);
        const cornerA = solids.pop();
        const cornerB = stripes.pop();
        const pool = [...solids, ...stripes].sort(() => Math.random() - 0.5);

        const startX = 645;
        const startY = H / 2;
        const dx = BALL_R * 1.75;
        const dy = BALL_R * 2.03;

        for (let row = 0; row < 5; row++) {
          for (let col = 0; col <= row; col++) {
            const x = startX + row * dx;
            const y = startY - (row * dy) / 2 + col * dy;
            let num;
            if (row === 2 && col === 1) num = 8;
            else if (row === 4 && col === 0) num = cornerA;
            else if (row === 4 && col === 4) num = cornerB;
            else num = pool.pop();

            balls.push({ num, x, y, vx: 0, vy: 0, active: true });
          }
        }

        updateHud();
        showToast('BREAK SHOT — AIM & PULL POWER TO SHOOT');
      }

      function renderPlayerRack(el, group) {
        el.innerHTML = '';
        if (!group) return;
        const nums = group === 'solid' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
        const allCleared = nums.every((n) => !balls.find((b) => b.num === n)?.active);

        if (allCleared) {
          const b8 = document.createElement('span');
          b8.className = 'rack-ball';
          b8.style.background = '#111827';
          b8.style.color = '#fff';
          b8.style.border = '1.5px solid #facc15';
          b8.textContent = '8';
          el.appendChild(b8);
          return;
        }

        for (const n of nums) {
          const alive = balls.find((b) => b.num === n)?.active;
          const b = document.createElement('span');
          b.className = 'rack-ball' + (alive ? '' : ' potted');
          if (n >= 9) {
            b.style.background = `linear-gradient(180deg, #fff 24%, ${BALL_COLORS[n]} 24%, ${BALL_COLORS[n]} 76%, #fff 76%)`;
          } else {
            b.style.background = BALL_COLORS[n];
          }
          b.textContent = n;
          el.appendChild(b);
        }
      }

      function updateHud() {
        p1Card.classList.toggle('active', !gameOver && turn === 1);
        p2Card.classList.toggle('active', !gameOver && turn === 2);

        p1NameEl.textContent = 'Player 1';
        p2NameEl.textContent = mode === 'ai' ? `AI (${aiLevel[0].toUpperCase() + aiLevel.slice(1)})` : 'Player 2';
        p2AvatarEl.textContent = mode === 'ai' ? '🤖' : '👥';

        p1GroupEl.textContent = groups[1] ? groups[1].toUpperCase() : 'Open';
        p2GroupEl.textContent = groups[2] ? groups[2].toUpperCase() : 'Open';

        renderPlayerRack(p1RackEl, groups[1]);
        renderPlayerRack(p2RackEl, groups[2]);
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

      function isCuePlacementValid(x, y, restrictHeadString = false) {
        const maxX = restrictHeadString ? 235 : W - RAIL - BALL_R - 2;
        if (x < RAIL + BALL_R + 2 || x > maxX) return false;
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

        const speed = 3.8 + powerRatio * 23;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        cue.vx = dx * speed;
        cue.vy = dy * speed;
        cue.shotDirX = dx;
        cue.shotDirY = dy;
        cue.spinFwd = spinY * speed * 0.56;
        cue.spinSide = spinX;
        cue.spinCarryX = 0;
        cue.spinCarryY = 0;

        isMoving = true;
        isBreakShot = false;
        shotPotted = [];
        firstHitNum = null;
        ballInHand = false;
        cueStrikeAnim = 1;
        updatePowerBarUI(0);
        playSound('hit', powerRatio);
      }

      function handleShotEnd() {
        isMoving = false;
        const cue = balls[0];
        cue.spinFwd = 0;
        cue.spinSide = 0;
        cue.spinCarryX = 0;
        cue.spinCarryY = 0;

        const scratched = shotPotted.includes(0);
        const pottedEight = shotPotted.includes(8);
        const numberedPotted = shotPotted.filter((n) => n !== 0 && n !== 8);

        if (scratched) {
          cue.active = true;
          cue.vx = 0;
          cue.vy = 0;
          cue.x = 235;
          cue.y = H / 2;
          while (!isCuePlacementValid(cue.x, cue.y)) {
            cue.x += 12;
            if (cue.x > W - RAIL - 50) {
              cue.x = 180;
              cue.y += 24;
            }
          }
        }

        if (pottedEight) {
          const myGroup = groups[turn];
          const cleared = myGroup && remainingInGroup(myGroup) === 0;
          gameOver = true;
          if (cleared && !scratched) {
            winner = turn;
            victoryTitle.textContent = `🏆 ${playerName(winner)} Wins!`;
            victoryReason.textContent = 'Clean 8-Ball sink! Great match.';
          } else {
            winner = turn === 1 ? 2 : 1;
            victoryTitle.textContent = `🏆 ${playerName(winner)} Wins!`;
            victoryReason.textContent = scratched
              ? `${playerName(turn)} scratched while potting the 8-ball.`
              : `${playerName(turn)} potted the 8-ball too early.`;
          }
          updateHud();
          victoryOverlay.classList.remove('hidden');
          return;
        }

        let assignedMsg = null;
        if (!groups[1] && !scratched && numberedPotted.length > 0) {
          const g = getGroup(numberedPotted[0]);
          groups[turn] = g;
          groups[turn === 1 ? 2 : 1] = g === 'solid' ? 'stripe' : 'solid';
          assignedMsg = `${playerName(turn).toUpperCase()} IS ${g.toUpperCase()}S!`;
        }

        let foul = scratched || firstHitNum === null;
        if (!foul && groups[turn]) {
          const needed = remainingInGroup(groups[turn]) === 0 ? 'eight' : groups[turn];
          if (getGroup(firstHitNum) !== needed) foul = true;
        }

        if (foul) {
          const reason = scratched
            ? 'SCRATCH!'
            : firstHitNum === null
            ? 'NO BALL HIT!'
            : 'WRONG BALL HIT FIRST!';
          turn = turn === 1 ? 2 : 1;
          ballInHand = true;
          resetSpin();
          updateHud();
          showToast(`FOUL (${reason}) — ${playerName(turn).toUpperCase()} HAS BALL IN HAND`);
          if (mode === 'ai' && turn === 2) scheduleAiTurn();
          return;
        }

        const myGroup = groups[turn];
        const sankOwn = myGroup
          ? numberedPotted.some((n) => getGroup(n) === myGroup)
          : numberedPotted.length > 0;

        resetSpin();
        if (sankOwn || assignedMsg) {
          updateHud();
          if (assignedMsg) showToast(assignedMsg);
          else showToast(`${playerName(turn).toUpperCase()} POTTED A BALL — SHOOT AGAIN!`);
        } else {
          turn = turn === 1 ? 2 : 1;
          updateHud();
          showToast(`${playerName(turn).toUpperCase()}'S TURN`);
        }

        if (mode === 'ai' && turn === 2 && !gameOver) {
          scheduleAiTurn();
        }
      }

      // --- Raycast & Tracer Engine ---
      function castBallRay(startX, startY, dirX, dirY, ignoreNums, maxDist = 920) {
        let bestDist = maxDist;
        let hitType = 'none';
        let hitBall = null;
        let wallNormal = { x: 0, y: 0 };

        if (dirX > 0.0001) {
          const d = (W - RAIL - BALL_R - startX) / dirX;
          if (d >= 0 && d < bestDist) { bestDist = d; hitType = 'wall'; wallNormal = { x: -1, y: 0 }; }
        } else if (dirX < -0.0001) {
          const d = (RAIL + BALL_R - startX) / dirX;
          if (d >= 0 && d < bestDist) { bestDist = d; hitType = 'wall'; wallNormal = { x: 1, y: 0 }; }
        }

        if (dirY > 0.0001) {
          const d = (H - RAIL - BALL_R - startY) / dirY;
          if (d >= 0 && d < bestDist) { bestDist = d; hitType = 'wall'; wallNormal = { x: 0, y: -1 }; }
        } else if (dirY < -0.0001) {
          const d = (RAIL + BALL_R - startY) / dirY;
          if (d >= 0 && d < bestDist) { bestDist = d; hitType = 'wall'; wallNormal = { x: 0, y: 1 }; }
        }

        const minSumSq = (BALL_R * 2) * (BALL_R * 2);
        for (const b of balls) {
          if (!b.active || ignoreNums.includes(b.num)) continue;
          const px = b.x - startX;
          const py = b.y - startY;
          const proj = px * dirX + py * dirY;
          if (proj <= 0) continue;
          const perpSq = px * px + py * py - proj * proj;
          if (perpSq < minSumSq) {
            const hitDist = proj - Math.sqrt(minSumSq - perpSq);
            if (hitDist >= 0 && hitDist < bestDist) {
              bestDist = hitDist;
              hitType = 'ball';
              hitBall = b;
            }
          }
        }

        const endX = startX + dirX * bestDist;
        const endY = startY + dirY * bestDist;
        let pocketHit = null;
        for (const p of POCKETS) {
          if (Math.hypot(endX - p.x, endY - p.y) <= p.r + 3) {
            pocketHit = p;
            break;
          }
        }

        return { dist: bestDist, endX, endY, hitType, hitBall, wallNormal, pocketHit };
      }

      // --- AI Opponent ---
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
          if (Math.abs(px * uy - py * ux) < BALL_R * 2.05) return false;
        }
        return true;
      }

      function chooseAiShot() {
        const cue = balls[0];
        let targets = [];
        const aiGroup = groups[2];
        if (!aiGroup) {
          targets = balls.filter((b) => b.active && b.num !== 0 && b.num !== 8);
        } else if (remainingInGroup(aiGroup) > 0) {
          targets = balls.filter((b) => b.active && getGroup(b.num) === aiGroup);
        } else {
          targets = balls.filter((b) => b.active && b.num === 8);
        }

        if (ballInHand) {
          let placed = false;
          for (const t of targets) {
            for (const p of POCKETS) {
              const dx = t.x - p.x;
              const dy = t.y - p.y;
              const len = Math.hypot(dx, dy);
              const px = t.x + (dx / len) * 95;
              const py = t.y + (dy / len) * 95;
              if (isCuePlacementValid(px, py) && pathClear(t.x, t.y, p.x, p.y, [0, t.num])) {
                cue.x = px;
                cue.y = py;
                placed = true;
                break;
              }
            }
            if (placed) break;
          }
          if (!placed) {
            cue.x = 235;
            cue.y = H / 2;
            while (!isCuePlacementValid(cue.x, cue.y)) cue.y += 24;
          }
          ballInHand = false;
        }

        let bestShot = null;
        let bestScore = -Infinity;

        for (const t of targets) {
          for (const p of POCKETS) {
            const toPX = p.x - t.x;
            const toPY = p.y - t.y;
            const distTP = Math.hypot(toPX, toPY);
            const ux = toPX / distTP;
            const uy = toPY / distTP;

            const ghostX = t.x - ux * (BALL_R * 2);
            const ghostY = t.y - uy * (BALL_R * 2);

            if (ghostX < RAIL + BALL_R || ghostX > W - RAIL - BALL_R) continue;
            if (ghostY < RAIL + BALL_R || ghostY > H - RAIL - BALL_R) continue;

            const toGX = ghostX - cue.x;
            const toGY = ghostY - cue.y;
            const distCG = Math.hypot(toGX, toGY);
            if (distCG < 1) continue;

            const dirX = toGX / distCG;
            const dirY = toGY / distCG;
            const dot = dirX * ux + dirY * uy;
            if (dot <= 0.18) continue;

            if (!pathClear(cue.x, cue.y, ghostX, ghostY, [0, t.num])) continue;
            if (!pathClear(t.x, t.y, p.x, p.y, [0, t.num])) continue;

            let scratchPenalty = 0;
            if (aiLevel !== 'easy') {
              const cvx = dirX - COLLISION_FACTOR * dot * ux;
              const cvy = dirY - COLLISION_FACTOR * dot * uy;
              const cSpeed = Math.hypot(cvx, cvy);
              if (cSpeed > 0.1) {
                const cRay = castBallRay(ghostX, ghostY, cvx / cSpeed, cvy / cSpeed, [0, t.num], 300);
                if (cRay.pocketHit) scratchPenalty = 90;
              }
            }

            const score = dot * 130 - (distTP + distCG) * 0.08 - scratchPenalty;
            if (score > bestScore) {
              bestScore = score;
              bestShot = {
                angle: Math.atan2(toGY, toGX),
                power: Math.min(0.84, 0.36 + (distTP + distCG) / 920)
              };
            }
          }
        }

        if (!bestShot && targets.length > 0) {
          for (const t of targets) {
            if (pathClear(cue.x, cue.y, t.x, t.y, [0, t.num])) {
              bestShot = { angle: Math.atan2(t.y - cue.y, t.x - cue.x), power: 0.58 };
              break;
            }
          }
          if (!bestShot) {
            const t = targets[0];
            bestShot = { angle: Math.atan2(t.y - cue.y, t.x - cue.x), power: 0.72 };
          }
        }

        const errMap = { easy: 0.052, medium: 0.018, hard: 0.005 };
        const err = (Math.random() - 0.5) * 2 * (errMap[aiLevel] || 0.018);
        return {
          angle: (bestShot ? bestShot.angle : 0) + err,
          power: bestShot ? bestShot.power : 0.7
        };
      }

      function scheduleAiTurn() {
        clearTimeout(aiTimer);
        clearInterval(aiPullInterval);
        aiThinking = true;
        activePower = 0;

        aiTimer = setTimeout(() => {
          if (gameOver || mode !== 'ai' || turn !== 2) return;
          const shot = chooseAiShot();
          aimAngle = shot.angle;

          let step = 0;
          aiPullInterval = setInterval(() => {
            if (gameOver || mode !== 'ai' || turn !== 2) {
              clearInterval(aiPullInterval);
              return;
            }
            step++;
            activePower = (step / 14) * shot.power;
            updatePowerBarUI(activePower);
            if (step >= 14) {
              clearInterval(aiPullInterval);
              aiThinking = false;
              const p = activePower;
              activePower = 0;
              shootCue(shot.angle, p);
            }
          }, 30);
        }, 620);
      }

      // --- Physics Engine ---
      function stepPhysics() {
        // Animate potted balls shrinking into pockets
        for (let i = pottingAnims.length - 1; i >= 0; i--) {
          const pa = pottingAnims[i];
          pa.x += (pa.px - pa.x) * 0.28;
          pa.y += (pa.py - pa.y) * 0.28;
          pa.scale -= 0.08;
          if (pa.scale <= 0.1) pottingAnims.splice(i, 1);
        }

        if (cueStrikeAnim > 0) {
          cueStrikeAnim = Math.max(0, cueStrikeAnim - 0.14);
        }

        if (!isMoving) return;

        const cue = balls[0];
        // Smoothly apply post-collision topspin/backspin grip onto the felt
        if (cue.active && (Math.abs(cue.spinCarryX) > 0.02 || Math.abs(cue.spinCarryY) > 0.02)) {
          cue.vx += cue.spinCarryX * 0.22;
          cue.vy += cue.spinCarryY * 0.22;
          cue.spinCarryX *= 0.78;
          cue.spinCarryY *= 0.78;
        }

        const SUBSTEPS = 6;
        const FRICTION = Math.pow(0.9865, 1 / SUBSTEPS);
        let anyMoving = false;

        for (let s = 0; s < SUBSTEPS; s++) {
          for (const b of balls) {
            if (!b.active) continue;
            b.x += b.vx / SUBSTEPS;
            b.y += b.vy / SUBSTEPS;
            b.vx *= FRICTION;
            b.vy *= FRICTION;

            let potted = false;
            let nearPocket = false;
            for (const p of POCKETS) {
              const dist = Math.hypot(b.x - p.x, b.y - p.y);
              if (dist < p.r) {
                b.active = false;
                b.vx = 0;
                b.vy = 0;
                shotPotted.push(b.num);
                pottingAnims.push({ num: b.num, x: b.x, y: b.y, px: p.x, py: p.y, scale: 1 });
                playSound('pocket');
                potted = true;
                break;
              } else if (dist < p.r + 5) {
                nearPocket = true;
              }
            }
            if (potted) continue;

            if (!nearPocket) {
              const speed = Math.hypot(b.vx, b.vy);
              let bounced = false;
              if (b.x - BALL_R < RAIL) {
                b.x = RAIL + BALL_R;
                b.vx = Math.abs(b.vx) * 0.84;
                if (b.num === 0 && b.spinSide) {
                  b.vy += b.spinSide * speed * 0.28;
                  b.spinSide *= 0.35;
                }
                bounced = true;
              } else if (b.x + BALL_R > W - RAIL) {
                b.x = W - RAIL - BALL_R;
                b.vx = -Math.abs(b.vx) * 0.84;
                if (b.num === 0 && b.spinSide) {
                  b.vy -= b.spinSide * speed * 0.28;
                  b.spinSide *= 0.35;
                }
                bounced = true;
              }

              if (b.y - BALL_R < RAIL) {
                b.y = RAIL + BALL_R;
                b.vy = Math.abs(b.vy) * 0.84;
                if (b.num === 0 && b.spinSide) {
                  b.vx -= b.spinSide * speed * 0.28;
                  b.spinSide *= 0.35;
                }
                bounced = true;
              } else if (b.y + BALL_R > H - RAIL) {
                b.y = H - RAIL - BALL_R;
                b.vy = -Math.abs(b.vy) * 0.84;
                if (b.num === 0 && b.spinSide) {
                  b.vx += b.spinSide * speed * 0.28;
                  b.spinSide *= 0.35;
                }
                bounced = true;
              }

              if (bounced && speed > 1.2) playSound('rail', Math.min(1, speed / 15));
            }
          }

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
                const isFirstCueHit = firstHitNum === null && (a.num === 0 || b.num === 0);
                if (isFirstCueHit) {
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
                  const impulse = impact * COLLISION_FACTOR;
                  a.vx -= impulse * nx;
                  a.vy -= impulse * ny;
                  b.vx += impulse * nx;
                  b.vy += impulse * ny;

                  // Transfer cue spin (Follow / Draw) on first cue ball strike
                  if (isFirstCueHit && cue.spinFwd !== 0) {
                    const cNorm = Math.abs((cue.shotDirX * nx + cue.shotDirY * ny));
                    cue.spinCarryX = cue.shotDirX * cue.spinFwd * cNorm;
                    cue.spinCarryY = cue.shotDirY * cue.spinFwd * cNorm;
                    cue.spinFwd = 0;
                  }

                  if (impact > 1.1) playSound('hit', Math.min(1, impact / 16));
                }
              }
            }
          }
        }

        for (const b of balls) {
          if (!b.active) continue;
          if (Math.hypot(b.vx, b.vy) < 0.06) {
            b.vx = 0;
            b.vy = 0;
          } else {
            anyMoving = true;
          }
        }

        if (!anyMoving && (Math.abs(cue.spinCarryX) < 0.05 && Math.abs(cue.spinCarryY) < 0.05)) {
          handleShotEnd();
        }
      }

      // --- Rendering ---
      function drawSingleBall(num, x, y, scale = 1) {
        const r = BALL_R * scale;
        ctx.save();
        ctx.translate(x, y);

        // Soft shadow
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath();
        ctx.arc(2 * scale, 3 * scale, r, 0, Math.PI * 2);
        ctx.fill();

        if (num >= 9) {
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = BALL_COLORS[num];
          ctx.fillRect(-r, -r * 0.52, r * 2, r * 1.04);
          ctx.restore();
        } else {
          ctx.fillStyle = BALL_COLORS[num];
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle spherical shading
        const shade = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
        shade.addColorStop(0, 'rgba(255,255,255,0.28)');
        shade.addColorStop(0.65, 'rgba(255,255,255,0)');
        shade.addColorStop(1, 'rgba(0,0,0,0.32)');
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        if (num !== 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.max(6, Math.round(7.8 * scale))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(num), 0, 0.5 * scale);
        }

        ctx.restore();
      }

      function drawTable() {
        const theme = THEMES[currentTheme];

        // Outer wood rails
        const wood = ctx.createLinearGradient(0, 0, W, H);
        wood.addColorStop(0, theme.woodA);
        wood.addColorStop(1, theme.woodB);
        ctx.fillStyle = wood;
        ctx.fillRect(0, 0, W, H);

        // Brushed metallic corner brackets
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, 30, 30);
        ctx.fillRect(W - 30, 0, 30, 30);
        ctx.fillRect(0, H - 30, 30, 30);
        ctx.fillRect(W - 30, H - 30, 30, 30);

        // Felt
        const felt = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.65);
        felt.addColorStop(0, theme.feltLight);
        felt.addColorStop(1, theme.feltDark);
        ctx.fillStyle = felt;
        ctx.fillRect(RAIL, RAIL, W - RAIL * 2, H - RAIL * 2);

        // Inner cushion bevel
        ctx.strokeStyle = theme.cushion;
        ctx.lineWidth = 7;
        ctx.strokeRect(RAIL, RAIL, W - RAIL * 2, H - RAIL * 2);

        // Center table emblem watermark (Miniclip style)
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 46, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('8', W / 2, H / 2 + 2);
        ctx.restore();

        // Head string & foot spot
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(235, RAIL);
        ctx.lineTo(235, H - RAIL);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.arc(645, H / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Diamond sights
        ctx.fillStyle = '#e2c286';
        for (let i = 1; i <= 3; i++) {
          const lx = RAIL + ((W / 2 - RAIL) * i) / 4;
          const rx = W / 2 + ((W / 2 - RAIL) * i) / 4;
          [lx, rx].forEach((dx) => {
            ctx.beginPath(); ctx.arc(dx, RAIL / 2, 3.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(dx, H - RAIL / 2, 3.2, 0, Math.PI * 2); ctx.fill();
          });
          const sy = RAIL + ((H - RAIL * 2) * i) / 4;
          ctx.beginPath(); ctx.arc(RAIL / 2, sy, 3.2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(W - RAIL / 2, sy, 3.2, 0, Math.PI * 2); ctx.fill();
        }

        // Pockets
        for (const p of POCKETS) {
          ctx.fillStyle = '#030508';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      function drawBalls() {
        for (const pa of pottingAnims) {
          drawSingleBall(pa.num, pa.x, pa.y, pa.scale);
        }
        for (const b of balls) {
          if (!b.active) continue;
          drawSingleBall(b.num, b.x, b.y, 1);

          // Highlight legal target cue ring on 8-ball if group is cleared
          if (!isMoving && !gameOver && b.num === 8 && groups[turn] && remainingInGroup(groups[turn]) === 0) {
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_R + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      function drawArrowHead(x, y, dx, dy, color, size = 8) {
        const ang = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size * 0.55);
        ctx.lineTo(-size, size * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function drawTracersAndCue() {
        const canHumanAim = !isMoving && !gameOver && !ballInHand && !(mode === 'ai' && turn === 2);
        if (!canHumanAim && !aiThinking && cueStrikeAnim <= 0) return;

        const cue = balls[0];
        if (!cue.active) return;

        const dirX = Math.cos(aimAngle);
        const dirY = Math.sin(aimAngle);

        // Draw Tracers while aiming
        if (cueStrikeAnim === 0 && !draggingCueBall) {
          const primaryRay = castBallRay(cue.x, cue.y, dirX, dirY, [0], 950);

          let isLegalTarget = true;
          if (primaryRay.hitType === 'ball' && groups[turn]) {
            const needed = remainingInGroup(groups[turn]) === 0 ? 'eight' : groups[turn];
            if (getGroup(primaryRay.hitBall.num) !== needed) isLegalTarget = false;
          }

          ctx.save();

          // 1. Primary Cue Aim Line
          ctx.strokeStyle = isLegalTarget ? 'rgba(255, 255, 255, 0.84)' : 'rgba(239, 68, 68, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cue.x, cue.y);
          ctx.lineTo(primaryRay.endX, primaryRay.endY);
          ctx.stroke();

          // Ghost Cue Ball at Impact
          ctx.beginPath();
          ctx.arc(primaryRay.endX, primaryRay.endY, BALL_R, 0, Math.PI * 2);
          ctx.strokeStyle = isLegalTarget ? 'rgba(255, 255, 255, 0.9)' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();

          if (!isLegalTarget && primaryRay.hitType === 'ball') {
            ctx.beginPath();
            ctx.moveTo(primaryRay.endX - 5, primaryRay.endY - 5);
            ctx.lineTo(primaryRay.endX + 5, primaryRay.endY + 5);
            ctx.moveTo(primaryRay.endX + 5, primaryRay.endY - 5);
            ctx.lineTo(primaryRay.endX - 5, primaryRay.endY + 5);
            ctx.stroke();
          }

          if (primaryRay.hitType === 'ball') {
            const target = primaryRay.hitBall;
            const nx = (target.x - primaryRay.endX) / (BALL_R * 2);
            const ny = (target.y - primaryRay.endY) / (BALL_R * 2);

            // 2. Target Ball Path Tracer
            const targetRay = castBallRay(target.x, target.y, nx, ny, [0, target.num], 460);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(target.x, target.y);
            ctx.lineTo(targetRay.endX, targetRay.endY);
            ctx.stroke();
            drawArrowHead(targetRay.endX, targetRay.endY, nx, ny, '#22d3ee', 9);

            if (targetRay.pocketHit) {
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(targetRay.pocketHit.x, targetRay.pocketHit.y, targetRay.pocketHit.r + 4, 0, Math.PI * 2);
              ctx.stroke();
            }

            // 3. White Ball Post-Impact Tracer (Accounts for Topspin / Backspin!)
            const dot = dirX * nx + dirY * ny;
            const cueAfterX = (dirX - COLLISION_FACTOR * dot * nx) + spinY * 0.56 * dot * dirX;
            const cueAfterY = (dirY - COLLISION_FACTOR * dot * ny) + spinY * 0.56 * dot * dirY;
            const cueAfterSpeed = Math.hypot(cueAfterX, cueAfterY);

            if (cueAfterSpeed > 0.04) {
              const ux = cueAfterX / cueAfterSpeed;
              const uy = cueAfterY / cueAfterSpeed;
              const maxLen = 65 + Math.min(1.2, cueAfterSpeed) * 165;
              const whiteRay = castBallRay(primaryRay.endX, primaryRay.endY, ux, uy, [0, target.num], maxLen);

              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 2.3;
              ctx.setLineDash([5, 4]);
              ctx.beginPath();
              ctx.moveTo(primaryRay.endX, primaryRay.endY);
              ctx.lineTo(whiteRay.endX, whiteRay.endY);
              ctx.stroke();
              ctx.setLineDash([]);
              drawArrowHead(whiteRay.endX, whiteRay.endY, ux, uy, '#facc15', 8);

              if (whiteRay.hitType === 'wall' && !whiteRay.pocketHit && whiteRay.dist < maxLen - 18) {
                const remain = Math.min(110, maxLen - whiteRay.dist);
                const rx = whiteRay.wallNormal.x !== 0 ? -ux : ux;
                const ry = whiteRay.wallNormal.y !== 0 ? -uy : uy;
                const bRay = castBallRay(whiteRay.endX, whiteRay.endY, rx, ry, [0, target.num], remain);
                ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
                ctx.lineWidth = 1.8;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(whiteRay.endX, whiteRay.endY);
                ctx.lineTo(bRay.endX, bRay.endY);
                ctx.stroke();
                ctx.setLineDash([]);
              }

              if (whiteRay.pocketHit) {
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(whiteRay.pocketHit.x, whiteRay.pocketHit.y, whiteRay.pocketHit.r + 4, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
          } else if (primaryRay.hitType === 'wall' && !primaryRay.pocketHit) {
            const rx = primaryRay.wallNormal.x !== 0 ? -dirX : dirX;
            const ry = primaryRay.wallNormal.y !== 0 ? -dirY : dirY;
            const bRay = castBallRay(primaryRay.endX, primaryRay.endY, rx, ry, [0], 175);

            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(primaryRay.endX, primaryRay.endY);
            ctx.lineTo(bRay.endX, bRay.endY);
            ctx.stroke();
            ctx.setLineDash([]);
            drawArrowHead(bRay.endX, bRay.endY, rx, ry, '#facc15', 8);
          }

          ctx.restore();
        }

        // Draw Detailed Pool Cue Stick
        const pullBack = cueStrikeAnim > 0
          ? 12 - cueStrikeAnim * 10
          : 18 + activePower * 76;
        const stickLen = 225;

        const sx1 = cue.x - dirX * pullBack;
        const sy1 = cue.y - dirY * pullBack;
        const sx2 = cue.x - dirX * (pullBack + stickLen);
        const sy2 = cue.y - dirY * (pullBack + stickLen);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.moveTo(sx1 + 2, sy1 + 4);
        ctx.lineTo(sx2 + 2, sy2 + 4);
        ctx.stroke();

        // Cue shaft + dark butt
        const stickGrad = ctx.createLinearGradient(sx1, sy1, sx2, sy2);
        stickGrad.addColorStop(0, '#fef3c7');
        stickGrad.addColorStop(0.42, '#d97706');
        stickGrad.addColorStop(0.55, '#1e293b');
        stickGrad.addColorStop(1, '#090d16');
        ctx.strokeStyle = stickGrad;
        ctx.lineWidth = 6.5;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        // Chalked blue tip + white ferrule
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx1 - dirX * 9, sy1 - dirY * 9);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx1 - dirX * 3, sy1 - dirY * 3);
        ctx.stroke();
        ctx.restore();
      }

      function drawBallInHandIndicator() {
        const cue = balls[0];
        if (!cue.active || isMoving || gameOver || (mode === 'ai' && turn === 2)) return;
        if (!ballInHand && !isBreakShot) return;

        // Miniclip-style glowing grab ring around the cue ball when movable
        if (ballInHand) {
          ctx.save();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(cue.x, cue.y, BALL_R + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      function loop() {
        stepPhysics();
        drawTable();
        drawBalls();
        drawBallInHandIndicator();
        drawTracersAndCue();
        requestAnimationFrame(loop);
      }

      // --- Canvas Pointer Controls ---
      function onCanvasDown(e) {
        if (gameOver || isMoving || (mode === 'ai' && turn === 2)) return;
        e.preventDefault();
        spinPopover.classList.add('hidden');
        const pos = getCanvasPos(e);
        pointerPos = pos;
        const cue = balls[0];

        // Allow grabbing cue ball directly on break OR anytime during Ball-in-Hand
        if ((ballInHand || isBreakShot) && Math.hypot(pos.x - cue.x, pos.y - cue.y) <= BALL_R + 14) {
          draggingCueBall = true;
          return;
        }

        // Click anywhere valid on table during Ball-in-Hand to place cue ball
        if (ballInHand) {
          if (isCuePlacementValid(pos.x, pos.y)) {
            cue.x = pos.x;
            cue.y = pos.y;
            ballInHand = false;
            showToast('BALL PLACED — AIM & SHOOT!');
          }
          return;
        }

        aimAngle = Math.atan2(pos.y - cue.y, pos.x - cue.x);
        draggingCanvas = true;
        dragStart = pos;
        activePower = 0;
        updatePowerBarUI(0);
      }

      function onWindowMove(e) {
        if (draggingPowerBar) {
          const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
          const dy = Math.max(0, clientY - powerBarStartY);
          activePower = Math.min(1, dy / 150);
          updatePowerBarUI(activePower);
          return;
        }

        const pos = getCanvasPos(e);
        pointerPos = pos;
        if (gameOver || isMoving || (mode === 'ai' && turn === 2)) return;

        const cue = balls[0];
        if (draggingCueBall) {
          if (isCuePlacementValid(pos.x, pos.y, isBreakShot && !ballInHand)) {
            cue.x = pos.x;
            cue.y = pos.y;
          }
          return;
        }

        if (draggingCanvas && dragStart) {
          const dist = Math.hypot(pos.x - dragStart.x, pos.y - dragStart.y);
          activePower = Math.min(1, dist / 150);
          updatePowerBarUI(activePower);
        } else if (!ballInHand) {
          aimAngle = Math.atan2(pos.y - cue.y, pos.x - cue.x);
        }
      }

      function onWindowUp() {
        if (draggingCueBall) {
          draggingCueBall = false;
          if (ballInHand) {
            ballInHand = false;
            showToast('BALL PLACED — AIM & SHOOT!');
          }
          return;
        }

        if (draggingCanvas || draggingPowerBar) {
          draggingCanvas = false;
          draggingPowerBar = false;
          if (activePower >= 0.06) {
            const p = activePower;
            activePower = 0;
            shootCue(aimAngle, p);
          } else {
            activePower = 0;
            updatePowerBarUI(0);
          }
        }
      }

      // Left Vertical Power Bar Events
      function onPowerBarDown(e) {
        if (gameOver || isMoving || ballInHand || (mode === 'ai' && turn === 2)) return;
        e.preventDefault();
        spinPopover.classList.add('hidden');
        draggingPowerBar = true;
        powerBarStartY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
        activePower = 0;
      }

      powerSlider.addEventListener('mousedown', onPowerBarDown);
      powerSlider.addEventListener('touchstart', onPowerBarDown, { passive: false });

      canvas.addEventListener('mousedown', onCanvasDown);
      canvas.addEventListener('touchstart', onCanvasDown, { passive: false });

      window.addEventListener('mousemove', onWindowMove);
      window.addEventListener('touchmove', onWindowMove, { passive: false });
      window.addEventListener('mouseup', onWindowUp);
      window.addEventListener('touchend', onWindowUp);

      // Fine aim with Left/Right arrows
      window.addEventListener('keydown', (e) => {
        if (gameOver || isMoving || ballInHand || (mode === 'ai' && turn === 2)) return;
        if (e.code === 'ArrowLeft') { e.preventDefault(); aimAngle -= 0.005; }
        else if (e.code === 'ArrowRight') { e.preventDefault(); aimAngle += 0.005; }
        else if (e.code === 'Escape') {
          draggingCanvas = false;
          draggingPowerBar = false;
          activePower = 0;
          updatePowerBarUI(0);
          spinPopover.classList.add('hidden');
        }
      });

      // Spin Widget Events
      spinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        spinPopover.classList.toggle('hidden');
      });

      function setSpinFromPointer(e) {
        const rect = spinPad.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let nx = ((clientX - rect.left) / rect.width - 0.5) * 2.2;
        let ny = -((clientY - rect.top) / rect.height - 0.5) * 2.2;
        const len = Math.hypot(nx, ny);
        if (len > 1) {
          nx /= len;
          ny /= len;
        }
        spinX = nx;
        spinY = ny;
        updateSpinUI();
      }

      let draggingSpin = false;
      spinPad.addEventListener('mousedown', (e) => { draggingSpin = true; setSpinFromPointer(e); });
      window.addEventListener('mousemove', (e) => { if (draggingSpin) setSpinFromPointer(e); });
      window.addEventListener('mouseup', () => { draggingSpin = false; });
      spinPad.addEventListener('touchstart', (e) => { e.preventDefault(); setSpinFromPointer(e); }, { passive: false });
      spinResetBtn.addEventListener('click', resetSpin);

      // Header Controls
      btnAi.addEventListener('click', () => {
        mode = 'ai';
        btnAi.classList.add('active');
        btn2p.classList.remove('active');
        aiLevelEl.classList.remove('hidden');
        createRack();
      });

      btn2p.addEventListener('click', () => {
        mode = '2p';
        btn2p.classList.add('active');
        btnAi.classList.remove('active');
        aiLevelEl.classList.add('hidden');
        createRack();
      });

      aiLevelEl.addEventListener('change', (e) => {
        aiLevel = e.target.value;
        updateHud();
      });

      themeEl.addEventListener('change', (e) => {
        currentTheme = e.target.value;
      });

      btnSound.addEventListener('click', () => {
        soundOn = !soundOn;
        btnSound.classList.toggle('active', soundOn);
        btnSound.textContent = soundOn ? '🔊' : '🔇';
      });

      btnNew.addEventListener('click', createRack);
      playAgainBtn.addEventListener('click', createRack);

      // Start
      createRack();
      requestAnimationFrame(loop);
    })();
