# Portfolio Builder — Open Source Template Gallery

A growing, open-source collection of professionally designed portfolio templates for every industry, profession, and tech stack. Our goal is to reach **1000+ templates** with the help of contributors from around the world.

---

## Live Showcase

Browse all templates with live search and filtering at the showcase site (deploy from `showcase/` on Vercel).

---

## Template Categories

Templates are organized with the following deep structure:

```
templates/
  [industry]/
    [profession]/
      [stack]/          ← html-css-js | react | nextjs | vue | etc.
        [theme-name]/   ← the actual template folder
```

### Current Categories

| Industry | Professions Covered |
|---|---|
| `technology` | Full Stack Developer, Software Engineer, Data Scientist, DevOps, Game Developer |
| `creative` | UI/UX Designer, Video Editor, Photographer, Musician, Animator, Graphic Designer |
| `business` | Real Estate Agent, Marketing Consultant, Entrepreneur, Accountant |
| `academic` | Journalist, Author, Researcher, Professor, Teacher |
| `health-wellness` | Personal Trainer, Nutritionist, Therapist, Doctor |
| `services` | Chef, Event Planner, Interior Designer, Freelancer |

---

## Available Templates (10)

### Technology

| Template | Role | Theme | Stack |
|---|---|---|---|
| [Cyberpunk Neon](./templates/technology/full-stack-developer/html-css-js/cyberpunk-neon) | Full Stack Developer | Dark Cyberpunk | HTML/CSS/JS |
| [Tech Terminal](./templates/technology/software-engineer/html-css-js/tech-terminal) | Software Engineer | Terminal Modern | HTML/CSS/JS |

### Creative

| Template | Role | Theme | Stack |
|---|---|---|---|
| [Minimal Glassmorphism](./templates/creative/ui-ux-designer/html-css-js/minimal-glassmorphism) | UI/UX Designer | Glassmorphism | HTML/CSS/JS |
| [Cinematic Dark](./templates/creative/video-editor/html-css-js/cinematic-dark) | Video Editor | Cinematic | HTML/CSS/JS |
| [Minimal Monochrome](./templates/creative/photographer/html-css-js/minimal-monochrome) | Photographer | B&W Editorial | HTML/CSS/JS |
| [Grunge Tour](./templates/creative/musician/html-css-js/grunge-tour) | Musician / Band | Grunge Rock | HTML/CSS/JS |

### Business

| Template | Role | Theme | Stack |
|---|---|---|---|
| [Luxury Trust](./templates/business/real-estate/html-css-js/luxury-trust) | Real Estate Agent | Luxury Gold/Navy | HTML/CSS/JS |

### Academic

| Template | Role | Theme | Stack |
|---|---|---|---|
| [Classic Editorial](./templates/academic/journalist/html-css-js/classic-editorial) | Journalist / Author | Newspaper Editorial | HTML/CSS/JS |

### Health & Wellness

| Template | Role | Theme | Stack |
|---|---|---|---|
| [Bold Energy](./templates/health-wellness/fitness/html-css-js/bold-energy) | Personal Trainer | Yellow/Black Energy | HTML/CSS/JS |

### Services

| Template | Role | Theme | Stack |
|---|---|---|---|
| [Elegant Restaurant](./templates/services/culinary/html-css-js/elegant-restaurant) | Chef / Culinary | Warm Elegant | HTML/CSS/JS |

---

## How to Use a Template

1. Clone or download this repository.
2. Navigate to the template folder of your choice.
3. Open `index.html` in your browser to preview locally.
4. Edit the HTML files, update the CSS variables, and personalize the content.
5. Configure the contact form using [EmailJS](https://emailjs.com/) or [Formspree](https://formspree.io/).
6. Deploy to [Netlify](https://netlify.com), [Vercel](https://vercel.com), or [GitHub Pages](https://pages.github.com/).

---

## Showcase Website

The `showcase/` folder contains a Next.js application that catalogs all templates with real-time search and filtering.

```bash
cd showcase
npm install
npm run dev
```

---

## Contributing

**We welcome contributions from developers, designers, and creators of all skill levels.**

This project's goal is to build the largest open-source portfolio template collection in the world — one that covers every profession, style, and tech stack. We can't do it alone.

### How to Contribute a Template

1. **Fork** this repository.
2. **Create a new template** following the directory structure:
   ```
   templates/[industry]/[profession]/[stack]/[your-theme-name]/
   ```
3. Ensure your template includes:
   - A working `index.html` (or equivalent entry point for your framework).
   - A `README.md` inside the template folder describing the theme, features, and how to use it.
   - Responsive design (works on mobile and desktop).
   - A contact form (or instructions for integrating one).
4. **Add your template** to `showcase/src/data/templates.json` following the existing format.
5. **Open a Pull Request** with a clear description of your template (role, theme, stack, key features).

### Contribution Guidelines

- Any tech stack is welcome: HTML/CSS/JS, React, Next.js, Vue, Svelte, Angular, etc.
- Any profession or industry is welcome — the more niche, the better.
- Any visual style or theme is welcome: dark, light, minimal, maximalist, futuristic, retro, etc.
- Keep templates self-contained and free of paid dependencies.
- Do not include copyrighted images. Use [Unsplash](https://unsplash.com/) or similar free resources.

### Ideas for New Templates

Need inspiration? Here are some professions that still need templates:

- Data Scientist, ML Engineer, DevOps Engineer, Game Developer
- Graphic Designer, Animator, 3D Artist, Illustrator, Architect
- Marketing Consultant, Financial Advisor, Startup Founder
- Doctor, Dentist, Therapist, Nutritionist
- Interior Designer, Event Planner, Wedding Photographer
- Teacher, Researcher, PhD Student, Scientist

---

## License

All templates in this repository are available under the [MIT License](./LICENSE). Free for personal and commercial use. Attribution appreciated but not required.

---

*Built with love for the open-source community. Star the repo if you find it useful.*
