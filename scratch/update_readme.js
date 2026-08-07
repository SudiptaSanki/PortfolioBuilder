const fs = require('fs');

let readme = fs.readFileSync('README.md', 'utf8');

// 1. Update the Vercel showcase link
readme = readme.replace(/https:\/\/portfolio4builders\.vercel\.app/g, 'https://portfoliobuilders.pages.dev');

// 2. Fix the table links. They look like this:
// | [Cyberpunk Developer](./templates/technology/full-stack-developer/html-css-js/cyberpunk-neon) | Full Stack Developer | Cyberpunk Neon Dark (HTML/CSS/JS) | Multi-page | [Preview](https://portfoliobuilders.pages.dev/templates/technology/full-stack-developer/html-css-js/cyberpunk-neon/index.html) |
// We need to:
// a) Change relative link to include `github-pages/` (e.g. `./templates/github-pages/technology/...`) (Assuming all in README are github-pages HTML templates right now)
// b) Change Preview link to use `sudiptasanki.github.io/PortfolioBuilder/`

// First, fix the relative links in the first column
readme = readme.replace(/\]\(\.\/templates\/(?!github-pages|netlify|vercel|firebase)(.*?)\)/g, '](./templates/github-pages/$1)');

// Second, fix the preview links in the last column
readme = readme.replace(/\]\(https:\/\/portfoliobuilders\.pages\.dev\/templates\/(?:github-pages\/)?(.*?)\/index\.html\)/g, '](https://sudiptasanki.github.io/PortfolioBuilder/$1/index.html)');

fs.writeFileSync('README.md', readme);
console.log('README updated successfully!');
