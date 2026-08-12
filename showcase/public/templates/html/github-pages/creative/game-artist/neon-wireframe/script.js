const cube = document.querySelector('.cube');
const btn = document.querySelector('.arcade-btn');
let rx = -20, ry = 30;

function spinCube() {
    rx += 90;
    ry += 120;
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
}

btn.addEventListener('click', () => {
    playArcadeSound();
    spinCube();
});

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playArcadeSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playArcadeSound));