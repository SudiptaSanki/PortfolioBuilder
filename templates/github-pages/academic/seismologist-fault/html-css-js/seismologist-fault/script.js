const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      let points = [];
      let x = 0;
      function draw() {
        ctx.fillStyle = 'rgba(15, 10, 10, 0.08)';
        ctx.fillRect(0,0,w,h);
        x += 3;
        if(x > w) { x = 0; points = []; }

        const amp = (Math.random() > 0.95) ? (Math.random()-0.5)*180 : (Math.random()-0.5)*15;
        const y = h*0.5 + amp;
        points.push({x, y});

        ctx.beginPath();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        for(let i=0; i<points.length; i++) {
          if(i===0) ctx.moveTo(points[i].x, points[i].y);
          else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        requestAnimationFrame(draw);
      }
      draw();