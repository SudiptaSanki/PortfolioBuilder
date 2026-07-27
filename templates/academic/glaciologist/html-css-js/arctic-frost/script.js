const canvas = document.getElementById('iceCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

let flakes = Array.from({length: 40}, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*3+1, vy: Math.random()*0.8+0.2 }));
function drawFlakes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach(f => {
        f.y += f.vy; if(f.y>canvas.height) f.y = 0;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
        ctx.fillStyle = '#e0f2fe'; ctx.fill();
    });
    requestAnimationFrame(drawFlakes);
}
drawFlakes();