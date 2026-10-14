import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Monitor, 
  Play, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';

export const TerminalGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [osTab, setOsTab] = useState<'unix' | 'windows'>('unix');
  const [cliInput, setCliInput] = useState<string>('python solve.py');
  const [cliLoading, setCliLoading] = useState<boolean>(false);
  const [cliResult, setCliResult] = useState<{
    command: string;
    stdout: string;
    stderr: string;
    returncode: number;
    elapsed_ms: number;
    pid: number;
    timestamp: string;
  } | null>(null);
  const [copiedCliOutput, setCopiedCliOutput] = useState<boolean>(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteCli = async (cmdToRun?: string) => {
    const cmd = cmdToRun || cliInput;
    setCliInput(cmd);
    setCliLoading(true);
    try {
      const res = await fetch('/api/cli-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      if (res.ok) {
        const data = await res.json();
        setCliResult(data);
      } else {
        const err = await res.json();
        setCliResult({
          command: cmd,
          stdout: '',
          stderr: err.detail || 'Execution failed',
          returncode: 1,
          elapsed_ms: 0,
          pid: 0,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (e: any) {
      setCliResult({
        command: cmd,
        stdout: '',
        stderr: e.message || 'Network error',
        returncode: 1,
        elapsed_ms: 0,
        pid: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setCliLoading(false);
    }
  };

  // Run official preset on first mount
  useEffect(() => {
    handleExecuteCli('python solve.py');
  }, []);

  const playgroundPresets = [
    { label: 'Official 5-Item (Benchmark)', cmd: 'python solve.py' },
    { label: 'Custom 4-Item (Cap 9, p=2)', cmd: 'python solve.py --values 6 5 8 9 --weights 2 3 6 7 --capacity 9 --p 2' },
    { label: 'CVaR Tail (alpha=0.25)', cmd: 'python solve.py --p 2 --cvar 0.25' },
    { label: 'Check Qiskit & Aer Version', cmd: "python -c \"import qiskit, qiskit_aer; print('Qiskit:', qiskit.__version__, '| Aer:', qiskit_aer.__version__)\"" },
  ];

  const steps = [
    {
      id: 'step-env',
      stepNum: '01',
      title: 'Environment Setup & Dependencies',
      desc: 'Create an isolated virtual environment and install Qiskit 2.5, Qiskit-Aer, and scientific dependencies.',
      unixCode: `cd project\npython3 -m venv .venv\nsource .venv/bin/activate\npip install -r requirements.txt`,
      winCode: `cd project\npython -m venv .venv\n.venv\\Scripts\\activate\npip install -r requirements.txt`,
      notes: 'Requires Python 3.10+. If qiskit-aer is not present, install via: pip install qiskit-aer',
    },
    {
      id: 'step-solve-default',
      stepNum: '02',
      title: 'Run the Quick CLI Solver (Default QFF Instance)',
      desc: 'Executes the 5-qubit unbalanced QAOA pipeline on the official competition instance.',
      unixCode: `python solve.py`,
      winCode: `python solve.py`,
      expectedOutput: `qubits=5  penalty={'lam1': 1.75, 'lam2': 0.2}  <C>=-22.846\nQAOA best feasible sample: (1, 1, 1, 1, 0)  value=26  weight=14/15  items=[0, 1, 2, 3]\nBrute-force optimum      : (1, 1, 1, 1, 0)  value=26  -> MATCH`,
      notes: 'Verifies the optimal packing items {0,1,2,3} matches the classical brute force value of 26.',
    },
    {
      id: 'step-solve-custom',
      stepNum: '03',
      title: 'Solve Any Custom Knapsack Instance via CLI',
      desc: 'Pass custom item values, item weights, backpack capacity, QAOA depth p, and CVaR alpha directly from command line.',
      unixCode: `python solve.py --values 6 5 8 9 --weights 2 3 6 7 --capacity 9 --p 2 --cvar 0.25`,
      winCode: `python solve.py --values 6 5 8 9 --weights 2 3 6 7 --capacity 9 --p 2 --cvar 0.25`,
      notes: 'Statevector demo supports up to n <= 12 items. Try adjusting --cvar between 0.1 and 1.0.',
    },
    {
      id: 'step-notebook',
      stepNum: '04',
      title: 'Regenerate Entire Research Benchmark (main.ipynb)',
      desc: 'Executes the end-to-end research notebook in ~75 seconds, reproducing all tables and high-resolution figures.',
      unixCode: `jupyter nbconvert --to notebook --execute --inplace main.ipynb`,
      winCode: `jupyter nbconvert --to notebook --execute --inplace main.ipynb`,
      notes: 'Outputs 8 publication charts to results/figures/ and 8 benchmark CSVs/JSONs to results/tables/.',
    },
    {
      id: 'step-interactive-python',
      stepNum: '05',
      title: 'Modular Python Exploration (src/ Modules)',
      desc: 'Direct programmatic access to the QUBO builder, penalty calibration, and transpiler router.',
      unixCode: `python3 -c "
from src.problem import Knapsack, calibrate_penalty, build_qubo, qubo_to_ising
from src.processors import TOPOLOGIES
from src.routing import route
from src.qaoa import QAOA

prob = Knapsack([10, 4, 7, 5, 8], [5, 3, 4, 2, 6], 15)
kw, gap = calibrate_penalty(prob, 'unbalanced')
q = build_qubo(prob, 'unbalanced', **kw)
H, h, J, _ = qubo_to_ising(q)
qa = QAOA(q, h, J, p=2)
x, e, _ = qa.train()
circuit = qa.bound(x)
_, metrics = route(circuit, TOPOLOGIES['A_bowtie (ours)'], seed=42)
print(f'Trained Energy: {e:.3f} | Bow-tie CX Gates: {metrics[\"cx\"]} | SWAPs: {metrics[\"swaps\"]}')
"`,
      winCode: `python -c "from src.problem import Knapsack, calibrate_penalty, build_qubo, qubo_to_ising; from src.processors import TOPOLOGIES; from src.routing import route; from src.qaoa import QAOA; prob = Knapsack([10, 4, 7, 5, 8], [5, 3, 4, 2, 6], 15); kw, gap = calibrate_penalty(prob, 'unbalanced'); q = build_qubo(prob, 'unbalanced', **kw); H, h, J, _ = qubo_to_ising(q); qa = QAOA(q, h, J, p=2); x, e, _ = qa.train(); circuit = qa.bound(x); _, metrics = route(circuit, TOPOLOGIES['A_bowtie (ours)'], seed=42); print(f'Trained Energy: {e:.3f} | Bow-tie CX Gates: {metrics[\"cx\"]} | SWAPs: {metrics[\"swaps\"]}')"`,
      notes: 'Directly imports and runs the internal modules in a single one-liner.',
    },
    {
      id: 'step-server',
      stepNum: '06',
      title: 'Run Local Web Server & API Daemon',
      desc: 'Starts the FastAPI server on port 8000, serving the REST API and the interactive web studio.',
      unixCode: `python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload`,
      winCode: `python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload`,
      notes: 'Visit http://127.0.0.1:8000 or http://localhost:8000 in your browser.',
    },
  ];

  return (
    <div className="terminal-guide-container">
      {/* Header Banner */}
      <div className="glass-panel terminal-header-card">
        <div className="terminal-header-meta">
          <div className="chip-badge">No-GUI Reproduction Protocol</div>
          <h2>Step-by-Step Terminal & CLI Testing Guide</h2>
          <p className="subtitle">
            Everything in this project is 100% reproducible directly from your shell without relying on a web browser. Follow these steps to execute the quantum solvers, run transpilation benchmarks, and inspect outputs.
          </p>
        </div>

        {/* OS Selector Toggle */}
        <div className="os-toggle-group">
          <span className="os-label">Select Your Operating System:</span>
          <div className="os-buttons">
            <button
              className={`os-btn ${osTab === 'unix' ? 'active' : ''}`}
              onClick={() => setOsTab('unix')}
            >
              <Terminal size={15} />
              <span>macOS / Linux (Bash/Zsh)</span>
            </button>
            <button
              className={`os-btn ${osTab === 'windows' ? 'active' : ''}`}
              onClick={() => setOsTab('windows')}
            >
              <Monitor size={15} />
              <span>Windows (CMD / PowerShell)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Interactive Web Terminal Playground */}
      <div className="glass-panel cli-playground-card spotlight-card">
        <div className="playground-header">
          <div className="playground-title-row">
            <div className="playground-icon-wrap">
              <Terminal size={22} className="text-cyan animate-pulse" />
            </div>
            <div>
              <div className="chip-badge-cyan">Live Subprocess Execution</div>
              <h3>Interactive Web CLI Terminal Playground</h3>
              <p className="subtitle">
                Test real command-line execution right now. Click a preset or type your custom arguments below to run <code className="font-mono text-cyan">python solve.py</code> directly against the active Python daemon.
              </p>
            </div>
          </div>
          <div className="playground-status-badge">
            <span className="live-daemon-dot" />
            <span className="font-mono text-xs">Python Daemon Active · Port 8000</span>
          </div>
        </div>

        {/* Presets Row */}
        <div className="playground-presets-row">
          <span className="presets-label">Quick Presets:</span>
          {playgroundPresets.map((p, i) => (
            <button
              key={i}
              className={`preset-pill ${cliInput === p.cmd ? 'active' : ''}`}
              onClick={() => handleExecuteCli(p.cmd)}
              disabled={cliLoading}
            >
              <Sparkles size={11} className="mr-1 inline text-cyan" />
              {p.label}
            </button>
          ))}
        </div>

        {/* Command Input Bar */}
        <div className="cli-input-bar">
          <span className="cli-input-prompt font-mono">$</span>
          <input
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteCli()}
            className="cli-text-input font-mono"
            placeholder="python solve.py --values 6 5 8 9 --weights 2 3 6 7 --capacity 9"
            disabled={cliLoading}
          />
          <button
            onClick={() => handleExecuteCli()}
            disabled={cliLoading}
            className={`btn-cli-run ${cliLoading ? 'loading' : ''}`}
          >
            {cliLoading ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>Execute CLI</span>
              </>
            )}
          </button>
        </div>

        {/* Terminal Screen Result */}
        <div className="cli-screen-window">
          <div className="cli-screen-bar">
            <div className="cli-screen-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <div className="cli-screen-title font-mono">
              python-daemon · {cliResult ? `${cliResult.elapsed_ms}ms · exit:${cliResult.returncode} · PID:${cliResult.pid}` : 'ready'}
            </div>
            {cliResult?.stdout && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cliResult.stdout);
                  setCopiedCliOutput(true);
                  setTimeout(() => setCopiedCliOutput(false), 2000);
                }}
                className="cli-copy-btn"
              >
                {copiedCliOutput ? <Check size={12} className="text-emerald inline mr-1" /> : <Copy size={12} className="inline mr-1" />}
                {copiedCliOutput ? 'Copied Output' : 'Copy Output'}
              </button>
            )}
          </div>

          <div className="cli-screen-content font-mono">
            <div className="cli-line cli-echo-cmd">$ {cliInput}</div>
            {cliLoading ? (
              <div className="cli-line cli-loading-line">
                <RefreshCw size={13} className="spin-icon inline mr-2 text-cyan" />
                <span>Executing Python quantum pipeline on Qiskit Aer...</span>
              </div>
            ) : cliResult ? (
              <>
                {cliResult.stdout && (
                  <pre className="cli-pre-stdout">{cliResult.stdout}</pre>
                )}
                {cliResult.stderr && (
                  <pre className="cli-pre-stderr text-rose">{cliResult.stderr}</pre>
                )}
                <div className="cli-line cli-complete-line">
                  <span className="text-emerald font-semibold">✓ Process completed with code {cliResult.returncode} in {cliResult.elapsed_ms}ms</span>
                </div>
              </>
            ) : (
              <div className="cli-line text-muted">Click 'Execute CLI' or select a preset to run.</div>
            )}
            <div className="cli-line cli-cursor-row">
              <span className="text-cyan">$</span> <span className="cli-cursor" />
            </div>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="terminal-steps-list">
        {steps.map((st) => {
          const codeToCopy = osTab === 'unix' ? st.unixCode : st.winCode;
          const isCopied = copiedId === st.id;

          return (
            <div key={st.id} className="terminal-step-card glass-panel">
              <div className="step-card-header">
                <div className="step-badge-circle font-mono">{st.stepNum}</div>
                <div>
                  <h3 className="step-title">{st.title}</h3>
                  <p className="step-desc">{st.desc}</p>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="cli-code-box">
                <div className="cli-code-header">
                  <div className="cli-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <span className="cli-label font-mono">
                    {osTab === 'unix' ? 'terminal ~ bash / zsh' : 'command prompt / powershell'}
                  </span>
                  <button
                    className="copy-code-btn"
                    onClick={() => handleCopy(st.id, codeToCopy)}
                    title="Copy command to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-emerald" />
                        <span className="text-emerald font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="cli-code-content font-mono">{codeToCopy}</pre>
              </div>

              {/* Expected Output Box if present */}
              {st.expectedOutput && (
                <div className="cli-output-box">
                  <div className="output-header font-mono">
                    <CheckCircle2 size={13} className="text-emerald" />
                    <span>Expected Console Output:</span>
                  </div>
                  <pre className="output-content font-mono">{st.expectedOutput}</pre>
                </div>
              )}

              {/* Step Notes / Troubleshooting */}
              {st.notes && (
                <div className="step-notes">
                  <BookOpen size={13} className="text-cyan" />
                  <span>{st.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Troubleshooting & FAQ Box */}
      <div className="glass-panel cli-troubleshooting-box">
        <div className="troubleshoot-header">
          <AlertCircle size={18} className="text-amber" />
          <h3>Terminal Troubleshooting & FAQ</h3>
        </div>
        <div className="troubleshoot-grid">
          <div className="faq-item">
            <strong>ModuleNotFoundError: No module named 'qiskit_aer'</strong>
            <p>
              Install the precompiled Aer simulator wheel directly: <code>pip install qiskit-aer==0.17.2</code>. On Apple Silicon (M1/M2/M3/M4), ensure your Python environment is native arm64.
            </p>
          </div>
          <div className="faq-item">
            <strong>How long does QAOA training take?</strong>
            <p>
              For 5 items at p=2 depth, training takes ~0.4 seconds with exact statevector expectation on standard CPUs. Brute-force verification across 32 subsets completes in &lt;1 ms.
            </p>
          </div>
          <div className="faq-item">
            <strong>Where are the results saved?</strong>
            <p>
              All benchmark tables are stored in <code>results/tables/</code> (CSV & JSON) and high-res plots are in <code>results/figures/</code> (PNG).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
