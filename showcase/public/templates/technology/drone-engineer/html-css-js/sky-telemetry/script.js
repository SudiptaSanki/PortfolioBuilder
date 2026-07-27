const canvas = document.getElementById('hudCanvas');
const ctx = canvas.getContext('2d');
let angle = 0;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawHUD() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let cx = canvas.width/2, cy = canvas.height/2;
    
    ctx.beginPath(); ctx.arc(cx, cy, 180, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)'; ctx.lineWidth = 2; ctx.stroke();
    
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(-220, 0); ctx.lineTo(220, 0);
    ctx.strokeStyle = '#00f0ff'; ctx.stroke();
    ctx.restore();
    
    angle += 0.01;
    requestAnimationFrame(drawHUD);
}
drawHUD();