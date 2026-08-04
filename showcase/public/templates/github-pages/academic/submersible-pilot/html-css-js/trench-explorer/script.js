const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSonarPing() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 1400;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.6);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playSonarPing));