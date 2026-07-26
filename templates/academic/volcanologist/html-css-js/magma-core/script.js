const canvas = document.getElementById('emberCanvas');
const ctx = canvas.getContext('2d');
let embers = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<70; i++) {
    embers.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        vy: - (Math.random() * 1.2 + 0.4),
        vx: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.8 + 0.2
    });
}

function animate() {
    ctx.fillStyle = 'rgba(9, 4, 3, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    embers.forEach(e => {
        e.y += e.vy;
        e.x += e.vx;
        if(e.y < 0) { e.y = canvas.height; e.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.3 ? 'rgba(255, 51, 0, ' + e.alpha + ')' : 'rgba(255, 170, 0, ' + e.alpha + ')';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff3300';
        ctx.fill();
    });
    requestAnimationFrame(animate);
}
animate();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playRumble() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

document.getElementById('magmaBtn').addEventListener('click', playRumble);