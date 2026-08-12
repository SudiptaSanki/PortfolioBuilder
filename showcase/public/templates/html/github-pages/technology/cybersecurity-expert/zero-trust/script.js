const termBody = document.getElementById('termBody');
const termInput = document.getElementById('termInput');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}

termInput.addEventListener('keydown', (e) => {
    playBeep();
    if (e.key === 'Enter') {
        const cmd = termInput.value.trim().toLowerCase();
        termInput.value = '';
        
        const userLine = document.createElement('div');
        userLine.innerHTML = '<span class="prompt">mercer@sec-box:~$</span> ' + cmd;
        termBody.appendChild(userLine);

        const respLine = document.createElement('div');
        respLine.style.color = '#00ff66';
        respLine.style.marginBottom = '10px';

        if (cmd === 'help') {
            respLine.innerHTML = 'Available commands:<br>- <span style="color:#00f0ff">scan</span>: Run vulnerability scan simulation<br>- <span style="color:#00f0ff">cve</span>: Display latest discovered vulnerabilities<br>- <span style="color:#00f0ff">about</span>: Show engineer bio<br>- <span style="color:#00f0ff">clear</span>: Clear terminal';
        } else if (cmd === 'scan') {
            respLine.innerHTML = '[...] Initializing port scan on 192.168.1.1<br>[✓] Port 22/tcp (SSH) OPEN<br>[✓] Port 443/tcp (HTTPS) OPEN<br>[!] Warning: Outdated SSL TLS 1.0 handshake detected!';
        } else if (cmd === 'cve') {
            respLine.innerHTML = 'CVE-2025-48192 [CRITICAL] OAuth Server RCE<br>CVE-2025-39102 [HIGH] Container Runtime Privilege Escalation';
        } else if (cmd === 'about') {
            respLine.innerHTML = 'Alex Mercer - Red Team Lead & Cybersecurity Architect. Specializing in offensive adversary simulation & zero-trust cloud hardening.';
        } else if (cmd === 'clear') {
            termBody.innerHTML = '';
            return;
        } else {
            respLine.style.color = '#ff3355';
            respLine.textContent = 'Command not recognized. Type "help" for a list of commands.';
        }

        termBody.appendChild(respLine);
        termBody.scrollTop = termBody.scrollHeight;
    }
});

document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playBeep));