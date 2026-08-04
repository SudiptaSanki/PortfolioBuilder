const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder';
const TEMPLATES_JSON = path.join(ROOT, 'showcase', 'src', 'data', 'templates.json');

const templates = JSON.parse(fs.readFileSync(TEMPLATES_JSON, 'utf8'));

// Target platforms
const PLATFORM_MAP = {
  'HTML/CSS/JS': 'github-pages',
  'html-css-js': 'github-pages',
  'React': 'netlify',
  'Vue': 'netlify',
  'Next.js': 'vercel'
};

const updatedTemplates = templates.map(t => {
  const platform = PLATFORM_MAP[t.stack] || 'github-pages'; // fallback
  const currentPath = path.join(ROOT, t.path);
  
  // Example current path: templates/technology/game-dev/html-css-js/pixel-retro
  // New path should insert the platform after 'templates'
  // i.e. templates/github-pages/technology/game-dev/html-css-js/pixel-retro
  
  const pathParts = t.path.split('/');
  if (pathParts[0] === 'templates' && pathParts[1] !== 'github-pages' && pathParts[1] !== 'netlify' && pathParts[1] !== 'vercel' && pathParts[1] !== 'cloudflare') {
    pathParts.splice(1, 0, platform);
  }
  
  const newRelPath = pathParts.join('/');
  const newAbsPath = path.join(ROOT, newRelPath);
  
  if (fs.existsSync(currentPath) && currentPath !== newAbsPath) {
    fs.mkdirSync(path.dirname(newAbsPath), { recursive: true });
    
    // Instead of renaming the leaf folder (which might fail if parents don't exist in sequence),
    // renameSync moves the entire folder to the new location.
    try {
      fs.renameSync(currentPath, newAbsPath);
      console.log(`Moved: ${t.id} -> ${platform}`);
    } catch (e) {
      console.error(`Error moving ${t.id}:`, e);
    }
  } else if (!fs.existsSync(currentPath) && !fs.existsSync(newAbsPath)) {
    console.log(`Missing both: ${currentPath}`);
  }
  
  t.path = newRelPath;
  return t;
});

fs.writeFileSync(TEMPLATES_JSON, JSON.stringify(updatedTemplates, null, 2));
console.log("templates.json updated successfully.");
