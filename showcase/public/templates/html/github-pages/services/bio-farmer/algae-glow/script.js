const canvas = document.getElementById('sporeCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

let spores = Array.from({length: 30}, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*4+2, vy: -(Math.random()*0.4+0.1) }));
function drawSpores() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    spores.forEach(s => {
        s.y += s.vy; if(s.y<0) s.y = canvas.height;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = '#14b8a6'; ctx.shadowBlur = 12; ctx.shadowColor = '#14b8a6'; ctx.fill();
    });
    requestAnimationFrame(drawSpores);
}
drawSpores();