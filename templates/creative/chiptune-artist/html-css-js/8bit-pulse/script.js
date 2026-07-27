const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playArp() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    let freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + idx*0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx*0.05 + 0.05);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx*0.05);
        osc.stop(audioCtx.currentTime + idx*0.05 + 0.05);
    });
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playArp));