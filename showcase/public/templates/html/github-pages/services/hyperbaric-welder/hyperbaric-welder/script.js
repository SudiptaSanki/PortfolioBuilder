const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      const sparks = [];
      for(let i=0; i<60; i++) {
        sparks.push({
          x: w*0.5 + (Math.random()-0.5)*100,
          y: h*0.6 + (Math.random()-0.5)*100,
          vx: (Math.random()-0.5)*8,
          vy: (Math.random()-0.5)*8 - 2,
          life: Math.random(),
          size: Math.random()*2.5 + 1
        });
      }

      function draw() {
        ctx.fillStyle = 'rgba(5, 16, 26, 0.2)';
        ctx.fillRect(0,0,w,h);
        sparks.forEach(s => {
          s.x += s.vx; s.y += s.vy; s.life -= 0.02;
          if(s.life <= 0) {
            s.x = w*0.5 + (Math.random()-0.5)*40;
            s.y = h*0.55 + (Math.random()-0.5)*40;
            s.vx = (Math.random()-0.5)*8;
            s.vy = (Math.random()-0.5)*8 - 2;
            s.life = 1;
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI*2);
          ctx.fillStyle = s.life > 0.5 ? '#ffffff' : '#00e5ff';
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();