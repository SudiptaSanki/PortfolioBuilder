// Audio Synthesizer State
let soundEnabled = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playDataSound() {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch(e) {}
}

function playClickSound() {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
}

// Audio Toggle Button
const audioToggleBtn = document.getElementById('audioToggleBtn');
if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        audioToggleBtn.innerText = soundEnabled ? '[ 🔊 AUDIO: ON ]' : '[ 🔇 AUDIO: OFF ]';
        playClickSound();
    });
}

// Sound hover triggers
document.querySelectorAll('.sound-hover, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => playDataSound());
});

// Matrix Rain Background
const canvas = document.getElementById('matrix');
if (canvas) {
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const letters = '0123456789ABCDEF⚡SYS_NEURAL_NEXUS';
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = Array.from({length: columns}).map(() => Math.floor(Math.random() * -100));

    function drawMatrix() {
        ctx.fillStyle = 'rgba(3, 7, 13, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff66';
        ctx.font = fontSize + 'px monospace';
        
        for(let i = 0; i < drops.length; i++) {
            const text = letters.charAt(Math.floor(Math.random() * letters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(drawMatrix, 40);
}

// Typewriter Effect
const typeTarget = document.querySelector('.typewriter');
if (typeTarget) {
    const text = typeTarget.getAttribute('data-text') || ">> NEXUS OS v4.2 // Neural weights loaded. 99.8% precision achieved.";
    typeTarget.innerHTML = '';
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            typeTarget.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, 35);
        }
    }
    setTimeout(typeWriter, 500);
}

// Mobile Menu Toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');
if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        playClickSound();
    });
}

// Interactive AI Sandbox Simulation
const runInferenceBtn = document.getElementById('runInferenceBtn');
const modelSelect = document.getElementById('modelSelect');
const terminalOutput = document.getElementById('terminalOutput');

const modelOutputs = {
    'llm-cyber': `[INFERENCE START] Model: Nexus-LLM-70B
> Initializing CUDA kernels... [OK]
> Quantization: 4-bit AWQ | Latency: 8.2ms
> Prompt: "Optimize distributed neural cluster routing"
> Output: Tokens generated @ 142 tokens/sec. 
  Result: Neural topology re-routed via ZK-Proof pathways with zero packet loss.`,
    
    'vision-tr': `[INFERENCE START] Model: Vision-Transformer-X
> Frame Resolution: 3840x2160 @ 120FPS
> Object Detection: 142 Entities Classified in 4.1ms
> Accuracy Score: 99.84% (COCO benchmark)
> Segment Mask: Tensor map compiled successfully.`,
    
    'quantum-embed': `[INFERENCE START] Model: Quantum-Embedder
> Vector Dimensionality: 1536D High-Sparse
> Cosine Similarity Search: 10M Vectors in 1.4ms
> Nearest Neighbors: 5 Clusters Identified (Confidence 0.999)
> Vector Index Status: Synchronized.`
};

if (runInferenceBtn && modelSelect && terminalOutput) {
    runInferenceBtn.addEventListener('click', () => {
        playClickSound();
        const selected = modelSelect.value;
        terminalOutput.innerHTML = `> Querying Neural Cluster... \n> Executing tensor operations...`;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            terminalOutput.innerHTML = `> Querying Neural Cluster... [${progress}%]\n> Calculating weights...`;
            if (progress >= 100) {
                clearInterval(interval);
                terminalOutput.innerHTML = modelOutputs[selected] || `> Inference complete. Model executed.`;
                playDataSound();
            }
        }, 150);
    });
}

// Interactive Neural Topology Canvas Visualizer
const topoCanvas = document.getElementById('topologyCanvas');
if (topoCanvas) {
    const tCtx = topoCanvas.getContext('2d');
    let width = topoCanvas.width = topoCanvas.parentElement.clientWidth;
    let height = topoCanvas.height = topoCanvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
        if (!topoCanvas.parentElement) return;
        width = topoCanvas.width = topoCanvas.parentElement.clientWidth;
        height = topoCanvas.height = topoCanvas.parentElement.clientHeight;
    });

    const nodes = Array.from({length: 45}).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 2
    }));

    let mouse = { x: null, y: null };
    topoCanvas.addEventListener('mousemove', (e) => {
        const rect = topoCanvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    topoCanvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function drawTopology() {
        tCtx.clearRect(0, 0, width, height);

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;

            tCtx.beginPath();
            tCtx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            tCtx.fillStyle = '#00ff66';
            tCtx.fill();

            for (let j = i + 1; j < nodes.length; j++) {
                const n2 = nodes[j];
                const dx = n.x - n2.x;
                const dy = n.y - n2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    tCtx.beginPath();
                    tCtx.moveTo(n.x, n.y);
                    tCtx.lineTo(n2.x, n2.y);
                    tCtx.strokeStyle = `rgba(0, 255, 102, ${1 - dist / 120})`;
                    tCtx.lineWidth = 0.6;
                    tCtx.stroke();
                }
            }

            if (mouse.x && mouse.y) {
                const mDx = n.x - mouse.x;
                const mDy = n.y - mouse.y;
                const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
                if (mDist < 150) {
                    tCtx.beginPath();
                    tCtx.moveTo(n.x, n.y);
                    tCtx.lineTo(mouse.x, mouse.y);
                    tCtx.strokeStyle = `rgba(0, 240, 255, ${1 - mDist / 150})`;
                    tCtx.lineWidth = 1.2;
                    tCtx.stroke();
                }
            }
        }
        requestAnimationFrame(drawTopology);
    }
    drawTopology();
}

// Form Submission simulation
const contactForm = document.getElementById('cyberContactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerText = 'TRANSMITTING TENSORS...';
            setTimeout(() => {
                submitBtn.innerText = '✓ SEQUENCE INITIALIZED';
                alert('Transmission Received! API keys and documentation have been dispatched to your terminal email.');
                contactForm.reset();
                setTimeout(() => submitBtn.innerText = 'INITIALIZE API ACCESS', 2000);
            }, 1000);
        }
    });
}