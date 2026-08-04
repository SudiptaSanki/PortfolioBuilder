const canvas = document.getElementById('partCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

let parts = Array.from({length: 40}, () => ({ x: canvas.width/2, y: canvas.height/2, r: Math.random()*3+1, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8 }));
function drawParticles() {
    ctx.fillStyle = 'rgba(9, 4, 14, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = Math.random()>0.5 ? '#ffaa00' : '#c084fc'; ctx.fill();
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();