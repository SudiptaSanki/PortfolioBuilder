const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../templates/github-pages');
const oldUrl = 'https://raw.githubusercontent.com/SudiptaSanki/PortfolioBuilder/main/assets/images/';
const newUrl = 'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images/';

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

const allFiles = findFiles(baseDir);
let changedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldUrl)) {
    content = content.split(oldUrl).join(newUrl);
    fs.writeFileSync(file, content);
    changedCount++;
  }
}

console.log(`Updated ${changedCount} files with new Assets repo URLs.`);
