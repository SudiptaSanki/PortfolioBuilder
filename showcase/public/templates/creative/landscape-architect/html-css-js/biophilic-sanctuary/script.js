const canvas = document.getElementById('leafCanvas');
const ctx = canvas.getContext('2d');
let leaves = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<30; i++) {
    leaves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 8 + 4,
        speedY: Math.random() * 0.8 + 0.3,
        speedX: Math.random() * 0.4 - 0.2
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a3b18a';
    leaves.forEach(l => {
        l.y += l.speedY;
        l.x += l.speedX;
        if(l.y > canvas.height) l.y = -10;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.size, 0, Math.PI * 2);
        ctx.fill();
    });
    requestAnimationFrame(animate);
}
animate();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playChime() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.2);
        }, idx * 150);
    });
}

document.getElementById('chimeBtn').addEventListener('click', playChime);