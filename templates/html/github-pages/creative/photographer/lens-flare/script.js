let soundEnabled = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playShutter() {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.06);
        
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
        
        // Mechanical noise buffer
        const bufferSize = audioCtx.sampleRate * 0.05;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
        noise.start();
    } catch(e) {}
}

// Shutter Audio Toggle
const shutterAudioBtn = document.getElementById('shutterAudioBtn');
if (shutterAudioBtn) {
    shutterAudioBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        shutterAudioBtn.innerText = soundEnabled ? '[ 🔊 SHUTTER AUDIO: ON ]' : '[ 🔇 SHUTTER AUDIO: OFF ]';
        playShutter();
    });
}

// Flash Screen Trigger on Shutter Hover
document.querySelectorAll('.photo-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
        playShutter();
        document.body.classList.add('flash');
        setTimeout(() => document.body.classList.remove('flash'), 80);
    });
});

// Mobile Nav Toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');
if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        playShutter();
    });
}

// Gallery Category Filter
const filterBtns = document.querySelectorAll('.filter-btn');
const photoItems = document.querySelectorAll('.photo-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playShutter();

        const cat = btn.getAttribute('data-filter');
        photoItems.forEach(item => {
            if (cat === 'all' || item.getAttribute('data-category') === cat) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Lightbox Modal Handler
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const exifIso = document.getElementById('exifIso');
const exifAperture = document.getElementById('exifAperture');
const exifShutter = document.getElementById('exifShutter');
const exifLens = document.getElementById('exifLens');
const lightboxClose = document.getElementById('lightboxClose');

if (photoItems.length > 0 && lightboxModal) {
    photoItems.forEach(item => {
        item.addEventListener('click', () => {
            playShutter();
            document.body.classList.add('flash');
            setTimeout(() => document.body.classList.remove('flash'), 100);

            const img = item.querySelector('img');
            const title = item.getAttribute('data-title') || 'Untitled Masterpiece';
            const iso = item.getAttribute('data-iso') || 'ISO 400';
            const aperture = item.getAttribute('data-aperture') || 'f/1.4';
            const shutter = item.getAttribute('data-shutter') || '1/2000s';
            const lens = item.getAttribute('data-lens') || 'FE 35mm F1.4 GM';

            if (lightboxImg && img) lightboxImg.src = img.src;
            if (lightboxTitle) lightboxTitle.innerText = title;
            if (exifIso) exifIso.innerText = iso;
            if (exifAperture) exifAperture.innerText = aperture;
            if (exifShutter) exifShutter.innerText = shutter;
            if (exifLens) exifLens.innerText = lens;

            lightboxModal.classList.add('active');
        });
    });
}

if (lightboxClose && lightboxModal) {
    lightboxClose.addEventListener('click', () => {
        lightboxModal.classList.remove('active');
    });
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });
}

// Form Submit Handler
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playShutter();
        const btn = bookingForm.querySelector('button[type="submit"]');
        if (btn) {
            btn.innerText = 'CAMERA SNAP... SENT!';
            setTimeout(() => {
                alert('Thank you! Your photography booking inquiry has been received. Our studio manager will reply within 24 hours.');
                bookingForm.reset();
                btn.innerText = 'SEND BOOKING INQUIRY';
            }, 800);
        }
    });
}