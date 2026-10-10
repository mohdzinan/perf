(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logo = document.querySelector('.brand-letters');
  if (logo && !reduced) {
    const label = logo.textContent;
    logo.textContent = '';
    [...label].forEach((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter === ' ' ? '\u00a0' : letter;
      span.className = 'logo-letter';
      span.style.animationDelay = `${1.25 + index * 0.075}s`;
      logo.append(span);
    });
  }
  const canvas = document.querySelector('.atmosphere');
  const banner = document.getElementById('consent-banner');
  const dialog = document.getElementById('preferences-dialog');
  const storageKey = 'oxfo-cookie-preferences-v1';
  let storageAvailable = true;
  let consent = null;
  try { consent = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { storageAvailable = false; }

  const showBanner = () => {
    if (!banner) return;
    banner.hidden = !!consent && storageAvailable;
    const warning = document.getElementById('consent-storage-warning');
    if (warning) warning.hidden = storageAvailable;
  };
  const persistConsent = (next) => {
    consent = { ...next, essential: true, savedAt: new Date().toISOString() };
    try { localStorage.setItem(storageKey, JSON.stringify(consent)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
    showBanner();
    const note = document.getElementById('storage-note');
    if (note) note.textContent = storageAvailable ? 'Your choice has been saved in this browser.' : 'Browser storage is unavailable; your choice was not saved and this notice may return.';
  };
  showBanner();
  document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
    const allow = button.dataset.consent === 'all';
    persistConsent({ analytics: allow, marketing: allow });
  }));
  const openPreferences = () => {
    const analytics = document.getElementById('analytics-choice');
    const marketing = document.getElementById('marketing-choice');
    analytics.checked = !!consent?.analytics;
    marketing.checked = !!consent?.marketing;
    const note = document.getElementById('storage-note');
    note.textContent = storageAvailable ? '' : 'Browser storage is unavailable. Changes cannot be remembered.';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  };
  document.querySelectorAll('[data-open-preferences]').forEach(button => button.addEventListener('click', openPreferences));
  if (location.hash === '#cookie-preferences') openPreferences();
  document.querySelectorAll('[data-close-preferences]').forEach(button => button.addEventListener('click', () => dialog.close ? dialog.close() : dialog.removeAttribute('open')));
  document.querySelector('[data-save-preferences]')?.addEventListener('click', () => {
    persistConsent({ analytics: document.getElementById('analytics-choice').checked, marketing: document.getElementById('marketing-choice').checked });
    dialog.close ? dialog.close() : dialog.removeAttribute('open');
  });
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  if (!canvas || reduced) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  let width = 0, height = 0, dpr = 1, frame = 0, pointer = { x: 0, y: 0 }, active = true;
  const small = window.matchMedia('(max-width: 700px)').matches;
  const dustCount = small ? 34 : 74;
  const dust = Array.from({ length: dustCount }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.25 + .25, a: Math.random() * .38 + .08, phase: Math.random() * 6.28, speed: Math.random() * .00009 + .000025 }));
  const mist = Array.from({ length: small ? 4 : 7 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 120 + 100, vx: (Math.random() - .5) * .00008, vy: -Math.random() * .00006 - .00002, a: Math.random() * .022 + .008 }));
  const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); width = innerWidth; height = innerHeight; canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const draw = (now) => {
    if (!active) return;
    ctx.clearRect(0, 0, width, height);
    const lx = width * .5 + pointer.x * 35, ly = height * .42 + pointer.y * 26;
    const light = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(width, height) * .62);
    light.addColorStop(0, 'rgba(190,151,83,0.055)'); light.addColorStop(.45, 'rgba(160,119,57,0.018)'); light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light; ctx.fillRect(0, 0, width, height);
    mist.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.y < -.15) p.y = 1.12; if (p.x < -.15) p.x = 1.15; if (p.x > 1.15) p.x = -.15; const g = ctx.createRadialGradient(p.x * width, p.y * height, 0, p.x * width, p.y * height, p.r); g.addColorStop(0, `rgba(177,151,108,${p.a})`); g.addColorStop(1, 'rgba(177,151,108,0)'); ctx.fillStyle = g; ctx.fillRect(p.x * width - p.r, p.y * height - p.r, p.r * 2, p.r * 2); });
    dust.forEach(p => { const y = (p.y * height - now * p.speed * height + height) % height; const x = p.x * width + Math.sin(now * .0002 + p.phase) * 12 + pointer.x * 8; ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(222,190,128,${p.a * (.65 + .35 * Math.sin(now * .001 + p.phase))})`; ctx.fill(); });
    frame = requestAnimationFrame(draw);
  };
  resize();
  frame = requestAnimationFrame(draw);
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); }, { passive: true });
  document.addEventListener('visibilitychange', () => { active = !document.hidden; if (active) frame = requestAnimationFrame(draw); else cancelAnimationFrame(frame); });
  const track = event => { const rect = canvas.getBoundingClientRect(); const point = event.touches?.[0] || event; pointer.x = (point.clientX / width - .5) * 2; pointer.y = (point.clientY / height - .5) * 2; };
  window.addEventListener('pointermove', track, { passive: true });
  let dragging = false;
  window.addEventListener('touchstart', event => { dragging = true; track(event); }, { passive: true });
  window.addEventListener('touchmove', event => { if (dragging) track(event); }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; }, { passive: true });
  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('pointermove', event => { if (event.pointerType === 'touch') return; const rect = button.getBoundingClientRect(); const dx = (event.clientX - rect.left - rect.width / 2) * .045; const dy = (event.clientY - rect.top - rect.height / 2) * .045; button.style.transform = `translate(${dx}px,${dy}px)`; });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
})();
