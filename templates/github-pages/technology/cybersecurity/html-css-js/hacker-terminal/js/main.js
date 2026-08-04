
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('terminal-input');
  const body = document.getElementById('terminal-body');
  const outputArea = document.getElementById('output-area');

  const content = {
    help: 'Available commands: <span class="highlight">about</span>, <span class="highlight">projects</span>, <span class="highlight">skills</span>, <span class="highlight">education</span>, <span class="highlight">tools</span>, <span class="highlight">logs</span>, <span class="highlight">contact</span>, <span class="highlight">clear</span>',
    about: '<b>Crypt-Shell Analyst:</b> Specialist in penetration testing, threat hunting, and reverse engineering. Certified OSCP & CISSP.',
    projects: '<b>Active Shells:</b><br>- <i>sh-secure:</i> Custom audit script for microservice APIs.<br>- <i>dock-guard:</i> Sandboxed vulnerability inspector for Docker.',
    skills: '<b>Languages:</b> Python, Bash, Rust, Go, assembly x86<br><b>Frameworks:</b> FastAPI, PyTorch, Docker, Kubernetes',
    education: '<b>B.S. in Computer Science</b> - ETH Zurich<br><b>Offensive Security Certified Professional (OSCP)</b><br><b>CISSP Certification</b>',
    tools: '<b>Primary Stack:</b> Nmap, Wireshark, Metasploit, Burp Suite, GDB, Ghidra',
    logs: '<b>Dynamic Firewall Logs:</b><br>' +
          '<span class="prompt">[INFO]</span> 14:32:01 Connection accepted from 192.168.1.104<br>' +
          '<span class="prompt">[WARN]</span> 14:32:05 Attempted brute-force on SSH port 22 blocked from IP 185.220.101.4<br>' +
          '<span class="prompt">[SUCCESS]</span> 14:32:10 Firewall rules updated successfully.',
    contact: 'Send encrypted mail to: <span class="highlight">sec@crypt-shell.org</span>'
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim().toLowerCase();
      input.value = '';
      executeCommand(val);
    }
  });

  document.querySelectorAll('.cmd-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      executeCommand(link.getAttribute('data-cmd'));
    });
  });

  function executeCommand(cmd) {
    if (!cmd) return;

    if (cmd === 'clear') {
      outputArea.innerHTML = '';
      return;
    }

    const commandLine = document.createElement('div');
    commandLine.className = 'history-command';
    commandLine.innerHTML = 'guest@crypt-shell:~$ ' + cmd;
    outputArea.appendChild(commandLine);

    const response = document.createElement('div');
    response.className = 'response-block';
    if (content[cmd]) {
      response.innerHTML = content[cmd];
    } else {
      response.innerHTML = 'Command not found: ' + cmd + '. Type <span class="highlight">help</span> for commands.';
    }
    outputArea.appendChild(response);
    body.scrollTop = body.scrollHeight;
  }
});
  