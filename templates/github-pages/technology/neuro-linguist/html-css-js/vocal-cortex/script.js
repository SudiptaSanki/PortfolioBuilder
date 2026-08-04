const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');
let w = 0;
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for(let x=0; x<canvas.width; x+=10) {
        let y = canvas.height/2 + Math.sin(x*0.02 + w)*40;
        if(x===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3; ctx.stroke();
    w += 0.05;
    requestAnimationFrame(drawWave);
}
drawWave();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playVocalSynth() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playVocalSynth));