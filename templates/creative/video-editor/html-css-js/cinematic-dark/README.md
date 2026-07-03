# Video Editor Portfolio Template

A cinematic, dark, and highly visual portfolio template built for video editors, filmmakers, and motion graphics artists.

## 🎨 Theme Details
- **Aesthetic:** Cinematic Dark
- **Colors:** Deep Black (`#0a0a0a`), Netflix Red, IMDb Gold
- **Fonts:** Oswald (Headings), Roboto (Body)
- **Vibe:** Dramatic, professional, focus on media

## ✨ Key Features
- **Video Background Hero:** Fullscreen hero section designed to host a looping background video (showreel).
- **Sharp UI:** Hard edges (`border-radius: 0`) for a traditional cinematic/film aesthetic.
- **High Contrast:** Bright red and gold accents against a dark background to draw attention to CTAs.
- **Media Focused:** Layouts designed to prioritize thumbnails and video content over text.
- **EmailJS Ready:** Form-to-email functionality built in.

## 📁 File Structure
- `index.html` - Showreel hero, featured videos, and expertise areas
- `about.html` - Director/Editor biography and toolset
- `work.html` - Gallery of all video projects
- `contact.html` - Booking and inquiries form
- `css/style.css` - Styling and layout configurations
- `js/main.js` - Scripting for interactions and form submission

## 🚀 Getting Started

1. **Add Your Showreel:** In `index.html`, replace the `<img class="hero-video-bg">` placeholder with an actual `<video>` tag pointing to your showreel loop.
   ```html
   <video autoplay loop muted playsinline class="hero-video-bg">
     <source src="your-video.mp4" type="video/mp4">
   </video>
   ```
2. **Update Thumbnails:** Replace the image `src` attributes in the video cards with thumbnails of your work. Wrap the cards in `<a>` tags linking to Vimeo or YouTube.
3. **Configure Form:** Set up EmailJS in `js/main.js` and `contact.html` to receive booking inquiries directly to your email.
4. **Deploy:** Host on Netlify, Vercel, or GitHub Pages.
