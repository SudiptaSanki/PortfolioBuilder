const btn = document.getElementById('cipherBtn');
const keyOut = document.getElementById('keyOut');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

btn.addEventListener('click', () => {
    let randomKey = 'KEY: 0x' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
    keyOut.textContent = randomKey;
    playKeySynth();
});

function playKeySynth() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}