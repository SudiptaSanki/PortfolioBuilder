const canvas = document.getElementById('vfxCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<60; i++) {
    particles.push({ x: canvas.width/2, y: canvas.height/2, r: Math.random()*4+1, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, alpha: 1 });
}

function drawVFX() {
    ctx.fillStyle = 'rgba(5, 4, 10, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = Math.random()>0.5 ? '#d946ef' : '#06b6d4';
        ctx.shadowBlur = 10; ctx.shadowColor = '#d946ef'; ctx.fill();
    });
    requestAnimationFrame(drawVFX);
}
drawVFX();