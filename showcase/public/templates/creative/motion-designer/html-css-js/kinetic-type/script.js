// Custom cursor (only if hover is supported)
const cursor = document.querySelector('.cursor-dot');
if (window.matchMedia('(hover: hover)').matches && cursor) {
    document.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Expand cursor on hover
    document.querySelectorAll('a, button, .work-card, h1').forEach(el => {
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
const hoverHeader = document.querySelector('.shake-extreme');
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

// Short beep for links/buttons
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

document.querySelectorAll('.sound-hover, .btn-ripple').forEach(el => {
    el.addEventListener('mouseenter', playBeep);
});

// Navigation Transitions (Gatekeeper Overlay)
const enterBtn = document.getElementById('enterBtn');
const backToGate = document.getElementById('backToGate');
const modal = document.getElementById('showreelModal');
const closeModal = document.getElementById('closeModal');
const iframe = modal ? modal.querySelector('iframe') : null;
let originalIframeSrc = iframe ? iframe.getAttribute('src') : '';

if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        playBeep();
        
        // Remove gate active class from body to reveal site and enable scroll
        document.body.classList.remove('gate-active');
        
        // Open showreel modal automatically
        if (modal) {
            modal.classList.add('active');
            if (iframe && originalIframeSrc) {
                iframe.setAttribute('src', originalIframeSrc.replace('autoplay=0', 'autoplay=1'));
            }
        }
    });
}

if (backToGate) {
    backToGate.addEventListener('click', () => {
        playBeep();
        
        // Return to gatekeeper screen
        document.body.classList.add('gate-active');
        window.scrollTo(0, 0);
    });
}

// Modal closing logic
if (modal && closeModal) {
    closeModal.addEventListener('click', () => {
        playBeep();
        modal.classList.remove('active');
        if (iframe) {
            iframe.setAttribute('src', originalIframeSrc);
        }
    });

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
