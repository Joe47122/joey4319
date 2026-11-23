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

  const NUM_LINES = 16;
  const NUM_NODES = 34;
  let lines = [];

  // Authentic 1969 NASA Apollo 11 Human Mission Control Recording ("Houston, Tranquility Base here. The Eagle has landed.")
  // Plays strictly ONCE when the SpaceX rocket lands in the interface.
  let radioHtmlAudio = null;
  let rocketLandingAudioPlayed = false;
  try {
    rocketLandingAudioPlayed = sessionStorage.getItem('rocket_landing_audio_played') === 'true';
    radioHtmlAudio = new Audio('assets/touchdown-radio.mp3');
    radioHtmlAudio.preload = 'auto';
    radioHtmlAudio.volume = 0.55;
  } catch (_) {}

  function playTouchdownRadioCallout() {
    if (rocketLandingAudioPlayed) return; // strictly once per session in the whole interface
    rocketLandingAudioPlayed = true;
    try {
      sessionStorage.setItem('rocket_landing_audio_played', 'true');
    } catch (_) {}

    if (radioHtmlAudio) {
      try {
        radioHtmlAudio.currentTime = 0;
        const p = radioHtmlAudio.play();
        if (p && p.catch) {
          p.catch(() => {
            // If browser blocked autoplay before first click, allow one retry on next landing after click
            rocketLandingAudioPlayed = false;
            try { sessionStorage.removeItem('rocket_landing_audio_played'); } catch (_) {}
          });
        }
      } catch (_) {}
    }
  }

  const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, lastX: -9999, lastY: -9999, lastMoveTime: 0 };

  window.addEventListener('mousemove', e => {
    if (pointer.lastX !== -9999) {
      pointer.vx = (e.clientX - pointer.lastX);
      pointer.vy = (e.clientY - pointer.lastY);
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;
    pointer.lastMoveTime = performance.now();
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
    { id: 'uav',      label: 'UAV',            span: 9.5,  speed: 4.8, turn: 0.085, dualTrail: true },
    { id: 'rocket',   label: 'SpaceX Falcon',  span: 3.2,  speed: 5.4, turn: 0.08,  dualTrail: false },
    { id: 'heli',     label: 'Heli',           span: 7.0,  speed: 4.1, turn: 0.105, dualTrail: false },
    { id: 'drone',    label: 'Drone',          span: 7.5,  speed: 4.5, turn: 0.12,  dualTrail: true },
    { id: 'airliner', label: 'Airliner',       span: 11.8, speed: 4.3, turn: 0.068, dualTrail: true }
  ];

  let uavEnabled = true;
  let craftIdx = Math.floor(Math.random() * CRAFT_TYPES.length);
  try {
    uavEnabled = localStorage.getItem('uav_enabled') !== 'false';
    const lastIdx = parseInt(sessionStorage.getItem('last_craft_idx'), 10);
    if (!Number.isNaN(lastIdx) && CRAFT_TYPES.length > 1) {
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
    initialized: false,
    // SpaceX Super Heavy Mechazilla Launch Tower Chopstick Catch state (matching video 00:00-00:20)
    mode: 'cruise',       // 'cruise' | 'reentry' | 'chopstick_approach' | 'shutdown_flare' | 'caught'
    chopstickClose: 0,    // 0 (arms wide open) -> 1 (chopsticks closed under upper grid fins)
    gridFinDeploy: 0,     // 0 -> 1 (upper waffle grid fins + catch pins)
    thrustPower: 1,       // 1.35 (diagonal Raptor Mach-diamond jet) -> 0 (MECO)
    gimbalAngle: 0,       // Raptor thrust-vector gimbal angle during pendulum swing into tower
    flareProgress: 0,     // 0 -> 1 (00:16-00:18 golden-orange shutdown flame puff + white side vent)
    rcsPulse: 0,
    padX: 300,
    padY: 300,
    padAlpha: 0,
    touchdownPulse: 0
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
      // 2. SpaceX Starship Super Heavy Booster (Dark stainless/carbon silhouette, upper grid fins & catch pins, gimbaled Raptor Mach-diamond beam + 00:16-00:18 golden shutdown puff)
      const thrust = drone.thrustPower;
      const flare = drone.flareProgress;

      // A) High-velocity Raptor Mach-diamond landing beam (00:01 - 00:15 in video)
      if (thrust > 0.05 && drone.mode !== 'shutdown_flare' && drone.mode !== 'caught') {
        ctx.save();
        ctx.translate(-11.2, 0);
        ctx.rotate(drone.gimbalAngle || 0);

        const beamLen = (18.5 + Math.sin(t * 1.1) * 3.2) * thrust;
        // Outer rose-amber-emerald supersonic exhaust plume
        const plumeGrad = ctx.createLinearGradient(0, 0, -beamLen, 0);
        plumeGrad.addColorStop(0, 'rgba(255, 245, 220, 0.98)');
        plumeGrad.addColorStop(0.28, 'rgba(255, 165, 110, 0.92)');
        plumeGrad.addColorStop(0.65, 'rgba(235, 120, 145, 0.58)');
        plumeGrad.addColorStop(1, 'rgba(104, 182, 148, 0)');

        ctx.beginPath();
        ctx.moveTo(0, -1.6);
        ctx.lineTo(-beamLen, 0);
        ctx.lineTo(0, 1.6);
        ctx.closePath();
        ctx.fillStyle = plumeGrad;
        ctx.fill();

        // Razor-sharp white-hot Mach diamond core
        ctx.beginPath();
        ctx.moveTo(0, -0.85);
        ctx.lineTo(-beamLen * 0.62, 0);
        ctx.lineTo(0, 0.85);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.fill();
        ctx.restore();
      }

      // B) Flickering Golden-Orange Raptor Shutdown Flame Puff & White Cryo Side Vent (00:16 - 00:19 in video)
      if (drone.mode === 'shutdown_flare' || (drone.mode === 'caught' && flare > 0.02)) {
        const puffScale = Math.sin(flare * Math.PI);
        if (puffScale > 0.04) {
          ctx.save();
          ctx.translate(-11.4, 0);
          // Rolling golden-orange shutdown fireball below nozzle
          const r1 = 3.6 + puffScale * 5.2;
          const fireGrad = ctx.createRadialGradient(-r1 * 0.7, 0.6, 0.4, -r1 * 0.8, 0.6, r1 * 1.35);
          fireGrad.addColorStop(0, 'rgba(255, 245, 175, 0.96)');
          fireGrad.addColorStop(0.45, 'rgba(255, 148, 38, 0.88)');
          fireGrad.addColorStop(0.8, 'rgba(215, 68, 22, 0.5)');
          fireGrad.addColorStop(1, 'rgba(215, 68, 22, 0)');
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(-r1 * 0.65, Math.sin(t * 0.7) * 1.1, r1 * 1.2, 0, Math.PI * 2);
          ctx.arc(-r1 * 1.35, -0.8 + Math.cos(t * 0.8) * 1.1, r1 * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // White cryogenic methane/LOX side vent cloud on the left/lower side of the booster (00:14 - 00:20 in video)
        const ventA = Math.min(1, puffScale * 1.3 + 0.18);
        ctx.fillStyle = `rgba(225, 236, 248, ${(ventA * 0.55).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(-8.5, -4.4 - (1 - puffScale) * 2.5, 2.2, 3.8 + (1 - puffScale) * 2.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // C) Super Heavy Booster Cylindrical Body (-11.2 base to +9.2 upper dome, +12.4 nose tip)
      ctx.beginPath();
      ctx.moveTo(12.6, 0);
      ctx.quadraticCurveTo(10.8, -2.5, 7.6, -2.6);
      ctx.lineTo(-11.2, -2.5);
      ctx.lineTo(-11.2, 2.5);
      ctx.lineTo(7.6, 2.6);
      ctx.quadraticCurveTo(10.8, 2.5, 12.6, 0);
      ctx.closePath();
      ctx.fillStyle = '#141c27';
      ctx.fill();
      ctx.strokeStyle = 'rgba(205, 222, 242, 0.82)';
      ctx.lineWidth = 1.05;
      ctx.stroke();

      // Metallic stainless-steel specular highlight along the fuselage spine + hot-stage ring
      ctx.beginPath();
      ctx.moveTo(-10.8, -0.9);
      ctx.lineTo(8.5, -0.9);
      ctx.strokeStyle = 'rgba(238, 245, 255, 0.38)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Hot-staging ring collar near top (+6.2)
      ctx.beginPath();
      ctx.moveTo(6.2, -2.6);
      ctx.lineTo(6.2, 2.6);
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // D) 4 Deployed Waffle Grid Fins + Lifting Catch Pins below hot-stage ring (+4.6)
      const gf = 1.8 + drone.gridFinDeploy * 2.4;
      ctx.beginPath();
      ctx.rect(4.2, -2.6 - gf, 1.9, gf);
      ctx.rect(4.2, 2.6, 1.9, gf);
      ctx.fillStyle = '#0d131c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.92)';
      ctx.lineWidth = 0.95;
      ctx.stroke();

      // Cold-gas RCS thruster puffs at upper booster during initial flip
      if (drone.rcsPulse > 0.05) {
        ctx.beginPath();
        ctx.moveTo(8.6, -2.8);
        ctx.lineTo(9.6, -2.8 - 5.2 * drone.rcsPulse);
        ctx.strokeStyle = `rgba(225, 245, 255, ${(drone.rcsPulse * 0.72).toFixed(2)})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }

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

  function drawRocketHoldingPod(ctx, px, py, alpha, chopstickClose, touchdownPulse) {
    if (alpha <= 0.01) return;
    ctx.save();
    // Anchor at (px, py) where the booster hangs at x = px, y = py (with its upper grid fins caught at y = py - 5)
    ctx.translate(px, py);

    // Subtle telemetry confirmation pulse + 1990s Mission Control Radio HUD caption when Chopsticks lock onto the booster
    if (touchdownPulse > 0.01) {
      const r = 10 + (1 - touchdownPulse) * 28;
      ctx.beginPath();
      ctx.arc(0, -5, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(104, 182, 148, ${(touchdownPulse * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    if (chopstickClose > 0.9) {
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      ctx.fillStyle = `rgba(104, 182, 148, ${(alpha * 0.92).toFixed(3)})`;
      ctx.fillText('📻 "WE HAVE TOUCHDOWN"', 12, -4);
    }

    // Mechazilla Launch Integration Tower stands to the left of the catch center (x = -15 to -9, y = -20 to +28)
    const txL = -15.5;
    const txR = -9.5;
    const tyTop = -20;
    const tyBot = 28;

    // Ground launch pad base plinth under the tower
    ctx.beginPath();
    ctx.moveTo(-21, tyBot);
    ctx.lineTo(14, tyBot);
    ctx.strokeStyle = `rgba(104, 182, 148, ${(alpha * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Vertical lattice tower columns
    ctx.fillStyle = `rgba(12, 19, 28, ${(alpha * 0.88).toFixed(3)})`;
    ctx.fillRect(txL, tyTop, txR - txL, tyBot - tyTop);

    ctx.beginPath();
    ctx.rect(txL, tyTop, txR - txL, tyBot - tyTop);
    // Internal X-bracing truss latticework (8 bays up the tower)
    const bays = 7;
    const bayH = (tyBot - tyTop) / bays;
    for (let b = 0; b < bays; b++) {
      const y0 = tyTop + b * bayH;
      const y1 = y0 + bayH;
      ctx.moveTo(txL, y0);
      ctx.lineTo(txR, y1);
      ctx.moveTo(txR, y0);
      ctx.lineTo(txL, y1);
    }
    ctx.strokeStyle = `rgba(165, 190, 218, ${(alpha * 0.72).toFixed(3)})`;
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Top tower crown & lightning mast
    ctx.beginPath();
    ctx.moveTo(txL - 1, tyTop);
    ctx.lineTo(txR + 2.5, tyTop);
    ctx.moveTo((txL + txR) * 0.5, tyTop);
    ctx.lineTo((txL + txR) * 0.5, tyTop - 5.5);
    ctx.strokeStyle = `rgba(220, 234, 248, ${(alpha * 0.85).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Mechazilla Horizontal Chopstick Catch Arms extending right from upper tower (y = -5)
    const armY = -5.2;
    const armReachX = 7.2 - chopstickClose * 1.4;
    ctx.beginPath();
    // Upper diagonal suspension cable from tower top to chopstick tip
    ctx.moveTo(txR, tyTop + 2.5);
    ctx.lineTo(armReachX - 1.5, armY - 1.2);
    // Main horizontal chopstick catch beams (front & back rails)
    ctx.moveTo(txR - 1, armY - 1.3);
    ctx.lineTo(armReachX, armY - 0.6);
    ctx.moveTo(txR - 1, armY + 1.5);
    ctx.lineTo(armReachX, armY + 0.8);
    // Lower diagonal support strut under chopstick carriage
    ctx.moveTo(txR, armY + 6.5);
    ctx.lineTo(-2.5, armY + 1.2);
    ctx.strokeStyle = `rgba(104, 182, 148, ${(alpha * 0.95).toFixed(3)})`;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Glowing green catch-lock indicator beacon on the chopstick tip
    ctx.fillStyle = chopstickClose > 0.85
      ? `rgba(104, 182, 148, ${alpha.toFixed(3)})`
      : `rgba(255, 200, 110, ${(alpha * 0.9).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, armY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  let t = 0;
  function animate() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    pointer.vx *= 0.88;
    pointer.vy *= 0.88;
    const influenceRadius = 155;
    const currentCraft = CRAFT_TYPES[craftIdx];
    const idleMs = performance.now() - pointer.lastMoveTime;
    const isPointerIdle = pointer.x > -1000 && idleMs > 520;

    if (uavEnabled) {
      const hasPointer = pointer.x > -1000 && pointer.y > -1000;

      // Exact SpaceX Super Heavy Mechazilla Chopstick Tower Catch choreography (from uploaded video 00:00-00:20)
      if (currentCraft.id === 'rocket' && isPointerIdle) {
        if (drone.mode === 'cruise') {
          drone.mode = 'reentry';
          // Position the Mechazilla tower catch point near the stopped cursor
          drone.padX = Math.max(60, Math.min(W - 60, pointer.x));
          drone.padY = Math.max(95, Math.min(H - 55, pointer.y + 22));
          // Start booster up and to the right of the tower so it descends diagonally down-left into the chopsticks (00:01-00:08)
          drone.x = Math.min(W - 30, drone.padX + 54);
          drone.y = Math.max(30, drone.padY - 76);
          drone.angle = -Math.PI * 0.15; // sideways entry (00:00)
          drone.flareProgress = 0;
        }

        drone.padAlpha = Math.min(1, drone.padAlpha + 0.065);
        drone.gridFinDeploy = Math.min(1, drone.gridFinDeploy + 0.07);

        const vertAngle = -Math.PI / 2; // straight upright (↑)
        const diagTiltAngle = -Math.PI * 0.63; // ~23° tilted back (nose up-left, Raptor beam firing down-right as in 00:03-00:09)

        if (drone.mode === 'reentry') {
          // 00:00 - 00:06: Pitch from sideways drop into the 23° tilted diagonal vector-braking descent toward the tower top
          const approachX = drone.padX + 20;
          const approachY = drone.padY - 34;
          const dx = approachX - drone.x;
          const dy = approachY - drone.y;
          const dist = Math.hypot(dx, dy);

          drone.x += dx * 0.065;
          drone.y += dy * 0.065;

          let aDiff = diagTiltAngle - drone.angle;
          while (aDiff > Math.PI) aDiff -= Math.PI * 2;
          while (aDiff < -Math.PI) aDiff += Math.PI * 2;
          drone.angle += aDiff * 0.11;
          drone.gimbalAngle = -0.18; // Raptor gimbaled to push tail under
          drone.rcsPulse = Math.min(1, Math.abs(aDiff) * 1.4);
          drone.thrustPower = 1.35;  // long bright Mach-diamond Raptor beam
          drone.chopstickClose = 0;

          if (dist < 14) {
            drone.mode = 'chopstick_approach';
          }
        } else if (drone.mode === 'chopstick_approach') {
          // 00:07 - 00:15: Translate diagonally down-left into the open Chopstick arms while gimbaling upright to vertical (-PI/2)
          const dx = drone.padX - drone.x;
          const dy = drone.padY - drone.y;
          const dist = Math.hypot(dx, dy);

          drone.x += dx * 0.095;
          drone.y += dy * 0.095;

          // Swing lower booster like a pendulum from 23° diagonal tilt into dead vertical (-PI/2) as it enters the chopsticks
          const progress = Math.max(0, Math.min(1, 1 - dist / 38));
          const targetAng = diagTiltAngle + (vertAngle - diagTiltAngle) * progress;
          let aDiff = targetAng - drone.angle;
          while (aDiff > Math.PI) aDiff -= Math.PI * 2;
          while (aDiff < -Math.PI) aDiff += Math.PI * 2;
          drone.angle += aDiff * 0.18;

          // Visible Raptor gimbal steering right then centering
          drone.gimbalAngle = (1 - progress) * 0.26;
          drone.thrustPower = 1.25 - progress * 0.35;
          drone.rcsPulse = 0.2;
          drone.chopstickClose = Math.max(0, (progress - 0.35) / 0.65);

          if (dist < 1.4 && Math.abs(vertAngle - drone.angle) < 0.06) {
            drone.x = drone.padX;
            drone.y = drone.padY;
            drone.angle = vertAngle;
            drone.gimbalAngle = 0;
            drone.chopstickClose = 1;
            drone.touchdownPulse = 1;
            drone.flareProgress = 0.02;
            drone.mode = 'shutdown_flare';
            playTouchdownRadioCallout();
          }
        } else if (drone.mode === 'shutdown_flare') {
          // 00:16 - 00:18: Caught in chopsticks! Raptor beam collapses into flickering golden-orange shutdown flame puff + white side vent
          drone.x = drone.padX;
          drone.y = drone.padY;
          drone.angle = vertAngle;
          drone.chopstickClose = 1;
          drone.thrustPower = Math.max(0, drone.thrustPower - 0.08);
          drone.flareProgress = Math.min(1, drone.flareProgress + 0.024);
          drone.touchdownPulse = Math.max(0, drone.touchdownPulse - 0.03);
          if (drone.trail.length > 0) drone.trail.shift();

          if (drone.flareProgress >= 1) {
            drone.mode = 'caught';
          }
        } else if (drone.mode === 'caught') {
          // 00:19 - 00:20+: Hanging suspended vertically inside the Mechazilla Chopsticks well above the ground pad
          drone.x = drone.padX;
          drone.y = drone.padY;
          drone.angle = vertAngle;
          drone.thrustPower = 0;
          drone.chopstickClose = 1;
          drone.rcsPulse = 0;
          drone.flareProgress = Math.max(0, drone.flareProgress - 0.02);
          drone.touchdownPulse = Math.max(0, drone.touchdownPulse - 0.025);
          if (drone.trail.length > 0) drone.trail.shift();
        }

        // Record Raptor exhaust wake trail during approach
        if (drone.mode === 'reentry' || drone.mode === 'chopstick_approach') {
          const tailX = drone.x - Math.cos(drone.angle) * 11;
          const tailY = drone.y - Math.sin(drone.angle) * 11;
          drone.trail.push({ x: tailX, y: tailY, lx: tailX, ly: tailY, rx: tailX, ry: tailY });
          if (drone.trail.length > 22) drone.trail.shift();
        }
      } else {
        // Normal active flight chasing cursor across streamlines
        drone.mode = 'cruise';
        drone.chopstickClose = Math.max(0, drone.chopstickClose - 0.08);
        drone.gridFinDeploy = Math.max(0, drone.gridFinDeploy - 0.06);
        drone.thrustPower = 1;
        drone.gimbalAngle = 0;
        drone.flareProgress = 0;
        drone.rcsPulse = 0;
        drone.padAlpha = Math.max(0, drone.padAlpha - 0.07);
        drone.touchdownPulse = 0;

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

      if (currentCraft.id === 'rocket' && drone.padAlpha > 0.01) {
        drawRocketHoldingPod(ctx, drone.padX, drone.padY, drone.padAlpha, drone.chopstickClose, drone.touchdownPulse);
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
     4. SINGLE SUBTLE GLASS-TAP ACOUSTIC CLICK + HAPTICS
     ------------------------------------------------------------ */
  let audioCtx = null;
  let lastTapTime = 0;

  function triggerSingleSubtleTap(ac, isPrimary) {
    const now = ac.currentTime + 0.002;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    // Single soft, brief tempered-glass micro-tap (22ms duration, subtle volume, zero echo)
    osc.type = 'sine';
    const startFreq = isPrimary ? 1920 : 1720;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(1080, now + 0.022);

    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(0.052, now + 0.0018);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.023);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  }

  function playGlassTap(isPrimary = false, clientX = null, clientY = null) {
    const nowMs = performance.now();
    if (nowMs - lastTapTime < 350) return; // strict single-tap guard: never double-tap
    lastTapTime = nowMs;

    if (navigator.vibrate) {
      try { navigator.vibrate(5); } catch (_) {}
    }

    if (clientX !== null && clientY !== null) {
      const ripple = document.createElement('span');
      ripple.className = 'glass-tap-ripple';
      ripple.style.left = clientX + 'px';
      ripple.style.top = clientY + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 440);
    }

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          triggerSingleSubtleTap(audioCtx, isPrimary);
        }).catch(() => {});
      } else {
        triggerSingleSubtleTap(audioCtx, isPrimary);
      }
    } catch (_) {}
  }

  const TAP_SELECTOR = 'a, button, .liquid-btn, .nav-tab, .filter-pill, .exp-tab-btn, .spec-pill-card, .arc-card, .gallery figure';

  // Bind ONLY to pointerdown so a click can never fire two taps (on press + release)
  document.addEventListener('pointerdown', e => {
    const target = e.target.closest(TAP_SELECTOR);
    if (!target) return;
    playGlassTap(target.classList.contains('primary'), e.clientX, e.clientY);
  });

  /* ------------------------------------------------------------
     5. DYNAMIC 3D ROLLING HERO PANORAMA (Ultra-slow time-based drift)
     ------------------------------------------------------------ */
  const arcTrack = document.querySelector('.hero-arc-track');
  const arcCards = arcTrack ? Array.from(arcTrack.querySelectorAll('.arc-card')) : [];
  if (arcCards.length > 0) {
    let arcOffset = 0;
    let arcHoverIdx = -1;
    let isArcHovered = false;
    let lastArcTime = performance.now();

    arcTrack.addEventListener('mouseenter', () => { isArcHovered = true; });
    arcTrack.addEventListener('mouseleave', () => { isArcHovered = false; arcHoverIdx = -1; });

    arcCards.forEach((card, idx) => {
      card.addEventListener('mouseenter', () => { arcHoverIdx = idx; });
      card.addEventListener('mouseleave', () => { if (arcHoverIdx === idx) arcHoverIdx = -1; });
    });

    function animatePanorama() {
      // Exact approved calm panorama speed; pauses completely on hover
      const speed = isArcHovered ? 0 : 0.00026;
      arcOffset = (arcOffset + speed) % 1;

      const N = arcCards.length;
      const trackW = arcTrack.clientWidth || 1050;
      const spreadX = Math.min(620, trackW * 0.56);

      for (let i = 0; i < N; i++) {
        const card = arcCards[i];
        // Normalized position u in [-0.5, 0.5) wrapping continuously right-to-left
        let u = ((i / N) - arcOffset) % 1;
        if (u < -0.5) u += 1;
        if (u >= 0.5) u -= 1;

        // Angle along the concave panoramic screen (-1.22 rad to +1.22 rad)
        const theta = u * 2.44;
        const x = Math.sin(theta) * spreadX;
        // Concave cylindrical depth: middle recedes behind portrait shoulders (-140px), edges curve forward (-15px)
        const baseZ = -Math.cos(theta) * 140 + 15;
        const hoverBoostZ = (i === arcHoverIdx) ? 38 : 0;
        const hoverScale = (i === arcHoverIdx) ? 1.06 : 0.94;
        const z = baseZ + hoverBoostZ;
        const rotY = -theta * 30; // tilt inward toward viewer like a wraparound cockpit screen
        const y = Math.cos(theta) * 14 - 8;

        // Smooth fade at wrap-around seam (|u| near 0.5)
        const edgeDist = 0.5 - Math.abs(u);
        const alpha = Math.max(0, Math.min(1, edgeDist * 5.2));

        card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${hoverScale})`;
        card.style.opacity = (i === arcHoverIdx) ? '1' : (alpha * 0.92).toFixed(2);
        card.style.pointerEvents = alpha > 0.25 ? 'auto' : 'none';
      }

      requestAnimationFrame(animatePanorama);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(animatePanorama);
    }
  }

  /* ------------------------------------------------------------
     6. GALLERY IMAGE LIGHTBOX
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
