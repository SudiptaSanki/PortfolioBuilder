# Portfolio Builder Templates

Welcome to the Portfolio Builder Templates collection. This repository contains 5 complete, ready-to-use HTML/CSS/JS portfolio website templates designed for different professionals.

## 🚀 The Templates

Click on the links below to view the source code and instructions for each specific template.

### 1. [Developer Portfolio](./developer-portfolio)
**Theme:** Cyberpunk / Neon Dark
**Ideal For:** Full Stack Developers, Game Developers, Tech Enthusiasts
**Key Features:**
- Typing text effect
- Dark/Light mode toggle
- Cyberpunk aesthetic with neon accents

### 2. [UI/UX Designer Portfolio](./designer-portfolio)
**Theme:** Clean Minimal / Glassmorphism
**Ideal For:** UI/UX Designers, Product Designers, Web Designers
**Key Features:**
- Soft gradients and glassmorphism elements
- Clean, typography-focused layout
- Dark/Light mode toggle

### 3. [Video Editor Portfolio](./editor-portfolio)
**Theme:** Cinematic Dark
**Ideal For:** Video Editors, Filmmakers, Colorists, Motion Graphics Artists
**Key Features:**
- Fullscreen background video hero section
- Sharp edges, dark theme with high-contrast accents
- Heavy focus on visual content over text

### 4. [Photographer Portfolio](./photographer-portfolio)
**Theme:** Minimalist Black & White
**Ideal For:** Photographers, Fine Artists, Fashion Designers
**Key Features:**
- Masonry image gallery layout
- Fullscreen automatic hero image slider
- Built-in custom lightbox for viewing images

### 5. [Software Engineer Portfolio](./engineer-portfolio)
**Theme:** Sleek Modern Tech (Terminal Inspired)
**Ideal For:** Software Engineers, Backend Devs, Systems Engineers, DevOps
**Key Features:**
- Navy/Cyan color palette with monospace typography
- Custom hide-on-scroll down, show-on-scroll up navbar
- Tabular archive format for technical projects

## 🛠️ Global Features

All templates in this repository share the following best practices:
- **Zero Dependencies**: Pure HTML, CSS (Vanilla), and JavaScript. No build tools required (no NPM, no Webpack).
- **Fully Responsive**: Mobile-first design principles ensure the sites look perfect on any screen size.
- **Custom CSS Variables**: Easy global theme changing by just editing the `:root` variables in `style.css`.
- **Working Contact Forms**: Pre-configured structure to easily plug in [EmailJS](https://www.emailjs.com/) or [Formspree](https://formspree.io/) for free form-to-email functionality without a backend.
- **Smooth Animations**: Intersection Observer API used for performant scroll-reveal animations.

## 📝 How to Use

1. **Clone or Download** this repository.
2. **Choose a template** folder that suits your needs.
3. **Open the `index.html`** file in your browser to preview it locally.
4. **Edit the HTML files** to replace the placeholder text and images with your own content.
5. **Configure the Contact Form** (see below).
6. **Deploy** by dragging and dropping the folder into [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/), or [GitHub Pages](https://pages.github.com/).

### Setting up EmailJS for Contact Forms

All forms are pre-scripted to work with EmailJS. To activate them:

1. Sign up for a free account at [EmailJS.com](https://www.emailjs.com/).
2. Add an Email Service (e.g., Gmail).
3. Create an Email Template.
4. Get your `Public Key`, `Service ID`, and `Template ID`.
5. Open the target template's HTML files (e.g., `contact.html` and `index.html`).
6. Replace `YOUR_PUBLIC_KEY` in the `<head>` script tag.
7. Open the template's `js/main.js` file.
8. Replace `YOUR_SERVICE_ID` and `YOUR_Template_ID` inside the `initContactForm()` function.

## 📄 License
These templates are free to use for personal and commercial projects. Feel free to modify them to fit your exact needs!
