const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h, t = 0;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      function draw() {
        ctx.clearRect(0,0,w,h);
        t += 0.01;
        for(let i=0; i<3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, h*(0.4 + i*0.15));
          for(let x=0; x<=w; x+=10) {
            const y = h*(0.4 + i*0.15) + Math.sin(x*0.003 + t + i)*30;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.fillStyle = i===0 ? 'rgba(234, 179, 8, 0.05)' : 'rgba(180, 83, 9, 0.04)';
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();