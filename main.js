(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ---------- El día de Texako: el control lleva la página de la mañana a la noche ---------- */
  const range = document.getElementById('hora');
  const outHora = document.querySelector('[data-hora]');
  const outPlan = document.querySelector('[data-plan]');
  const grupos = document.querySelectorAll('.grupo');
  const esFinde = [0, 6].includes(new Date().getDay());

  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  function fase(m) {
    if (m < 13 * 60) return 'manana';
    if (m < 18 * 60) return 'tarde';
    return 'noche';
  }
  function plan(m) {
    if (m < 13 * 60) return esFinde ? 'Los desayunos son de lunes a viernes; hoy, café en la barra.' : 'Café y tostada: es hora de desayunos.';
    if (m < 16 * 60) return esFinde ? 'Caña fría y vino en la terraza.' : 'Últimos desayunos o la primera caña.';
    if (m < 18 * 60) return 'Caña fría y vino, a la sombra de la terraza.';
    return 'Tarde de tardeo: DJ desde las 18:00, combinados y la terraza llena.';
  }
  function grupoActivo(m) {
    if (m < 16 * 60 && !esFinde) return 'manana';
    if (m < 18 * 60) return 'tarde';
    return 'noche';
  }
  function aplicar(m) {
    outHora.textContent = fmt(m);
    outPlan.textContent = plan(m);
    body.dataset.phase = fase(m);
    const g = grupoActivo(m);
    grupos.forEach((el) => el.classList.toggle('ahora', el.dataset.grupo === g));
    range.setAttribute('aria-valuetext', `${fmt(m)}. ${plan(m)}`);
  }
  // Arranca en la hora real (redondeada a 15 min), dentro del horario 9:00–21:30.
  const now = new Date();
  let mins = Math.round((now.getHours() * 60 + now.getMinutes()) / 15) * 15;
  mins = Math.min(Math.max(mins, 540), 1290);
  range.value = mins;
  aplicar(mins);
  range.addEventListener('input', () => aplicar(+range.value));

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

  /* ---------- Movimiento ---------- */
  if (!window.gsap || !window.ScrollTrigger) return; // sin librerías, la página queda completa y quieta
  document.documentElement.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);

  if (reduce) { ScrollTrigger.refresh(); return; }

  const ease = 'expo.out';

  // Entrada del monumento: las letras suben desde el borde, una a una
  const mono = document.querySelector('.monument-inner');
  const isPhone = window.matchMedia('(max-width: 700px)').matches;
  gsap.from(mono, { yPercent: isPhone ? 0 : 22, xPercent: isPhone ? -12 : 0, duration: 1.0, ease });

  // Firma: el nombre pesa — se encoge un poco y se hunde al salir de la primera pantalla
  gsap.to('.monument', {
    scale: .93, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-glow', {
    yPercent: 18, scale: 1.1, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Hero: frase, botón y control entran escalonados
  gsap.to('.hero [data-rise]', { opacity: 1, y: 0, duration: .9, ease, stagger: .09, delay: .1 });

  // Entradas por sección: título, luego texto, luego imagen
  document.querySelectorAll('main section').forEach((sec) => {
    const rises = sec.querySelectorAll('[data-rise]');
    if (rises.length) {
      gsap.to(rises, {
        opacity: 1, y: 0, duration: .9, ease, stagger: .08,
        scrollTrigger: { trigger: sec, start: 'top 82%', once: true }
      });
    }
  });

  // Fotos: se abren con una cortina desde abajo y se asientan con una escala lenta
  document.querySelectorAll('[data-open]').forEach((fig) => {
    const img = fig.querySelector('img');
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 88%', once: true } })
      .to(img, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'power4.inOut' })
      .from(img, { scale: 1.18, duration: 1.8, ease: 'power3.out' }, 0);
  });

  // Paralaje suave en la galería
  document.querySelectorAll('.pares figure').forEach((fig, i) => {
    gsap.to(fig, {
      yPercent: i % 2 ? -10 : -4, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Carta: las filas llegan una a una
  document.querySelectorAll('.grupo').forEach((g) => {
    gsap.from(g.querySelectorAll('li, h3'), {
      opacity: 0, y: 18, duration: .7, ease, stagger: .06,
      scrollTrigger: { trigger: g, start: 'top 85%', once: true }
    });
  });

  // Cita: cada línea se abre desde el centro hacia los márgenes
  document.querySelectorAll('.cita-l').forEach((l) => {
    gsap.fromTo(l, { gap: 0, letterSpacing: '-0.06em' }, {
      letterSpacing: '-0.02em', ease: 'none',
      scrollTrigger: { trigger: l, start: 'top bottom', end: 'top 45%', scrub: true }
    });
  });

  // Dónde: cada fila sube dentro de su banda
  gsap.to('.fila > *', {
    y: 0, yPercent: 0, opacity: 1, duration: .9, ease, stagger: .1,
    scrollTrigger: { trigger: '.filas', start: 'top 80%', once: true }
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

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
