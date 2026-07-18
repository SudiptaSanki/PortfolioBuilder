const title = document.querySelector('.sound-trigger');
const lights = document.querySelectorAll('.light');
let strobeInterval;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBassDrop() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1);
    
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
}

title.addEventListener('mouseenter', () => {
    playBassDrop();
    document.body.classList.add('boom');
    
    // Strobe effect
    let count = 0;
    strobeInterval = setInterval(() => {
        document.body.classList.toggle('strobe');
        
        // Randomize lights
        lights.forEach(light => {
            light.style.height = (Math.random() * 100 + 20) + 'px';
            light.style.opacity = Math.random();
        });
        
        count++;
        if(count > 10) {
            clearInterval(strobeInterval);
            document.body.classList.remove('strobe');
            document.body.classList.remove('boom');
            lights.forEach(light => {
                light.style.height = '20px';
                light.style.opacity = 1;
            });
        }
    }, 100);
});

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });
