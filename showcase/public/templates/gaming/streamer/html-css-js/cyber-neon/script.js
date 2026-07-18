// 3D Card effect
const card = document.querySelector('.card3d');
document.addEventListener('mousemove', (e) => {
    let xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    let yAxis = (window.innerHeight / 2 - e.pageY) / 25;
    if(card) card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

// Sound effects on hover using Web Audio API to avoid external assets
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}
function playHoverSound() {
    if(getAudioContext().state === 'suspended') getAudioContext().resume();
    const osc = getAudioContext().createOscillator();
    const gainNode = getAudioContext().createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, getAudioContext().currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, getAudioContext().currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, getAudioContext().currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(getAudioContext().destination);
    
    osc.start();
    osc.stop(getAudioContext().currentTime + 0.1);
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', playHoverSound);
});

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    if (typeof audioCtx !== 'undefined' && getAudioContext().state === 'suspended') {
        getAudioContext().resume();
    }
}, { once: true });
