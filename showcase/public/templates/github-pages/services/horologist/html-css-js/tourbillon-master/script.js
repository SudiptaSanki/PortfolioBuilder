const canvas = document.getElementById('watchCanvas');
const ctx = canvas.getContext('2d');
let rot = 0;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawTourbillon() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(rot);
    
    ctx.beginPath(); ctx.arc(0, 0, 140, 0, Math.PI*2);
    ctx.strokeStyle = '#e8a598'; ctx.lineWidth = 3; ctx.stroke();
    
    ctx.restore();
    rot += 0.02;
    requestAnimationFrame(drawTourbillon);
}
drawTourbillon();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTick() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.02);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playTick));