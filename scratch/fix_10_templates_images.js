const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder';
const TEMPLATES_JSON_PATH = path.join(ROOT, 'showcase', 'src', 'data', 'templates.json');

// Collection of valid image URLs from Alex-DevDrift/Assets
const ASSET_BASE = 'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images/';

// Curated image subsets from Alex-DevDrift/Assets repo
const IMAGES = {
  photography: [
    ASSET_BASE + 'img_e92bb67a.webp',
    ASSET_BASE + 'img_f46989fa.webp',
    ASSET_BASE + 'img_78dc87ab.webp',
    ASSET_BASE + 'img_d67affb2.webp',
    ASSET_BASE + 'img_dc83cd28.webp',
    ASSET_BASE + 'img_718bbf89.webp',
    ASSET_BASE + 'img_86bbe7b7.webp',
    ASSET_BASE + 'img_4cb6e2c9.webp',
    ASSET_BASE + 'img_a721091d.webp',
    ASSET_BASE + 'img_2e2daebb.webp',
    ASSET_BASE + 'img_5bb26af8.webp',
    ASSET_BASE + 'img_a5da4639.webp'
  ],
  video: [
    ASSET_BASE + 'img_4f1cbf62.webp',
    ASSET_BASE + 'img_4353e6eb.webp',
    ASSET_BASE + 'img_56a29330.webp',
    ASSET_BASE + 'img_80dd74e9.webp',
    ASSET_BASE + 'img_908c1367.webp',
    ASSET_BASE + 'img_74bc9d85.webp',
    ASSET_BASE + 'img_c7c91132.webp',
    ASSET_BASE + 'img_3bd47ef2.webp',
    ASSET_BASE + 'img_f4b96c3d.webp',
    ASSET_BASE + 'img_0245b7d4.webp'
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

const TEMPLATE_CONFIGS = [
  {
    id: "cinematic-scroller",
    path: "templates/github-pages/creative/photographer/html-css-js/cinematic-scroller",
    preview: IMAGES.photography[0],
    imgs: IMAGES.photography
  },
  {
    id: "film-strip-horizontal",
    path: "templates/github-pages/creative/videographer/html-css-js/film-strip-horizontal",
    preview: IMAGES.video[0],
    imgs: IMAGES.video
  },
  {
    id: "mecha-showcase",
    path: "templates/github-pages/technology/robotics-builder/html-css-js/mecha-showcase",
    preview: IMAGES.tech_robotics[0],
    imgs: IMAGES.tech_robotics
  },
  {
    id: "urban-lens",
    path: "templates/github-pages/creative/photographer/html-css-js/urban-lens",
    preview: IMAGES.photography[3],
    imgs: IMAGES.photography
  },
  {
    id: "drone-swarm-gallery",
    path: "templates/github-pages/technology/robotics-builder/html-css-js/drone-swarm-gallery",
    preview: IMAGES.tech_robotics[2],
    imgs: IMAGES.tech_robotics
  },
  {
    id: "reel-panoramas",
    path: "templates/github-pages/creative/videographer/html-css-js/reel-panoramas",
    preview: IMAGES.video[2],
    imgs: IMAGES.video
  },
  {
    id: "servo-motion",
    path: "templates/github-pages/technology/robotics-builder/html-css-js/servo-motion",
    preview: IMAGES.tech_robotics[4],
    imgs: IMAGES.tech_robotics
  },
  {
    id: "event-chronicle",
    path: "templates/github-pages/creative/photojournalist/html-css-js/event-chronicle",
    preview: IMAGES.photography[6],
    imgs: IMAGES.photography
  },
  {
    id: "slow-pan-studio",
    path: "templates/github-pages/creative/videographer/html-css-js/slow-pan-studio",
    preview: IMAGES.video[4],
    imgs: IMAGES.video
  },
  {
    id: "nature-focus",
    path: "templates/github-pages/creative/photographer/html-css-js/nature-focus",
    preview: IMAGES.nature[0],
    imgs: IMAGES.nature
  }
];

// 1. Update templates.json
const rawData = fs.readFileSync(TEMPLATES_JSON_PATH, 'utf8');
const templates = JSON.parse(rawData);

TEMPLATE_CONFIGS.forEach(cfg => {
  const t = templates.find(item => item.id === cfg.id);
  if (t) {
    t.preview = cfg.preview;
    console.log(`Updated preview for ${cfg.id}`);
  } else {
    console.warn(`Template ${cfg.id} not found in templates.json`);
  }
});

fs.writeFileSync(TEMPLATES_JSON_PATH, JSON.stringify(templates, null, 2));
console.log('templates.json saved.');

// Helper to update index.html & style.css inside template dirs
TEMPLATE_CONFIGS.forEach(cfg => {
  const templateDir = path.join(ROOT, cfg.path);
  const publicDir = path.join(ROOT, 'showcase', 'public', cfg.path);

  const indexPath = path.join(templateDir, 'index.html');
  const stylePath = path.join(templateDir, 'style.css');

  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Replace placeholder img-inner divs with real img tags
    let imgIdx = 0;
    html = html.replace(/<div class="img-card"><div class="img-inner"><span>(.*?)<\/span><\/div><\/div>/g, (match, label) => {
      const imgUrl = cfg.imgs[imgIdx % cfg.imgs.length];
      imgIdx++;
      return `<div class="img-card"><div class="img-inner"><img src="${imgUrl}" alt="${label}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" /><span>${label}</span></div></div>`;
    });

    // Handle generic img-card replacements if present
    html = html.replace(/<div class="img-card"><span>(.*?)<\/span><\/div>/g, (match, label) => {
      const imgUrl = cfg.imgs[imgIdx % cfg.imgs.length];
      imgIdx++;
      return `<div class="img-card"><img src="${imgUrl}" alt="${label}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" /><span class="label">${label}</span></div>`;
    });

    fs.writeFileSync(indexPath, html);
    console.log(`Updated ${indexPath}`);

    // Sync to publicDir if it exists
    if (fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(path.join(publicDir, 'index.html'), html);
      if (fs.existsSync(stylePath)) {
        fs.copyFileSync(stylePath, path.join(publicDir, 'style.css'));
      }
    }
  }

  // Update style.css to ensure img-inner positions images nicely
  if (fs.existsSync(stylePath)) {
    let css = fs.readFileSync(stylePath, 'utf8');
    if (!css.includes('.img-inner img')) {
      css += `\n.img-inner { position: relative; overflow: hidden; }\n.img-inner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }\n.img-inner span { position: relative; z-index: 1; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }\n`;
      fs.writeFileSync(stylePath, css);
      if (fs.existsSync(publicDir)) {
        fs.writeFileSync(path.join(publicDir, 'style.css'), css);
      }
    }
  }
});

console.log('All 10 templates updated successfully!');
