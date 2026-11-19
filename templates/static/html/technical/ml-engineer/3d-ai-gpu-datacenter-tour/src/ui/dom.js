// dom.js — builds every HTML overlay and document section from content.js.
// No copy lives in this file; it only renders PERSONA / STOPS into the
// shell elements declared in index.html.

import { PERSONA, STOPS } from './content.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function sectionShell(id, kicker, title) {
  const s = el('section', 'doc-section');
  s.id = id;
  const head = el('div', 'section-head');
  head.append(el('p', 'kicker', kicker), el('h2', null, title));
  s.append(head);
  return s;
}

export function buildUI() {
  // ------------------------------------------------------------ header --
  const header = document.getElementById('site-header');
  const brand = el('a', 'brand');
  brand.href = '#top';
  brand.append(el('span', 'brand-name', PERSONA.name), el('span', 'brand-role', PERSONA.role));
  const nav = el('nav', 'site-nav');
  for (const [label, href] of [
    ['About', '#about'], ['Experience', '#experience'],
    ['Projects', '#projects'], ['Contact', '#contact'],
  ]) {
    const a = el('a', null, label);
    a.href = href;
    nav.append(a);
  }
  header.append(brand, nav);

  // ------------------------------------------------------------- cards --
  const cardsRoot = document.getElementById('cards');
  const cards = STOPS.map((stop, i) => {
    const card = el('article', 'card');
    card.dataset.stop = String(i);
    card.append(
      el('p', 'kicker', stop.kicker),
      el('h3', null, stop.title),
      el('p', 'card-body', stop.body),
    );
    cardsRoot.append(card);
    return card;
  });

  // ---------------------------------------------------------- sections --
  const content = document.getElementById('content');

  const about = sectionShell('about', 'About', 'The engineer behind the hall');
  for (const p of PERSONA.about) about.append(el('p', 'prose', p));
  content.append(about);

  const exp = sectionShell('experience', 'Experience', 'Nine years of infrastructure');
  for (const job of PERSONA.experience) {
    const item = el('article', 'job');
    const meta = el('div', 'job-meta');
    meta.append(el('h3', null, job.role), el('p', 'job-org', `${job.org} · ${job.period}`));
    const ul = el('ul', 'job-points');
    for (const b of job.bullets) ul.append(el('li', null, b));
    item.append(meta, ul);
    exp.append(item);
  }
  content.append(exp);

  const proj = sectionShell('projects', 'Projects', 'Selected work');
  for (const p of PERSONA.projects) {
    const item = el('article', 'project');
    item.append(el('h3', null, p.name), el('p', 'project-meta', p.meta), el('p', 'prose', p.body));
    const tags = el('ul', 'tags');
    for (const t of p.tags) tags.append(el('li', null, t));
    item.append(tags);
    proj.append(item);
  }
  content.append(proj);

  const skills = sectionShell('skills', 'Skills', 'Toolbox');
  const strip = el('ul', 'skills-strip');
  for (const s of PERSONA.skills) strip.append(el('li', null, s));
  skills.append(strip);
  content.append(skills);

  const contact = sectionShell('contact', 'Contact', 'Get in touch');
  contact.append(el('p', 'prose', PERSONA.contactBlurb));
  const mail = el('a', 'contact-mail', PERSONA.email);
  mail.href = `mailto:${PERSONA.email}`;
  contact.append(mail);
  const foot = el('div', 'site-foot');
  const socials = el('p', 'socials');
  PERSONA.socials.forEach((s, i) => {
    if (i) socials.append(document.createTextNode(' · '));
    const a = el('a', null, s.label);
    a.href = s.href;
    socials.append(a);
  });
  foot.append(
    socials,
    el('p', 'foot-note', `© ${PERSONA.name} · ${PERSONA.location} · Station 03 hall rendered in real time with Three.js`),
  );
  contact.append(foot);
  content.append(contact);

  return {
    cards,
    panel: document.getElementById('info-panel'),
    panelName: document.getElementById('info-name'),
    panelLines: document.getElementById('info-lines'),
    panelClose: document.getElementById('info-close'),
    hintScroll: document.getElementById('hint-scroll'),
    hintDrag: document.getElementById('hint-drag'),
    progressBar: document.getElementById('progress-bar'),
  };
}
