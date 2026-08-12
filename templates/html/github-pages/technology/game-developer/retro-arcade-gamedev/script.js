const gCanvas = document.getElementById('gameCanvas');
if (gCanvas) {
    const gCtx = gCanvas.getContext('2d');
    let px = 200, py = 150, dx = 3, dy = 2;

    function gameLoop() {
        gCtx.fillStyle = '#000';
        gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);

        px += dx;
        py += dy;
        if (px < 10 || px > gCanvas.width - 20) dx *= -1;
        if (py < 10 || py > gCanvas.height - 20) dy *= -1;

        gCtx.fillStyle = '#00f0ff';
        gCtx.fillRect(px, py, 15, 15);

        gCtx.fillStyle = '#ffee00';
        gCtx.font = '10px "Press Start 2P"';
        gCtx.fillText("SCORE: 999900", 20, 30);

        requestAnimationFrame(gameLoop);
    }
    gameLoop();
}
