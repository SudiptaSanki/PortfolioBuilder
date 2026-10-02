# Contributing to Portfolio Builder

Thank you for your interest in contributing! Portfolio Builder is an open-source catalog designed to scale to 100,000+ free portfolio templates.

Our architecture is **provider-independent**: templates can be hosted on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or your own infrastructure without changing their identity in the catalog.

---

## ⚡ Quick Contributor Workflow

1. **Fork and clone** the repository.
2. **Create your template folder** under `templates/<framework>/<provider>/<genre>/<role>/<theme-name>/` (or `templates/<theme-name>/`).
3. **Add your source code** (Ensure all HTML/CSS/JS assets use relative paths).
4. **Create `template.json`** inside your template folder (never manually edit the central catalog!).
5. **Run automated validation locally**:
   ```bash
   npm run validate
   ```
6. **Compile the catalog**:
   ```bash
   npm run catalog:generate
   ```
7. **Submit a Pull Request** — GitHub Actions CI will automatically validate your template.

---

## 🔒 Contributor Hosting Ownership Contract

You have full ownership of your deployment:

- **For Static HTML/CSS/JS:** Your template can automatically be deployed to our shared static hosting pool (`github-pages-01`). You don't need any hosting account!
- **For React, Vue, Next.js SSR, or Custom Backends:** You can deploy your template on your **own free-tier hosting account** (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or a custom domain).
- **Zero Credentials Needed:** We will **never** ask for your Vercel token, Netlify credentials, or Cloudflare API keys. You simply provide your live preview URL in `template.json`.
- **Permanent Template Identity:** If your personal hosting node ever goes offline, your template is not deleted from the catalog. It is simply marked as `status: "broken"` or `status: "pending"` with direct links to your source code on GitHub until a new URL is registered.

---

## 📖 Detailed Submission Guide

For the full specification, metadata schema, asset path rules, and local preview instructions, read:
👉 **[Template Submission Guide](docs/contributing/template-submission.md)**

---

## Code of Conduct

Be respectful, welcoming, and supportive. We are building the world's most accessible open-source portfolio directory together.
