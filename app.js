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
  }

  let t = 0;
  function animate() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    pointer.vx *= 0.88;
    pointer.vy *= 0.88;
    const influenceRadius = 155;

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
