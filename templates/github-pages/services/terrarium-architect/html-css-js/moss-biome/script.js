const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playDrop() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playDrop));