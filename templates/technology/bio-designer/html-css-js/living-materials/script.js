const canvas = document.getElementById('bioCanvas');
const ctx = canvas.getContext('2d');
let cells = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<40; i++) {
    cells.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*5+2, vy: -(Math.random()*0.5+0.2) });
}

function drawCells() {
    ctx.fillStyle = 'rgba(3, 13, 8, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    cells.forEach(c => {
        c.y += c.vy; if(c.y<0) c.y = canvas.height;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
        ctx.fillStyle = '#10b981'; ctx.shadowBlur = 10; ctx.shadowColor = '#6ee7b7'; ctx.fill();
    });
    requestAnimationFrame(drawCells);
}
drawCells();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBubble() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 600 + Math.random()*300;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playBubble));