const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source folder does not exist: ${src}`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy from root templates/ to showcase/public/templates/
const srcTemplates = path.join(__dirname, '..', 'templates');
const destTemplates = path.join(__dirname, 'public', 'templates');

console.log(`Copying templates from ${srcTemplates} to ${destTemplates}...`);
try {
  copyDirRecursive(srcTemplates, destTemplates);
  console.log('Templates copied successfully!');
} catch (err) {
  console.error('Failed to copy templates:', err);
  process.exit(1);
}
