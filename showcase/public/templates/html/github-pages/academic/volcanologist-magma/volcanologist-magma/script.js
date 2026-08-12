const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      const embers = [];
      for(let i=0; i<70; i++) {
        embers.push({
          x: Math.random()*w,
          y: h + Math.random()*100,
          vy: -Math.random()*2 - 0.5,
          vx: (Math.random()-0.5)*1,
          size: Math.random()*3 + 1,
          alpha: Math.random()
        });
      }

      function draw() {
        ctx.fillStyle = 'rgba(10, 8, 7, 0.2)';
        ctx.fillRect(0,0,w,h);
        embers.forEach(e => {
          e.y += e.vy; e.x += e.vx; e.alpha -= 0.003;
          if(e.y < -10 || e.alpha <= 0) {
            e.y = h + 10; e.x = Math.random()*w;
            e.alpha = 1; e.vy = -Math.random()*2 - 0.5;
          }
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(234, 88, 12, ' + e.alpha + ')';
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();