const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

let stars = Array.from({length: 80}, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+1 }));
function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = Math.random()>0.2 ? '#38bdf8' : '#c084fc'; ctx.fill();
    });
    requestAnimationFrame(drawStars);
}
drawStars();