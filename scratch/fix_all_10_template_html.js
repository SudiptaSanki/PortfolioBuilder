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
  {
    id: "cinematic-scroller",
    dir: "templates/github-pages/creative/photographer/html-css-js/cinematic-scroller",
    imgs: IMAGES.photography
  },
  {
    id: "film-strip-horizontal",
    dir: "templates/github-pages/creative/videographer/html-css-js/film-strip-horizontal",
    imgs: IMAGES.video
  },
  {
    id: "mecha-showcase",
    dir: "templates/github-pages/technology/robotics-builder/html-css-js/mecha-showcase",
    imgs: IMAGES.tech_robotics
  },
  {
    id: "urban-lens",
    dir: "templates/github-pages/creative/photographer/html-css-js/urban-lens",
    imgs: IMAGES.photography
  },
  {
    id: "drone-swarm-gallery",
    dir: "templates/github-pages/technology/robotics-builder/html-css-js/drone-swarm-gallery",
    imgs: IMAGES.tech_robotics
  },
  {
    id: "reel-panoramas",
    dir: "templates/github-pages/creative/videographer/html-css-js/reel-panoramas",
    imgs: IMAGES.video
  },
  {
    id: "servo-motion",
    dir: "templates/github-pages/technology/robotics-builder/html-css-js/servo-motion",
    imgs: IMAGES.tech_robotics
  },
  {
    id: "event-chronicle",
    dir: "templates/github-pages/creative/photojournalist/html-css-js/event-chronicle",
    imgs: IMAGES.photography
  },
  {
    id: "slow-pan-studio",
    dir: "templates/github-pages/creative/videographer/html-css-js/slow-pan-studio",
    imgs: IMAGES.video
  },
  {
    id: "nature-focus",
    dir: "templates/github-pages/creative/photographer/html-css-js/nature-focus",
    imgs: IMAGES.nature
  }
];

TEMPLATES.forEach(t => {
  const tDir = path.join(ROOT, t.dir);
  const pDir = path.join(ROOT, 'showcase', 'public', t.dir);
  const htmlPath = path.join(tDir, 'index.html');
  const stylePath = path.join(tDir, 'style.css');

  if (!fs.existsSync(htmlPath)) {
    console.error('File not found: ' + htmlPath);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  let css = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf8') : '';

  // Generic inner container regex patterns
  // Replace inner frame / card divs with <img src="..." />
  let imgCount = 0;

  // Pattern 1: <div class="frame-inner">...</div>
  html = html.replace(/<div class="frame-inner">(.*?)<\/div>/g, (m, inner) => {
    const url = t.imgs[imgCount % t.imgs.length];
    imgCount++;
    return `<div class="frame-inner"><img src="${url}" alt="Frame" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" /><div style="position:relative;z-index:1;">${inner}</div></div>`;
  });

  // Pattern 2: <div class="card-inner">...</div>
  html = html.replace(/<div class="card-inner">(.*?)<\/div>/g, (m, inner) => {
    const url = t.imgs[imgCount % t.imgs.length];
    imgCount++;
    return `<div class="card-inner"><img src="${url}" alt="Card" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" /><div style="position:relative;z-index:1;">${inner}</div></div>`;
  });

  // Pattern 3: <div class="item-inner">...</div>
  html = html.replace(/<div class="item-inner">(.*?)<\/div>/g, (m, inner) => {
    const url = t.imgs[imgCount % t.imgs.length];
    imgCount++;
    return `<div class="item-inner"><img src="${url}" alt="Item" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" /><div style="position:relative;z-index:1;">${inner}</div></div>`;
  });

  // Pattern 4: <div class="strip-item">...</div>
  html = html.replace(/<div class="strip-item">(.*?)<\/div>/g, (m, inner) => {
    const url = t.imgs[imgCount % t.imgs.length];
    imgCount++;
    return `<div class="strip-item" style="position:relative;overflow:hidden;"><img src="${url}" alt="Strip" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" /><div style="position:relative;z-index:1;">${inner}</div></div>`;
  });

  // Pattern 5: Any remaining <div class="*inner*"> without img
  html = html.replace(/<div class="([^"]*inner[^"]*)">(?![\s\S]*?<img)(.*?)<\/div>/g, (m, cName, inner) => {
    const url = t.imgs[imgCount % t.imgs.length];
    imgCount++;
    return `<div class="${cName}" style="position:relative;overflow:hidden;"><img src="${url}" alt="Media" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" /><div style="position:relative;z-index:1;">${inner}</div></div>`;
  });

  fs.writeFileSync(htmlPath, html);
  console.log(`Updated images for ${t.id} (${imgCount} images inserted)`);

  // Ensure CSS handles relative / absolute positioning cleanly
  if (!css.includes('.img-overlay-fix')) {
    css += `\n/* Image Overlay Fix */\n.frame-inner, .card-inner, .item-inner, .img-inner { position: relative !important; overflow: hidden !important; }\n.frame-inner img, .card-inner img, .item-inner img, .img-inner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }\n`;
    fs.writeFileSync(stylePath, css);
  }

  // Copy to showcase/public
  fs.mkdirSync(pDir, { recursive: true });
  fs.writeFileSync(path.join(pDir, 'index.html'), html);
  if (fs.existsSync(stylePath)) {
    fs.writeFileSync(path.join(pDir, 'style.css'), css);
  }
});

console.log('Finished updating all template images!');
