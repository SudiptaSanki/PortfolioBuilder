// Synth Pulse Audio System Interface
document.addEventListener('DOMContentLoaded', () => {
  console.log('SYNTH_PULSE systems online.');

  // Tracks list data
  const tracks = [
    { name: 'NEON_DRIFT.WAV', genre: 'SYNTHWAVE / Darksynth', duration: '03:45' },
    { name: 'CYBER_PULSE.MP3', genre: 'CYBERPUNK / Industrial', duration: '04:12' },
    { name: 'CHRONO_TRIGGER_MIX.WAV', genre: 'RETROWAVE / Chillwave', duration: '05:01' },
    { name: 'STATIC_SHADOWS.WAV', genre: 'AMBIENT / Dark Ambient', duration: '02:58' }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let playPercent = 35;
  let playInterval = null;

  // DOM elements
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const trackNameDisplay = document.getElementById('current-track-name');
  const trackGenreDisplay = document.getElementById('current-track-genre');
  const progressBar = document.getElementById('progress-bar');
  const trackRows = document.querySelectorAll('.track-row');

  // Load track
  function loadTrack(idx) {
    currentTrackIdx = idx;
    const track = tracks[idx];
    trackNameDisplay.textContent = track.name;
    trackGenreDisplay.textContent = track.genre;
    
    // Highlight list row
    trackRows.forEach((row, i) => {
      if (i === idx) {
        row.classList.add('active-row');
      } else {
        row.classList.remove('active-row');
      }
    });

    // Reset progress
    playPercent = 0;
    progressBar.style.width = '0%';
  }

  // Play/Pause Action
  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playBtn.textContent = 'PAUSE';
      playBtn.classList.add('playing');
      
      // Start simulated progress
      playInterval = setInterval(() => {
        playPercent += 0.5;
        if (playPercent >= 100) {
          playPercent = 0;
          // Go to next track
          nextTrack();
        }
        progressBar.style.width = playPercent + '%';
      }, 100);
    } else {
      playBtn.textContent = 'PLAY';
      playBtn.classList.remove('playing');
      clearInterval(playInterval);
    }
  }

  function nextTrack() {
    let nextIdx = currentTrackIdx + 1;
    if (nextIdx >= tracks.length) nextIdx = 0;
    loadTrack(nextIdx);
  }

  function prevTrack() {
    let prevIdx = currentTrackIdx - 1;
    if (prevIdx < 0) prevIdx = tracks.length - 1;
    loadTrack(prevIdx);
  }

  // Event listeners
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', () => {
    nextTrack();
    if (isPlaying) {
      // Keep playing
      isPlaying = false;
      togglePlay();
    }
  });
  prevBtn.addEventListener('click', () => {
    prevTrack();
    if (isPlaying) {
      // Keep playing
      isPlaying = false;
      togglePlay();
    }
  });

  trackRows.forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.getAttribute('data-track'));
      loadTrack(idx);
      if (!isPlaying) {
        togglePlay();
      }
    });
  });

  // Equalizer Canvas Animation
  const canvas = document.getElementById('eq-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set internal canvas size matching display size
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const numBars = 32;
  const barHeights = Array(numBars).fill(10);
  const targetHeights = Array(numBars).fill(10);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / numBars;
    
    for (let i = 0; i < numBars; i++) {
      if (isPlaying) {
        // Random spikes, taller in the middle/low-ends
        if (Math.random() < 0.15) {
          const factor = i < 8 ? 0.8 : (i > 24 ? 0.3 : 0.6);
          targetHeights[i] = Math.random() * canvas.height * factor + 5;
        }
      } else {
        // Decays slowly down to flat line
        targetHeights[i] = 4;
      }
      
      // Interpolate height for smoothness
      barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.15;
      
      // Draw bar
      const h = barHeights[i];
      const x = i * barWidth + 2;
      const y = canvas.height - h;
      const w = barWidth - 4;
      
      // Gradient colors (Cyan to Magenta)
      const grad = ctx.createLinearGradient(x, y, x, canvas.height);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(0.5, '#bd00ff');
      grad.addColorStop(1, '#ff007f');
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
    }
    
    requestAnimationFrame(animate);
  }

  animate();
});
