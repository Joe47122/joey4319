/* ============================================================
   Shared Interactive Script — Joseph Komgbenda Portfolio
   1. Full-page mouse-deflected wind-tunnel airflow streamlines
   2. Cursor-tracked liquid glass specular reflection
   3. Project category filter tabs & Experience switcher tabs
   4. Gallery image lightbox viewer
   ============================================================ */

(() => {
  /* ------------------------------------------------------------
     1. INTERACTIVE AIRFLOW STREAMLINES (Mouse pushes & bends lines)
     ------------------------------------------------------------ */
  let canvas = document.getElementById('airflow-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'airflow-canvas';
    document.body.prepend(canvas);
  }
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  const NUM_LINES = 26;
  const NUM_NODES = 38;
  let lines = [];

  const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, lastX: -9999, lastY: -9999 };

  window.addEventListener('mousemove', e => {
    if (pointer.lastX !== -9999) {
      pointer.vx = (e.clientX - pointer.lastX);
      pointer.vy = (e.clientY - pointer.lastY);
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  function buildLines() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    lines = [];
    const spacing = H / (NUM_LINES + 1);
    for (let i = 0; i < NUM_LINES; i++) {
      const baseY = spacing * (i + 1);
      const nodes = [];
      for (let j = 0; j < NUM_NODES; j++) {
        const x = (W / (NUM_NODES - 1)) * j;
        nodes.push({ x, y: baseY, baseY, vy: 0, glow: 0 });
      }
      lines.push({
        baseY,
        phase: i * 0.45,
        speed: 0.008 + (i % 4) * 0.002,
        nodes
      });
    }
    if (!drone.initialized) {
      drone.x = W * 0.35;
      drone.y = H * 0.35;
      drone.initialized = true;
    }
  }

  // 5 cursor-chasing aerospace vehicles: randomized on every page reload (never repeating the same one twice in a row)
  const CRAFT_TYPES = [
    { id: 'uav',      label: 'UAV',      span: 9.5,  speed: 4.8, turn: 0.085, dualTrail: true },
    { id: 'rocket',   label: 'Rocket',   span: 3.2,  speed: 5.4, turn: 0.075, dualTrail: false },
    { id: 'heli',     label: 'Heli',     span: 7.0,  speed: 4.1, turn: 0.105, dualTrail: false },
    { id: 'drone',    label: 'Drone',    span: 7.5,  speed: 4.5, turn: 0.12,  dualTrail: true },
    { id: 'airliner', label: 'Airliner', span: 11.8, speed: 4.3, turn: 0.068, dualTrail: true }
  ];

  let uavEnabled = true;
  let craftIdx = Math.floor(Math.random() * CRAFT_TYPES.length);
  try {
    uavEnabled = localStorage.getItem('uav_enabled') !== 'false';
    const lastIdx = parseInt(sessionStorage.getItem('last_craft_idx'), 10);
    if (!Number.isNaN(lastIdx) && CRAFT_TYPES.length > 1) {
      // Pick a random index different from the previous reload so every refresh gives a new aircraft
      const candidates = CRAFT_TYPES.map((_, idx) => idx).filter(idx => idx !== lastIdx);
      craftIdx = candidates[Math.floor(Math.random() * candidates.length)];
    }
    sessionStorage.setItem('last_craft_idx', String(craftIdx));
  } catch (_) {}

  const drone = {
    x: 300,
    y: 260,
    vx: 1.4,
    vy: 0.4,
    angle: 0,
    bank: 0,
    trail: [],
    initialized: false
  };

  // Inject compact liquid-glass Aircraft ON/OFF toggle + cycle button into the top nav bar
  const topNav = document.querySelector('nav.top-pill');
  if (topNav) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'liquid-btn sm uav-toggle-btn';
    toggleBtn.setAttribute('aria-pressed', String(uavEnabled));
    toggleBtn.title = 'Turn the cursor-chasing aircraft on or off';

    const cycleBtn = document.createElement('button');
    cycleBtn.type = 'button';
    cycleBtn.className = 'liquid-btn sm uav-toggle-btn';
    cycleBtn.style.padding = '7px 10px';
    cycleBtn.title = 'Switch aircraft (UAV · Rocket · Helicopter · Quad Drone · Commercial Airliner)';
    cycleBtn.innerHTML = '<span>↻</span>';

    const renderToggleLabel = () => {
      const currentCraft = CRAFT_TYPES[craftIdx];
      toggleBtn.setAttribute('aria-pressed', String(uavEnabled));
      toggleBtn.innerHTML = `<span class="uav-led"></span><span>${currentCraft.label}: ${uavEnabled ? 'ON' : 'OFF'}</span>`;
    };
    renderToggleLabel();

    toggleBtn.addEventListener('click', () => {
      uavEnabled = !uavEnabled;
      try {
        localStorage.setItem('uav_enabled', String(uavEnabled));
      } catch (_) {}
      if (!uavEnabled) {
        drone.trail = [];
      } else {
        drone.x = pointer.x > 0 ? pointer.x - 90 : W * 0.35;
        drone.y = pointer.y > 0 ? pointer.y - 60 : H * 0.35;
      }
      renderToggleLabel();
    });

    cycleBtn.addEventListener('click', () => {
      craftIdx = (craftIdx + 1) % CRAFT_TYPES.length;
      uavEnabled = true;
      drone.trail = [];
      try {
        localStorage.setItem('uav_enabled', 'true');
        sessionStorage.setItem('last_craft_idx', String(craftIdx));
      } catch (_) {}
      renderToggleLabel();
    });

    const ctaBtn = topNav.querySelector('.liquid-btn.primary');
    const rightGroup = document.createElement('div');
    rightGroup.style.display = 'flex';
    rightGroup.style.alignItems = 'center';
    rightGroup.style.gap = '6px';
    if (ctaBtn) {
      topNav.insertBefore(rightGroup, ctaBtn);
      rightGroup.appendChild(toggleBtn);
      rightGroup.appendChild(cycleBtn);
      rightGroup.appendChild(ctaBtn);
    } else {
      rightGroup.appendChild(toggleBtn);
      rightGroup.appendChild(cycleBtn);
      topNav.appendChild(rightGroup);
    }
  }

  function drawAircraft(ctx, craftId, t, bank) {
    if (craftId === 'uav') {
      // 1. Tailless Swept Flying-Wing UAV
      ctx.scale(1, 1 - Math.abs(bank) * 0.28);
      const glowGrad = ctx.createRadialGradient(-4, 0, 0.5, -4, 0, 11);
      glowGrad.addColorStop(0, 'rgba(104, 182, 148, 0.55)');
      glowGrad.addColorStop(1, 'rgba(104, 182, 148, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(-4, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(9.5, 0);
      ctx.lineTo(-5.5, -10.2);
      ctx.lineTo(-8.2, -7.8);
      ctx.lineTo(-3.8, -2.1);
      ctx.lineTo(-6.2, 0);
      ctx.lineTo(-3.8, 2.1);
      ctx.lineTo(-8.2, 7.8);
      ctx.lineTo(-5.5, 10.2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 24, 34, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.78)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5.2, 0);
      ctx.lineTo(-2.5, 0);
      ctx.strokeStyle = 'rgba(238, 242, 248, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

    } else if (craftId === 'rocket') {
      // 2. Orbital / Sounding Rocket with flickering thruster plume
      const flameLen = 8.5 + Math.sin(t * 0.7) * 2.8;
      ctx.beginPath();
      ctx.moveTo(-7.5, -2.1);
      ctx.lineTo(-7.5 - flameLen, 0);
      ctx.lineTo(-7.5, 2.1);
      ctx.closePath();
      ctx.fillStyle = 'rgba(104, 182, 148, 0.75)';
      ctx.fill();

      // Rear fins
      ctx.beginPath();
      ctx.moveTo(-3.5, -2.6);
      ctx.lineTo(-8.2, -6.5);
      ctx.lineTo(-7.5, -2.4);
      ctx.moveTo(-3.5, 2.6);
      ctx.lineTo(-8.2, 6.5);
      ctx.lineTo(-7.5, 2.4);
      ctx.fillStyle = 'rgba(15, 24, 34, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.75)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rocket cylindrical body + ogive nose cone
      ctx.beginPath();
      ctx.moveTo(11.5, 0);
      ctx.quadraticCurveTo(6.5, -3.1, 2.0, -3.1);
      ctx.lineTo(-7.5, -2.8);
      ctx.lineTo(-7.5, 2.8);
      ctx.lineTo(2.0, 3.1);
      ctx.quadraticCurveTo(6.5, 3.1, 11.5, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(18, 28, 40, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(238, 242, 248, 0.8)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Stage interstage band
      ctx.beginPath();
      ctx.moveTo(1.5, -3.0);
      ctx.lineTo(1.5, 3.0);
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

    } else if (craftId === 'heli') {
      // 3. Helicopter (Hughes 369H / Bell UH-1 tribute with spinning main rotor)
      // Tailboom & tail stabilizer
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-11.5, 0);
      ctx.moveTo(-10.2, -3.2);
      ctx.lineTo(-11.5, 3.2);
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.8)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Landing skids hint
      ctx.beginPath();
      ctx.moveTo(4.5, -4.4);
      ctx.lineTo(-3.2, -4.4);
      ctx.moveTo(4.5, 4.4);
      ctx.lineTo(-3.2, 4.4);
      ctx.strokeStyle = 'rgba(160, 182, 210, 0.55)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Teardrop fuselage cabin
      ctx.beginPath();
      ctx.ellipse(2.2, 0, 6.2, 3.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 24, 34, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.82)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Spinning main rotor disc + 4 blades
      ctx.beginPath();
      ctx.arc(1.2, 0, 10.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.24)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      const rAng = t * 0.38;
      ctx.save();
      ctx.translate(1.2, 0);
      ctx.rotate(rAng);
      ctx.beginPath();
      ctx.moveTo(-10.2, 0);
      ctx.lineTo(10.2, 0);
      ctx.moveTo(0, -10.2);
      ctx.lineTo(0, 10.2);
      ctx.strokeStyle = 'rgba(238, 242, 248, 0.72)';
      ctx.lineWidth = 1.15;
      ctx.stroke();
      ctx.restore();

    } else if (craftId === 'drone') {
      // 4. Small Quadcopter Drone with 4 spinning micro-rotors
      const arms = [
        [5.8, -5.8],
        [5.8, 5.8],
        [-5.8, -5.8],
        [-5.8, 5.8]
      ];
      ctx.beginPath();
      arms.forEach(([ax, ay]) => {
        ctx.moveTo(0, 0);
        ctx.lineTo(ax, ay);
      });
      ctx.strokeStyle = 'rgba(160, 182, 210, 0.75)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // 4 spinning rotor discs
      arms.forEach(([ax, ay], idx) => {
        ctx.beginPath();
        ctx.arc(ax, ay, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(104, 182, 148, 0.14)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(104, 182, 148, 0.65)';
        ctx.lineWidth = 0.85;
        ctx.stroke();

        const bAng = t * 0.55 * (idx % 2 === 0 ? 1 : -1);
        ctx.beginPath();
        ctx.moveTo(ax - Math.cos(bAng) * 3.1, ay - Math.sin(bAng) * 3.1);
        ctx.lineTo(ax + Math.cos(bAng) * 3.1, ay + Math.sin(bAng) * 3.1);
        ctx.strokeStyle = 'rgba(238, 242, 248, 0.75)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });

      // Central avionics pod
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-3.4, -2.4, 6.8, 4.8, 2) : ctx.rect(-3.4, -2.4, 6.8, 4.8);
      ctx.fillStyle = 'rgba(15, 24, 34, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.85)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

    } else {
      // 5. Commercial Aircraft (ATR 72-600 / Twin-Engine Airliner planform)
      ctx.scale(1, 1 - Math.abs(bank) * 0.25);

      // Main wings + horizontal tailplane
      ctx.beginPath();
      // Main wing
      ctx.moveTo(3.2, 0);
      ctx.lineTo(-1.2, -12.2);
      ctx.lineTo(-3.4, -12.0);
      ctx.lineTo(-1.8, 0);
      ctx.lineTo(-3.4, 12.0);
      ctx.lineTo(-1.2, 12.2);
      ctx.closePath();
      // Tailplane
      ctx.moveTo(-7.2, 0);
      ctx.lineTo(-9.8, -4.6);
      ctx.lineTo(-11.0, -4.4);
      ctx.lineTo(-9.6, 0);
      ctx.lineTo(-11.0, 4.4);
      ctx.lineTo(-9.8, 4.6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 24, 34, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.78)';
      ctx.lineWidth = 1.05;
      ctx.stroke();

      // Twin wing-mounted engine nacelles
      ctx.beginPath();
      ctx.rect(-0.2, -6.2, 4.2, 1.6);
      ctx.rect(-0.2, 4.6, 4.2, 1.6);
      ctx.fillStyle = 'rgba(104, 182, 148, 0.5)';
      ctx.fill();

      // Fuselage tube
      ctx.beginPath();
      ctx.moveTo(11.5, 0);
      ctx.quadraticCurveTo(8.5, -2.0, 4.5, -2.0);
      ctx.lineTo(-7.5, -1.7);
      ctx.lineTo(-11.2, 0);
      ctx.lineTo(-7.5, 1.7);
      ctx.lineTo(4.5, 2.0);
      ctx.quadraticCurveTo(8.5, 2.0, 11.5, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 30, 44, 0.96)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(238, 242, 248, 0.85)';
      ctx.lineWidth = 1.05;
      ctx.stroke();
    }
  }

  let t = 0;
  function animate() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    pointer.vx *= 0.88;
    pointer.vy *= 0.88;
    const influenceRadius = 155;
    const currentCraft = CRAFT_TYPES[craftIdx];

    if (uavEnabled) {
      const hasPointer = pointer.x > -1000 && pointer.y > -1000;
      const targetX = hasPointer ? pointer.x : (W * 0.5 + Math.cos(t * 0.012) * (W * 0.28));
      const targetY = hasPointer ? pointer.y : (H * 0.42 + Math.sin(t * 0.024) * (H * 0.16));

      const toDx = targetX - drone.x;
      const toDy = targetY - drone.y;
      const toDist = Math.hypot(toDx, toDy);

      let desiredAngle = Math.atan2(toDy, toDx);
      if (toDist < 48) {
        desiredAngle += 1.15;
      }

      let angleDiff = desiredAngle - drone.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      drone.angle += angleDiff * currentCraft.turn;
      drone.bank = drone.bank * 0.85 + Math.max(-0.55, Math.min(0.55, angleDiff * 1.4)) * 0.15;

      const cruiseSpeed = Math.min(currentCraft.speed, Math.max(1.85, toDist * 0.032));
      drone.vx = Math.cos(drone.angle) * cruiseSpeed;
      drone.vy = Math.sin(drone.angle) * cruiseSpeed;
      drone.x += drone.vx;
      drone.y += drone.vy;

      const wingSpan = currentCraft.span * (1 - Math.abs(drone.bank) * 0.25);
      const perpX = -Math.sin(drone.angle);
      const perpY = Math.cos(drone.angle);
      const tailX = drone.x - Math.cos(drone.angle) * 6;
      const tailY = drone.y - Math.sin(drone.angle) * 6;

      drone.trail.push({
        x: tailX,
        y: tailY,
        lx: tailX + perpX * wingSpan,
        ly: tailY + perpY * wingSpan,
        rx: tailX - perpX * wingSpan,
        ry: tailY - perpY * wingSpan
      });
      if (drone.trail.length > 34) drone.trail.shift();
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nodes = line.nodes;
      let maxGlow = 0;

      for (let j = 0; j < nodes.length; j++) {
        const n = nodes[j];
        const wave = Math.sin(j * 0.22 + t * line.speed + line.phase) * 4.5;
        const targetY = n.baseY + wave;

        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist < influenceRadius) {
          const falloff = Math.pow(1 - dist / influenceRadius, 2);
          const pushDir = dy === 0 ? 1 : dy / dist;
          n.vy += (pushDir * 2.8 + pointer.vy * 0.16) * falloff;
          n.glow = Math.min(1, n.glow + falloff * 0.35);
        }

        if (uavEnabled) {
          const uDx = n.x - drone.x;
          const uDy = n.y - drone.y;
          const uDist = Math.hypot(uDx, uDy);
          if (uDist < 72) {
            const uFall = Math.pow(1 - uDist / 72, 2);
            const uDir = uDy === 0 ? 1 : uDy / uDist;
            n.vy += (uDir * 1.15 + drone.vy * 0.12) * uFall;
            n.glow = Math.min(1, n.glow + uFall * 0.28);
          }
        }

        const spring = (targetY - n.y) * 0.055;
        n.vy = (n.vy + spring) * 0.86;
        n.y += n.vy;
        n.glow *= 0.92;
        if (n.glow > maxGlow) maxGlow = n.glow;
      }

      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let j = 1; j < nodes.length - 1; j++) {
        const xc = (nodes[j].x + nodes[j + 1].x) * 0.5;
        const yc = (nodes[j].y + nodes[j + 1].y) * 0.5;
        ctx.quadraticCurveTo(nodes[j].x, nodes[j].y, xc, yc);
      }
      const last = nodes[nodes.length - 1];
      ctx.lineTo(last.x, last.y);

      const alpha = 0.065 + maxGlow * 0.28;
      ctx.strokeStyle = maxGlow > 0.05
        ? `rgba(104, 182, 148, ${alpha.toFixed(3)})`
        : `rgba(160, 182, 210, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1 + maxGlow * 0.9;
      ctx.stroke();
    }

    if (uavEnabled) {
      if (drone.trail.length > 2) {
        for (let k = 1; k < drone.trail.length; k++) {
          const p0 = drone.trail[k - 1];
          const p1 = drone.trail[k];
          const frac = k / drone.trail.length;
          ctx.strokeStyle = `rgba(104, 182, 148, ${(frac * 0.24).toFixed(3)})`;
          ctx.lineWidth = currentCraft.dualTrail ? 0.85 : 1.35;
          ctx.beginPath();
          if (currentCraft.dualTrail) {
            ctx.moveTo(p0.lx, p0.ly);
            ctx.lineTo(p1.lx, p1.ly);
            ctx.moveTo(p0.rx, p0.ry);
            ctx.lineTo(p1.rx, p1.ry);
          } else {
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
          }
          ctx.stroke();
        }
      }

      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.angle);
      drawAircraft(ctx, currentCraft.id, t, drone.bank);
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', buildLines);
  buildLines();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate();
  }

  /* ------------------------------------------------------------
     2. SUBTLE LIQUID-GLASS CURSOR SPECULAR TRACKING
     ------------------------------------------------------------ */
  document.querySelectorAll('.liquid-glass').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });
  });

  document.querySelectorAll('.liquid-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      btn.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ------------------------------------------------------------
     3. PROJECT FILTER PILLS & EXPERIENCE SWITCHER TABS
     ------------------------------------------------------------ */
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const group = pill.closest('.filter-bar');
      group.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.filter;
      document.querySelectorAll('[data-cat]').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });

  document.querySelectorAll('.exp-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.exp-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.exp-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById('exp-' + btn.dataset.exp);
      if (target) target.classList.add('active');
    });
  });

  /* ------------------------------------------------------------
     4. GLASS-TAP ACOUSTIC SOUND + HAPTICS + VISUAL RIPPLE
     ------------------------------------------------------------ */
  let audioCtx = null;
  function playGlassTap(isPrimary = false) {
    // Haptic vibration on mobile / supported hardware
    if (navigator.vibrate) {
      navigator.vibrate(isPrimary ? [8, 18, 6] : 6);
    }

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;

      // High crystalline ping (tempered glass resonance)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      const baseFreq = isPrimary ? 2650 : 2350;
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.58, now + 0.042);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.11, now + 0.002);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      // Subtle tactile body transient (finger impact on glass)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(620, now);
      osc2.frequency.exponentialRampToValueAtTime(190, now + 0.018);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.linearRampToValueAtTime(0.09, now + 0.0015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc1.connect(gain1).connect(audioCtx.destination);
      osc2.connect(gain2).connect(audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.048);
      osc2.start(now);
      osc2.stop(now + 0.022);
    } catch (_) {}
  }

  document.addEventListener('pointerdown', e => {
    const target = e.target.closest('.liquid-btn, .nav-tab, .filter-pill, .exp-tab-btn, .spec-pill-card, .gallery figure');
    if (!target) return;
    playGlassTap(target.classList.contains('primary'));
  });

  /* ------------------------------------------------------------
     5. GALLERY IMAGE LIGHTBOX
     ------------------------------------------------------------ */
  const figures = document.querySelectorAll('.gallery figure');
  if (figures.length > 0) {
    const modal = document.createElement('div');
    modal.className = 'lightbox-backdrop';
    modal.innerHTML = `
      <div class="lightbox-inner liquid-glass">
        <img src="" alt="">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(modal);
    const modalImg = modal.querySelector('img');
    const modalCap = modal.querySelector('.lightbox-caption');

    figures.forEach(fig => {
      fig.addEventListener('click', () => {
        const img = fig.querySelector('img');
        const cap = fig.querySelector('figcaption');
        if (!img) return;
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalCap.textContent = cap ? cap.textContent : img.alt;
        modal.classList.add('open');
      });
    });

    modal.addEventListener('click', () => modal.classList.remove('open'));
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') modal.classList.remove('open');
    });
  }
})();
