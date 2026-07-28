const canvas = document.getElementById('flickerCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function draw() {
    ctx.fillStyle = Math.random() > 0.95 ? 'rgba(255,170,0,0.2)' : 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(draw);
}
draw();