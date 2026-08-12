const canvas = document.getElementById('abyssCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<60; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        vy: - (Math.random() * 0.6 + 0.2),
        alpha: Math.random() * 0.8 + 0.2
    });
}

function animate() {
    ctx.fillStyle = 'rgba(2, 11, 20, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        p.y += p.vy;
        if(p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 163, ' + p.alpha + ')';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.fill();
    });
    requestAnimationFrame(animate);
}
animate();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSonarPing() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

document.getElementById('sonarBtn').addEventListener('click', playSonarPing);