const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h, t = 0;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      function draw() {
        ctx.clearRect(0,0,w,h);
        t += 0.01;

        const colors = ['rgba(236, 72, 153, 0.08)', 'rgba(139, 92, 246, 0.08)', 'rgba(59, 130, 246, 0.08)'];
        for(let i=0; i<3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const a = t + i*1.2;
          ctx.lineTo(w*0.8 + Math.cos(a)*100, h);
          ctx.lineTo(w*0.4 + Math.sin(a)*100, h);
          ctx.closePath();
          ctx.fillStyle = colors[i];
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();