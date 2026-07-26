const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');
let points = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', e => {
    points.push({ x: e.clientX, y: e.clientY, r: 25, alpha: 0.6 });
    playChime();
});

function animate() {
    ctx.fillStyle = 'rgba(13, 8, 10, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    points.forEach((p, idx) => {
        p.r *= 0.95;
        p.alpha -= 0.01;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232, 165, 152, ' + p.alpha + ')';
        ctx.fill();
    });
    points = points.filter(p => p.alpha > 0);
    requestAnimationFrame(animate);
}
animate();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let lastTone = 0;
function playChime() {
    let now = Date.now();
    if(now - lastTone < 150) return;
    lastTone = now;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 400 + Math.random() * 400;
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}