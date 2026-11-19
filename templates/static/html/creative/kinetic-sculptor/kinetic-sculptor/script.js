const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h, t = 0;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      function draw() {
        ctx.fillStyle = 'rgba(15, 14, 19, 0.15)';
        ctx.fillRect(0,0,w,h);
        t += 0.02;

        const cx = w*0.5, cy = h*0.5;
        ctx.beginPath();
        for(let i=0; i<200; i++) {
          const a = i * 0.1;
          const r = 120 * Math.sin(a*3 + t) + 80;
          const x = cx + r * Math.cos(a + t*0.5);
          const y = cy + r * Math.sin(a*0.8 - t*0.3);
          if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        requestAnimationFrame(draw);
      }
      draw();