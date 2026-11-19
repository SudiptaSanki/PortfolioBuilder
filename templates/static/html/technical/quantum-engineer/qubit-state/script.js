const btn = document.getElementById('entangleBtn');
const qState = document.getElementById('qState');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

btn.addEventListener('click', () => {
    qState.textContent = "STATE: (1/√2)(|0⟩ + |1⟩)";
    qState.style.color = "#00f0ff";
    playQuantumSound();
});

function playQuantumSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}