const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('mouseenter', () => {
        let freq = parseFloat(key.dataset.freq);
        playTone(freq);
    });
});

function playTone(freq) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}