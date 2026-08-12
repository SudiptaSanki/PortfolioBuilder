const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

let particles = [];
function createBurst(x, y) {
    const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#3b82f6'];
    const count = 60;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const speed = Math.random() * 5 + 2;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

setInterval(() => {
    createBurst(Math.random() * canvas.width, Math.random() * canvas.height * 0.6);
}, 1200);

function draw() {
    ctx.fillStyle = 'rgba(3, 3, 8, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy + 0.1; // gravity
        p.alpha -= 0.015;
        if (p.alpha <= 0) { particles.splice(i, 1); return; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    requestAnimationFrame(draw);
}
draw();