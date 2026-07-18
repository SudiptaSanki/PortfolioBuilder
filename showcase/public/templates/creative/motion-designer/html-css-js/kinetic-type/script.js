// Custom cursor (only if hover is supported)
const cursor = document.querySelector('.cursor-dot');
if (window.matchMedia('(hover: hover)').matches && cursor) {
    document.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Expand cursor on hover
    document.querySelectorAll('a, button, .work-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width = '60px';
            cursor.style.height = '60px';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.width = '20px';
            cursor.style.height = '20px';
        });
    });
}

// Lazy AudioContext
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// Heavy bass sound on hover of H1
const hoverHeader = document.querySelector('h1');
if (hoverHeader) {
    hoverHeader.addEventListener('mouseenter', () => {
        try {
            const ctx = getAudioContext();
            if(ctx.state === 'suspended') ctx.resume();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.log("AudioContext blocked or failed: ", e);
        }
    });
}

// Short beep for links
function playBeep() {
    try {
        const ctx = getAudioContext();
        if(ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch(e) {
        console.log("AudioContext blocked or failed: ", e);
    }
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', playBeep);
});

// Modal Logic
const modal = document.getElementById('showreelModal');
const showreelBtn = document.getElementById('showreelBtn');
const closeModal = document.getElementById('closeModal');
const iframe = modal ? modal.querySelector('iframe') : null;
let originalIframeSrc = iframe ? iframe.getAttribute('src') : '';

if (showreelBtn && modal && closeModal) {
    showreelBtn.addEventListener('click', () => {
        playBeep();
        modal.classList.add('active');
        if (iframe && originalIframeSrc) {
            // Force play on open by modifying src (if supported)
            iframe.setAttribute('src', originalIframeSrc.replace('autoplay=0', 'autoplay=1'));
        }
    });

    closeModal.addEventListener('click', () => {
        playBeep();
        modal.classList.remove('active');
        if (iframe) {
            // Stop video playing by resetting src
            iframe.setAttribute('src', originalIframeSrc);
        }
    });

    // Close on click outside modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            if (iframe) {
                iframe.setAttribute('src', originalIframeSrc);
            }
        }
    });
}

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    } catch (e) {
        console.log("AudioContext resume failed: ", e);
    }
}, { once: true });
