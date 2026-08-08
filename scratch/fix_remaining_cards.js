const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder';
const ASSET_BASE = 'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images/';

const IMAGES = {
  photography: [
    ASSET_BASE + 'img_e92bb67a.webp',
    ASSET_BASE + 'img_f46989fa.webp',
    ASSET_BASE + 'img_78dc87ab.webp',
    ASSET_BASE + 'img_d67affb2.webp',
    ASSET_BASE + 'img_dc83cd28.webp',
    ASSET_BASE + 'img_718bbf89.webp',
    ASSET_BASE + 'img_86bbe7b7.webp',
    ASSET_BASE + 'img_4cb6e2c9.webp'
  ],
  video: [
    ASSET_BASE + 'img_4f1cbf62.webp',
    ASSET_BASE + 'img_4353e6eb.webp',
    ASSET_BASE + 'img_56a29330.webp',
    ASSET_BASE + 'img_80dd74e9.webp',
    ASSET_BASE + 'img_908c1367.webp',
    ASSET_BASE + 'img_74bc9d85.webp',
    ASSET_BASE + 'img_c7c91132.webp',
    ASSET_BASE + 'img_3bd47ef2.webp'
  ],
  tech_robotics: [
    ASSET_BASE + 'img_7b6058b9.webp',
    ASSET_BASE + 'img_26904803.webp',
    ASSET_BASE + 'img_05c80816.webp',
    ASSET_BASE + 'img_6a5ec629.webp',
    ASSET_BASE + 'img_5bfe32c1.webp',
    ASSET_BASE + 'img_19a2f51b.webp',
    ASSET_BASE + 'img_bd2be5a4.webp',
    ASSET_BASE + 'img_7fb33731.webp'
  ],
  nature: [
    ASSET_BASE + 'img_0e613989.webp',
    ASSET_BASE + 'img_8cd55c4f.webp',
    ASSET_BASE + 'img_0323e730.webp',
    ASSET_BASE + 'img_2c42e6c2.webp',
    ASSET_BASE + 'img_81626282.webp',
    ASSET_BASE + 'img_913e4f96.webp',
    ASSET_BASE + 'img_86299927.webp',
    ASSET_BASE + 'img_6ed4392e.webp'
  ]
};

const TEMPLATES = [
  { id: "mecha-showcase", dir: "templates/github-pages/technology/robotics-builder/html-css-js/mecha-showcase", classPattern: "mecha-card", imgs: IMAGES.tech_robotics },
  { id: "drone-swarm-gallery", dir: "templates/github-pages/technology/robotics-builder/html-css-js/drone-swarm-gallery", classPattern: "drone-card", imgs: IMAGES.tech_robotics },
  { id: "servo-motion", dir: "templates/github-pages/technology/robotics-builder/html-css-js/servo-motion", classPattern: "servo-card", imgs: IMAGES.tech_robotics },
  { id: "event-chronicle", dir: "templates/github-pages/creative/photojournalist/html-css-js/event-chronicle", classPattern: "event-card", imgs: IMAGES.photography },
  { id: "slow-pan-studio", dir: "templates/github-pages/creative/videographer/html-css-js/slow-pan-studio", classPattern: "pan-card", imgs: IMAGES.video },
  { id: "nature-focus", dir: "templates/github-pages/creative/photographer/html-css-js/nature-focus", classPattern: "nature-card", imgs: IMAGES.nature }
];

TEMPLATES.forEach(t => {
  const tDir = path.join(ROOT, t.dir);
  const pDir = path.join(ROOT, 'showcase', 'public', t.dir);
  const htmlPath = path.join(tDir, 'index.html');
  const stylePath = path.join(tDir, 'style.css');

  if (!fs.existsSync(htmlPath)) return;

  let html = fs.readFileSync(htmlPath, 'utf8');
  let css = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf8') : '';

  let imgIdx = 0;
  // Match <div class="CARDCLASS">...</div>
  const regex = new RegExp(`<div class="${t.classPattern}">([\\s\\S]*?)<\\/div>`, 'g');

  html = html.replace(regex, (match, inner) => {
    if (inner.includes('<img')) return match;
    const url = t.imgs[imgIdx % t.imgs.length];
    imgIdx++;
    return `<div class="${t.classPattern}" style="position:relative;overflow:hidden;min-height:260px;background:#000;"><img src="${url}" alt="Card background" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.4;z-index:0;" /><div style="position:relative;z-index:1;padding:1.5rem;">${inner}</div></div>`;
  });

  fs.writeFileSync(htmlPath, html);
  console.log(`Inserted ${imgIdx} images into ${t.id}`);

  if (!css.includes(`.${t.classPattern} img`)) {
    css += `\n.${t.classPattern} { position: relative !important; overflow: hidden !important; }\n.${t.classPattern} img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0.4; }\n.${t.classPattern} > * { position: relative; z-index: 1; }\n`;
    fs.writeFileSync(stylePath, css);
  }

  // Mirror to showcase/public
  fs.mkdirSync(pDir, { recursive: true });
  fs.writeFileSync(path.join(pDir, 'index.html'), html);
  if (fs.existsSync(stylePath)) {
    fs.writeFileSync(path.join(pDir, 'style.css'), css);
  }
});

console.log('Finished updating remaining card templates!');
