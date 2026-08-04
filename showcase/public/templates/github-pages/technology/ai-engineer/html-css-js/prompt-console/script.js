// Interactive Command Line Terminal Portfolio for Dr. Kaelen Vance
document.addEventListener('DOMContentLoaded', () => {
  const terminalInput = document.getElementById('terminal-input');
  const outputArea = document.getElementById('output-area');
  const terminalBody = document.getElementById('terminal-body');

  const database = {
    about: `
      <div class="terminal-line"><span class="highlight">Dr. Kaelen Vance</span> is a Senior Prompt Architect and Cognitive Orchestrator.</div>
      <div class="terminal-line">Specializes in engineering dynamic agent workflows, semantic routers, and structured prompt template pipelines.</div>
      <div class="terminal-line">Active in bridging the gap between raw LLM outputs and deterministic application structures.</div>
    `,
    skills: `
      <div class="terminal-line">// CORE TECH STACK & METHODOLOGIES //</div>
      <div class="terminal-line"><span class="highlight">> PROMPT_ENGINEERING:</span> Chain-of-Thought (CoT), Few-Shot Guardrails, Skeleton-of-Thought.</div>
      <div class="terminal-line"><span class="highlight">> ORCHESTRATION:</span> LangChain, LangGraph, AutoGen, CrewAI.</div>
      <div class="terminal-line"><span class="highlight">> LLM_MODELS:</span> Claude 3.5 Sonnet, Gemini 1.5 Pro, GPT-4o, Llama-3.1.</div>
      <div class="terminal-line"><span class="highlight">> SEMANTIC_SEARCH:</span> RAG structures, Vector DBs (Chroma, Pinecone), Hybrid Search.</div>
    `,
    projects: `
      <div class="terminal-line">// PRODUCTION-READY SYSTEMS DEPLOYED //</div>
      <div class="terminal-line"><span class="highlight">01 // AgenticDoc-V2</span></div>
      <div class="terminal-line">An automated legal analysis pipeline mapping inconsistent lease agreements using hierarchical agent loops. (92% accuracy).</div>
      <div class="terminal-line">&nbsp;</div>
      <div class="terminal-line"><span class="highlight">02 // SchemaGuard-LLM</span></div>
      <div class="terminal-line">A middleware package guaranteeing structured JSON schemas from open-source local models using constraint logit biasing.</div>
    `,
    contact: `
      <div class="terminal-line">// CONTACT GATEWAY //</div>
      <div class="terminal-line">EMAIL: k.vance@prompt-systems.io</div>
      <div class="terminal-line">GITHUB: github.com/kaelen-vance</div>
      <div class="terminal-line">SECURE_SIGNAL: +1 (503) 555-0182</div>
    `,
    help: `
      <div class="terminal-line">Available commands:</div>
      <div class="terminal-line">  <span class="highlight">about</span>      - Personal summary & philosophy</div>
      <div class="terminal-line">  <span class="highlight">skills</span>     - Technical capabilities & model familiarity</div>
      <div class="terminal-line">  <span class="highlight">projects</span>   - Selected systems and architectures built</div>
      <div class="terminal-line">  <span class="highlight">contact</span>    - Communication pathways</div>
      <div class="terminal-line">  <span class="highlight">clear</span>      - Flush console logs</div>
      <div class="terminal-line">  <span class="highlight">help</span>       - Display this assistance directory</div>
    `
  };

  // Focus input automatically
  document.addEventListener('click', () => {
    terminalInput.focus();
  });

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputVal = terminalInput.value.trim().toLowerCase();
      
      // Print command entered
      const cmdLine = document.createElement('div');
      cmdLine.className = 'terminal-line';
      cmdLine.innerHTML = `<span class="dim">guest@prompt-console:~$</span> <span class="highlight">${terminalInput.value}</span>`;
      outputArea.appendChild(cmdLine);

      // Execute logic
      if (inputVal === 'clear') {
        outputArea.innerHTML = '';
      } else if (inputVal === '') {
        // Do nothing
      } else if (database[inputVal]) {
        const resultLine = document.createElement('div');
        resultLine.className = 'terminal-line';
        resultLine.innerHTML = database[inputVal];
        outputArea.appendChild(resultLine);
      } else {
        const errLine = document.createElement('div');
        errLine.className = 'terminal-line error';
        errLine.textContent = `bash: command not found: ${inputVal}. Type 'help' for options.`;
        outputArea.appendChild(errLine);
      }

      // Reset & scroll
      terminalInput.value = '';
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  });
});
