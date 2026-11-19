/* ══════════════════════════════════════════════════════════
   Jamie — scrapbook portfolio
   hand-cut interactions: pointer drag + momentum, scrolling
   paper choreography, drawn-in checklist, paper modals.
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.__jzDiag = { errors: [], brokenImages: [] };
  window.addEventListener("error", (e) => {
    window.__jzDiag.errors.push(String((e && e.message) || e));
  });
  window.addEventListener("unhandledrejection", (e) => {
    window.__jzDiag.errors.push("promise: " + String(e.reason));
  });

  /* ─────────── fonts ─────────── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add("fonts-ready");
    });
  }

  /* ─────────── tile rails ─────────── */
  const railMotifs = ["m-eye", "m-cat", "m-owl", "m-flower", "m-hand", "m-bird", "m-box", "m-dice", "m-leaf", "m-computer", "m-spark", "m-eye", "m-cat", "m-leaf"];
  $$("[data-rail]").forEach((rail, ri) => {
    const count = 26;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      const motif = railMotifs[(i + ri * 5) % railMotifs.length];
      tile.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#' + motif + '"/></svg>';
      frag.appendChild(tile);
    }
    rail.appendChild(frag);
  });

  /* ─────────── project content ─────────── */
  const IMG = (id, w) =>
    "https://assets/photos (local copies)/" + id + "?w=" + (w || 1200) + "&q=75&auto=format&fit=crop";

  const PROJECTS = {
    bash: {
      kicker: "case study · commerce",
      title: "Bash",
      sub: "South Africa's largest omni-channel fashion platform.",
      img: IMG("photo-1542291026-7eec264c27ff", 1200),
      role: "Lead product designer",
      years: "2022 — 2024",
      team: "2 squads · 9 engineers",
      body: [
        "Bash started as a website and ended up as the place people buy clothes in South Africa. My job was the boring middle of it: cart, checkout, returns, and the freight desk that lets a courier quote a container of shoes before lunch.",
        "We rebuilt the checkout three times. The first two were prettier. The third one was faster, honest about stock, and let you pay with the card you already had. Conversion went up 22% and — more importantly — support tickets about “where is my order” dropped by a third."
      ],
      bullets: [
        "One design system, 60+ screens, four squads",
        "Checkout rebuild: 22% conversion lift",
        "Freight desk: quotes in seconds, not days"
      ],
      quote: "If the cart is the only place people cry, we haven't finished.",
      tags: ["Product design", "Design system", "Checkout", "Retail"]
    },
    "bash-pay": {
      kicker: "feature · payments",
      title: "Bash Pay",
      sub: "One sheet between wanting the shoe and owning it.",
      img: IMG("photo-1556742049-0cfed4f6a45d", 1200),
      role: "Product designer",
      years: "2023",
      team: "Payments pod",
      body: [
        "A payment sheet is a confession: it tells you exactly how much friction a business is willing to tolerate. We cut ours down to a number, one button, and a list of the banks people actually use.",
        "Wallets, bank transfers, and cash on delivery all live behind the same summary. Cashback is shown as a promise you can spend, not a marketing badge."
      ],
      bullets: ["3 taps to pay, from 7", "All major SA banks + wallets", "1.5% cashback, stated plainly"],
      tags: ["Payments", "Mobile", "Checkout", "UX writing"]
    },
    pulse: {
      kicker: "case study · sports streaming",
      title: "Pulse",
      sub: "Live sport, filmed from the athlete's own point of view.",
      img: IMG("photo-1558981403-c5f9899a28bc", 1200),
      role: "Product designer",
      years: "2021 — 2022",
      team: "Streaming platform team",
      body: [
        "Pulse lets athletes stream a ride, a run, or a gym session straight from the camera on their chest. The design problem was not video — it was dignity: how do you make someone holding a mountain bike feel like the main event, not a content source.",
        "We designed the creator console, the viewer side, and the small honest details: battery warnings before a ride, a live badge that does not lie, a replay that starts at the good bit."
      ],
      bullets: ["Creator console + viewer app", "Live/replay states designed for bad signal", "Athlete onboarding with zero jargon"],
      quote: "Let the athlete look good. The interface can wait.",
      tags: ["Streaming", "Mobile", "Creator tools", "Live video"]
    },
    speaking: {
      kicker: "side quest · community",
      title: "Who's Speaking",
      sub: "Follow the speakers, not just the conference.",
      img: IMG("photo-1540575467063-178a50c2df87", 1200),
      role: "Designer & front-end",
      years: "2021 — now",
      team: "Two of us, mostly Sundays",
      body: [
        "A small directory that answers one question: where is this person talking next? Conference pages are usually organised by event; people follow people.",
        "Built with a scraper, a very boring database, and a poster-style card that makes a talk feel like a gig."
      ],
      bullets: ["Speaker-first browsing", "Poster cards, hand-set type", "Runs on a shoestring"],
      tags: ["Directory", "Design & code", "Community"]
    },
    heygo: {
      kicker: "case study · travel",
      title: "HEYGO",
      sub: "Visit interesting places through a guide's eyes, from your sofa.",
      img: IMG("photo-1506905925346-21bda4d32df4", 1200),
      role: "Product designer",
      years: "2019 — 2021",
      team: "Streams + product",
      body: [
        "HEYGO sold live walking tours. The ticket was the brand: an admission stub for a place you have never been, dated, seat and all.",
        "Designing for a guide holding a phone in a windy street taught me more about constraints than any design system. Big buttons, one path, no dead ends, and a map that never pretends to be precise."
      ],
      bullets: ["Booking flow + live tour player", "Tour guide tooling, one hand only", "Ticket-based brand system"],
      quote: "Design is an alignment tool before it is an artefact.",
      tags: ["Travel", "Booking", "Brand", "Live video"]
    },
    ditakah: {
      kicker: "freelance years",
      title: "Ditakah",
      sub: "Helping small businesses thrive in the digital landscape.",
      img: IMG("photo-1550745165-9bc0b252726f", 1200),
      role: "Designer, developer, everything",
      years: "2018 — 2020",
      team: "Me and a retired iMac",
      body: [
        "My first real studio work: websites for bakeries, clinics and one very determined bike shop. I learnt to scope, quote, and say no.",
        "The old computer stayed on the desk because it made clients smile. It also ran the invoicing."
      ],
      bullets: ["40+ small brand and web projects", "Design, build, handover, support", "Learnt to price the work honestly"],
      tags: ["Brand", "Web", "Freelance"]
    },
    drift: {
      kicker: "side quest",
      title: "Drift",
      sub: "A personal shelf of things found online and made on a Sunday.",
      img: IMG("photo-1519389950473-47ba0277781c", 1200),
      role: "Design & code",
      years: "ongoing",
      team: "just me",
      body: [
        "A slow-moving collection: a keyboard that types in poems, a browser toy, a poster series. No roadmap, no analytics, no users to disappoint.",
        "It is where I remember why I like this job."
      ],
      bullets: ["Small experiments, shipped weekly-ish", "No metrics, on purpose"],
      tags: ["Play", "Code", "Type"]
    },
    team: {
      kicker: "the kitchen table",
      title: "Team rituals",
      sub: "How a design team stays a team when everyone is busy.",
      img: IMG("photo-1522071820081-009f0129c71c", 1200),
      role: "Design lead",
      years: "2022 — 2024",
      team: "6 designers, 2 researchers",
      body: [
        "Weekly show-and-tell, a shared critique board, and one rule: bring the messy version. The board on the desk is a copy of the real one.",
        "Rituals are design too — they need a purpose, a shape, and permission to be cancelled when they stop working."
      ],
      bullets: ["Critique format used for 2 years", "Onboarding kit for new designers", "Design debt register, publicly visible"],
      tags: ["Team", "Process", "Critique"]
    },
    tf2018: {
      kicker: "side quest",
      title: "TF2018",
      sub: "A brand for a 3D printing studio, plus a pixel NFT because it was 2018.",
      img: IMG("photo-1498050108023-c5249f4df085", 1200),
      role: "Brand & web",
      years: "2018",
      team: "with two makers",
      body: [
        "Identity, packaging and a website that could be edited by people who did not want to learn a CMS.",
        "The NFT was a joke that got taken seriously for about three weeks."
      ],
      bullets: ["Identity + packaging", "Editable site, no training needed", "One very small NFT"],
      tags: ["Brand", "Packaging", "Web"]
    },
    tripletime: {
      kicker: "side quest",
      title: "Triple Time",
      sub: "Finding a trusted tube-taker for a nervous three-year-old.",
      img: IMG("photo-1526772662000-3f88f10405ff", 1200),
      role: "Product designer",
      years: "2023",
      team: "with a paediatric nurse",
      body: [
        "A booking service for medical procedures that need a trusted adult present. The design work was mostly tone: what do you say to a parent at 6am in a hospital corridor.",
        "Calm colours, one decision per screen, and a phone number that a human answers."
      ],
      bullets: ["Booking in 4 steps", "Plain-language consent copy", "Human fallback everywhere"],
      tags: ["Health", "Booking", "Service design"]
    },
    "note-clarity": {
      kicker: "a note pinned to the board",
      title: "tirelessly pursue clarity.",
      sub: "The thing I keep re-learning.",
      role: "principle",
      years: "always",
      team: "—",
      body: [
        "Most design problems are communication problems wearing a costume. If I cannot explain the flow in three sentences, I do not understand it yet.",
        "So I ask again, draw it badly, and ask someone who is not a designer to read it back to me."
      ],
      tags: ["Principle", "Craft"]
    },
    "note-moments": {
      kicker: "a note pinned to the board",
      title: "Design for moments.",
      sub: "Not screens, not flows, not features.",
      role: "principle",
      years: "always",
      team: "—",
      body: [
        "People do not remember your navigation. They remember the four seconds when the payment went through and the app said something kind.",
        "Design the moment, then work backwards to the screens that make it possible."
      ],
      tags: ["Principle", "Craft"]
    }
  };

  /* ─────────── modal ─────────── */
  const modal = $("#modal");
  const modalBody = $("#modalBody");
  let lastFocus = null;
  let openedAt = 0;

  function openModal(html) {
    lastFocus = document.activeElement;
    openedAt = Date.now();
    modalBody.innerHTML = html;
    modalBody.scrollTop = 0;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    const panel = $(".modal__panel", modal);
    panel.scrollTop = 0;
    if (window.gsap) {
      gsap.killTweensOf([$(".modal__scrim", modal), panel]);
      gsap.to($(".modal__scrim", modal), { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(panel, hoverOnly(), { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.3)" });
    } else {
      panel.style.opacity = 1;
      panel.style.transform = "none";
    }
    const closeBtn = $(".modal__close", modal);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }
  function hoverOnly() { return { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.3)" }; }

  function closeModal() {
    if (!modal.classList.contains("is-open")) return;
    const panel = $(".modal__panel", modal);
    modal.setAttribute("aria-hidden", "true");
    if (window.gsap) {
      gsap.to($(".modal__scrim", modal), { opacity: 0, duration: 0.22, ease: "power2.in" });
      gsap.to(panel, {
        opacity: 0, y: 18, scale: 0.985, duration: 0.22, ease: "power2.in",
        onComplete: () => {
          modal.classList.remove("is-open");
          document.body.classList.remove("is-locked");
          modalBody.innerHTML = "";
        }
      });
    } else {
      modal.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function projectModal(id) {
    const p = PROJECTS[id];
    if (!p) return;
    const img = p.img ? '<img class="m-image" src="' + p.img + '" alt="">' : "";
    const meta = p.role
      ? '<div class="m-grid">' +
        '<p><span class="m-lab">Role</span><span class="m-val">' + p.role + "</span></p>" +
        '<p><span class="m-lab">Years</span><span class="m-val">' + (p.years || "—") + "</span></p>" +
        '<p><span class="m-lab">Crew</span><span class="m-val">' + (p.team || "—") + "</span></p>" +
        "</div>"
      : "";
    const body = (p.body || []).map((t) => '<p class="m-p">' + t + "</p>").join("");
    const quote = p.quote ? '<p class="m-quote">“' + p.quote + "”</p>" : "";
    const bullets = p.bullets
      ? '<ul class="m-list">' + p.bullets.map((b) => "<li>" + b + "</li>").join("") + "</ul>"
      : "";
    const tags = p.tags
      ? '<div class="m-tags">' + p.tags.map((t) => '<span class="m-tag">' + t + "</span>").join("") + "</div>"
      : "";
    openModal(
      '<p class="m-kicker">' + p.kicker + "</p>" +
      '<h2 class="m-title" id="modalTitle">' + p.title + "</h2>" +
      (p.sub ? '<p class="m-sub">' + p.sub + "</p>" : "") +
      img + meta + body + quote + bullets + tags +
      '<div class="m-row"><button class="m-btn" data-open="connect">work with me</button>' +
      '<button class="m-btn m-btn--ghost" data-close>close</button></div>'
    );
  }

  function aboutModal() {
    openModal(
      '<p class="m-kicker">about</p>' +
      '<h2 class="m-title" id="modalTitle">Senior level,<br><em style="font-style:italic">still curious.</em></h2>' +
      '<p class="m-sub">Ten years of turning complex ideas into things you can touch.</p>' +
      '<img class="m-image" src="' + IMG("photo-1507003211169-0a1dd7228f2d", 1200) + '" alt="Jamie, product designer">' +
      '<p class="m-p">I design software for people who are already tired: couriers quoting a container at 7am, shoppers on 3G, athletes filming a descent with one hand. My work is mostly removing things until the next step is obvious.</p>' +
      '<div class="m-grid">' +
      '<p><span class="m-lab">Based</span><span class="m-val">Cape Town</span></p>' +
      '<p><span class="m-lab">Doing this</span><span class="m-val">since 2016</span></p>' +
      '<p><span class="m-lab">Timezone</span><span class="m-val">GMT +2:00</span></p>' +
      "</div>" +
      '<p class="m-lab" style="margin-bottom:8px">I&rsquo;m a product designer but I&rsquo;m also&hellip;</p>' +
      '<ul class="m-list"><li>an ai-powered coder</li><li>a digital artist</li><li>a mentor</li><li>a martial artist</li><li>a cautious skateboarder</li></ul>' +
      '<p class="m-quote">Everything you do, do it with care.</p>' +
      '<div class="m-tags"><span class="m-tag">Product design</span><span class="m-tag">Design systems</span><span class="m-tag">Prototyping</span><span class="m-tag">Mentoring</span></div>' +
      '<div class="m-row"><button class="m-btn" data-open="connect">say hello</button><button class="m-btn m-btn--ghost" data-close>close</button></div>'
    );
  }

  function workModal() {
    const rows = [
      ["bash", "Bash", "Commerce platform · 2022—2024"],
      ["pulse", "Pulse", "Sports streaming · 2021—2022"],
      ["heygo", "HEYGO", "Live travel · 2019—2021"],
      ["ditakah", "Ditakah", "Freelance years · 2018—2020"],
      ["speaking", "Who's Speaking", "Speaker directory · side quest"],
      ["drift", "Drift", "Personal experiments · side quest"]
    ]
      .map(
        ([id, name, meta]) =>
          '<li style="list-style:none"><button class="m-btn m-btn--ghost" data-project="' + id +
          '" style="width:100%;justify-content:space-between;display:flex;gap:12px;text-align:left;margin-bottom:8px">' +
          "<span style=\"font-family:var(--serif);font-size:20px;text-transform:none;letter-spacing:0\">" + name +
          '</span><span style="opacity:.6">' + meta + "</span></button></li>"
      )
      .join("");
    openModal(
      '<p class="m-kicker">work</p>' +
      '<h2 class="m-title" id="modalTitle">Places I&rsquo;ve been,<br>things I&rsquo;ve learnt.</h2>' +
      '<p class="m-sub">Six of them, honestly told.</p>' +
      '<ul style="padding:0;margin:0">' + rows + "</ul>" +
      '<p class="m-p" style="margin-top:22px">Or just drag the cards around on the desk. That is where the rest live.</p>'
    );
  }

  function connectModal() {
    openModal(
      '<p class="m-kicker">connect</p>' +
      '<h2 class="m-title" id="modalTitle">Let&rsquo;s chat!</h2>' +
      '<p class="m-sub">I read everything, and answer most of it.</p>' +
      '<p class="m-p">Tell me what you are building, what is broken, or what you cannot stop thinking about. I like problems that sound boring until you open them.</p>' +
      '<a class="m-mail" href="mailto:hello@jamie.design?subject=Hello%20Jamie">hello@jamie.design</a>' +
      '<div class="m-row"><button class="m-btn" id="copyMail" type="button">copy email</button>' +
      '<button class="m-btn m-btn--ghost" data-project="about">more about me</button></div>' +
      '<div class="m-tags" style="margin-top:26px"><span class="m-tag">Cape Town · GMT+2</span><span class="m-tag">open to freelance</span><span class="m-tag">replies in a day or two</span></div>'
    );
  }

  document.addEventListener("click", (e) => {
    const closeEl = e.target.closest("[data-close]");
    if (closeEl) {
      e.preventDefault();
      // a double-click on a card fires a second click on the scrim — ignore it
      if (Date.now() - openedAt < 420) return;
      closeModal();
      return;
    }
    const openEl = e.target.closest("[data-open]");
    if (openEl) {
      e.preventDefault();
      const which = openEl.getAttribute("data-open");
      if (which === "about") aboutModal();
      else if (which === "work") workModal();
      else if (which === "connect") connectModal();
      return;
    }
    const copyEl = e.target.closest("#copyMail");
    if (copyEl) {
      const txt = "hello@jamie.design";
      if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
      copyEl.textContent = "copied ✓";
      return;
    }
    const projEl = e.target.closest("[data-project]");
    if (projEl && !projEl.classList.contains("card") && !projEl.classList.contains("trip") && !projEl.classList.contains("quest") && !projEl.classList.contains("bio")) {
      e.preventDefault();
      const id = projEl.getAttribute("data-project");
      if (id === "about") aboutModal();
      else projectModal(id);
      return;
    }
    if (projEl && (projEl.classList.contains("trip") || projEl.classList.contains("quest"))) {
      projectModal(projEl.getAttribute("data-project"));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if ((e.key === "Enter" || e.key === " ") && document.activeElement) {
      const el = document.activeElement;
      if (el.classList && (el.classList.contains("trip") || el.classList.contains("quest"))) {
        e.preventDefault();
        projectModal(el.getAttribute("data-project"));
      }
    }
  });

  /* ─────────── generic pointer drag ─────────── */
  function makeDraggable(el, opts) {
    const state = {
      x: 0,
      y: 0,
      rot: opts.rot || 0,
      baseRot: opts.rot || 0,
      vx: 0,
      vy: 0,
      raf: 0,
      down: false,
      moved: 0
    };
    let sx = 0, sy = 0, ox = 0, oy = 0, lastT = 0, lastX = 0, lastY = 0;

    const apply = () => {
      el.style.transform =
        "translate3d(" + state.x.toFixed(2) + "px," + state.y.toFixed(2) + "px,0) rotate(" + state.rot.toFixed(2) + "deg)";
      if (opts.onMove) opts.onMove(state);
    };

    const bounds = () => (opts.bounds ? opts.bounds() : null);

    function limit(nx, ny) {
      const b = bounds();
      if (!b) return [nx, ny];
      return [clamp(nx, b.minX, b.maxX), clamp(ny, b.minY, b.maxY)];
    }

    function stopMomentum() {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    }

    function momentum() {
      if (reduced) return;
      stopMomentum();
      const step = () => {
        state.vx *= 0.935;
        state.vy *= 0.935;
        state.rot += (state.baseRot - state.rot) * 0.14;
        if (Math.abs(state.vx) < 0.03 && Math.abs(state.vy) < 0.03) {
          state.vx = state.vy = 0;
          settle();
          return;
        }
        const [nx, ny] = limit(state.x + state.vx, state.y + state.vy);
        if (nx !== state.x + state.vx) state.vx *= -0.4;
        if (ny !== state.y + state.vy) state.vy *= -0.4;
        state.x = nx;
        state.y = ny;
        apply();
        state.raf = requestAnimationFrame(step);
      };
      state.raf = requestAnimationFrame(step);
    }

    function settle() {
      if (reduced) {
        state.rot = state.baseRot;
        apply();
        return;
      }
      const target = state.baseRot + (Math.random() * 2 - 1) * 1.4;
      const t0 = performance.now();
      const from = state.rot;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 260);
        state.rot = from + (target - from) * (1 - Math.pow(1 - p, 3));
        apply();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      state.baseRot = target;
    }

    function down(e) {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
      stopMomentum();
      state.down = true;
      state.moved = 0;
      sx = e.clientX;
      sy = e.clientY;
      ox = state.x;
      oy = state.y;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      state.vx = state.vy = 0;
      el.classList.add("is-dragging");
      if (opts.onLift) opts.onLift();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      if (window.gsap) gsap.killTweensOf(state);
    }

    function move(e) {
      if (!state.down) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      state.moved = Math.max(state.moved, Math.abs(dx) + Math.abs(dy));
      if (state.moved > 3) e.preventDefault();
      const [nx, ny] = limit(ox + dx, oy + dy);
      state.x = nx;
      state.y = ny;
      const tilt = clamp(dx * 0.03, -6, 6) + (opts.rot || 0);
      state.rot = state.rot + (tilt - state.rot) * 0.35;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      state.vx = ((e.clientX - lastX) / dt) * 14;
      state.vy = ((e.clientY - lastY) / dt) * 14;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      apply();
    }

    function up(e) {
      if (!state.down) return;
      state.down = false;
      el.classList.remove("is-dragging");
      if (opts.onDrop) opts.onDrop(state);
      if (state.moved < 5) {
        state.vx = state.vy = 0;
        settle();
        if (opts.onTap) opts.onTap(e);
        return;
      }
      momentum();
    }

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    return {
      state,
      apply,
      reset(animate) {
        stopMomentum();
        const anim = (animate !== false) && window.gsap && !reduced;
        if (anim) {
          gsap.to(state, {
            x: 0, y: 0, rot: opts.rot || 0, duration: 0.85, ease: "back.out(1.3)",
            onUpdate: apply,
            onComplete: () => { state.baseRot = opts.rot || 0; }
          });
        } else {
          state.x = state.y = 0;
          state.rot = state.baseRot = opts.rot || 0;
          apply();
        }
      }
    };
  }

  /* ─────────── cutting board ─────────── */
  const board = $("#boardArea");
  const cards = $$(".card");
  let topZ = 20;

  /* scattered layout — desktop uses % positions from the markup, mobile stacks
     the cutouts with a small overlap so none of the mini-UIs get buried */
  const MOBILE_ORDER = ["bash", "bash-pay", "pulse", "speaking", "heygo", "ditakah", "note-clarity", "note-moments"];
  const MOBILE_POS = {
    bash: [2, 0.5],
    "bash-pay": [21, 9],
    pulse: [4, 21],
    speaking: [19, 28],
    heygo: [2, 47],
    ditakah: [23, 58],
    "note-clarity": [3, 68],
    "note-moments": [48, 70.5]
  };
  let mobileStackHeight = 0;

  function layOutCards() {
    const narrow = window.innerWidth <= 760;
    if (!narrow) {
      cards.forEach((card) => {
        const id = card.getAttribute("data-project");
        card.style.left = "";
        card.style.top = "";
        card.style.setProperty("--x", card.getAttribute("data-x") || "0");
        card.style.setProperty("--y", card.getAttribute("data-y") || "0");
      });
      return;
    }
    const inner = board.clientWidth - 22;
    let y = 18;
    MOBILE_ORDER.forEach((id, i) => {
      const card = cards.find((c) => c.getAttribute("data-project") === id);
      if (!card) return;
      const h = card.offsetHeight || 150;
      const left = i % 2 === 0 ? 2 : Math.min(inner * 0.22, inner - card.offsetWidth - 4);
      card.style.left = Math.max(2, left) + "px";
      card.style.top = y + "px";
      y += h - 26;
    });
    mobileStackHeight = y;
    board.style.minHeight = Math.round(y + 300) + "px";
  }
  layOutCards();

  function boardBoundsFor(el, pad) {
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const margin = pad === undefined ? 6 : pad;
    // current translation is included in r, so derive the offset of the card's layout box
    const st = el.__drag ? el.__drag.state : { x: 0, y: 0 };
    const left = r.left - st.x;
    const top = r.top - st.y;
    return {
      minX: b.left - left + margin,
      maxX: b.right - r.width - (left) - margin,
      minY: b.top - top + margin,
      maxY: b.bottom - r.height - top - margin
    };
  }

  const draggables = cards.map((card) => {
    const rot = parseFloat(card.getAttribute("data-rot") || "0");
    const drag = makeDraggable(card, {
      rot,
      bounds: () => boardBoundsFor(card),
      onLift: () => {
        topZ += 1;
        card.style.zIndex = String(topZ);
        card.classList.add("is-lifted");
      },
      onDrop: () => card.classList.remove("is-lifted"),
      onTap: () => {
        const id = card.getAttribute("data-project");
        if (id) projectModal(id);
      }
    });
    card.__drag = drag;
    drag.apply();

    card.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 40 : 12;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const [nx, ny] = (() => {
          const b = boardBoundsFor(card);
          let x = drag.state.x, y = drag.state.y;
          if (e.key === "ArrowLeft") x -= step;
          if (e.key === "ArrowRight") x += step;
          if (e.key === "ArrowUp") y -= step;
          if (e.key === "ArrowDown") y += step;
          return [clamp(x, b.minX, b.maxX), clamp(y, b.minY, b.maxY)];
        })();
        drag.state.x = nx;
        drag.state.y = ny;
        drag.apply();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const id = card.getAttribute("data-project");
        if (id) projectModal(id);
      }
    });

    return drag;
  });

  /* peeking bio card + draggable mask */
  const mask = $("#bioMask");
  let maskDrag = null;
  if (mask) {
    maskDrag = makeDraggable(mask, {
      rot: 0,
      bounds: () => {
        const bio = $("#bio").getBoundingClientRect();
        const r = mask.getBoundingClientRect();
        const st = maskDrag ? maskDrag.state : { x: 0, y: 0 };
        const left = r.left - st.x;
        const top = r.top - st.y;
        return {
          minX: bio.left - left - 130,
          maxX: bio.right - r.width - left + 150,
          minY: bio.top - top - 150,
          maxY: bio.bottom - r.height - top + 90
        };
      },
      onLift: () => {
        mask.style.zIndex = "30";
      },
      onDrop: (st) => {
        if (Math.abs(st.x) > 130 || Math.abs(st.y) > 120) {
          mask.setAttribute("aria-label", "Mask moved — the photo is revealed. Double-click to put it back.");
        }
      }
    });
    maskDrag.apply();
    mask.addEventListener("dblclick", () => maskDrag.reset(true));
  }

  const dragPill = $("#dragPill");
  if (dragPill) {
    dragPill.addEventListener("click", () => {
      const target = cards[Math.floor(Math.random() * cards.length)];
      if (!target || !target.__drag) return;
      const d = target.__drag;
      const t0 = performance.now();
      const from = { x: d.state.x, y: d.state.y, rot: d.state.rot };
      const dx = (Math.random() * 2 - 1) * 90;
      const dy = (Math.random() * 2 - 1) * 70;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 620);
        const e = 1 - Math.pow(1 - p, 4);
        d.state.x = from.x + dx * e;
        d.state.y = from.y + dy * e;
        d.state.rot = from.rot + Math.sin(p * Math.PI) * 9;
        d.apply();
        if (p < 1) requestAnimationFrame(tick);
        else d.state.rot = d.state.baseRot;
      };
      requestAnimationFrame(tick);
      target.classList.add("is-lifted");
      topZ += 1;
      target.style.zIndex = String(topZ);
      setTimeout(() => target.classList.remove("is-lifted"), 1200);
      dragPill.querySelector("span").textContent = "Nice. Now reset it.";
      dragPill.classList.add("is-done");
    });
  }

  const resetBtn = $("#resetBoard");
  resetBtn &&
    resetBtn.addEventListener("click", () => {
      draggables.forEach((d, i) => setTimeout(() => d.reset(true), i * 45));
      if (maskDrag) setTimeout(() => maskDrag.reset(true), 120);
      topZ = 20;
      if (dragPill) {
        dragPill.querySelector("span").textContent = "DRAG ME";
        dragPill.classList.remove("is-done");
      }
      const b = $("#bio");
      if (b) b.classList.remove("is-open");
    });

  /* ─────────── checklist ─────────── */
  const checks = $$(".check");
  const stages = $$(".draw g.dr");
  const countEl = $("#checkCount");
  const stampEl = $("#stamp");
  const chatBtn = $("#chatBtn");
  const stampCopy = [
    "nothing ticked yet —<br>the page is still blank",
    "a start. keep going.",
    "nearly a whole plant.",
    "that’s the whole sketch.<br>now say hello."
  ];

  // prime the strokes for the draw-in
  $$(".draw path").forEach((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 200;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  function paintStages() {
    const on = checks.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => parseInt(c.getAttribute("data-check"), 10));
    stages.forEach((g) => {
      const idx = parseInt(g.getAttribute("data-stage"), 10);
      const active = on.includes(idx);
      g.classList.toggle("is-on", active);
      $$("path", g).forEach((p) => {
        const len = p.style.strokeDasharray;
        if (active) {
          if (window.gsap) {
            gsap.to(p, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", delay: 0.05 * idx, overwrite: true });
          } else {
            p.style.strokeDashoffset = 0;
          }
        } else {
          if (window.gsap) gsap.to(p, { strokeDashoffset: len, duration: 0.4, ease: "power2.in", overwrite: true });
          else p.style.strokeDashoffset = len;
        }
      });
    });
    countEl.textContent = on.length + " / 3";
    stampEl.innerHTML = stampCopy[Math.min(on.length, 3)];
    if (on.length === 3) {
      chatBtn.classList.add("is-live");
      if (window.gsap && !reduced) {
        gsap.fromTo(stages[2], { scale: 0.94, transformOrigin: "50% 60%" }, { scale: 1, duration: 0.9, ease: "elastic.out(1,0.4)" });
      }
    } else {
      chatBtn.classList.remove("is-live");
    }
  }

  checks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", on ? "false" : "true");
      paintStages();
    });
  });

  if (chatBtn) chatBtn.addEventListener("click", connectModal);

  /* ─────────── scroll choreography ─────────── */
  const gs = window.gsap;
  const ST = window.ScrollTrigger;
  const revealEls = [];
  function track(els) {
    (gs ? gs.utils.toArray(els) : []).forEach((el) => revealEls.push(el));
  }
  if (gs && ST) {
    gs.registerPlugin(ST);

    // progress line
    gs.to(".progress i", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: "top top", end: "max", scrub: 0.3 }
    });

    // chalk doodles drift at different speeds
    $$(".chalk").forEach((layer) => {
      $$(".chalk__d", layer).forEach((d, i) => {
        const speed = 40 + i * 26;
        gs.to(d, {
          y: -speed,
          ease: "none",
          scrollTrigger: { trigger: layer.parentElement, start: "top bottom", end: "bottom top", scrub: 1.2 }
        });
      });
    });

    // hero sheet settles as you leave it
    gs.to(".hero__sheet", {
      y: -26,
      rotate: 0.4,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
    });

    // beliefs: the three scraps are laid down 1 → 2 → 3, one after another,
    // then drift gently apart with the "empower" scrap stepping forward.
    // Every card carries its own entrance tween inside one staggered timeline,
    // so the third card always finishes its move and rests fully visible.
    const scraps = $(".scraps");
    if (scraps) {
      const scrapEls = gs.utils.toArray("[data-scrap]", scraps);
      const heroScrap = $(".scrap--hero", scraps);
      // never leave a card invisible if a trigger misfires
      const rescueBeliefs = () => {
        scrapEls.forEach((el) => {
          if (!el.__introStarted) return;
          if (gs.isTweening && gs.isTweening(el)) return;
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          if (parseFloat(getComputedStyle(el).opacity) < 0.06) {
            gs.set(el, { opacity: 1, y: 0 });
          }
        });
      };
      setTimeout(rescueBeliefs, 3200);
      setTimeout(rescueBeliefs, 6000);

      const mm = gs.matchMedia();

      if (reduced) {
        gs.set(scrapEls, { opacity: 1, y: 0 });
      } else {
        /* ── phone / narrow: the scraps are a stacked column, so each one
           lands on its own as it scrolls in — 1, then 2, then 3 ── */
        mm.add("(max-width: 900px)", () => {
          scrapEls.forEach((el, i) => {
            gs.from(el, {
              opacity: 0,
              y: 54,
              duration: 0.8,
              delay: 0.05 * i,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
              onStart: () => { el.__introStarted = 1; },
              onComplete: () => { gs.set(el, { opacity: 1, y: 0 }); }
            });
          });
        });

        /* ── desktop: one timeline, 1 → 2 → 3, then the drift ── */
        mm.add("(min-width: 901px)", () => {
          const heroX = () => {
            const a = heroScrap.getBoundingClientRect();
            const b = scraps.getBoundingClientRect();
            return (b.left + b.width / 2) - (a.left + a.width / 2);
          };

          const intro = gs.timeline({
            defaults: { duration: 0.95, ease: "power3.out" },
            scrollTrigger: {
              trigger: scraps,
              start: "top 84%",
              once: true,
              onEnter: () => { scrapEls.forEach((el) => { el.__introStarted = 1; }); }
            }
          });
          intro
            .from(scrapEls, {
              y: 74,
              opacity: 0,
              rotate: "+=3.2",
              stagger: 0.3
            })
            .set(scrapEls, { clearProps: "opacity" });

          // gentle drift apart — yPercent/xPercent so it never fights the intro
          scrapEls.forEach((s) => {
            if (s === heroScrap) return;
            const drift = parseFloat(s.getAttribute("data-drift") || "0");
            gs.to(s, {
              yPercent: -drift * 0.4,
              xPercent: drift * 0.12,
              ease: "none",
              scrollTrigger: { trigger: ".beliefs", start: "top 85%", end: "bottom 20%", scrub: 1 }
            });
          });

          // the "empower" scrap steps forward once it has landed
          gs.fromTo(
            heroScrap,
            { x: 0, yPercent: 0, scale: 1 },
            {
              x: () => heroX(),
              yPercent: 22,
              scale: 1.14,
              ease: "none",
              scrollTrigger: { trigger: ".beliefs", start: "top 70%", end: "bottom 35%", scrub: 1.1 }
            }
          );
        });
      }
    }

    // board cards: dropped onto the desk
    track(cards);
    gs.from(cards, {
      y: 90,
      opacity: 0,
      rotate: (i) => parseFloat(cards[i].getAttribute("data-rot") || "0") - 6,
      duration: 1.05,
      ease: "power3.out",
      stagger: { each: 0.055, from: "random" },
      scrollTrigger: { trigger: ".board", start: "top 78%", once: true },
      onComplete: () => {
        cards.forEach((c) => {
          c.style.opacity = 1;
          if (c.__drag) c.__drag.apply();
        });
      }
    });

    // journey pieces rise a little
    track(".trip");
    $$(".trip").forEach((trip, i) => {
      gs.from(trip, {
        y: 46,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        delay: (i % 2) * 0.08,
        scrollTrigger: { trigger: trip, start: "top 88%", once: true }
      });
    });

    track(".quests__sheet");
    gs.from(".quests__sheet", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: { trigger: ".quests__sheet", start: "top 90%", once: true }
    });

    // look card
    track(".lookcard");
    gs.from(".lookcard", {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: { trigger: ".lookcard", start: "top 88%", once: true }
    });

    // footer signature wobble
    track(".footer__sig");
    gs.from(".footer__sig", {
      scaleX: 0.86,
      opacity: 0,
      rotate: -8,
      duration: 1.1,
      ease: "back.out(1.6)",
      scrollTrigger: { trigger: ".footer", start: "top 85%", once: true }
    });
  }

  /* safety net: if a reveal tween never fired (instant jumps, deep links,
     reduced-motion quirks) anything sitting on screen gets shown anyway */
  let rescueTick = false;
  function rescueVisible() {
    rescueTick = false;
    if (!gs) return;
    revealEls.forEach((el) => {
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight * 0.96) return;
      if (parseFloat(getComputedStyle(el).opacity) < 0.06) {
        gs.killTweensOf(el);
        el.style.opacity = "1";
        el.style.transform = "";
      }
    });
  }
  let rescueTimer = 0;
  function queueRescue(delay) {
    clearTimeout(rescueTimer);
    rescueTimer = setTimeout(rescueVisible, delay === undefined ? 520 : delay);
  }
  window.addEventListener("scroll", () => queueRescue(520), { passive: true });
  window.addEventListener("scrollend", () => queueRescue(120), { passive: true });
  window.addEventListener("resize", () => queueRescue(260));
  window.addEventListener("load", () => queueRescue(400));
  setTimeout(rescueVisible, 1600);
  setTimeout(rescueVisible, 4200);

  /* reveal cards if the entrance tween never fires (no gsap / reduced motion) */
  window.addEventListener("load", () => {
    cards.forEach((c) => { if (!c.style.opacity) c.style.opacity = ""; });
  });

  /* ─────────── back to top ─────────── */
  const toTop = $("#toTop");
  toTop &&
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });

  /* ─────────── image health check (diagnostics) ─────────── */
  $$("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) window.__jzDiag.brokenImages.push(img.src);
    img.addEventListener("error", () => window.__jzDiag.brokenImages.push(img.src));
  });

  /* ─────────── resize: keep cards inside the board ─────────── */
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      layOutCards();
      cards.forEach((c) => {
        if (!c.__drag) return;
        const b = boardBoundsFor(c);
        c.__drag.state.x = clamp(c.__drag.state.x, b.minX, b.maxX);
        c.__drag.state.y = clamp(c.__drag.state.y, b.minY, b.maxY);
        c.__drag.apply();
      });
    }, 200);
  });

  window.addEventListener("load", () => { layOutCards(); setTimeout(layOutCards, 700); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layOutCards());

  // expose for verification
  window.__jz = {
    cards: () => cards.map((c) => ({ id: c.getAttribute("data-project"), x: c.__drag.state.x, y: c.__drag.state.y, z: c.style.zIndex })),
    drag: () => draggables,
    projects: () => Object.keys(PROJECTS),
    mask: () => (maskDrag ? maskDrag.state : null)
  };
})();
