/* Yatai Lantern — night planner and stall elevation.
   No libraries, no audio. */
(() => {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  const form = document.getElementById('stall-form');
  if (form) planner();
  bindContact();

  function planner() {
    const $ = (id) => document.getElementById(id);
    const svg = $('stall-svg');
    const yen = (n) => '¥' + Math.round(Math.abs(n)).toLocaleString('en-US');
    const NIGHTS = { weekday: 0.62, saturday: 1.0, festival: 1.55 };
    const FEES = { weekday: 18000, saturday: 30000, festival: 45000 };

    function read() {
      return {
        night: $('night').value,
        focus: $('focus').value,
        pans: parseInt($('pans').value, 10),
        staff: parseInt($('staff').value, 10),
        hours: parseInt($('hours').value, 10),
      };
    }

    function calc(s) {
      const takoShare = s.focus === 'tako' ? 1 : s.focus === 'both' ? 0.62 : 0;
      const yakiShare = s.focus === 'yaki' ? 1 : s.focus === 'both' ? 0.38 : 0;
      const handBoost = 1 + 0.17 * (s.staff - 2);
      const takoCap = s.pans * 90 * handBoost * (s.focus === 'both' ? 0.72 : 1);
      const yakiCap = s.staff >= 3 ? (s.staff - 1) * 34 : 18;
      const demand = 70 * NIGHTS[s.night] * (s.focus === 'both' ? 1.12 : s.focus === 'yaki' ? 0.92 : 1);
      const capPerHour = takoCap * takoShare + yakiCap * yakiShare;
      const cap = capPerHour * s.hours;
      const want = demand * s.hours;
      const prep = Math.round(Math.min(cap * 0.96, want * 1.02));
      const sold = Math.round(Math.min(prep, want));
      const tako = Math.round(sold * takoShare);
      const yaki = sold - tako;
      const queue = Math.max(0, Math.round((demand - capPerHour) / 7));
      const wait = capPerHour > 0 ? Math.max(0, Math.round(((demand - capPerHour) / capPerHour) * 9)) : 0;

      let sellout = '';
      if (want > prep) {
        const hh = prep / Math.max(1, demand);
        const mins = Math.round(17 * 60 + hh * 60);
        sellout = `Sold out around ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
      } else {
        sellout = `${Math.round(prep - want)} portions left at close`;
      }

      const take = tako * 600 + yaki * 700;
      const ingredients = tako * 95 + yaki * 135;
      const gas = 2600 + s.hours * s.pans * 420 + (s.focus !== 'tako' ? 1800 : 0);
      const fee = FEES[s.night];
      const wages = (s.staff - 1) * 9000;
      const transport = 6000;
      const cost = ingredients + gas + fee + wages + transport;

      return {
        tako, yaki, sold, prep, take, cost, net: take - cost, queue, wait, sellout,
        batter: tako * 0.09, octopus: tako * 0.012, noodles: yaki * 0.18, cabbage: yaki * 0.11,
        gasKg: s.hours * s.pans * 0.35, capPerHour, demand,
      };
    }

    function draw(s, c) {
      const W = 560, H = 420;
      const groundY = 352;
      const lit = s.pans + 2;
      const queueN = Math.min(6, Math.max(0, Math.ceil(c.queue / 4)));
      const soldOut = c.sellout.startsWith('Sold out');
      let g = '';

      // sky
      g += `<rect x="0" y="0" width="${W}" height="${H}" fill="#0f1729"/>`;
      g += `<circle cx="470" cy="56" r="10" fill="#f6e7c8" opacity=".62"/>`;
      for (let i = 0; i < 26; i++) {
        const x = (i * 137) % W;
        const y = 20 + ((i * 61) % 120);
        g += `<circle cx="${x}" cy="${y}" r="${(i % 3) + 0.6}" fill="#f6e7c8" opacity="${0.25 + (i % 4) * 0.12}"/>`;
      }
      // distant buildings
      g += `<g fill="#0b1220">`;
      [[0, 300, 70, 52], [60, 286, 54, 66], [110, 308, 46, 44], [420, 292, 70, 60], [486, 306, 74, 46], [380, 316, 44, 36]].forEach(([x, y, w, h]) => {
        g += `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
      });
      g += `</g>`;
      // faint festival string far behind
      g += `<path d="M0 78q140 22 280 6t280 6" fill="none" stroke="#d9a441" stroke-width=".5" opacity=".22"/>`;

      // stall body
      g += `<rect class="sk-body" x="140" y="212" width="286" height="140" rx="2"/>`;
      g += `<rect class="sk-wood" x="132" y="200" width="302" height="14" rx="2"/>`;
      // noren
      g += `<rect class="sk-noren" x="146" y="128" width="274" height="48"/>`;
      g += `<rect class="sk-stripe" x="146" y="128" width="274" height="4"/>`;
      const kanji = ['た', 'こ', '焼', 'き'];
      kanji.forEach((k, i) => {
        g += `<text class="sk-jp" x="${146 + 34 + i * 68}" y="160" text-anchor="middle">${k}</text>`;
        if (i < 3) g += `<path d="M${146 + 68 + i * 68} 128v48" stroke="#d9a441" stroke-width=".5" opacity=".5"/>`;
      });
      // hanging lanterns
      for (let i = 0; i < lit; i++) {
        const x = 160 + i * (250 / Math.max(1, lit - 1));
        g += `<path d="M${x} 128v-14" stroke="#3a2f26" stroke-width="1.6"/>`;
        g += `<ellipse class="sk-lantern" cx="${x}" cy="${96}" rx="15" ry="20"/>`;
        g += `<ellipse class="sk-glow" cx="${x}" cy="${96}" rx="24" ry="30"/>`;
        g += `<path d="M${x - 9} 90h18M${x - 9} 102h18M${x} 76v40" stroke="#d9a441" stroke-width=".5" opacity=".7"/>`;
      }
      // takoyaki pans on counter
      for (let i = 0; i < s.pans; i++) {
        const x = 170 + i * 60;
        g += `<ellipse class="sk-pan" cx="${x}" cy="208" rx="26" ry="7"/>`;
        g += `<g fill="#c8442e" opacity=".9">`;
        for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) {
          g += `<circle cx="${x - 12 + k * 12}" cy="${204 + r * 6}" r="2.4"/>`;
        }
        g += `</g>`;
      }
      if (s.focus !== 'tako') {
        g += `<rect class="sk-pan" x="330" y="198" width="76" height="14" rx="2"/>`;
        g += `<path d="M340 205h22M370 205h24" stroke="#d9a441" stroke-width="1.4" opacity=".7"/>`;
      }
      // price board
      g += `<g><rect x="156" y="232" width="80" height="60" fill="#f1e3c2" stroke="#d9a441"/>`;
      g += `<text x="196" y="248" text-anchor="middle" font-family="Shippori Mincho,serif" font-size="9" fill="#3a2a1c">たこ焼き</text>`;
      g += `<text x="196" y="262" text-anchor="middle" font-family="Shippori Mincho,serif" font-size="11" fill="#3a2a1c">¥600</text>`;
      g += `<path d="M166 270h60" stroke="#3a2a1c" stroke-width=".5"/>`;
      g += `<text x="196" y="284" text-anchor="middle" font-family="Shippori Mincho,serif" font-size="8" fill="#3a2a1c">${s.focus === 'yaki' ? '焼きそば ¥700' : 'six pieces'}</text></g>`;
      // counter front panel
      g += `<rect x="248" y="236" width="160" height="86" fill="none" stroke="#d9a441" stroke-width=".6" opacity=".5"/>`;
      g += `<text x="328" y="266" text-anchor="middle" font-family="Shippori Mincho,serif" font-size="13" fill="#f6e7c8" opacity=".85">灯</text>`;
      g += `<text class="sk-txt" x="328" y="290" text-anchor="middle">KONDO · SINCE 1978</text>`;

      // sold out sign
      if (soldOut) {
        g += `<g transform="rotate(-6 196 300)"><rect x="140" y="286" width="112" height="26" fill="#c8442e"/>`;
        g += `<text x="196" y="304" text-anchor="middle" font-family="Zen Kaku Gothic New,sans-serif" font-size="11" letter-spacing="2" fill="#f6e7c8">SOLD OUT</text></g>`;
      }

      // steam
      g += `<g class="sk-steam"><path d="M176 198c-5-9 4-13 0-22M196 196c-5-9 4-13 0-22M216 198c-5-9 4-13 0-22"/></g>`;

      // queue
      if (!soldOut) {
        for (let i = 0; i < queueN; i++) {
          const x = 446 + i * 18;
          const sc = 1 - i * 0.08;
          g += `<g class="sk-people" opacity="${0.9 - i * 0.1}" transform="translate(${x} ${326}) scale(${sc})">
            <circle cx="0" cy="-26" r="4.6"/>
            <path d="M0-21l5 12h-10z"/>
            <path d="M-5-9l-3 9h2l3-6 3 6h2l-3-9z"/>
          </g>`;
        }
      }

      // ground & labels
      g += `<path d="M20 ${groundY}h520" stroke="#d9a441" stroke-width="1" opacity=".5"/>`;
      g += `<text class="sk-txt" x="20" y="372">ASAKUSA · ${s.night === 'festival' ? 'FESTIVAL EVE' : s.night === 'saturday' ? 'SATURDAY' : 'WEEKDAY'}</text>`;
      g += `<text class="sk-txt" x="540" y="372" text-anchor="end">${lit} LANTERNS · ${s.pans} PAN${s.pans > 1 ? 'S' : ''}</text>`;
      g += `<text class="sk-txt" x="20" y="392">QUEUE ${c.queue} · WAIT ${c.wait} MIN</text>`;
      g += `<text class="sk-txt" x="540" y="392" text-anchor="end">${c.sold} PORTIONS</text>`;
      svg.innerHTML = g;
    }

    function render() {
      const s = read();
      const c = calc(s);
      $('o-hours').textContent = s.hours;
      $('o-portions').textContent = `${c.prep} portions prepared · ${c.sold} sold`;
      $('o-batter').textContent = `${c.batter.toFixed(1)} L`;
      $('o-octopus').textContent = `${c.octopus.toFixed(2)} kg`;
      $('o-noodles').textContent = c.yaki > 0 ? `${c.noodles.toFixed(1)} kg / ${c.cabbage.toFixed(1)} kg` : '—';
      $('o-gas').textContent = `${c.gasKg.toFixed(1)} kg`;
      $('o-queue').textContent = c.queue > 0 ? `${c.queue} people · ${c.wait} min` : 'No queue — the pan keeps up';
      $('o-sellout').textContent = c.sellout;
      $('o-take').textContent = yen(c.take);
      $('o-cost').textContent = '−' + yen(c.cost);
      $('o-net').textContent = (c.net < 0 ? '−' : '') + yen(c.net);
      $('o-light').textContent = `${s.pans + 2} lanterns lit`;
      const focusName = s.focus === 'tako' ? 'takoyaki only' : s.focus === 'both' ? 'takoyaki and yakisoba' : 'yakisoba only';
      $('o-cap').textContent = `A ${s.night === 'festival' ? 'festival eve' : s.night} with ${s.pans} pan${s.pans > 1 ? 's' : ''}, ${s.staff} pairs of hands and ${focusName}. ${c.queue > 0 ? `The queue at seven is about ${c.queue} people, ${c.wait} minutes.` : 'The pan keeps up with the street.'}`;
      draw(s, c);
    }

    ['night', 'focus', 'pans', 'staff'].forEach((id) => $(id).addEventListener('change', render));
    $('hours').addEventListener('input', render);
    form.addEventListener('submit', (e) => e.preventDefault());
    render();
  }

  function bindContact() {
    const cform = document.getElementById('contact-form');
    if (!cform) return;
    const status = document.getElementById('form-status');
    const fields = [...cform.querySelectorAll('input, textarea, select')];
    const slotFor = (el) => (el.closest('.field') || el.parentElement).querySelector('.err');
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      let bad = null;
      fields.forEach((el) => {
        let msg = '';
        const v = (el.value || '').trim();
        if (el.required && !v) msg = 'Please fill this.';
        else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email looks incomplete.';
        else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) msg = 'Add the country code.';
        const slot = slotFor(el);
        if (slot) slot.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      status.hidden = false;
      status.textContent = 'Thanks. Hiroshi answers on Mondays — the cart is closed then and the phone is finally off. If the date is free you will have a price and a shopping list.';
      cform.reset();
      status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    fields.forEach((el) => el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        const slot = slotFor(el);
        if (slot) slot.textContent = '';
        el.setAttribute('aria-invalid', 'false');
      }
    }));
  }
})();
