const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const baseDir = path.join(__dirname, '../templates/github-pages');
const assetsDir = path.join(__dirname, '../assets/images');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Helper to find all HTML and CSS files in a directory
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.endsWith('.html') || filePath.endsWith('.css')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Find all template directories (those containing an index.html)
function findTemplates(dir, templates = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (fs.existsSync(path.join(filePath, 'index.html'))) {
        templates.push(filePath);
      } else {
        findTemplates(filePath, templates);
      }
    }
  }
  return templates;
}

const templates = findTemplates(baseDir);

const urlRegex = /https:\/\/(?:images\.unsplash\.com|source\.unsplash\.com|images\.pexels\.com)[^\s"'\\)]+/g;

// Only process templates that actually contain unsplash links
const targetTemplates = [];
for (const temp of templates) {
    const indexHtml = path.join(temp, 'index.html');
    if (fs.existsSync(indexHtml)) {
        const content = fs.readFileSync(indexHtml, 'utf8');
        if (content.match(urlRegex)) {
            targetTemplates.push(temp);
            if (targetTemplates.length >= 500) break;
        }
    }
}

const batch = targetTemplates;

console.log(`Found 15 templates with unsplash links. Processing...`);

// To avoid downloading the same image multiple times, and to reuse images
let urlMap = {};
if (fs.existsSync('scratch/urlMap.json')) {
  urlMap = JSON.parse(fs.readFileSync('scratch/urlMap.json', 'utf8'));
}

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function processTemplates() {
  for (const templateDir of batch) {
    console.log(`Processing template: ${path.basename(templateDir)}`);
    const files = findFiles(templateDir);
    
    for (const file of files) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      const matches = [...new Set(content.match(urlRegex) || [])];
      
      for (let originalUrl of matches) {
        let filename;
        if (urlMap[originalUrl]) {
          filename = urlMap[originalUrl];
        } else {
          // Generate a safe filename
          const hash = crypto.createHash('md5').update(originalUrl).digest('hex').substring(0, 8);
          filename = `img_${hash}.jpg`;
          
          let downloadUrl = originalUrl;
          if (downloadUrl.includes('images.unsplash.com')) {
            // Force WebP and smaller width for optimization, ignore original params if they exist
            downloadUrl = downloadUrl.split('?')[0] + '?auto=format&fit=crop&fm=webp&w=800&q=80';
            filename = `img_${hash}.webp`;
          }
          
          const destPath = path.join(assetsDir, filename);
          console.log(`Downloading ${downloadUrl} -> ${filename}`);
          
          try {
            await downloadImage(downloadUrl, destPath);
            urlMap[originalUrl] = filename;
            fs.writeFileSync('scratch/urlMap.json', JSON.stringify(urlMap, null, 2));
          } catch (e) {
            console.error(`Error downloading ${originalUrl}:`, e.message);
            // Fallback to a random existing image
            const existingImages = Object.values(urlMap);
            if (existingImages.length > 0) {
              filename = existingImages[Math.floor(Math.random() * existingImages.length)];
              urlMap[originalUrl] = filename;
              fs.writeFileSync('scratch/urlMap.json', JSON.stringify(urlMap, null, 2));
              console.log(`Fell back to existing image: ${filename}`);
            } else {
              continue; // Skip replacing if no fallback available
            }
          }
        }
        
        const rawGithubUrl = `https://raw.githubusercontent.com/SudiptaSanki/PortfolioBuilder/main/assets/images/${filename}`;
        
        // Replace in content
        content = content.split(originalUrl).join(rawGithubUrl);
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Updated file: ${path.relative(baseDir, file)}`);
      }
    }
  }
  
  console.log('Batch 1 complete!');
}

processTemplates();
