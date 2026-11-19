const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let mouse = { x: null, y: null };

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

for(let i=0; i<150; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: Math.random() > 0.5 ? '#00f0ff' : '#7000ff'
    });
}

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function animate() {
    ctx.fillStyle = 'rgba(3, 4, 11, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
        star.x += star.vx;
        star.y += star.vy;
        if(star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if(star.y < 0 || star.y > canvas.height) star.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        
        if(mouse.x) {
            let dx = mouse.x - star.x;
            let dy = mouse.y - star.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 100) {
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = 'rgba(0, 240, 255, ' + (1 - dist/100) * 0.4 + ')';
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(animate);
}
animate();

// Sound Synth
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCosmicTone(freq=300) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq*1.5, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', () => playCosmicTone(440));
});
document.getElementById('initPulse').addEventListener('click', () => {
    playCosmicTone(150);
    stars.forEach(s => { s.vx *= 3; s.vy *= 3; });
    setTimeout(() => { stars.forEach(s => { s.vx /= 3; s.vy /= 3; }); }, 1000);
});