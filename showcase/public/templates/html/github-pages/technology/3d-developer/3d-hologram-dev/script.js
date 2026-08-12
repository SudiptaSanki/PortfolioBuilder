const canvas = document.getElementById('hologramCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({length: 80}).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.angle += p.speed;
            p.x += Math.cos(p.angle) * 1.5;
            p.y += Math.sin(p.angle) * 1.5;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${0.3 * p.z})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f0ff';
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}
