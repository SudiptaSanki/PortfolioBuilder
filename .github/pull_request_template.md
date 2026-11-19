## Summary
<!-- Briefly describe what this PR adds or changes. -->

## PR Type
- [ ] New Core Template (`templates/<rendering>/<stack>/<category>/<role>/<slug>/`)
- [ ] Community Self-Hosted Manifest (`registry/community/<github-username>/<slug>.json`)
- [ ] Showcase UI / Search
- [ ] Infrastructure / CI / Scripts
- [ ] Documentation

## Pre-Merge Checklist
- [ ] `npm run validate` passes (`0` errors, valid 6-level layout & schema)
- [ ] `npm run test:phase3` passes
- [ ] `npm run showcase:build` compiles cleanly
- [ ] Role slug is registered in `registry/roles.json` under its canonical category
- [ ] Neutral **Type + Role** naming used (no third-party brands or real person names)
- [ ] Strictly relative asset paths (`./...`), zero broken `../../` or root-relative `/...` links
- [ ] Within template size budget (standard HTML <= 1.5 MB; 3D/WebGL <= 10 MB; no single file > 5 MB)
- [ ] Live preview URL returns HTTP 200 and permits iframe embedding (or `deployment.status` set accurately)
