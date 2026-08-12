const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h, angle = 0;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      function draw() {
        ctx.fillStyle = 'rgba(3, 20, 26, 0.1)';
        ctx.fillRect(0,0,w,h);
        angle += 0.02;

        const cx = w*0.7, cy = h*0.5;
        const radius = 180;

        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'; ctx.stroke();

        ctx.beginPath(); ctx.arc(cx, cy, radius*0.6, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + 0.4);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();

        requestAnimationFrame(draw);
      }
      draw();