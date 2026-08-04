const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let projectorInterval;

function playProjectorSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if(projectorInterval) { clearInterval(projectorInterval); projectorInterval = null; return; }
    
    projectorInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 100 + Math.random() * 50;
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    }, 80);
}

document.getElementById('projectorBtn').addEventListener('click', playProjectorSound);