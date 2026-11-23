/* Amelia Esposito — costume atelier
   Nav, the pattern-block drafter and the commission form.
   The drafter is plain SVG arithmetic: inches in, quarter-scale panel out. Silent. */

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

  /* ---------- commission form ---------- */
  const form = document.getElementById('commissionForm');
  if (form) {
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const project = String(data.get('project') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = 'I need your name, a working email and a few lines about the production. A date and a venue help more than a mood board.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Thanks, ' + name.split(' ')[0] + '. Your note about ' + (project || 'a commission') + ' is pinned to the workroom board. I answer on weekday mornings, before the machines start.';
      form.reset();
    });
  }

  /* ---------- pattern drafter ---------- */
  const svgLayer = document.getElementById('patLayer');
  if (!svgLayer) return;

  const waistEl = document.getElementById('waist');
  const hipEl = document.getElementById('hip');
  const lengthEl = document.getElementById('length');
  const seamEl = document.getElementById('seam');
  const yardOut = document.getElementById('yardOut');
  const dartOut = document.getElementById('dartOut');
  const sweepOut = document.getElementById('sweepOut');
  const draftNote = document.getElementById('draftNote');
  const pinnedTag = document.getElementById('pinnedTag');
  const tagLabel = document.getElementById('tagLabel');

  const SA = 0.625;      // inches, 5/8 seam allowance
  const HEM_ALLOW = 1.5; // inches, turned hem

  const FRACTIONS = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];

  function fmt(v, unit) {
    const whole = Math.floor(v + 1e-9);
    const frac = Math.round((v - whole) * 8);
    let out;
    if (frac === 8) out = String(whole + 1);
    else if (frac === 0) out = String(whole);
    else out = (whole === 0 ? '' : String(whole)) + FRACTIONS[frac];
    return out + (unit || '');
  }

  function value(el, min, max, fallback) {
    let v = parseFloat(el.value);
    if (!isFinite(v)) v = fallback;
    return Math.min(max, Math.max(min, v));
  }

  function silhouette() {
    return (document.querySelector('input[name="sil"]:checked') || {}).value || 'aline';
  }

  function measurements() {
    const waist = value(waistEl, 22, 60, 28);
    const hip = value(hipEl, 30, 70, 38);
    const length = value(lengthEl, 16, 40, 26);
    return { waist, hip, length, sil: silhouette(), sa: seamEl.checked };
  }

  function yardage(m) {
    if (m.sil === 'circle') {
      const radius = (m.waist / (2 * Math.PI)) + m.length;
      const diameter = radius * 2;
      const piecesPerWidth = 45 >= diameter ? 1 : 2;
      const yards = piecesPerWidth === 1 ? (diameter + 4) / 36 : (diameter * 2 + 4) / 36;
      return Math.ceil(yards * 8) / 8;
    }
    const base = (m.length + HEM_ALLOW + 3) / 36;
    return Math.ceil((base * (m.sil === 'aline' ? 2 : 1.9)) * 8) / 8;
  }

  function draw() {
    const m = measurements();
    const waistQ = m.waist / 4;
    const hipQ = m.hip / 4;
    const dart = m.sil === 'circle' ? 0 : Math.min(2, Math.max(0.6, (hipQ - waistQ) * 0.55 + 0.4));

    const W = 460, H = 540;
    const padTop = 86, padBottom = 58, padLeft = 96;
    let scale;
    let halfWidth;
    let hemHalf;

    if (m.sil === 'pencil') {
      hemHalf = Math.max(waistQ * 0.9, hipQ - 1.1);
      halfWidth = Math.max(waistQ + dart / 2, hipQ, hemHalf);
    } else if (m.sil === 'aline') {
      hemHalf = hipQ + Math.min(6, m.length * 0.16);
      halfWidth = Math.max(waistQ + dart / 2, hipQ, hemHalf);
    } else {
      const rIn = (m.waist / (2 * Math.PI)) / 4 * 4 / 4; // quarter panel inner radius
      hemHalf = rIn + m.length;
      halfWidth = hemHalf;
    }

    const availH = H - padTop - padBottom;
    const availW = W - padLeft - 44;
    scale = Math.min(availH / (m.length + HEM_ALLOW), availW / (halfWidth + SA + 0.4));
    scale = Math.max(5, Math.min(scale, 16));

    const y0 = padTop;
    const hipDrop = 7;           // inches from waist to hip
    const yHip = y0 + hipDrop * scale;
    const yHem = y0 + m.length * scale;
    const xFold = padLeft - 10;

    let drawing = '';
    let labels = '';

    if (m.sil === 'circle') {
      const rIn = (m.waist / (2 * Math.PI)) / 4 * 4; // inches, quarter of waist arc -> radius
      const rInIn = m.waist / (2 * Math.PI);
      const rOut = rInIn + m.length;
      const cx = W - 54;
      const cy = y0 + 8;
      const s = Math.min((W - 90) / rOut, (H - 150) / rOut);
      const rin = rInIn * s;
      const rout = rOut * s;
      const sa = m.sa ? SA * s : 0;
      const px = (r, a) => [cx - r * Math.cos(a), cy + r * Math.sin(a)];
      const a0 = Math.PI / 2, a1 = Math.PI;
      const p1 = px(rin, a0), p2 = px(rout, a0), p3 = px(rout, a1), p4 = px(rin, a1);
      const q1 = px(rin + sa, a0), q2 = px(rout + sa, a0), q3 = px(rout + sa, a1), q4 = px(rin + sa, a1);
      if (m.sa) {
        drawing += `<path d="M${q1[0].toFixed(1)} ${q1[1].toFixed(1)}A${(rout + sa).toFixed(1)} ${(rout + sa).toFixed(1)} 0 0 0 ${q3[0].toFixed(1)} ${q3[1].toFixed(1)}L${q4[0].toFixed(1)} ${q4[1].toFixed(1)}A${(rin + sa).toFixed(1)} ${(rin + sa).toFixed(1)} 0 0 1 ${q2[0].toFixed(1)} ${q2[1].toFixed(1)}Z" fill="none" stroke="#a6432f" stroke-width="1.1" stroke-dasharray="6 4"/>`;
      }
      drawing += `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${rout.toFixed(1)} ${rout.toFixed(1)} 0 0 0 ${p3[0].toFixed(1)} ${p3[1].toFixed(1)}L${p4[0].toFixed(1)} ${p4[1].toFixed(1)}A${rin.toFixed(1)} ${rin.toFixed(1)} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z" fill="#f3ecdd" stroke="#3a332c" stroke-width="1.3"/>`;
      drawing += `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}M${p3[0].toFixed(1)} ${p3[1].toFixed(1)}L${p4[0].toFixed(1)} ${p4[1].toFixed(1)}" stroke="#3a332c" stroke-width="1.3"/>`;
      // grainline along the diagonal
      const gm = (rin + rout) / 2;
      const g = px(gm, Math.PI * 0.75);
      drawing += `<path d="M${(g[0] - 16).toFixed(1)} ${(g[1] + 16).toFixed(1)}L${(g[0] + 16).toFixed(1)} ${(g[1] - 16).toFixed(1)}" stroke="#3a332c" stroke-width=".8" stroke-dasharray="1 4"/>`;
      drawing += `<path d="M${(g[0] - 5).toFixed(1)} ${(g[1] + 5).toFixed(1)}l-4 8m4-8l8-4" stroke="#3a332c" stroke-width=".8" fill="none"/>`;
      labels += `<text x="${g[0].toFixed(1)}" y="${(g[1] + 26).toFixed(1)}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="7.5" fill="#6a6153" letter-spacing="1">GRAIN</text>`;
      labels += `<text x="${p1[0].toFixed(1)}" y="${(p1[1] - 8).toFixed(1)}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="8" fill="#a6432f">WAIST ${fmt(m.waist, '″')}</text>`;
      labels += `<text x="${(W - 40).toFixed(1)}" y="${(p3[1] - 8).toFixed(1)}" text-anchor="end" font-family="Courier Prime, monospace" font-size="8" fill="#6a6153">HEM ${fmt(2 * Math.PI * rOut, '″')}</text>`;
      labels += `<text x="${cx.toFixed(1)}" y="${(H - 44)}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="8.5" fill="#3a332c" letter-spacing="1">CIRCLE · CUT 2 · ${m.sa ? '⅝ SEAM ALLOWANCE' : 'NO ALLOWANCE'}</text>`;
    } else {
      const waistHalf = (waistQ + dart / 2) * scale;
      const hipHalf = hipQ * scale;
      const hemW = hemHalf * scale;
      const xWaist = xFold + waistHalf;

      // stitching-line panel
      const panel = [
        `M${xFold} ${y0}`,
        `L${(xFold + waistHalf - dart * scale).toFixed(1)} ${y0}`,
        `L${(xFold + waistHalf).toFixed(1)} ${(y0 + 0.35 * scale).toFixed(1)}`,
        `C${(xFold + waistHalf + 0.6 * scale).toFixed(1)} ${(y0 + hipDrop * scale * 0.55).toFixed(1)} ${(xFold + hipHalf - 0.2 * scale).toFixed(1)} ${(yHip - 1.2 * scale).toFixed(1)} ${(xFold + hipHalf).toFixed(1)} ${yHip.toFixed(1)}`,
        `C${(xFold + hipHalf + 0.8 * scale).toFixed(1)} ${(yHip + (yHem - yHip) * 0.4).toFixed(1)} ${(xFold + hemW - 0.4 * scale).toFixed(1)} ${(yHem - 0.5 * scale).toFixed(1)} ${(xFold + hemW).toFixed(1)} ${yHem.toFixed(1)}`,
        `L${xFold} ${yHem.toFixed(1)}`,
        'Z'
      ].join(' ');

      if (m.sa) {
        const saPx = SA * scale;
        drawing += `<path d="M${(xFold - saPx).toFixed(1)} ${(y0 - saPx).toFixed(1)}L${(xFold + waistHalf - dart * scale + saPx).toFixed(1)} ${(y0 - saPx).toFixed(1)}L${(xFold + waistHalf + saPx).toFixed(1)} ${(y0 + 0.35 * scale).toFixed(1)}C${(xFold + waistHalf + saPx + 0.6 * scale).toFixed(1)} ${(y0 + hipDrop * scale * 0.52).toFixed(1)} ${(xFold + hipHalf + saPx).toFixed(1)} ${(yHip - 1.2 * scale).toFixed(1)} ${(xFold + hipHalf + saPx).toFixed(1)} ${yHip.toFixed(1)}C${(xFold + hipHalf + 0.8 * scale + saPx).toFixed(1)} ${(yHip + (yHem - yHip) * 0.42).toFixed(1)} ${(xFold + hemW + saPx).toFixed(1)} ${(yHem - 0.4 * scale).toFixed(1)} ${(xFold + hemW + saPx).toFixed(1)} ${(yHem + saPx).toFixed(1)}L${(xFold - saPx).toFixed(1)} ${(yHem + saPx).toFixed(1)}Z" fill="none" stroke="#a6432f" stroke-width="1.1" stroke-dasharray="6 4"/>`;
      }

      drawing += `<path d="${panel}" fill="#f3ecdd" stroke="#3a332c" stroke-width="1.3"/>`;

      // waist dart
      if (dart > 0.4) {
        const dW = dart * scale;
        const dTopX = xFold + waistHalf * 0.62;
        const depth = Math.min(4.2, m.length * 0.32) * scale;
        drawing += `<path d="M${(dTopX - dW / 2).toFixed(1)} ${y0}L${dTopX.toFixed(1)} ${(y0 + depth).toFixed(1)}L${(dTopX + dW / 2).toFixed(1)} ${y0}" fill="none" stroke="#a6432f" stroke-width="1"/>`;
        drawing += `<text x="${(dTopX + dW / 2 + 5).toFixed(1)}" y="${(y0 + 12).toFixed(1)}" font-family="Courier Prime, monospace" font-size="7" fill="#a6432f">DART</text>`;
      }

      // grainline
      const gx = xFold + Math.min(14, halfWidth * 0.45);
      drawing += `<path d="M${gx.toFixed(1)} ${(y0 + 10).toFixed(1)}V${(yHem - 8).toFixed(1)}" stroke="#3a332c" stroke-width=".7" stroke-dasharray="1 5"/>`;
      drawing += `<path d="M${gx.toFixed(1)} ${(y0 + 12).toFixed(1)}l-3 6m3-6l3 6" stroke="#3a332c" stroke-width=".7" fill="none"/>`;
      labels += `<text x="${(gx + 5).toFixed(1)}" y="${(y0 + 26).toFixed(1)}" font-family="Courier Prime, monospace" font-size="6.5" fill="#6a6153" letter-spacing=".6">GRAIN</text>`;

      // hip notches
      [1, 2].forEach((n) => {
        const nx = xFold + waistHalf + (hipHalf - waistHalf) * (n === 1 ? 0.28 : 0.58);
        drawing += `<path d="M${(nx - 5).toFixed(1)} ${(yHip - 4).toFixed(1)}L${(nx + 4).toFixed(1)} ${(yHip + 3).toFixed(1)}M${(nx - 5).toFixed(1)} ${(yHip + 3).toFixed(1)}L${(nx + 4).toFixed(1)} ${(yHip - 4).toFixed(1)}" stroke="#3a332c" stroke-width=".7"/>`;
      });

      // fold mark
      drawing += `<path d="M${(xFold - 14).toFixed(1)} ${y0}h-14M${(xFold - 14).toFixed(1)} ${yHem.toFixed(1)}h-14" stroke="#6a6153" stroke-width=".8"/>`;
      drawing += `<text x="${(xFold - 32).toFixed(1)}" y="${((y0 + yHem) / 2).toFixed(1)}" transform="rotate(-90 ${(xFold - 32).toFixed(1)} ${((y0 + yHem) / 2).toFixed(1)})" text-anchor="middle" font-family="Courier Prime, monospace" font-size="7.5" fill="#3a332c" letter-spacing="1.4">CUT ON FOLD</text>`;

      // dimension lines
      drawing += `<path d="M${(xFold + waistHalf + 26).toFixed(1)} ${y0}H${(xFold + hipHalf + 30).toFixed(1)}" stroke="#6a6153" stroke-width=".6" stroke-dasharray="2 3"/>`;
      drawing += `<path d="M${(xFold + hipHalf + 30).toFixed(1)} ${yHip}V${yHem.toFixed(1)}" stroke="#6a6153" stroke-width=".6" stroke-dasharray="2 3"/>`;
      drawing += `<text x="${(xFold + waistHalf + 30).toFixed(1)}" y="${(y0 - 6).toFixed(1)}" font-family="Courier Prime, monospace" font-size="7.5" fill="#6a6153">WAIST ${fmt(m.waist, '″')}</text>`;
      labels += `<text x="${(xFold + waistHalf + 34).toFixed(1)}" y="${(y0 + 14).toFixed(1)}" font-family="Courier Prime, monospace" font-size="7.5" fill="#6a6153">HIP ${fmt(m.hip, '″')}</text>`;
      labels += `<text x="${(xFold + 4).toFixed(1)}" y="${(yHem + 18).toFixed(1)}" font-family="Courier Prime, monospace" font-size="7.5" fill="#6a6153">LENGTH ${fmt(m.length, '″')}</text>`;
      labels += `<text x="${(xFold + hemW - 4).toFixed(1)}" y="${(yHem + 18).toFixed(1)}" text-anchor="end" font-family="Courier Prime, monospace" font-size="7.5" fill="#6a6153">HEM ${fmt(hemHalf, '″')}</text>`;
      labels += `<text x="${xFold}" y="${(H - 44)}" font-family="Courier Prime, monospace" font-size="8" fill="#3a332c" letter-spacing="1">FRONT · ${m.sil === 'pencil' ? 'PENCIL' : 'A-LINE'} · CUT 1 ON FOLD</text>`;
      labels += `<text x="${xFold}" y="${(H - 30)}" font-family="Courier Prime, monospace" font-size="7.5" fill="#6a6153" letter-spacing=".6">${m.sa ? '⅝ IN SEAM ALLOWANCE · 1½ IN HEM' : 'NO SEAM ALLOWANCE · 1½ IN HEM'}</text>`;
    }

    svgLayer.innerHTML = drawing + labels;

    // readouts
    const yards = yardage(m);
    yardOut.textContent = fmt(yards, ' yd');
    dartOut.textContent = m.sil === 'circle' ? 'none' : fmt(dart, '″');
    const sweep = m.sil === 'circle'
      ? 2 * Math.PI * ((m.waist / (2 * Math.PI)) + m.length)
      : hemHalf * 2 * 2;
    sweepOut.textContent = fmt(sweep, '″');

    const fabrics = {
      aline: 'Wool crepe or cotton twill, 45 inches wide: two lengths plus a hem. Cut the front on the fold, the back in two with a centre seam.',
      pencil: 'Wool with a little elastane, or a heavy cotton. The walking vent goes in the back seam; cut the front on the fold and interface the waist.',
      circle: 'A soft wool or a crisp cotton, 60 inches wide if you can find it. Two half-circles, one on each selvedge; the grain runs on the diagonal, so let it hang a day before hemming.'
    };
    draftNote.textContent = fabrics[m.sil] + ' Allow ' + (m.sil === 'circle' ? '6' : '3') + ' inches for shrinkage and matching.';
    tagLabel.textContent = 'WAIST ' + fmt(m.waist) + ' · HIP ' + fmt(m.hip) + ' · LEN ' + fmt(m.length);
    if (!pinnedTag.hidden) pinnedTag.hidden = true;
  }

  ['input', 'change'].forEach((evt) => {
    waistEl.addEventListener(evt, draw);
    hipEl.addEventListener(evt, draw);
    lengthEl.addEventListener(evt, draw);
    seamEl.addEventListener(evt, draw);
    document.querySelectorAll('input[name="sil"]').forEach((r) => r.addEventListener(evt, draw));
  });

  document.getElementById('pinBtn').addEventListener('click', () => {
    draw();
    pinnedTag.hidden = false;
  });

  document.getElementById('resetDraft').addEventListener('click', () => {
    waistEl.value = '28';
    hipEl.value = '38';
    lengthEl.value = '26';
    seamEl.checked = true;
    document.querySelector('input[name="sil"][value="aline"]').checked = true;
    pinnedTag.hidden = true;
    draw();
  });

  draw();
})();
