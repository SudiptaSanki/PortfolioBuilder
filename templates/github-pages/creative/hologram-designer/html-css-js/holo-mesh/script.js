const canvas = document.getElementById('holoCanvas');
const ctx = canvas.getContext('2d');
let rot = 0;
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawPrism() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(rot);
    
    for(let i=0; i<3; i++) {
        ctx.rotate((Math.PI*2)/3);
        ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(100, 100); ctx.lineTo(-100, 100); ctx.closePath();
        ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.stroke();
    }
    
    ctx.restore();
    rot += 0.01;
    requestAnimationFrame(drawPrism);
}
drawPrism();