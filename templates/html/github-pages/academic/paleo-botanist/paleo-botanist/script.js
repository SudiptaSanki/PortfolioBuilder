const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      const amberDots = [];
      for(let i=0; i<45; i++) {
        amberDots.push({
          x: Math.random()*w, y: Math.random()*h,
          r: Math.random()*4 + 1,
          pulse: Math.random()*Math.PI*2,
          speed: Math.random()*0.02 + 0.01
        });
      }

      function draw() {
        ctx.clearRect(0,0,w,h);
        amberDots.forEach(p => {
          p.pulse += p.speed;
          const alpha = 0.3 + Math.sin(p.pulse)*0.25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(245, 158, 11, ' + alpha + ')';
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();