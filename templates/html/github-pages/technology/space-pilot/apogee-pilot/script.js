const canvas = document.getElementById('earthCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawHorizon() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 2.2, canvas.height * 1.8, Math.PI * 1.2, Math.PI * 1.8);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#38bdf8';
    ctx.stroke();
    ctx.shadowBlur = 0;
    requestAnimationFrame(drawHorizon);
}
drawHorizon();