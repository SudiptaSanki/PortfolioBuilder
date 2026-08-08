const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder';
const ASSET_BASE = 'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images/';

const IMAGES = {
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
  { id: "slow-pan-studio", dir: "templates/github-pages/creative/videographer/html-css-js/slow-pan-studio", tag: "panel-visual", imgs: IMAGES.video },
  { id: "nature-focus", dir: "templates/github-pages/creative/photographer/html-css-js/nature-focus", tag: "nature-img", imgs: IMAGES.nature }
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
  const regex = new RegExp(`<div class="${t.tag}"><\\/div>`, 'g');

  html = html.replace(regex, () => {
    const url = t.imgs[imgIdx % t.imgs.length];
    imgIdx++;
    return `<div class="${t.tag}" style="position:relative;overflow:hidden;"><img src="${url}" alt="Visual" style="width:100%;height:100%;object-fit:cover;" /></div>`;
  });

  fs.writeFileSync(htmlPath, html);
  console.log(`Inserted ${imgIdx} images into ${t.id}`);

  // Mirror to showcase/public
  fs.mkdirSync(pDir, { recursive: true });
  fs.writeFileSync(path.join(pDir, 'index.html'), html);
  if (fs.existsSync(stylePath)) {
    fs.writeFileSync(path.join(pDir, 'style.css'), css);
  }
});

console.log('Finished updating remaining 2 templates!');
