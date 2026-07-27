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
        let y = canvas.height/2 + Math.sin(x*0.01 + w)*30;
        if(x===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    w += 0.03;
    requestAnimationFrame(drawWave);
}
drawWave();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playWaterChime() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 900;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playWaterChime));