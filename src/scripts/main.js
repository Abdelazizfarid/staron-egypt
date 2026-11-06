import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);
window.__revealOK = true;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- smooth scroll (Lenis synced to ScrollTrigger) ---------- */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, anchors: { offset: -100 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- header ---------- */
const hdr = $('[data-hdr]');
const onScroll = () => hdr.classList.toggle('is-scrolled', scrollY > 60);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- mega menus ---------- */
const megaBtns = $$('[data-mega]');
let closeT;
const openMega = (name) => {
  clearTimeout(closeT);
  megaBtns.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.mega === name)));
  $$('.mega').forEach((p) => p.classList.toggle('open', p.dataset.panel === name));
  hdr.classList.toggle('is-open', !!name);
};
const closeMega = () => openMega(null);
megaBtns.forEach((b) => {
  b.addEventListener('click', () => (b.getAttribute('aria-expanded') === 'true' ? closeMega() : openMega(b.dataset.mega)));
  b.addEventListener('mouseenter', () => openMega(b.dataset.mega));
});
const mainbar = $('.mainbar');
mainbar?.addEventListener('mouseleave', () => (closeT = setTimeout(closeMega, 180)));
mainbar?.addEventListener('mouseenter', () => clearTimeout(closeT));
$$('.nav > li > a, .logo, .ctas a').forEach((a) => a.addEventListener('mouseenter', closeMega));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = megaBtns.find((b) => b.getAttribute('aria-expanded') === 'true');
  closeMega();
  open?.focus();
  closeDrawer();
});
document.addEventListener('click', (e) => { if (!e.target.closest('.mainbar')) closeMega(); });

const activate = (list, li) => { $$(':scope > li', list).forEach((x) => x.classList.toggle('on', x === li)); };
$$('.mega').forEach((panel) => {
  const col1 = $('[data-col1]', panel);
  const pick1 = (li) => {
    activate(col1, li);
    const key = li.dataset.key;
    $$('[data-pane]', panel).forEach((p) => p.classList.toggle('on', p.dataset.pane === key));
    const col2 = $(`[data-pane="${key}"] [data-col2]`, panel);
    if (col2) pick2(col2, $('li', col2));
  };
  const pick2 = (col2, li) => {
    activate(col2, li);
    $$('[data-pane3]', panel).forEach((p) => p.classList.toggle('on', p.dataset.pane3 === li.dataset.key));
  };
  $$(':scope > li', col1).forEach((li) => {
    li.addEventListener('mouseenter', () => pick1(li));
    li.addEventListener('focusin', () => pick1(li));
  });
  $$('[data-col2]', panel).forEach((col2) =>
    $$(':scope > li', col2).forEach((li) => {
      li.addEventListener('mouseenter', () => pick2(col2, li));
      li.addEventListener('focusin', () => pick2(col2, li));
    })
  );
});

// small sliders in column 3
$$('[data-mslider]').forEach((s) => {
  const slides = $$('.mslide', s);
  const dots = $$('.mdots > button', s);
  let i = 0;
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((x, j) => x.classList.toggle('on', j === i));
    dots.forEach((x, j) => x.classList.toggle('on', j === i));
  };
  dots.forEach((d, j) => d.addEventListener('click', () => go(j)));
  $('[data-prev]', s)?.addEventListener('click', () => go(i - 1));
  $('[data-next]', s)?.addEventListener('click', () => go(i + 1));
  s._next = () => go(i + 1);
  s.addEventListener('mouseenter', () => (s._hold = true));
  s.addEventListener('mouseleave', () => (s._hold = false));
});
if (!reduce) setInterval(() => {
  $$('.mega.open [data-mslider].on, .mega.open [data-mslider][data-pane3].on').forEach((s) => !s._hold && s._next?.());
}, 3800);

/* ---------- mobile drawer ---------- */
const drawer = $('[data-drawer]');
const burger = $('[data-burger]');
function closeDrawer() {
  if (!drawer?.classList.contains('open')) return;
  drawer.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  lenis?.start();
  burger.focus();
}
burger?.addEventListener('click', () => {
  drawer.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  lenis?.stop();
  $('[data-close]', drawer).focus();
});
$('[data-close]', drawer)?.addEventListener('click', closeDrawer);

/* ---------- site search ---------- */
const index = JSON.parse($('#search-index')?.textContent || '[]');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const search = (q) => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index
    .map((it) => {
      const t = it.t.toLowerCase(), all = `${t} ${it.k} ${it.x}`.toLowerCase();
      if (!words.every((w) => all.includes(w))) return null;
      return { it, score: words.reduce((s, w) => s + (t.includes(w) ? 2 : 0) + (t.startsWith(w) ? 2 : 0), 0) };
    })
    .filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8).map((r) => r.it);
};
$$('[data-search]').forEach((box) => {
  const input = $('input', box), out = $('.results', box);
  let sel = -1;
  const render = () => {
    const q = input.value.trim();
    const res = search(q);
    sel = -1;
    out.innerHTML = q
      ? res.length
        ? res.map((r, i) => `<a href="${r.u}" role="option" id="${out.id}-${i}"><b>${esc(r.t)}</b><i>${r.k}</i></a>`).join('')
        : `<p>No match for “${esc(q)}”. Try a material, brand or space.</p>`
      : '';
    out.classList.toggle('open', !!q);
    input.setAttribute('aria-expanded', String(!!q));
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', (e) => {
    const links = $$('a', out);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('on', i === sel));
      input.setAttribute('aria-activedescendant', links[sel]?.id || '');
    } else if (e.key === 'Enter' && links.length) {
      e.preventDefault();
      location.href = (links[sel] || links[0]).href;
    }
  });
  input.addEventListener('blur', () => setTimeout(() => { out.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); }, 160));
});

/* ---------- headings split into words (Lume-style blur rise) ---------- */
const splitWords = (el) => {
  if (el.dataset.done) return $$('.w', el);
  el.dataset.done = 1;
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${esc(w)}</span>`).join(' ');
  return $$('.w', el);
};
const wordsIn = (el, delay = 0) =>
  gsap.fromTo(splitWords(el), { opacity: 0, y: '0.35em', filter: 'blur(10px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', stagger: 0.06, delay });

if (!reduce) {
  $$('[data-split]').forEach((el) => {
    gsap.set(el, { opacity: 1 });
    if (el.closest('[data-hero]')) return; // hero handles its own
    if (el.dataset.split === 'now') wordsIn(el, 0.25);
    else ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => wordsIn(el) });
  });

  /* section parts: heading, then text, then picture */
  $$('[data-reveal]').forEach((el) => {
    gsap.fromTo(el.children, { opacity: 0, y: 28, filter: 'blur(10px)' }, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  $$('[data-reveal-self]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 40, scale: 0.98 }, {
      opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* slow drift on large pictures */
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  /* page hero image settles as you scroll away */
  $$('[data-hero-img]').forEach((img) => {
    gsap.to(img, { scale: 1.08, yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
  });
}

/* ---------- home hero slider: slow crossfade, 8 slides ---------- */
const hero = $('[data-hero]');
if (hero) {
  const slides = $$('.slide', hero), tabs = $$('.hero__nav button', hero), count = $('.hero__count', hero);
  const DUR = 6500;
  let i = 0, t;
  hero.style.setProperty('--dur', `${DUR}ms`);
  const go = (n, user) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, j) => { s.classList.toggle('on', j === i); s.setAttribute('aria-hidden', String(j !== i)); s.inert = j !== i; });
    tabs.forEach((b, j) => {
      b.classList.remove('on'); void b.offsetWidth; b.classList.toggle('on', j === i);
      b.setAttribute('aria-selected', String(j === i));
    });
    if (count) count.textContent = `${i + 1} / ${slides.length}`;
    if (!reduce) {
      const s = slides[i];
      wordsIn($('[data-split]', s), 0.35);
      gsap.fromTo($('.slide__aside', s), { opacity: 0, y: 20, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, delay: 0.7, ease: 'power3.out' });
    }
    clearTimeout(t);
    if (!reduce && !hero.classList.contains('paused')) t = setTimeout(() => go(i + 1), DUR);
  };
  tabs.forEach((b, j) => b.addEventListener('click', () => go(j, true)));
  document.addEventListener('visibilitychange', () => {
    hero.classList.toggle('paused', document.hidden);
    if (document.hidden) clearTimeout(t); else go(i);
  });
  if (reduce) hero.classList.add('paused');
  go(0);
}

/* ---------- scope list with sticky crossfading photograph ---------- */
$$('[data-scope]').forEach((root) => {
  const items = $$('.scope__item', root), pics = $$('.scope__media img', root);
  const set = (n) => { items.forEach((x, j) => x.classList.toggle('on', j === n)); pics.forEach((x, j) => x.classList.toggle('on', j === n)); };
  items.forEach((it, n) => {
    ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 60%', onToggle: (s) => s.isActive && set(n) });
    it.addEventListener('mouseenter', () => set(n));
    it.addEventListener('focusin', () => set(n));
  });
});

/* ---------- material highlights: cards crossing a held photograph ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
  $$('[data-htrack]').forEach((root) => {
    const stage = $('.mats__stage', root), track = $('.mats__track', root);
    const view = $('.mats__view', root);
    const dist = () => track.scrollWidth - view.clientWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
    gsap.fromTo($('.mats__bg img', root), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top top', scrub: true } });
  });
});

/* ---------- testimonials ---------- */
$$('[data-quotes]').forEach((root) => {
  const slides = $$('.qslide', root), count = $('[data-qcount]', root);
  let i = 0, t;
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, j) => { s.classList.toggle('on', j === i); s.setAttribute('aria-hidden', String(j !== i)); });
    if (count) count.textContent = `${i + 1} / ${slides.length}`;
    clearTimeout(t);
    if (!reduce) t = setTimeout(() => go(i + 1), 8000);
  };
  $('[data-prev]', root).addEventListener('click', () => go(i - 1));
  $('[data-next]', root).addEventListener('click', () => go(i + 1));
  go(0);
});

/* ---------- numbers count up ---------- */
$$('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count);
  const fmt = (v) => Math.round(v).toLocaleString('en-US');
  if (reduce) return;
  const o = { v: 0 };
  el.textContent = fmt(0);
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => (el.textContent = fmt(o.v)) }),
  });
});

/* ---------- blog: search, filter, sort ---------- */
const blog = $('[data-blog]');
if (blog) {
  const q = $('#bq'), tag = $('#btag'), sort = $('#bsort'), list = $('.blist'), empty = $('.empty');
  const cards = $$('.pcard', list);
  const params = new URLSearchParams(location.search);
  if (params.get('q')) q.value = params.get('q');
  if (params.get('tag')) tag.value = params.get('tag');
  const apply = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((c) => {
      const ok = words.every((w) => c.dataset.text.includes(w)) && (!tag.value || c.dataset.tags.split(' ').includes(tag.value));
      c.hidden = !ok; shown += ok;
    });
    const key = sort.value;
    cards.sort((a, b) => key === 'az' ? a.dataset.title.localeCompare(b.dataset.title) : key === 'old' ? a.dataset.date.localeCompare(b.dataset.date) : b.dataset.date.localeCompare(a.dataset.date))
      .forEach((c) => list.appendChild(c));
    empty.style.display = shown ? 'none' : 'block';
    $('[data-bcount]').textContent = `${shown} ${shown === 1 ? 'article' : 'articles'}`;
    ScrollTrigger.refresh();
  };
  [q, tag, sort].forEach((x) => x.addEventListener('input', apply));
  apply();
}

/* ---------- contact: maps, form, newsletter ---------- */
const maps = $('[data-maps]');
if (maps) {
  const tabs = $$('[role="tab"]', maps), frame = $('iframe', maps);
  const sel = (b) => {
    tabs.forEach((x) => { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
    frame.src = b.dataset.src; frame.title = `Map: ${b.dataset.name}`;
  };
  tabs.forEach((b, n) => {
    b.addEventListener('click', () => sel(b));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); const nb = tabs[(n + d + tabs.length) % tabs.length]; nb.focus(); sel(nb); }
    });
  });
}

const form = $('[data-contact]');
if (form) {
  const type = $('#f-type', form), appt = $$('[data-appt]', form), msg = $('.form-msg', form);
  const p = new URLSearchParams(location.search).get('type');
  if (p && [...type.options].some((o) => o.value === p)) type.value = p;
  const sync = () => appt.forEach((el) => { el.hidden = type.value !== 'appointment'; $$('input', el).forEach((i) => (i.required = type.value === 'appointment')); });
  type.addEventListener('change', sync); sync();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(form));
    const label = type.options[type.selectedIndex].text;
    const body = Object.entries(d).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
    // ponytail: no backend on static hosting; opens the visitor's mail client. Wire to the CMS/API endpoint before launch.
    location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(`${label} – ${d.company || d.name}`)}&body=${encodeURIComponent(body)}`;
    msg.textContent = 'Your email app has opened with the request filled in. Send it and we will reply within one working day.';
  });
}

$$('[data-news]').forEach((f) => {
  const out = f.nextElementSibling;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('input', f);
    if (!email.checkValidity()) { out.textContent = 'Please enter a valid email address.'; email.focus(); return; }
    location.href = `mailto:${'info@staronegypt.com'}?subject=Newsletter%20subscription&body=${encodeURIComponent(`Please subscribe ${email.value}`)}`;
    out.textContent = 'Thank you. Confirm the email that just opened to subscribe.';
  });
});

/* ---------- colour rail arrows ---------- */
$$('[data-rail]').forEach((root) => {
  const rail = $('.swatches', root);
  $('[data-prev]', root)?.addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: 'smooth' }));
  $('[data-next]', root)?.addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: 'smooth' }));
});

addEventListener('load', () => ScrollTrigger.refresh());
