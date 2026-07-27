const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.getElementById('playThemeBtn').addEventListener('click', () => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    let notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx*0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx*0.2 + 1.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx*0.2);
        osc.stop(audioCtx.currentTime + idx*0.2 + 1.5);
    });
});