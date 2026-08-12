const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w, h, angle = 0;
      function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      function drawGear(cx, cy, radius, teeth, rot, color) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for(let i=0; i<teeth; i++) {
          const a = (i/teeth)*Math.PI*2;
          const a2 = ((i+0.5)/teeth)*Math.PI*2;
          const rOut = radius + 8;
          const rIn = radius - 4;
          ctx.lineTo(Math.cos(a)*rIn, Math.sin(a)*rIn);
          ctx.lineTo(Math.cos(a)*rOut, Math.sin(a)*rOut);
          ctx.lineTo(Math.cos(a2)*rOut, Math.sin(a2)*rOut);
          ctx.lineTo(Math.cos(a2)*rIn, Math.sin(a2)*rIn);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0, radius*0.3, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }

      function draw() {
        ctx.clearRect(0,0,w,h);
        angle += 0.008;
        drawGear(w*0.8, h*0.3, 90, 16, angle, 'rgba(217, 119, 6, 0.4)');
        drawGear(w*0.8 + 150, h*0.3, 60, 12, -angle*1.33, 'rgba(146, 64, 14, 0.4)');
        requestAnimationFrame(draw);
      }
      draw();