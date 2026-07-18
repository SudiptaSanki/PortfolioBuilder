// Custom cursor
const cursor = document.querySelector('.cursor-dot');
document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// Expand cursor on hover
document.querySelectorAll('h1, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.width = '60px';
        cursor.style.height = '60px';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.width = '20px';
        cursor.style.height = '20px';
    });
});

// Heavy bass sound on hover of H1
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}
document.querySelector('h1').addEventListener('mouseenter', () => {
    if(getAudioContext().state === 'suspended') getAudioContext().resume();
    const osc = getAudioContext().createOscillator();
    const gain = getAudioContext().createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, getAudioContext().currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, getAudioContext().currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.5, getAudioContext().currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(getAudioContext().destination);
    osc.start();
    osc.stop(getAudioContext().currentTime + 0.3);
});

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    if (typeof audioCtx !== 'undefined' && getAudioContext().state === 'suspended') {
        getAudioContext().resume();
    }
}, { once: true });
