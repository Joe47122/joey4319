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

  // Tiny autonomous tailless flying-wing UAV chasing the cursor across the streamlines
  let uavEnabled = true;
  try {
    uavEnabled = localStorage.getItem('uav_enabled') !== 'false';
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

  // Inject compact liquid-glass UAV ON/OFF cockpit toggle into the top nav bar
  const topNav = document.querySelector('nav.top-pill');
  if (topNav) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'liquid-btn sm uav-toggle-btn';
    toggleBtn.setAttribute('aria-pressed', String(uavEnabled));
    toggleBtn.title = 'Turn the cursor-chasing flying-wing UAV on or off';
    const renderToggleLabel = () => {
      toggleBtn.setAttribute('aria-pressed', String(uavEnabled));
      toggleBtn.innerHTML = `<span class="uav-led"></span><span>UAV: ${uavEnabled ? 'ON' : 'OFF'}</span>`;
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

    const ctaBtn = topNav.querySelector('.liquid-btn.primary');
    if (ctaBtn) {
      const rightGroup = document.createElement('div');
      rightGroup.style.display = 'flex';
      rightGroup.style.alignItems = 'center';
      rightGroup.style.gap = '8px';
      topNav.insertBefore(rightGroup, ctaBtn);
      rightGroup.appendChild(toggleBtn);
      rightGroup.appendChild(ctaBtn);
    } else {
      topNav.appendChild(toggleBtn);
    }
  }

  let t = 0;
  function animate() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    pointer.vx *= 0.88;
    pointer.vy *= 0.88;
    const influenceRadius = 155;

    if (uavEnabled) {
      // Update autonomous UAV chasing the cursor (or patrolling in a smooth figure-8 if cursor is idle/off-screen)
      const hasPointer = pointer.x > -1000 && pointer.y > -1000;
      const targetX = hasPointer ? pointer.x : (W * 0.5 + Math.cos(t * 0.012) * (W * 0.28));
      const targetY = hasPointer ? pointer.y : (H * 0.42 + Math.sin(t * 0.024) * (H * 0.16));

      const toDx = targetX - drone.x;
      const toDy = targetY - drone.y;
      const toDist = Math.hypot(toDx, toDy);

      let desiredAngle = Math.atan2(toDy, toDx);
      if (toDist < 48) {
        desiredAngle += 1.15; // banking orbit around stationary pointer
      }

      let angleDiff = desiredAngle - drone.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      drone.angle += angleDiff * 0.085;
      drone.bank = drone.bank * 0.85 + Math.max(-0.55, Math.min(0.55, angleDiff * 1.4)) * 0.15;

      const cruiseSpeed = Math.min(4.8, Math.max(1.85, toDist * 0.032));
      drone.vx = Math.cos(drone.angle) * cruiseSpeed;
      drone.vy = Math.sin(drone.angle) * cruiseSpeed;
      drone.x += drone.vx;
      drone.y += drone.vy;

      // Record wingtip contrail ribbon
      const wingSpan = 9.5 * (1 - Math.abs(drone.bank) * 0.28);
      const perpX = -Math.sin(drone.angle);
      const perpY = Math.cos(drone.angle);
      const tailX = drone.x - Math.cos(drone.angle) * 5;
      const tailY = drone.y - Math.sin(drone.angle) * 5;

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

        // 1) Cursor pushes streamlines
        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist < influenceRadius) {
          const falloff = Math.pow(1 - dist / influenceRadius, 2);
          const pushDir = dy === 0 ? 1 : dy / dist;
          n.vy += (pushDir * 2.8 + pointer.vy * 0.16) * falloff;
          n.glow = Math.min(1, n.glow + falloff * 0.35);
        }

        // 2) Tiny UAV wake also ripples the streamlines as it crosses them (only when enabled)
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
      // Draw subtle dual wingtip vortex trails behind the chasing UAV
      if (drone.trail.length > 2) {
        for (let k = 1; k < drone.trail.length; k++) {
          const p0 = drone.trail[k - 1];
          const p1 = drone.trail[k];
          const frac = k / drone.trail.length;
          ctx.strokeStyle = `rgba(104, 182, 148, ${(frac * 0.22).toFixed(3)})`;
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.moveTo(p0.lx, p0.ly);
          ctx.lineTo(p1.lx, p1.ly);
          ctx.moveTo(p0.rx, p0.ry);
          ctx.lineTo(p1.rx, p1.ry);
          ctx.stroke();
        }
      }

      // Draw the tiny tailless swept flying-wing UAV chasing the pointer
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.angle);
      ctx.scale(1, 1 - Math.abs(drone.bank) * 0.28);

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

      ctx.fillStyle = 'rgba(15, 24, 34, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(104, 182, 148, 0.72)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5.2, 0);
      ctx.lineTo(-2.5, 0);
      ctx.strokeStyle = 'rgba(238, 242, 248, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
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
