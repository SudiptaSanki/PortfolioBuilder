const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h, t = 0;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      function draw() {
        ctx.fillStyle = 'rgba(7, 11, 20, 0.15)';
        ctx.fillRect(0,0,w,h);
        t += 0.03;
        ctx.beginPath();
        for(let x=0; x<w; x+=5) {
          const y = h*0.5 + Math.sin(x*0.01 + t)*40 * Math.cos(x*0.005 - t*0.5);
          if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        for(let x=0; x<w; x+=5) {
          const y = h*0.5 + Math.sin(x*0.01 - t)*30;
          if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        requestAnimationFrame(draw);
      }
      draw();