(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ---------- La carta marca con "ahora" lo que toca a esta hora ---------- */
  const ahora = new Date();
  const m = ahora.getHours() * 60 + ahora.getMinutes();
  const finde = [0, 6].includes(ahora.getDay());
  const toca = (m < 16 * 60 && !finde) ? 'manana' : (m < 18 * 60 ? 'tarde' : 'noche');
  document.querySelectorAll('.grupo').forEach((el) => el.classList.toggle('ahora', el.dataset.grupo === toca));

  /* ---------- Menú móvil ---------- */
  const btnMenu = document.querySelector('.nav-menu');
  const menu = document.getElementById('menu-movil');
  btnMenu.addEventListener('click', () => {
    const open = btnMenu.getAttribute('aria-expanded') === 'true';
    btnMenu.setAttribute('aria-expanded', String(!open));
    btnMenu.textContent = open ? 'Menú' : 'Cerrar';
    menu.hidden = open;
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { menu.hidden = true; btnMenu.setAttribute('aria-expanded', 'false'); btnMenu.textContent = 'Menú'; }
  });

  /* ---------- Cinta de clientes: se duplica para que el bucle no tenga cortes ---------- */
  const fila = document.querySelector('.cinta-fila');
  if (fila && !reduce) {
    [...fila.children].forEach((li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      fila.appendChild(c);
    });
  }

  /* ---------- Vídeo de noches especiales ---------- */
  const vid = document.querySelector('.especial-video video');
  const play = document.querySelector('.play');
  if (vid && play) {
    if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); play.textContent = 'Reproducir vídeo'; play.setAttribute('aria-pressed', 'true'); }
    play.addEventListener('click', () => {
      if (vid.paused) { vid.play(); play.textContent = 'Pausar vídeo'; play.setAttribute('aria-pressed', 'false'); }
      else { vid.pause(); play.textContent = 'Reproducir vídeo'; play.setAttribute('aria-pressed', 'true'); }
    });
  }

  /* ---------- Vídeos que solo se cargan al acercarse ---------- */
  const lazy = document.querySelectorAll('video.lazy-video');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.dataset.src; }
          if (!reduce) v.play().catch(() => {});
        } else if (v.src) { v.pause(); }
      });
    }, { rootMargin: '300px 0px' });
    lazy.forEach((v) => io.observe(v));
  } else { lazy.forEach((v) => { v.src = v.dataset.src; }); }

  /* ---------- Apariciones al hacer scroll (IntersectionObserver: nunca deja nada oculto) ---------- */
  const revealEls = [...document.querySelectorAll('[data-rise], [data-open], .filas')];
  document.querySelectorAll('section, header').forEach((sec) => {
    sec.querySelectorAll('[data-rise]').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 6) * 80 + 'ms'));
  });
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    document.documentElement.classList.add('reveal');
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => rio.observe(el));
    // Red de seguridad: lo que ya esté por encima del borde inferior de la pantalla se muestra siempre
    const sweep = () => revealEls.forEach((el) => {
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight) el.classList.add('in');
    });
    addEventListener('load', sweep);
    let sweepT = 0;
    addEventListener('scroll', () => { const now = Date.now(); if (now - sweepT > 120) { sweepT = now; sweep(); } }, { passive: true });
    setTimeout(sweep, 400);
  }

  /* ---------- Movimiento ---------- */
  if (!window.gsap || !window.ScrollTrigger) return; // sin librerías, la página queda completa y quieta
  
  gsap.registerPlugin(ScrollTrigger);

  if (reduce) { ScrollTrigger.refresh(); return; }

  const ease = 'expo.out';

  // Entrada del monumento: las letras suben desde el borde, una a una
  const mono = document.querySelector('.monument-inner');
  gsap.from(mono, { yPercent: 22, duration: 1.0, ease });

  // Firma: el nombre pesa — se encoge un poco y se hunde al salir de la primera pantalla
  gsap.to('.monument', {
    scale: .93, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-glow', {
    yPercent: 18, scale: 1.1, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Paralaje suave en la galería
  document.querySelectorAll('.pares figure').forEach((fig, i) => {
    gsap.to(fig, {
      yPercent: i % 2 ? -10 : -4, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Cita: cada línea se abre desde el centro hacia los márgenes
  document.querySelectorAll('.cita-l').forEach((l) => {
    gsap.fromTo(l, { gap: 0, letterSpacing: '-0.06em' }, {
      letterSpacing: '-0.02em', ease: 'none',
      scrollTrigger: { trigger: l, start: 'top bottom', end: 'top 45%', scrub: true }
    });
  });

  // Pie: el nombre crece de 0.94 a 1 mientras se descubre
  gsap.fromTo('.pie-word svg', { scale: .94, transformOrigin: '50% 100%' }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.donde', start: 'bottom bottom', end: 'bottom top', scrub: true }
  });

  // Botón magnético
  document.querySelectorAll('.btn, .redondo').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3.out' });
    const host = el.closest('a') || el;
    host.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * .25);
      yTo((e.clientY - (r.top + r.height / 2)) * .35);
    });
    host.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  // Noche de pólvora: las dos palabras se separan y el vídeo crece al cruzar la sección
  if (!window.matchMedia('(max-width: 900px)').matches) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.polvora', start: 'top 85%', end: 'center 45%', scrub: true } });
    tl.fromTo('.pw-l', { xPercent: 18 }, { xPercent: 0, ease: 'none' }, 0)
      .fromTo('.pw-r', { xPercent: -18 }, { xPercent: 0, ease: 'none' }, 0)
      .fromTo('.polvora-video', { scale: .82 }, { scale: 1, ease: 'none' }, 0);
  } else {
    gsap.fromTo('.polvora-video', { scale: .9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.polvora-video', start: 'top bottom', end: 'center center', scrub: true } });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
