const canvas = document.getElementById('planetCanvas');
const ctx = canvas.getContext('2d');
let rot = 0;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawPlanet() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    
    ctx.beginPath(); ctx.arc(0, 0, 160, 0, Math.PI*2);
    ctx.fillStyle = '#0a101d'; ctx.fill();
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.stroke();
    
    ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0, 0, 240, 60, 0.4, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255, 119, 0, 0.6)'; ctx.stroke();
    
    ctx.restore();
    rot += 0.005;
    requestAnimationFrame(drawPlanet);
}
drawPlanet();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playOrbitalHum() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playOrbitalHum));