const slider = document.getElementById('lumenSlider');
const hero = document.getElementById('hero');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

slider.addEventListener('input', (e) => {
    let val = e.target.value;
    document.body.style.background = 'rgb(' + Math.floor(18 * val/50) + ',' + Math.floor(18 * val/50) + ',' + Math.floor(20 * val/50) + ')';
    playHum();
});

function playHum() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}