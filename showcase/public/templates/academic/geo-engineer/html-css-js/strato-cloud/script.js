const canvas = document.getElementById('cloudCanvas');
const ctx = canvas.getContext('2d');
let clouds = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<25; i++) {
    clouds.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*40+20, vx: Math.random()*0.5+0.1 });
}

function drawClouds() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    clouds.forEach(c => {
        c.x += c.vx; if(c.x > canvas.width+50) c.x = -50;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(drawClouds);
}
drawClouds();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playWindSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 400 + Math.random()*200;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playWindSound));