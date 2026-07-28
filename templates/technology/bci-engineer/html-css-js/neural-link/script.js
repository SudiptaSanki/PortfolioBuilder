const canvas = document.getElementById('eegCanvas');
const ctx = canvas.getContext('2d');
let t = 0;
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawEEG() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for(let x=0; x<canvas.width; x+=5) {
        let y = canvas.height/2 + Math.sin(x*0.02 + t)*30 + Math.sin(x*0.05 + t*2)*15;
        if(x===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.stroke();
    t += 0.05;
    requestAnimationFrame(drawEEG);
}
drawEEG();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playBeep));