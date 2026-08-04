const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder';
const TEMPLATES_DIR = path.join(ROOT, 'templates', 'github-pages');
const TEMPLATES_JSON = path.join(ROOT, 'showcase', 'src', 'data', 'templates.json');

const newTemplates = [
  {
    id: "cinematic-scroller",
    name: "Cinematic Scroller",
    description: "Vertical counter-scrolling image columns for photographers.",
    category: "creative",
    subcategory: "photographer",
    stack: "HTML/CSS/JS",
    features: ["Vertical Marquee", "Counter-Scroll", "Dark Mode", "Lightbox"],
    tags: ["photography", "gallery", "portfolio", "moving images"],
    author: "PortfolioBuilder",
    color: "#eab308"
  },
  {
    id: "film-strip-horizontal",
    name: "Film Strip",
    description: "Horizontal infinite scrolling film strip for videographers.",
    category: "creative",
    subcategory: "videographer",
    stack: "HTML/CSS/JS",
    features: ["Horizontal Marquee", "Video Previews", "Minimalist"],
    tags: ["video", "film", "horizontal scroll"],
    author: "PortfolioBuilder",
    color: "#ef4444"
  },
  {
    id: "mecha-showcase",
    name: "Mecha Showcase",
    description: "Robotics portfolio with technical grid and scrolling blueprint assets.",
    category: "technology",
    subcategory: "robotics-builder",
    stack: "HTML/CSS/JS",
    features: ["Grid Marquee", "Technical Font", "Hover Glitch"],
    tags: ["robotics", "engineering", "showcase", "grid"],
    author: "PortfolioBuilder",
    color: "#3b82f6"
  },
  {
    id: "urban-lens",
    name: "Urban Lens",
    description: "Street photography portfolio with diagonal scrolling image bands.",
    category: "creative",
    subcategory: "photographer",
    stack: "HTML/CSS/JS",
    features: ["Diagonal Scroll", "Monochrome", "Bold Typography"],
    tags: ["street photography", "urban", "monochrome", "moving images"],
    author: "PortfolioBuilder",
    color: "#a8a29e"
  },
  {
    id: "drone-swarm-gallery",
    name: "Drone Swarm",
    description: "Aerial robotics showcase with multi-directional image streams.",
    category: "technology",
    subcategory: "robotics-builder",
    stack: "HTML/CSS/JS",
    features: ["Multi-directional Scroll", "Cyberpunk", "Neon"],
    tags: ["drones", "robotics", "aerial", "dark"],
    author: "PortfolioBuilder",
    color: "#10b981"
  },
  {
    id: "reel-panoramas",
    name: "Reel Panoramas",
    description: "Slow-panning panoramic image scroller for wide shots.",
    category: "creative",
    subcategory: "videographer",
    stack: "HTML/CSS/JS",
    features: ["Slow Pan", "Wide Aspect Ratio", "Cinematic"],
    tags: ["panorama", "video", "cinematic", "scrolling"],
    author: "PortfolioBuilder",
    color: "#f97316"
  },
  {
    id: "servo-motion",
    name: "Servo Motion",
    description: "Robotics hardware gallery with vertical continuous sliding cards.",
    category: "technology",
    subcategory: "robotics-builder",
    stack: "HTML/CSS/JS",
    features: ["Vertical Slider", "Hardware Spec Cards", "Clean Light"],
    tags: ["hardware", "robotics", "cards", "vertical"],
    author: "PortfolioBuilder",
    color: "#0f172a"
  },
  {
    id: "event-chronicle",
    name: "Event Chronicle",
    description: "Photojournalist layout with dynamic speed-adjusted horizontal scrolling.",
    category: "creative",
    subcategory: "photojournalist",
    stack: "HTML/CSS/JS",
    features: ["Horizontal Columns", "Dynamic Speed", "Editorial"],
    tags: ["photojournalism", "events", "editorial"],
    author: "PortfolioBuilder",
    color: "#14b8a6"
  },
  {
    id: "slow-pan-studio",
    name: "Slow Pan Studio",
    description: "Studio videography portfolio with overlapping vertical moving strips.",
    category: "creative",
    subcategory: "videographer",
    stack: "HTML/CSS/JS",
    features: ["Overlapping Marquees", "Parallax", "Studio Aesthetic"],
    tags: ["studio", "video", "parallax", "overlapping"],
    author: "PortfolioBuilder",
    color: "#6366f1"
  },
  {
    id: "nature-focus",
    name: "Nature Focus",
    description: "Wildlife photography site with slow vertical parallax and moving galleries.",
    category: "creative",
    subcategory: "photographer",
    stack: "HTML/CSS/JS",
    features: ["Vertical Marquee", "Earth Tones", "Nature"],
    tags: ["wildlife", "nature", "photography", "parallax"],
    author: "PortfolioBuilder",
    color: "#84cc16"
  }
];

// ─── Per-template unique designs ───

const DESIGNS = {
  "cinematic-scroller": {
    bg: "#0a0a0a",
    fg: "#fafafa",
    accent: "#eab308",
    font: "'Playfair Display', Georgia, serif",
    monoFont: "'JetBrains Mono', monospace",
    googleFont: "Playfair+Display:wght@400;700&family=JetBrains+Mono",
    navStyle: "fixed",
    heroExtra: `<span class="tag">PHOTOGRAPHY PORTFOLIO</span>`,
    galleryHTML: `
    <div class="gallery-container">
      <div class="col scroll-up">
        <div class="img-card"><div class="img-inner"><span>Portrait Session</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Golden Hour</span></div></div>
        <div class="img-card"><div class="img-inner"><span>City Lights</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Studio Noir</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Portrait Session</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Golden Hour</span></div></div>
        <div class="img-card"><div class="img-inner"><span>City Lights</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Studio Noir</span></div></div>
      </div>
      <div class="col scroll-down">
        <div class="img-card"><div class="img-inner"><span>Film Grain</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Silhouette</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Contrast</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Bokeh Dream</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Film Grain</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Silhouette</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Contrast</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Bokeh Dream</span></div></div>
      </div>
      <div class="col scroll-up slow">
        <div class="img-card"><div class="img-inner"><span>Autumn Haze</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Coastal Dawn</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Vintage Mood</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Deep Focus</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Autumn Haze</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Coastal Dawn</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Vintage Mood</span></div></div>
        <div class="img-card"><div class="img-inner"><span>Deep Focus</span></div></div>
      </div>
    </div>`,
    css: `
.gallery-container { display:flex; gap:2rem; justify-content:center; height:200vh; overflow:hidden; padding:0 2rem; }
.col { display:flex; flex-direction:column; gap:2rem; width:320px; }
.img-card { border-radius:16px; overflow:hidden; flex-shrink:0; }
.img-inner { height:420px; background:linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.03)); border:1px solid rgba(234,179,8,0.12); display:flex; align-items:flex-end; padding:2rem; transition:all 0.5s ease; }
.img-inner span { font-family:'Playfair Display',serif; font-size:1.4rem; color:rgba(255,255,255,0.6); }
.img-card:hover .img-inner { border-color:#eab308; background:linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.05)); }
.img-card:hover .img-inner span { color:#eab308; }
@keyframes scrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
@keyframes scrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
.scroll-up { animation:scrollUp 18s linear infinite; }
.scroll-down { animation:scrollDown 22s linear infinite; }
.scroll-up.slow { animation-duration:28s; }
.col:hover { animation-play-state:paused; }
@media(max-width:768px){ .gallery-container{flex-direction:column;height:auto;align-items:center;} .col{width:90%;} .img-inner{height:280px;} }`
  },

  "film-strip-horizontal": {
    bg: "#0c0c0c",
    fg: "#e4e4e7",
    accent: "#ef4444",
    font: "'Inter', sans-serif",
    monoFont: "'Fira Code', monospace",
    googleFont: "Inter:wght@300;600&family=Fira+Code",
    navStyle: "fixed",
    heroExtra: `<span class="tag">VIDEOGRAPHY &bull; FILM &bull; MOTION</span>`,
    galleryHTML: `
    <div class="strip-container">
      <div class="strip scroll-left">
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 01</span><span class="tc">00:01:24:08</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 02</span><span class="tc">00:03:47:12</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 03</span><span class="tc">00:05:11:04</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 04</span><span class="tc">00:08:33:19</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 01</span><span class="tc">00:01:24:08</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 02</span><span class="tc">00:03:47:12</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 03</span><span class="tc">00:05:11:04</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 04</span><span class="tc">00:08:33:19</span></div></div>
      </div>
      <div class="strip scroll-right">
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 05</span><span class="tc">00:12:05:22</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 06</span><span class="tc">00:15:41:07</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 07</span><span class="tc">00:18:29:16</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 08</span><span class="tc">00:21:53:01</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 05</span><span class="tc">00:12:05:22</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 06</span><span class="tc">00:15:41:07</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 07</span><span class="tc">00:18:29:16</span></div></div>
        <div class="frame"><div class="frame-inner"><span class="frame-label">SCENE 08</span><span class="tc">00:21:53:01</span></div></div>
      </div>
    </div>`,
    css: `
.strip-container { display:flex; flex-direction:column; gap:2rem; overflow:hidden; padding:4rem 0; }
.strip { display:flex; gap:2rem; width:max-content; }
.frame { flex-shrink:0; width:500px; }
.frame-inner { height:300px; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15); border-radius:8px; display:flex; flex-direction:column; justify-content:flex-end; padding:1.5rem; transition:all 0.4s ease; position:relative; overflow:hidden; }
.frame-inner::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:#ef4444; opacity:0; transition:opacity 0.3s; }
.frame:hover .frame-inner::before { opacity:1; }
.frame-label { font-family:'Inter',sans-serif; font-weight:600; font-size:1.1rem; }
.tc { font-family:'Fira Code',monospace; font-size:0.8rem; color:rgba(255,255,255,0.3); margin-top:0.5rem; }
.frame:hover .frame-inner { border-color:#ef4444; background:rgba(239,68,68,0.12); }
@keyframes scrollLeft { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes scrollRight { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
.scroll-left { animation:scrollLeft 25s linear infinite; }
.scroll-right { animation:scrollRight 30s linear infinite; }
.strip:hover { animation-play-state:paused; }
@media(max-width:768px){ .frame{width:300px;} .frame-inner{height:200px;} }`
  },

  "mecha-showcase": {
    bg: "#0a0f1a",
    fg: "#c8d6e5",
    accent: "#3b82f6",
    font: "'Rajdhani', sans-serif",
    monoFont: "'Source Code Pro', monospace",
    googleFont: "Rajdhani:wght@400;700&family=Source+Code+Pro",
    navStyle: "fixed",
    heroExtra: `<span class="tag">ROBOTICS &bull; MECHATRONICS &bull; AUTOMATION</span>`,
    galleryHTML: `
    <div class="mecha-grid">
      <div class="mecha-col scroll-up">
        <div class="mecha-card"><div class="spec-tag">ARM-7X</div><div class="mecha-title">Robotic Arm Assembly</div><div class="mecha-spec">6-DOF &bull; 5kg Payload &bull; ±0.02mm</div></div>
        <div class="mecha-card"><div class="spec-tag">NAV-3</div><div class="mecha-title">Autonomous Navigation</div><div class="mecha-spec">LiDAR &bull; SLAM &bull; Path Planning</div></div>
        <div class="mecha-card"><div class="spec-tag">VIS-2</div><div class="mecha-title">Computer Vision Module</div><div class="mecha-spec">Stereo &bull; 120fps &bull; Object Detection</div></div>
        <div class="mecha-card"><div class="spec-tag">ARM-7X</div><div class="mecha-title">Robotic Arm Assembly</div><div class="mecha-spec">6-DOF &bull; 5kg Payload &bull; ±0.02mm</div></div>
        <div class="mecha-card"><div class="spec-tag">NAV-3</div><div class="mecha-title">Autonomous Navigation</div><div class="mecha-spec">LiDAR &bull; SLAM &bull; Path Planning</div></div>
        <div class="mecha-card"><div class="spec-tag">VIS-2</div><div class="mecha-title">Computer Vision Module</div><div class="mecha-spec">Stereo &bull; 120fps &bull; Object Detection</div></div>
      </div>
      <div class="mecha-col scroll-down">
        <div class="mecha-card"><div class="spec-tag">PWR-1</div><div class="mecha-title">Power Distribution</div><div class="mecha-spec">48V &bull; Smart BMS &bull; Li-Ion</div></div>
        <div class="mecha-card"><div class="spec-tag">CTL-5</div><div class="mecha-title">Flight Controller</div><div class="mecha-spec">IMU 9-Axis &bull; PID &bull; 1kHz Loop</div></div>
        <div class="mecha-card"><div class="spec-tag">GRP-4</div><div class="mecha-title">Soft Gripper Design</div><div class="mecha-spec">Pneumatic &bull; Compliant &bull; Force Sensing</div></div>
        <div class="mecha-card"><div class="spec-tag">PWR-1</div><div class="mecha-title">Power Distribution</div><div class="mecha-spec">48V &bull; Smart BMS &bull; Li-Ion</div></div>
        <div class="mecha-card"><div class="spec-tag">CTL-5</div><div class="mecha-title">Flight Controller</div><div class="mecha-spec">IMU 9-Axis &bull; PID &bull; 1kHz Loop</div></div>
        <div class="mecha-card"><div class="spec-tag">GRP-4</div><div class="mecha-title">Soft Gripper Design</div><div class="mecha-spec">Pneumatic &bull; Compliant &bull; Force Sensing</div></div>
      </div>
      <div class="mecha-col scroll-up slow">
        <div class="mecha-card"><div class="spec-tag">CHG-2</div><div class="mecha-title">Charging Dock System</div><div class="mecha-spec">Wireless &bull; Auto-Align &bull; 200W</div></div>
        <div class="mecha-card"><div class="spec-tag">COM-6</div><div class="mecha-title">Mesh Communication</div><div class="mecha-spec">LoRa &bull; 5km Range &bull; Encrypted</div></div>
        <div class="mecha-card"><div class="spec-tag">LEG-8</div><div class="mecha-title">Quadruped Locomotion</div><div class="mecha-spec">Terrain Adaptive &bull; Dynamic Gait</div></div>
        <div class="mecha-card"><div class="spec-tag">CHG-2</div><div class="mecha-title">Charging Dock System</div><div class="mecha-spec">Wireless &bull; Auto-Align &bull; 200W</div></div>
        <div class="mecha-card"><div class="spec-tag">COM-6</div><div class="mecha-title">Mesh Communication</div><div class="mecha-spec">LoRa &bull; 5km Range &bull; Encrypted</div></div>
        <div class="mecha-card"><div class="spec-tag">LEG-8</div><div class="mecha-title">Quadruped Locomotion</div><div class="mecha-spec">Terrain Adaptive &bull; Dynamic Gait</div></div>
      </div>
    </div>`,
    css: `
.mecha-grid { display:flex; gap:2rem; justify-content:center; height:180vh; overflow:hidden; padding:0 2rem; }
.mecha-col { display:flex; flex-direction:column; gap:1.5rem; width:350px; }
.mecha-card { background:rgba(59,130,246,0.05); border:1px solid rgba(59,130,246,0.12); border-radius:12px; padding:2rem; flex-shrink:0; transition:all 0.4s ease; position:relative; overflow:hidden; }
.mecha-card::after { content:''; position:absolute; top:0; left:0; width:3px; height:100%; background:#3b82f6; opacity:0; transition:opacity 0.3s; }
.mecha-card:hover::after { opacity:1; }
.mecha-card:hover { border-color:#3b82f6; transform:scale(1.02); }
.spec-tag { font-family:'Source Code Pro',monospace; font-size:0.75rem; color:#3b82f6; background:rgba(59,130,246,0.1); padding:0.3rem 0.8rem; border-radius:4px; display:inline-block; margin-bottom:1rem; letter-spacing:2px; }
.mecha-title { font-family:'Rajdhani',sans-serif; font-size:1.4rem; font-weight:700; margin-bottom:0.5rem; }
.mecha-spec { font-family:'Source Code Pro',monospace; font-size:0.8rem; color:rgba(200,214,229,0.5); }
@keyframes scrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
@keyframes scrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
.scroll-up { animation:scrollUp 20s linear infinite; }
.scroll-down { animation:scrollDown 24s linear infinite; }
.scroll-up.slow { animation-duration:30s; }
.mecha-col:hover { animation-play-state:paused; }
@media(max-width:900px){ .mecha-grid{flex-direction:column;height:auto;align-items:center;} .mecha-col{width:90%;} }`
  },

  "urban-lens": {
    bg: "#111111",
    fg: "#d4d4d4",
    accent: "#a8a29e",
    font: "'Oswald', sans-serif",
    monoFont: "'Space Mono', monospace",
    googleFont: "Oswald:wght@400;700&family=Space+Mono",
    navStyle: "fixed",
    heroExtra: `<span class="tag">STREET &bull; URBAN &bull; DOCUMENTARY</span>`,
    galleryHTML: `
    <div class="diagonal-wrap">
      <div class="band scroll-left">
        <div class="shot"><div class="shot-inner"><span>URBAN DECAY 01</span></div></div>
        <div class="shot"><div class="shot-inner"><span>NEON ALLEY 02</span></div></div>
        <div class="shot"><div class="shot-inner"><span>SUBWAY RUSH 03</span></div></div>
        <div class="shot"><div class="shot-inner"><span>ROOFTOP 04</span></div></div>
        <div class="shot"><div class="shot-inner"><span>URBAN DECAY 01</span></div></div>
        <div class="shot"><div class="shot-inner"><span>NEON ALLEY 02</span></div></div>
        <div class="shot"><div class="shot-inner"><span>SUBWAY RUSH 03</span></div></div>
        <div class="shot"><div class="shot-inner"><span>ROOFTOP 04</span></div></div>
      </div>
      <div class="band scroll-right">
        <div class="shot"><div class="shot-inner"><span>RAIN PUDDLE 05</span></div></div>
        <div class="shot"><div class="shot-inner"><span>GRAFFITI WALL 06</span></div></div>
        <div class="shot"><div class="shot-inner"><span>FIRE ESCAPE 07</span></div></div>
        <div class="shot"><div class="shot-inner"><span>CROSSWALK 08</span></div></div>
        <div class="shot"><div class="shot-inner"><span>RAIN PUDDLE 05</span></div></div>
        <div class="shot"><div class="shot-inner"><span>GRAFFITI WALL 06</span></div></div>
        <div class="shot"><div class="shot-inner"><span>FIRE ESCAPE 07</span></div></div>
        <div class="shot"><div class="shot-inner"><span>CROSSWALK 08</span></div></div>
      </div>
      <div class="band scroll-left slow">
        <div class="shot"><div class="shot-inner"><span>BRIDGE FOG 09</span></div></div>
        <div class="shot"><div class="shot-inner"><span>MARKET LIGHT 10</span></div></div>
        <div class="shot"><div class="shot-inner"><span>TUNNEL GLOW 11</span></div></div>
        <div class="shot"><div class="shot-inner"><span>STEEL SKY 12</span></div></div>
        <div class="shot"><div class="shot-inner"><span>BRIDGE FOG 09</span></div></div>
        <div class="shot"><div class="shot-inner"><span>MARKET LIGHT 10</span></div></div>
        <div class="shot"><div class="shot-inner"><span>TUNNEL GLOW 11</span></div></div>
        <div class="shot"><div class="shot-inner"><span>STEEL SKY 12</span></div></div>
      </div>
    </div>`,
    css: `
.diagonal-wrap { transform:rotate(-8deg) scale(1.15); margin:8rem 0; display:flex; flex-direction:column; gap:2rem; overflow:hidden; }
.band { display:flex; gap:2rem; width:max-content; }
.shot { flex-shrink:0; width:550px; }
.shot-inner { height:350px; background:rgba(168,162,158,0.06); border:1px solid rgba(168,162,158,0.1); border-radius:4px; display:flex; align-items:flex-end; padding:1.5rem; transition:all 0.4s; }
.shot-inner span { font-family:'Oswald',sans-serif; font-size:1rem; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.4); }
.shot:hover .shot-inner { border-color:#a8a29e; background:rgba(168,162,158,0.12); }
.shot:hover .shot-inner span { color:#fff; }
@keyframes scrollLeft { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes scrollRight { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
.scroll-left { animation:scrollLeft 22s linear infinite; }
.scroll-right { animation:scrollRight 28s linear infinite; }
.scroll-left.slow { animation-duration:35s; }
.band:hover { animation-play-state:paused; }
@media(max-width:768px){ .diagonal-wrap{transform:rotate(-5deg) scale(1.1);} .shot{width:350px;} .shot-inner{height:220px;} }`
  },

  "drone-swarm-gallery": {
    bg: "#030712",
    fg: "#e5e7eb",
    accent: "#10b981",
    font: "'Exo 2', sans-serif",
    monoFont: "'Fira Code', monospace",
    googleFont: "Exo+2:wght@300;700&family=Fira+Code",
    navStyle: "fixed",
    heroExtra: `<span class="tag">AERIAL ROBOTICS &bull; SWARM INTELLIGENCE &bull; AUTONOMOUS FLIGHT</span>`,
    galleryHTML: `
    <div class="swarm-gallery">
      <div class="swarm-row scroll-left">
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-001</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Recon Quadcopter</div><div class="drone-meta">Altitude: 120m &bull; Speed: 72km/h</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-002</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Survey Hexacopter</div><div class="drone-meta">Mapping: 4K LiDAR &bull; 45min Flight</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-003</span><span class="drone-status">● STANDBY</span></div><div class="drone-name">Delivery Octocopter</div><div class="drone-meta">Payload: 8kg &bull; Range: 25km</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-001</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Recon Quadcopter</div><div class="drone-meta">Altitude: 120m &bull; Speed: 72km/h</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-002</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Survey Hexacopter</div><div class="drone-meta">Mapping: 4K LiDAR &bull; 45min Flight</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-003</span><span class="drone-status">● STANDBY</span></div><div class="drone-name">Delivery Octocopter</div><div class="drone-meta">Payload: 8kg &bull; Range: 25km</div></div>
      </div>
      <div class="swarm-row scroll-right">
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-004</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Racing FPV Drone</div><div class="drone-meta">Max Speed: 180km/h &bull; 6S LiPo</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-005</span><span class="drone-status">● CHARGING</span></div><div class="drone-name">Agricultural Sprayer</div><div class="drone-meta">Tank: 20L &bull; Coverage: 5ha/hr</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-006</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Underwater ROV</div><div class="drone-meta">Depth: 300m &bull; 4K Camera</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-004</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Racing FPV Drone</div><div class="drone-meta">Max Speed: 180km/h &bull; 6S LiPo</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-005</span><span class="drone-status">● CHARGING</span></div><div class="drone-name">Agricultural Sprayer</div><div class="drone-meta">Tank: 20L &bull; Coverage: 5ha/hr</div></div>
        <div class="drone-card"><div class="drone-hud"><span class="drone-id">DRN-006</span><span class="drone-status online">● ONLINE</span></div><div class="drone-name">Underwater ROV</div><div class="drone-meta">Depth: 300m &bull; 4K Camera</div></div>
      </div>
    </div>`,
    css: `
.swarm-gallery { display:flex; flex-direction:column; gap:2.5rem; overflow:hidden; padding:4rem 0; }
.swarm-row { display:flex; gap:2rem; width:max-content; }
.drone-card { flex-shrink:0; width:420px; background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.1); border-radius:16px; padding:2rem; transition:all 0.4s; }
.drone-card:hover { border-color:#10b981; background:rgba(16,185,129,0.08); transform:translateY(-4px); box-shadow:0 12px 40px rgba(16,185,129,0.1); }
.drone-hud { display:flex; justify-content:space-between; margin-bottom:1.2rem; }
.drone-id { font-family:'Fira Code',monospace; font-size:0.8rem; color:#10b981; background:rgba(16,185,129,0.1); padding:0.2rem 0.6rem; border-radius:4px; }
.drone-status { font-family:'Fira Code',monospace; font-size:0.75rem; color:rgba(255,255,255,0.3); }
.drone-status.online { color:#10b981; }
.drone-name { font-family:'Exo 2',sans-serif; font-size:1.3rem; font-weight:700; margin-bottom:0.5rem; }
.drone-meta { font-family:'Fira Code',monospace; font-size:0.8rem; color:rgba(255,255,255,0.4); }
@keyframes scrollLeft { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes scrollRight { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
.scroll-left { animation:scrollLeft 22s linear infinite; }
.scroll-right { animation:scrollRight 28s linear infinite; }
.swarm-row:hover { animation-play-state:paused; }
@media(max-width:768px){ .drone-card{width:300px;padding:1.5rem;} }`
  },

  "reel-panoramas": {
    bg: "#0e0e0e",
    fg: "#f5f5f4",
    accent: "#f97316",
    font: "'DM Sans', sans-serif",
    monoFont: "'IBM Plex Mono', monospace",
    googleFont: "DM+Sans:wght@400;700&family=IBM+Plex+Mono",
    navStyle: "fixed",
    heroExtra: `<span class="tag">PANORAMIC FILM &bull; WIDE ANGLE &bull; CINEMATIC</span>`,
    galleryHTML: `
    <div class="pano-container">
      <div class="pano-strip scroll-left-slow">
        <div class="pano"><div class="pano-inner"><span>MOUNTAIN RIDGE &mdash; 180&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>OCEAN HORIZON &mdash; 240&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>CITY SKYLINE &mdash; 360&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>MOUNTAIN RIDGE &mdash; 180&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>OCEAN HORIZON &mdash; 240&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>CITY SKYLINE &mdash; 360&deg;</span></div></div>
      </div>
      <div class="pano-strip scroll-right-slow">
        <div class="pano"><div class="pano-inner"><span>DESERT DUNES &mdash; 220&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>AURORA BOREALIS &mdash; 180&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>CANYON DEPTH &mdash; 300&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>DESERT DUNES &mdash; 220&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>AURORA BOREALIS &mdash; 180&deg;</span></div></div>
        <div class="pano"><div class="pano-inner"><span>CANYON DEPTH &mdash; 300&deg;</span></div></div>
      </div>
    </div>`,
    css: `
.pano-container { display:flex; flex-direction:column; gap:2rem; overflow:hidden; padding:4rem 0; }
.pano-strip { display:flex; gap:2rem; width:max-content; }
.pano { flex-shrink:0; width:900px; }
.pano-inner { height:280px; background:linear-gradient(135deg, rgba(249,115,22,0.08), rgba(249,115,22,0.02)); border:1px solid rgba(249,115,22,0.12); border-radius:8px; display:flex; align-items:center; justify-content:center; transition:all 0.5s; }
.pano-inner span { font-family:'DM Sans',sans-serif; font-size:1.2rem; letter-spacing:4px; color:rgba(255,255,255,0.35); text-transform:uppercase; }
.pano:hover .pano-inner { border-color:#f97316; background:linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.04)); }
.pano:hover .pano-inner span { color:#f97316; }
@keyframes scrollLeftSlow { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes scrollRightSlow { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
.scroll-left-slow { animation:scrollLeftSlow 40s linear infinite; }
.scroll-right-slow { animation:scrollRightSlow 45s linear infinite; }
.pano-strip:hover { animation-play-state:paused; }
@media(max-width:768px){ .pano{width:500px;} .pano-inner{height:180px;} }`
  },

  "servo-motion": {
    bg: "#f8fafc",
    fg: "#0f172a",
    accent: "#0f172a",
    font: "'Plus Jakarta Sans', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    googleFont: "Plus+Jakarta+Sans:wght@400;700&family=JetBrains+Mono",
    navStyle: "fixed",
    heroExtra: `<span class="tag">HARDWARE ENGINEERING &bull; SERVO SYSTEMS &bull; ACTUATORS</span>`,
    galleryHTML: `
    <div class="servo-gallery">
      <div class="servo-col scroll-up">
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Precision Servo Motor</h3><p>12-bit encoder &bull; 0.088&deg; resolution</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Linear Actuator</h3><p>200mm stroke &bull; 1500N force</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Harmonic Drive</h3><p>100:1 ratio &bull; Zero backlash</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Precision Servo Motor</h3><p>12-bit encoder &bull; 0.088&deg; resolution</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Linear Actuator</h3><p>200mm stroke &bull; 1500N force</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Harmonic Drive</h3><p>100:1 ratio &bull; Zero backlash</p></div></div>
      </div>
      <div class="servo-col scroll-down">
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Stepper Motor Array</h3><p>NEMA 23 &bull; Microstepping 1/256</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Pneumatic Cylinder</h3><p>Double Acting &bull; 50mm bore</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Brushless DC Motor</h3><p>5000 RPM &bull; Hall Sensor</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Stepper Motor Array</h3><p>NEMA 23 &bull; Microstepping 1/256</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Pneumatic Cylinder</h3><p>Double Acting &bull; 50mm bore</p></div></div>
        <div class="servo-card"><div class="servo-img-placeholder"></div><div class="servo-info"><h3>Brushless DC Motor</h3><p>5000 RPM &bull; Hall Sensor</p></div></div>
      </div>
    </div>`,
    css: `
.servo-gallery { display:flex; gap:2rem; justify-content:center; height:180vh; overflow:hidden; padding:0 2rem; }
.servo-col { display:flex; flex-direction:column; gap:2rem; width:380px; }
.servo-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; flex-shrink:0; transition:all 0.4s; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
.servo-card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,0.1); border-color:#0f172a; }
.servo-img-placeholder { height:240px; background:linear-gradient(135deg, #e2e8f0, #f1f5f9); }
.servo-info { padding:1.5rem; }
.servo-info h3 { font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:1.15rem; color:#0f172a; margin-bottom:0.5rem; }
.servo-info p { font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:#64748b; }
@keyframes scrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
@keyframes scrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
.scroll-up { animation:scrollUp 18s linear infinite; }
.scroll-down { animation:scrollDown 22s linear infinite; }
.servo-col:hover { animation-play-state:paused; }
@media(max-width:768px){ .servo-gallery{flex-direction:column;height:auto;align-items:center;} .servo-col{width:90%;} .servo-img-placeholder{height:180px;} }`
  },

  "event-chronicle": {
    bg: "#080808",
    fg: "#fafaf9",
    accent: "#14b8a6",
    font: "'Libre Baskerville', Georgia, serif",
    monoFont: "'Space Mono', monospace",
    googleFont: "Libre+Baskerville:wght@400;700&family=Space+Mono",
    navStyle: "fixed",
    heroExtra: `<span class="tag">PHOTOJOURNALISM &bull; EVENTS &bull; EDITORIAL</span>`,
    galleryHTML: `
    <div class="chronicle-gallery">
      <div class="chronicle-row scroll-left">
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">JAN 2026</span><h3>International Summit</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">MAR 2026</span><h3>Cultural Festival</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">MAY 2026</span><h3>Documentary Premiere</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">JUL 2026</span><h3>Protest March</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">JAN 2026</span><h3>International Summit</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">MAR 2026</span><h3>Cultural Festival</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">MAY 2026</span><h3>Documentary Premiere</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">JUL 2026</span><h3>Protest March</h3></div></div>
      </div>
      <div class="chronicle-row scroll-right">
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">AUG 2026</span><h3>Music Awards</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">SEP 2026</span><h3>Tech Conference</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">OCT 2026</span><h3>Climate Rally</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">DEC 2026</span><h3>Year in Review</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">AUG 2026</span><h3>Music Awards</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">SEP 2026</span><h3>Tech Conference</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">OCT 2026</span><h3>Climate Rally</h3></div></div>
        <div class="event-card"><div class="event-cover"></div><div class="event-details"><span class="event-date">DEC 2026</span><h3>Year in Review</h3></div></div>
      </div>
    </div>`,
    css: `
.chronicle-gallery { display:flex; flex-direction:column; gap:2.5rem; overflow:hidden; padding:4rem 0; }
.chronicle-row { display:flex; gap:2rem; width:max-content; }
.event-card { flex-shrink:0; width:400px; background:rgba(20,184,166,0.03); border:1px solid rgba(20,184,166,0.1); border-radius:16px; overflow:hidden; transition:all 0.4s; }
.event-card:hover { border-color:#14b8a6; transform:translateY(-4px); box-shadow:0 16px 40px rgba(20,184,166,0.1); }
.event-cover { height:260px; background:linear-gradient(180deg, rgba(20,184,166,0.08), rgba(20,184,166,0.02)); }
.event-details { padding:1.5rem; }
.event-date { font-family:'Space Mono',monospace; font-size:0.75rem; color:#14b8a6; letter-spacing:2px; }
.event-details h3 { font-family:'Libre Baskerville',serif; font-size:1.2rem; margin-top:0.5rem; }
@keyframes scrollLeft { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes scrollRight { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
.scroll-left { animation:scrollLeft 24s linear infinite; }
.scroll-right { animation:scrollRight 30s linear infinite; }
.chronicle-row:hover { animation-play-state:paused; }
@media(max-width:768px){ .event-card{width:280px;} .event-cover{height:180px;} }`
  },

  "slow-pan-studio": {
    bg: "#0a0a14",
    fg: "#e0e0ff",
    accent: "#6366f1",
    font: "'Sora', sans-serif",
    monoFont: "'Fira Code', monospace",
    googleFont: "Sora:wght@300;700&family=Fira+Code",
    navStyle: "fixed",
    heroExtra: `<span class="tag">STUDIO &bull; COMMERCIAL &bull; CREATIVE DIRECTION</span>`,
    galleryHTML: `
    <div class="studio-gallery">
      <div class="studio-col scroll-up">
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Brand Film &mdash; Nike</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Music Video &mdash; Eclipse</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Short Film &mdash; Dusk</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Brand Film &mdash; Nike</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Music Video &mdash; Eclipse</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Short Film &mdash; Dusk</span></div>
      </div>
      <div class="studio-col scroll-down">
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Commercial &mdash; Lexus</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Documentary &mdash; Depths</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Art Film &mdash; Prism</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Commercial &mdash; Lexus</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Documentary &mdash; Depths</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Art Film &mdash; Prism</span></div>
      </div>
      <div class="studio-col scroll-up slow">
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Fashion &mdash; Vogue</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Product &mdash; Apple</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Recap &mdash; Summit 26</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Fashion &mdash; Vogue</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Product &mdash; Apple</span></div>
        <div class="studio-panel"><div class="panel-visual"></div><span class="panel-label">Recap &mdash; Summit 26</span></div>
      </div>
    </div>`,
    css: `
.studio-gallery { display:flex; gap:2rem; justify-content:center; height:200vh; overflow:hidden; padding:0 2rem; }
.studio-col { display:flex; flex-direction:column; gap:2rem; width:340px; }
.studio-panel { flex-shrink:0; border-radius:20px; overflow:hidden; transition:all 0.5s; }
.panel-visual { height:400px; background:linear-gradient(180deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02)); border:1px solid rgba(99,102,241,0.1); border-radius:20px 20px 0 0; transition:all 0.5s; }
.studio-panel:hover .panel-visual { border-color:#6366f1; background:linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.04)); }
.panel-label { display:block; padding:1.2rem 1.5rem; font-family:'Sora',sans-serif; font-size:0.95rem; color:rgba(224,224,255,0.6); letter-spacing:1px; }
.studio-panel:hover .panel-label { color:#6366f1; }
@keyframes scrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
@keyframes scrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
.scroll-up { animation:scrollUp 20s linear infinite; }
.scroll-down { animation:scrollDown 25s linear infinite; }
.scroll-up.slow { animation-duration:32s; }
.studio-col:hover { animation-play-state:paused; }
@media(max-width:768px){ .studio-gallery{flex-direction:column;height:auto;align-items:center;} .studio-col{width:90%;} .panel-visual{height:280px;} }`
  },

  "nature-focus": {
    bg: "#0c1108",
    fg: "#e8f0dc",
    accent: "#84cc16",
    font: "'Cormorant Garamond', Georgia, serif",
    monoFont: "'IBM Plex Mono', monospace",
    googleFont: "Cormorant+Garamond:wght@400;700&family=IBM+Plex+Mono",
    navStyle: "fixed",
    heroExtra: `<span class="tag">WILDLIFE &bull; NATURE &bull; CONSERVATION</span>`,
    galleryHTML: `
    <div class="nature-gallery">
      <div class="nature-col scroll-up">
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Bengal Tiger</h4><p>Sundarbans Reserve &bull; 2026</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Snow Leopard</h4><p>Himalayan Range &bull; 2025</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Coral Reef</h4><p>Great Barrier &bull; 2024</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Bengal Tiger</h4><p>Sundarbans Reserve &bull; 2026</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Snow Leopard</h4><p>Himalayan Range &bull; 2025</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Coral Reef</h4><p>Great Barrier &bull; 2024</p></div></div>
      </div>
      <div class="nature-col scroll-down">
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Amazon Canopy</h4><p>Manaus &bull; Drone Capture</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Arctic Fox</h4><p>Svalbard &bull; Winter</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Bioluminescence</h4><p>Maldives Shore &bull; Night</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Amazon Canopy</h4><p>Manaus &bull; Drone Capture</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Arctic Fox</h4><p>Svalbard &bull; Winter</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Bioluminescence</h4><p>Maldives Shore &bull; Night</p></div></div>
      </div>
      <div class="nature-col scroll-up slow">
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Redwood Forest</h4><p>California &bull; Fog Season</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Monarch Migration</h4><p>Mexico &bull; Annual Passage</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Volcanic Bloom</h4><p>Iceland &bull; Lupine Fields</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Redwood Forest</h4><p>California &bull; Fog Season</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Monarch Migration</h4><p>Mexico &bull; Annual Passage</p></div></div>
        <div class="nature-frame"><div class="nature-img"></div><div class="nature-caption"><h4>Volcanic Bloom</h4><p>Iceland &bull; Lupine Fields</p></div></div>
      </div>
    </div>`,
    css: `
.nature-gallery { display:flex; gap:2rem; justify-content:center; height:200vh; overflow:hidden; padding:0 2rem; }
.nature-col { display:flex; flex-direction:column; gap:2rem; width:340px; }
.nature-frame { flex-shrink:0; border-radius:16px; overflow:hidden; transition:all 0.5s; }
.nature-img { height:380px; background:linear-gradient(180deg, rgba(132,204,22,0.08), rgba(132,204,22,0.02)); border:1px solid rgba(132,204,22,0.1); border-radius:16px 16px 0 0; transition:all 0.5s; }
.nature-frame:hover .nature-img { border-color:#84cc16; background:linear-gradient(180deg, rgba(132,204,22,0.18), rgba(132,204,22,0.04)); }
.nature-caption { padding:1.2rem 1.5rem; }
.nature-caption h4 { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:700; color:#e8f0dc; margin-bottom:0.3rem; }
.nature-caption p { font-family:'IBM Plex Mono',monospace; font-size:0.8rem; color:rgba(232,240,220,0.4); }
.nature-frame:hover .nature-caption h4 { color:#84cc16; }
@keyframes scrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
@keyframes scrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
.scroll-up { animation:scrollUp 22s linear infinite; }
.scroll-down { animation:scrollDown 26s linear infinite; }
.scroll-up.slow { animation-duration:35s; }
.nature-col:hover { animation-play-state:paused; }
@media(max-width:768px){ .nature-gallery{flex-direction:column;height:auto;align-items:center;} .nature-col{width:90%;} .nature-img{height:260px;} }`
  }
};


// ─── Build Functions ───

function buildHTML(template) {
  const d = DESIGNS[template.id];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name} | Portfolio</title>
  <meta name="description" content="${template.description}">
  <link href="https://fonts.googleapis.com/css2?family=${d.googleFont}&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='${encodeURIComponent(d.bg)}'/%3E%3Ctext x='50' y='67' font-family='system-ui' font-size='60' font-weight='bold' fill='${encodeURIComponent(d.accent)}' text-anchor='middle'%3E${template.name[0]}%3C/text%3E%3C/svg%3E">
</head>
<body>
  <nav>
    <div class="logo">${template.name.toUpperCase()}</div>
    <div class="nav-links">
      <a href="#work">Work</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </div>
  </nav>

  <section class="hero">
    ${d.heroExtra}
    <h1>${template.name}</h1>
    <p class="hero-desc">${template.description}</p>
  </section>

  <section id="work" class="showcase">
    ${d.galleryHTML}
  </section>

  <footer>
    <p>&copy; 2026 ${template.name}. Built with PortfolioBuilder.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;
}

function buildCSS(template) {
  const d = DESIGNS[template.id];
  return `@import url('https://fonts.googleapis.com/css2?family=${d.googleFont}&display=swap');

* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body {
  background:${d.bg};
  color:${d.fg};
  font-family:${d.font};
  overflow-x:hidden;
  min-height:100vh;
}

/* Navigation */
nav {
  position:fixed;
  top:0;
  width:100%;
  padding:2rem 4rem;
  display:flex;
  justify-content:space-between;
  align-items:center;
  z-index:100;
  mix-blend-mode:difference;
}
.logo {
  font-weight:700;
  font-size:1.1rem;
  letter-spacing:3px;
  color:#fff;
}
.nav-links a {
  color:#fff;
  text-decoration:none;
  margin-left:2.5rem;
  font-size:0.85rem;
  letter-spacing:1.5px;
  text-transform:uppercase;
  transition:opacity 0.3s;
}
.nav-links a:hover { opacity:0.6; }

/* Hero */
.hero {
  height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  text-align:center;
  padding:0 2rem;
}
.tag {
  font-family:${d.monoFont};
  font-size:0.8rem;
  color:${d.accent};
  letter-spacing:3px;
  margin-bottom:1.5rem;
  display:block;
}
.hero h1 {
  font-size:clamp(2.5rem, 6vw, 5rem);
  font-weight:700;
  letter-spacing:-1px;
  margin-bottom:1.5rem;
  color:${d.fg};
}
.hero-desc {
  max-width:600px;
  font-size:1.1rem;
  line-height:1.7;
  opacity:0.6;
}

/* Showcase section */
.showcase {
  width:100%;
  position:relative;
  padding:4rem 0;
}

/* Footer */
footer {
  text-align:center;
  padding:3rem 2rem;
  font-family:${d.monoFont};
  font-size:0.8rem;
  opacity:0.4;
}

/* ─── Template-specific gallery styles ─── */
${d.css}
`;
}

function buildJS(template) {
  return `// ${template.name} - Scrolling Gallery
document.addEventListener('DOMContentLoaded', () => {
  // Pause animations on scroll for performance
  let scrollTimeout;
  const allAnimated = document.querySelectorAll('[class*="scroll-"]');

  // Optional: Speed modulation based on viewport scroll
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Resume normal speed after scroll stops
    }, 150);
  });

  console.log('${template.name} portfolio loaded.');
});
`;
}


// ─── Main Execution ───

let templatesDb = [];
if (fs.existsSync(TEMPLATES_JSON)) {
  templatesDb = JSON.parse(fs.readFileSync(TEMPLATES_JSON, 'utf8'));
}

newTemplates.forEach(t => {
  // Check if already exists
  if (templatesDb.find(existing => existing.id === t.id)) {
    console.log(`Skipping ${t.id} (already exists)`);
    return;
  }

  const tplDir = path.join(TEMPLATES_DIR, t.category, t.subcategory, 'html-css-js', t.id);
  fs.mkdirSync(tplDir, { recursive: true });

  fs.writeFileSync(path.join(tplDir, 'index.html'), buildHTML(t));
  fs.writeFileSync(path.join(tplDir, 'style.css'), buildCSS(t));
  fs.writeFileSync(path.join(tplDir, 'script.js'), buildJS(t));

  t.path = `templates/github-pages/${t.category}/${t.subcategory}/html-css-js/${t.id}`;
  templatesDb.push(t);
  console.log(`Built: ${t.id}`);
});

fs.writeFileSync(TEMPLATES_JSON, JSON.stringify(templatesDb, null, 2));
console.log(`\\nDone! Total templates: ${templatesDb.length}`);
