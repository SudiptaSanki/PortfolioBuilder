const qCanvas = document.getElementById('qubitCanvas');
if (qCanvas) {
    const qCtx = qCanvas.getContext('2d');
    let width = qCanvas.width = qCanvas.parentElement.clientWidth;
    let height = qCanvas.height = qCanvas.parentElement.clientHeight;

    let angle = 0;
    function renderQubit() {
        qCtx.clearRect(0, 0, width, height);
        angle += 0.02;

        const cx = width / 2;
        const cy = height / 2;
        const radius = 80;

        qCtx.beginPath();
        qCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        qCtx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        qCtx.stroke();

        const qx = cx + Math.cos(angle) * radius;
        const qy = cy + Math.sin(angle * 0.5) * (radius * 0.4);

        qCtx.beginPath();
        qCtx.moveTo(cx, cy);
        qCtx.lineTo(qx, qy);
        qCtx.strokeStyle = '#c084fc';
        qCtx.lineWidth = 2;
        qCtx.stroke();

        qCtx.beginPath();
        qCtx.arc(qx, qy, 6, 0, Math.PI * 2);
        qCtx.fillStyle = '#38bdf8';
        qCtx.fill();

        requestAnimationFrame(renderQubit);
    }
    renderQubit();
}
