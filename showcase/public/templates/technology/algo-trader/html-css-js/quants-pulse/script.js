const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawCandles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x=20; x<canvas.width; x+=40) {
        let h = Math.random()*80 + 20;
        let y = canvas.height/2 + (Math.random()-0.5)*150;
        ctx.fillStyle = Math.random()>0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(x, y, 16, h);
    }
    setTimeout(drawCandles, 500);
}
drawCandles();