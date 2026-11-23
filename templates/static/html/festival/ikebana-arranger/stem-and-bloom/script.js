/* Clara Nyberg — ikebana
   Nav, the composition bench and the class form. The arrangement is drawn as SVG
   from the angles, so the page stays light and quiet. No audio. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- class form ---------- */
  const form = document.getElementById('classForm');
  if (form) {
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const course = String(data.get('course') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10) {
        status.className = 'form-status err';
        status.textContent = 'I need your name, a working email and a sentence about what you would like to try. The rest can wait.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your note about ' + (course || 'a class') + ' is in the book. I answer on Mondays, after the studio has been swept.';
      form.reset();
    });
  }

  /* ---------- bench ---------- */
  const arrangement = document.getElementById('arrangement');
  if (!arrangement) return;

  const vaseGroup = document.getElementById('vaseGroup');
  const stemGroup = document.getElementById('stemGroup');
  const kenzanGroup = document.getElementById('kenzan');
  const scoreNum = document.getElementById('scoreNum');
  const readTitle = document.getElementById('readTitle');
  const readNote = document.getElementById('readNote');
  const readList = document.getElementById('readList');
  const hint = document.getElementById('composeHint');

  const CLASSIC = { shin: 12, soe: 45, hikae: 75 };
  const ANGLE_IDS = ['shin', 'soe', 'hikae'];

  const SEASONS = {
    spring: {
      label: 'Spring',
      shin: { stem: '#6d5138', leaf: '#7e8f5f', bloom: '#e7c3cb', bloom2: '#c98f9c', kind: 'blossom', count: 5 },
      soe: { stem: '#5f7148', leaf: '#6f8352', bloom: '#8b6f9e', bloom2: '#634a76', kind: 'iris', count: 1 },
      hikae: { stem: '#8b9058', leaf: '#9aa36a', bloom: '#aab27c', bloom2: '#7f8a52', kind: 'grass', count: 3 }
    },
    summer: {
      label: 'Summer',
      shin: { stem: '#4f4a34', leaf: '#3f5a3c', bloom: '#6a7f4a', bloom2: '#2f4429', kind: 'pine', count: 6 },
      soe: { stem: '#5c6f45', leaf: '#5f7a49', bloom: '#f4efe0', bloom2: '#d8cba6', kind: 'lily', count: 1 },
      hikae: { stem: '#6f7f4d', leaf: '#7c8f58', bloom: '#8fa06a', bloom2: '#5c6e40', kind: 'leaf', count: 2 }
    },
    autumn: {
      label: 'Autumn',
      shin: { stem: '#6a4a30', leaf: '#a85a2e', bloom: '#c47a35', bloom2: '#8e3f22', kind: 'maple', count: 7 },
      soe: { stem: '#5d6a3f', leaf: '#75804b', bloom: '#d7a63c', bloom2: '#a87a20', kind: 'chrys', count: 1 },
      hikae: { stem: '#7d7452', leaf: '#8d8256', bloom: '#a59164', bloom2: '#6e6440', kind: 'seed', count: 4 }
    }
  };

  let state = { vessel: 'suiban', season: 'summer', shin: 12, soe: 45, hikae: 75 };

  function geometry() {
    if (state.vessel === 'cylinder') return { bx: 230, by: 360, top: 336, bottom: 512, kind: 'cylinder' };
    if (state.vessel === 'bamboo') return { bx: 230, by: 330, top: 306, bottom: 512, kind: 'bamboo' };
    return { bx: 230, by: 416, top: 402, bottom: 462, kind: 'suiban' };
  }

  function drawVase() {
    const g = geometry();
    if (g.kind === 'suiban') {
      return `
        <g stroke="#5d5b4c" fill="none" stroke-linecap="round">
          <path d="M96 404h268" stroke-width="1.7"/>
          <path d="M102 404c2 34 30 50 128 50s126-16 128-50" stroke-width="1.5"/>
          <path d="M110 416c24 5 216 5 240 0" stroke-width=".8" opacity=".45"/>
          <path d="M132 456c26 9 170 9 196 0" stroke-width="1.1" opacity=".7"/>
          <path d="M152 460l-7 20M308 460l7 20" stroke-width="1"/>
          <path d="M96 404c0-6 8-9 14-9M364 404c0-6-8-9-14-9" stroke-width="1"/>
        </g>
        <ellipse cx="230" cy="480" rx="120" ry="6" fill="#cfc8b6" opacity=".35"/>`;
    }
    if (g.kind === 'cylinder') {
      return `
        <g stroke="#6a6353" fill="#efe9db" stroke-width="1.4">
          <path d="M172 338h116l-6 168c-1 8-24 12-52 12s-51-4-52-12Z"/>
          <ellipse cx="230" cy="338" rx="58" ry="9" fill="#e2dbc9"/>
          <ellipse cx="230" cy="340" rx="50" ry="6" fill="#c9c9b4" opacity=".55"/>
        </g>
        <path d="M180 360c0 60 3 110 6 140" stroke="#fff" stroke-width="3" opacity=".28" fill="none"/>
        <ellipse cx="230" cy="522" rx="62" ry="6" fill="#cfc8b6" opacity=".4"/>`;
    }
    return `
      <g stroke="#6f6244" fill="#e7dfc6" stroke-width="1.4">
        <path d="M194 310h72v196c0 8-16 12-36 12s-36-4-36-12Z"/>
        <path d="M194 366h72M194 430h72M194 480h72" stroke-width="1.1"/>
        <ellipse cx="230" cy="310" rx="36" ry="6" fill="#d9d0b2"/>
        <ellipse cx="230" cy="312" rx="29" ry="4" fill="#b9b191" opacity=".7"/>
      </g>
      <path d="M200 320c-2 60-1 120 1 170" stroke="#fff" stroke-width="2.4" opacity=".25" fill="none"/>
      <ellipse cx="230" cy="522" rx="44" ry="5" fill="#cfc8b6" opacity=".38"/>`;
  }

  function drawKenzan() {
    const g = geometry();
    const y = g.by;
    let pins = '';
    for (let i = -3; i <= 3; i++) {
      pins += `<path d="M${230 + i * 6} ${y + 4}l0 -6M${230 + i * 6} ${y + 12}l0 -6"/>`;
    }
    return `<circle cx="230" cy="${y + 6}" r="26" stroke-width="1" opacity=".55"/>${pins}`;
  }

  function leafCluster(x, y, angle, s, scale) {
    const leaves = [];
    for (let i = 0; i < 4; i++) {
      const a = angle + (i - 1.5) * 0.5;
      const len = (16 + i * 3) * scale;
      leaves.push(`<ellipse cx="${(x + Math.sin(a) * len * .5).toFixed(1)}" cy="${(y - Math.cos(a) * len * .5).toFixed(1)}" rx="${(3.6 * scale).toFixed(1)}" ry="${(len / 2).toFixed(1)}" transform="rotate(${(a * 180 / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${s.leaf}" opacity=".92"/>`);
    }
    return leaves.join('');
  }

  function flower(x, y, s, scale) {
    const r = 7 * scale;
    if (s.kind === 'lily') {
      let petals = '';
      for (let i = 0; i < 5; i++) {
        const a = i * 72;
        petals += `<ellipse cx="${x}" cy="${(y - r * 1.15).toFixed(1)}" rx="${(r * .42).toFixed(1)}" ry="${(r * 1.25).toFixed(1)}" transform="rotate(${a} ${x} ${y})" fill="${s.bloom}" stroke="${s.bloom2}" stroke-width=".7"/>`;
      }
      return petals + `<circle cx="${x}" cy="${y}" r="${(r * .45).toFixed(1)}" fill="${s.bloom2}"/>`;
    }
    if (s.kind === 'chrys') {
      let petals = '';
      for (let i = 0; i < 14; i++) {
        const a = (i * 360) / 14;
        petals += `<ellipse cx="${x}" cy="${(y - r * .72).toFixed(1)}" rx="${(r * .3).toFixed(1)}" ry="${(r * .8).toFixed(1)}" transform="rotate(${a} ${x} ${y})" fill="${s.bloom}" stroke="${s.bloom2}" stroke-width=".5"/>`;
      }
      return petals + `<circle cx="${x}" cy="${y}" r="${(r * .42).toFixed(1)}" fill="${s.bloom2}"/>`;
    }
    if (s.kind === 'iris') {
      return `<path d="M${x} ${y}c${-r} ${-r} ${-r} ${-r * 2} 0 ${-r * 2.4}c${r} ${r * .4} ${r} ${r * 1.4} 0 ${r * 2.4}Z" fill="${s.bloom}" stroke="${s.bloom2}" stroke-width=".6"/>
        <path d="M${x} ${y}c${-r * 1.3} ${-r * .2} ${-r * 1.5} ${-r} ${-r * .4} ${-r * 1.4}M${x} ${y}c${r * 1.3} ${-r * .2} ${r * 1.5} ${-r} ${r * .4} ${-r * 1.4}" fill="${s.bloom2}" stroke="${s.bloom2}" stroke-width=".5"/>`;
    }
    if (s.kind === 'blossom') {
      let petals = '';
      for (let i = 0; i < 5; i++) {
        const a = i * 72;
        petals += `<circle cx="${x}" cy="${(y - r * .68).toFixed(1)}" r="${(r * .58).toFixed(1)}" transform="rotate(${a} ${x} ${y})" fill="${s.bloom}" stroke="${s.bloom2}" stroke-width=".6"/>`;
      }
      return petals + `<circle cx="${x}" cy="${y}" r="${(r * .2).toFixed(1)}" fill="#b98a3a"/>`;
    }
    return '';
  }

  function drawStem(angle, length, side, s, scale, base) {
    const rad = (angle * Math.PI) / 180;
    const tipX = base.x + side * Math.sin(rad) * length;
    const tipY = base.y - Math.cos(rad) * length;
    const bend = side * length * 0.14;
    const cx1 = base.x + side * length * 0.32 + bend * 0.2;
    const cy1 = base.y - length * 0.42;
    const cx2 = tipX - side * length * 0.12 - bend * 0.1;
    const cy2 = tipY + length * 0.22;
    let out = `<path d="M${base.x} ${base.y}C${cx1.toFixed(1)} ${cy1.toFixed(1)} ${cx2.toFixed(1)} ${cy2.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}" fill="none" stroke="${s.stem}" stroke-width="${((s.kind === "pine" ? 3.1 : 2.4) * scale).toFixed(1)}" stroke-linecap="round"/>`;

    const segments = s.kind === 'grass' || s.kind === 'seed' ? 3 : 2;
    for (let i = 1; i <= segments; i++) {
      const t = i / (segments + 1);
      const px = (1 - t) * (1 - t) * (1 - t) * base.x + 3 * (1 - t) * (1 - t) * t * cx1 + 3 * (1 - t) * t * t * cx2 + t * t * t * tipX;
      const py = (1 - t) * (1 - t) * (1 - t) * base.y + 3 * (1 - t) * (1 - t) * t * cy1 + 3 * (1 - t) * t * t * cy2 + t * t * t * tipY;
      if (s.kind === 'pine') {
        out += `<path d="M${px.toFixed(1)} ${py.toFixed(1)}c${-side * 12 * scale} ${-8 * scale} ${-side * 20 * scale} 2 ${-side * 8 * scale} ${8 * scale}" fill="none" stroke="${s.leaf}" stroke-width="${1.5 * scale}" stroke-linecap="round"/>`;
        out += `<path d="M${px.toFixed(1)} ${py.toFixed(1)}c${side * 9 * scale} ${-9 * scale} ${side * 18 * scale} ${-2 * scale} ${side * 10 * scale} ${7 * scale}" fill="none" stroke="${s.leaf}" stroke-width="${1.3 * scale}" stroke-linecap="round"/>`;
      } else if (s.kind === 'maple') {
        const lx = px + side * 6 * scale;
        out += `<path d="M${lx.toFixed(1)} ${py.toFixed(1)}l${side * 14 * scale} ${-10 * scale}l${side * 4 * scale} ${10 * scale}l${-side * 10 * scale} ${9 * scale}Z" fill="${s.leaf}" opacity=".9"/>`;
      } else if (s.kind === 'seed') {
        out += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${3 * scale}" ry="${5 * scale}" fill="${s.bloom2}" opacity=".8"/>`;
      } else {
        out += leafCluster(px, py, side * (0.5 + t), s, scale);
      }
    }
    if (s.kind !== 'grass' && s.kind !== 'pine' && s.kind !== 'leaf') {
      out += flower(tipX, tipY, s, scale);
      if (s.kind === 'blossom') {
        out += flower(tipX - side * 14 * scale, tipY + 18 * scale, s, scale * 0.7);
      }
    }
    if (s.kind === 'pine') {
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.45;
        out += `<path d="M${tipX.toFixed(1)} ${tipY.toFixed(1)}c${(Math.sin(a) * 14 * scale).toFixed(1)} ${(-Math.cos(a) * 14 * scale).toFixed(1)} ${(Math.sin(a) * 24 * scale).toFixed(1)} ${(-Math.cos(a) * 20 * scale).toFixed(1)} ${(Math.sin(a) * 30 * scale).toFixed(1)} ${(-Math.cos(a) * 16 * scale).toFixed(1)}" fill="none" stroke="${s.leaf}" stroke-width="${1.3 * scale}" stroke-linecap="round"/>`;
      }
    }
    if (s.kind === 'grass') {
      out += `<path d="M${tipX} ${tipY}c${-side * 10} ${-12} ${-side * 18} ${-6} ${-side * 22} ${4}" fill="none" stroke="${s.leaf}" stroke-width="${1.1 * scale}"/>`;
    }
    if (s.kind === 'leaf') {
      out += `<path d="M${tipX} ${tipY}c${-side * 26 * scale} ${-6 * scale} ${-side * 30 * scale} ${24 * scale} ${-side * 4 * scale} ${30 * scale}c${side * 12 * scale} ${-10 * scale} ${side * 12 * scale} ${-22 * scale} ${side * 4 * scale} ${-30 * scale}Z" fill="${s.leaf}" opacity=".9" stroke="${s.bloom2}" stroke-width=".5"/>`;
    }
    return out;
  }

  function render() {
    const g = geometry();
    const season = SEASONS[state.season];
    const scale = state.vessel === 'suiban' ? 1 : 0.92;

    vaseGroup.innerHTML = drawVase();
    kenzanGroup.innerHTML = drawKenzan();
    stemGroup.innerHTML =
      drawStem(state.hikae, 118 * scale, -1, season.hikae, scale, { x: g.bx - 6, y: g.by }) +
      drawStem(state.soe, 168 * scale, 1, season.soe, scale, { x: g.bx + 4, y: g.by }) +
      drawStem(state.shin, 224 * scale, -1, season.shin, scale, { x: g.bx, y: g.by });

    const dev = Math.abs(state.shin - CLASSIC.shin) * 1.7 + Math.abs(state.soe - CLASSIC.soe) * 1.15 + Math.abs(state.hikae - CLASSIC.hikae) * 0.75;
    const score = Math.max(0, Math.min(100, Math.round(100 - dev)));
    scoreNum.textContent = String(score);

    const d = { shin: Math.abs(state.shin - 12), soe: Math.abs(state.soe - 45), hikae: Math.abs(state.hikae - 75) };
    const worst = Object.keys(d).sort((a, b) => d[b] - d[a])[0];
    const where = d[worst] < 4 ? null : worst;

    readList.innerHTML = ANGLE_IDS.map((k) => '<li><span>' + k.charAt(0).toUpperCase() + k.slice(1) + '</span><b>' + state[k] + '°</b></li>').join('') +
      '<li><span>Season</span><b>' + season.label + '</b></li>' +
      '<li><span>Vessel</span><b>' + state.vessel.charAt(0).toUpperCase() + state.vessel.slice(1) + '</b></li>';

    const titles = {
      high: ['Three lines, one breath', 'The room holds still', 'A quiet interval'],
      mid: ['The gesture holds', 'One line finds its place', 'Nearly still'],
      low: ['A full hand', 'The lines argue', 'Something wants to be taken out']
    };
    const band = score >= 90 ? 'high' : score >= 68 ? 'mid' : 'low';
    const title = titles[band][(state.shin + state.soe + state.hikae) % 3];
    readTitle.textContent = season.label + ', ' + state.vessel + ', “' + title + '”';

    let note;
    if (!where) {
      note = 'Shin ' + state.shin + '°, soe ' + state.soe + '°, hikae ' + state.hikae + '°. The classic form: tall and quiet, supported on the right, held low on the left.';
    } else if (where === 'shin') {
      note = 'Shin at ' + state.shin + '° is ' + (state.shin > 12 ? 'leaning further than the classic line' : 'standing too upright') + '. Ten to fifteen degrees is the whole range; beyond it the arrangement is falling.';
    } else if (where === 'soe') {
      note = 'Soe at ' + state.soe + '° is ' + (state.soe > 45 ? 'opening too wide' : 'too close to the shin') + '. It wants about forty-five degrees, two-thirds the height of shin, on the other side.';
    } else {
      note = 'Hikae at ' + state.hikae + '° is ' + (state.hikae > 75 ? 'too flat against the table' : 'sitting too high') + '. It should be low and wide, seventy-five degrees, holding the base down.';
    }
    readNote.textContent = note;

    hint.textContent = where
      ? 'In class, the first attempt is always too full. Take one thing out before you adjust an angle.'
      : 'This is the classic form. Now make it yours: change one angle by five degrees and see if it still breathes.';
  }

  function readState() {
    state.vessel = document.querySelector('input[name="vessel"]:checked').value;
    state.season = document.querySelector('input[name="season"]:checked').value;
    ANGLE_IDS.forEach((k) => {
      state[k] = Number(document.getElementById(k).value);
      document.getElementById(k + 'Out').textContent = state[k] + '°';
    });
  }

  ANGLE_IDS.forEach((k) => {
    document.getElementById(k).addEventListener('input', () => {
      readState();
      render();
    });
  });

  document.querySelectorAll('input[name="vessel"], input[name="season"]').forEach((r) => {
    r.addEventListener('change', () => { readState(); render(); });
  });

  document.getElementById('classicBtn').addEventListener('click', () => {
    ANGLE_IDS.forEach((k) => {
      document.getElementById(k).value = String(CLASSIC[k]);
    });
    readState();
    render();
  });

  document.getElementById('againBtn').addEventListener('click', () => {
    document.querySelector('input[name="vessel"][value="suiban"]').checked = true;
    document.querySelector('input[name="season"][value="summer"]').checked = true;
    ANGLE_IDS.forEach((k) => {
      document.getElementById(k).value = String(CLASSIC[k]);
    });
    readState();
    render();
  });

  readState();
  render();
})();
