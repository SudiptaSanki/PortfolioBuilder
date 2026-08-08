# Portfolio Builder Guidelines & Rules

## Asset & Image Management Rules

1. **Permanent Asset Storage**:
   - All image assets (backgrounds, project screenshots, avatars, mockups, gallery images) MUST be stored in the dedicated external assets repository:
     `https://github.com/Alex-DevDrift/Assets/tree/main/portfoliobuilders/images`
   - Image URLs used in template HTML, CSS, JS, and `showcase/src/data/templates.json` MUST follow the exact format:
     `https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images/<filename>`

2. **No Unsplash / External Links as Dependencies**:
   - Avoid direct Unsplash/third-party image URL dependencies in final production templates to prevent broken links or quota exhaustion.
   - Do NOT store large raw image files directly in the main `PortfolioBuilder` repository to keep git clone sizes small and prevent quota exhaustion.

3. **Template Preview Property Requirement**:
   - Every single template defined in `showcase/src/data/templates.json` MUST have a valid `"preview"` attribute pointing to a hosted image URL on `Alex-DevDrift/Assets`.
   - Never leave `"preview"` blank or missing when creating or adding new portfolio templates.

4. **Syncing Templates**:
   - When modifying template HTML/CSS in `templates/github-pages/...`, `templates/netlify/...`, or `templates/vercel/...`, ensure the public static files in `showcase/public/templates/...` are also synced.
