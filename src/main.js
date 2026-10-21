import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './style.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Partikel-Ei (nur Startseite, lazy geladen) ---------- */
let egg = null;
const eggCanvas = $('#eggCanvas');
if (eggCanvas) {
  import('./egg.js')
    .then(({ createEgg }) => {
      egg = createEgg(eggCanvas, { reduceMotion });
      if (!egg) document.documentElement.classList.add('no-webgl');
    })
    .catch(() => document.documentElement.classList.add('no-webgl'));
}

/* ---------- Ladebildschirm ---------- */
const loader = $('#loader');
const loaderNum = $('#loaderNum');
let loaderDone = false;

function finishLoader() {
  if (loaderDone) return;
  loaderDone = true;
  if (loaderNum) loaderNum.textContent = '100';
  if (loader) loader.classList.add('is-out');
  document.body.classList.remove('is-loading');
  setTimeout(() => { if (loader) loader.remove(); ScrollTrigger.refresh(); }, 1050);
  playIntro();
}

if (!loader || reduceMotion) {
  if (loader) loader.remove();
  document.body.classList.remove('is-loading');
  loaderDone = true;
} else {
  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(100, pct + 2 + Math.floor(Math.random() * 5));
    loaderNum.textContent = String(pct).padStart(3, '0');
    if (pct >= 100) { clearInterval(tick); setTimeout(finishLoader, 150); }
  }, 35);
  $('#loaderSkip')?.addEventListener('click', () => { clearInterval(tick); finishLoader(); });
  // Sicherheitsnetz, falls etwas hängt
  setTimeout(() => { clearInterval(tick); finishLoader(); }, 4000);
}

/* ---------- Hero-Einstieg ---------- */
function playIntro() {
  const letters = $$('.hero__title .ltr');
  if (!letters.length) return;
  gsap.from(letters, { yPercent: 120, rotate: 12, scale: .8, duration: .9, ease: 'back.out(1.7)', stagger: .05, delay: .35 });
  gsap.from('[data-hero-fade]', { opacity: 0, y: 20, duration: .8, delay: 1 });
}

/* ---------- Cursor ---------- */
const cursor = $('#cursor');
if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
  gsap.set(cursor, { x: -200, y: -200 });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); egg?.setPointer(e.clientX, e.clientY); }, { passive: true });
  $$('a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-big'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
  });
} else if (cursor) {
  cursor.remove();
}

/* ---------- Scroll-Animationen ---------- */
if (!reduceMotion) {
  // Hero: Titel kippt und schrumpft, Ei explodiert
  const hero = $('.hero');
  if (hero) {
    gsap.to('#heroTitle', {
      scale: .7, rotate: -6, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (self) => egg?.setExplode(self.progress),
    });
  }

  // Statement: wächst, Hintergrund springt auf Gelb
  const statement = $('#statement');
  if (statement) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: statement, start: 'top top', end: '+=120%', scrub: true, pin: true },
    });
    tl.fromTo('#statementText', { scale: .25, rotate: -8 }, { scale: 1, rotate: 0, ease: 'none', duration: .7 }, 0)
      .to('.statement__inner', { backgroundColor: '#FFD60A', color: '#0A0A0A', ease: 'none', duration: .2 }, .45);
  }

  // Leistungen: Titel kippen herein, vorheriges Panel tritt zurück
  const panels = $$('.panel');
  panels.forEach((panel, i) => {
    gsap.from(panel.querySelector('.panel__title'), {
      yPercent: 30, rotate: -7, ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top top', scrub: true },
    });
    const next = panels.at(i + 1);
    if (next) {
      gsap.to(panel, {
        scale: .9, rotate: -2, filter: 'brightness(.6)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
      });
    }
  });

  // Riesenwörter gegenläufig
  $$('[data-drift]').forEach((el) => {
    const dir = Number(el.dataset.drift);
    gsap.fromTo(el, { xPercent: dir < 0 ? 15 : -40 }, {
      xPercent: dir < 0 ? -40 : 15, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Schräg hereinkippende Elemente
  $$('[data-skew]').forEach((el) => {
    gsap.from(el, {
      skewY: 10, y: 140, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // Preiskarten klappen in 3D herein
  const cards = $$('[data-flip]');
  if (cards.length) {
    gsap.from(cards, {
      rotateY: -80, y: 80, opacity: 0, duration: 1, ease: 'back.out(1.4)', stagger: .12,
      scrollTrigger: { trigger: '.cards', start: 'top 80%' },
    });
  }

  // Foto öffnet sich kreisförmig
  const frame = $('#aboutFrame');
  if (frame) {
    gsap.fromTo(frame, { clipPath: 'circle(0% at 50% 50%)' }, {
      clipPath: 'circle(80% at 50% 50%)', ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top 90%', end: 'center 55%', scrub: true },
    });
  }

  // Funkenstern beim Kontakt
  const burst = $('#contactBurst');
  if (burst) {
    const sparks = Array.from({ length: 20 }, (_, i) => {
      const s = document.createElement('span');
      s.className = 'spark';
      s.dataset.angle = String(i * 18);
      s.dataset.dist = String(90 + ((i * 29) % 70));
      burst.appendChild(s);
      return s;
    });
    const fire = () => {
      sparks.forEach((s) => {
        const a = Number(s.dataset.angle), d = Number(s.dataset.dist);
        gsap.fromTo(s, { rotate: a, y: 0, scaleY: 0, opacity: 1, transformOrigin: '50% 100%' }, {
          y: -d * 1.8, scaleY: .3, opacity: 0, duration: 1.1, ease: 'expo.out',
        });
      });
    };
    ScrollTrigger.create({ trigger: burst, start: 'top 75%', onEnter: fire, onEnterBack: fire });
  }
}

/* ---------- Kontaktformular ---------- */
const form = $('#contactForm');
const statusEl = $('#formStatus');
if (form) {
  form.addEventListener('submit', async (e) => {
    if (form.action.includes('[FORMSPREE-ID]')) {
      // Noch kein Formular-Dienst verbunden: auf E-Mail ausweichen
      e.preventDefault();
      const data = new FormData(form);
      const body = `Name: ${data.get('name')}\nE-Mail: ${data.get('email')}\nLeistung: ${data.get('leistung')}\n\n${data.get('nachricht')}`;
      window.location.href = `mailto:max@exovoagency.at?subject=${encodeURIComponent('Projektanfrage')}&body=${encodeURIComponent(body)}`;
      return;
    }
    e.preventDefault();
    statusEl.textContent = 'Wird gesendet …';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      statusEl.textContent = 'Danke! Ich melde mich in Kürze.';
    } catch {
      statusEl.textContent = 'Das hat leider nicht geklappt. Bitte schreib direkt an max@exovoagency.at.';
    }
  });
}
