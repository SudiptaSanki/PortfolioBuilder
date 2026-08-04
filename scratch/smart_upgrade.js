const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { execSync } = require('child_process');

const ROOT = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder';
const TEMPLATES_JSON = path.join(ROOT, 'showcase', 'src', 'data', 'templates.json');
const TODO_MD = path.join(ROOT, 'TODO_UPGRADES.md');

const targetIds = [
  'hype-beast',
  'music-producer-vinyl-spin',
  'synthwave-audio',
  'events-dj-club-strobe',
  'bass-drop',
  'da-vinci-precision'
];

let templates = JSON.parse(fs.readFileSync(TEMPLATES_JSON, 'utf8'));
let todo = fs.readFileSync(TODO_MD, 'utf8');

for (const id of targetIds) {
  const t = templates.find(x => x.id === id);
  if (!t) continue;

  const dirPath = path.join(ROOT, t.path);
  const indexHtmlPath = path.join(dirPath, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.log(`Missing: ${indexHtmlPath}`);
    continue;
  }

  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Smart Navigation Injection
  // We look for a <nav> or a .nav or .navbar or <header>
  let $nav = $('nav').first();
  if (!$nav.length) $nav = $('.nav, .navbar, header').first();

  if ($nav.length) {
    // If it already has links, maybe it's already a menu
    // We inject our links into it
    const linksHtml = `
      <div style="display:flex; gap:20px; align-items:center; z-index:100; position:relative;">
        <a href="index.html" style="color:inherit; text-decoration:none; font-weight:bold;">Home</a>
        <a href="about.html" style="color:inherit; text-decoration:none; font-weight:bold;">About</a>
        <a href="projects.html" style="color:inherit; text-decoration:none; font-weight:bold;">Projects</a>
        <a href="contact.html" style="color:inherit; text-decoration:none; font-weight:bold;">Contact</a>
      </div>
    `;
    
    // Check if it has a logo
    const $logo = $nav.find('.logo, h1, h2, a').first();
    if ($logo.length) {
      $logo.after(linksHtml);
    } else {
      $nav.append(linksHtml);
    }
  }

  // Update index.html
  fs.writeFileSync(indexHtmlPath, $.html(), 'utf8');

  // Helper to generate a new page based on the modified index
  const createPage = (filename, title, content) => {
    const $page = cheerio.load($.html());
    $page('title').text(`${t.name} | ${title}`);
    
    // Find the main content area to replace
    // We remove elements that look like the hero, sections, or main
    $page('header.hero, section, main, .hero, .content').remove();

    // Inject the new tailored content before scripts
    const mainHtml = `
      <main style="display:flex; align-items:center; justify-content:center; min-height:80vh; padding:6rem 2rem 2rem; text-align:center;">
        <div style="background:rgba(128,128,128,0.1); padding:3rem; border-radius:12px; max-width:800px; backdrop-filter:blur(10px); color:inherit; border:1px solid rgba(128,128,128,0.2);">
          ${content}
        </div>
      </main>
    `;
    
    const $body = $page('body');
    const $scripts = $body.find('script');
    if ($scripts.length) {
      $scripts.first().before(mainHtml);
    } else {
      $body.append(mainHtml);
    }

    fs.writeFileSync(path.join(dirPath, filename), $page.html(), 'utf8');
  };

  // Generate About
  createPage('about.html', 'About', `
    <h1 style="margin-bottom:1.5rem; font-size:3rem; text-transform:uppercase;">About ${t.name}</h1>
    <p style="font-size:1.2rem; line-height:1.6; margin-bottom:1.5rem;">
      Welcome to my creative space. I am a professional <strong>${t.category.replace('-', ' ')}</strong> focused on delivering high-quality, innovative results.
    </p>
    <p style="font-size:1.1rem; line-height:1.6; opacity:0.8;">
      My work bridges the gap between technical execution and artistic vision. I believe in continuous iteration, exploring new mediums, and crafting digital experiences that resonate deeply with audiences.
    </p>
  `);

  // Generate Projects
  createPage('projects.html', 'Projects', `
    <h1 style="margin-bottom:1rem; font-size:3rem; text-transform:uppercase;">Selected Works</h1>
    <p style="font-size:1.2rem; line-height:1.6; margin-bottom: 2.5rem; opacity:0.8;">A showcase of my recent achievements and explorations in ${t.category.replace('-', ' ')}.</p>
    
    <div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap;">
      <div style="background:rgba(128,128,128,0.1); padding:2rem; border-radius:8px; width:250px; text-align:left; border:1px solid rgba(128,128,128,0.2);">
        <h3 style="font-size:1.4rem; margin-bottom:0.5rem;">Project Alpha</h3>
        <p style="font-size:0.95rem; opacity:0.7;">Commercial commission delivered ahead of schedule with exceptional client feedback.</p>
      </div>
      <div style="background:rgba(128,128,128,0.1); padding:2rem; border-radius:8px; width:250px; text-align:left; border:1px solid rgba(128,128,128,0.2);">
        <h3 style="font-size:1.4rem; margin-bottom:0.5rem;">Project Beta</h3>
        <p style="font-size:0.95rem; opacity:0.7;">Personal conceptual exploration pushing the boundaries of current methodologies.</p>
      </div>
    </div>
  `);

  // Generate Contact
  createPage('contact.html', 'Contact', `
    <h1 style="margin-bottom:1rem; font-size:3rem; text-transform:uppercase;">Let's Collaborate</h1>
    <p style="font-size:1.1rem; line-height:1.6; margin-bottom: 2rem; opacity:0.8;">Interested in hiring a ${t.category.replace('-', ' ')}? Reach out for bookings, inquiries, or just to say hello.</p>
    
    <form style="display:flex; flex-direction:column; gap:15px; text-align:left;">
      <input type="text" placeholder="Your Name" style="padding:12px; border-radius:6px; border:none; outline:none; background:rgba(255,255,255,0.1); font-family:inherit; color:inherit; border:1px solid rgba(128,128,128,0.3);">
      <input type="email" placeholder="Your Email" style="padding:12px; border-radius:6px; border:none; outline:none; background:rgba(255,255,255,0.1); font-family:inherit; color:inherit; border:1px solid rgba(128,128,128,0.3);">
      <textarea placeholder="Your Message" rows="5" style="padding:12px; border-radius:6px; border:none; outline:none; background:rgba(255,255,255,0.1); resize:vertical; font-family:inherit; color:inherit; border:1px solid rgba(128,128,128,0.3);"></textarea>
      <button type="button" style="padding:14px; background:rgba(128,128,128,0.2); color:inherit; font-weight:bold; font-size:1.1rem; border:1px solid rgba(128,128,128,0.5); border-radius:6px; cursor:pointer; text-transform:uppercase; letter-spacing:1px; margin-top:10px;">Send Message</button>
    </form>
  `);

  // Update tags
  if (t.tags.includes('single-page')) {
    t.tags = t.tags.filter(tag => tag !== 'single-page');
    t.tags.push('multi-page');
  }

  // Check off in TODO
  const regex = new RegExp(`- \\[ \\] \\*\\*.*\\*\\* \\(\`${id}\`\\)`);
  todo = todo.replace(regex, match => match.replace('[ ]', '[x]'));

  // Save changes to db and markdown immediately so we can commit
  fs.writeFileSync(TEMPLATES_JSON, JSON.stringify(templates, null, 2), 'utf8');
  fs.writeFileSync(TODO_MD, todo, 'utf8');

  // Push one by one
  console.log(`Committing ${id}...`);
  try {
    execSync(`git add "${t.path}/*" TODO_UPGRADES.md showcase/src/data/templates.json`, { cwd: ROOT });
    execSync(`git commit -m "feat: Upgraded ${id} via smart parsing"`, { cwd: ROOT });
    execSync(`git push`, { cwd: ROOT });
    console.log(`Successfully upgraded and pushed: ${t.name}`);
  } catch (e) {
    console.error(`Git error on ${id}: ${e.message}`);
  }
}

console.log(`\nSmart Upgrade Batch Complete.`);
