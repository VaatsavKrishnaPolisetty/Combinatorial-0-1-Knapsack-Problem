import React, { useState } from 'react';
import { Terminal, Copy, Check, BookOpen, AlertCircle, CheckCircle2, Monitor } from 'lucide-react';

export const TerminalGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [osTab, setOsTab] = useState<'unix' | 'windows'>('unix');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
