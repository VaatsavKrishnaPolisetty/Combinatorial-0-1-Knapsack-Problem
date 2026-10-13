import React from 'react';
import { Sparkles, ArrowRight, Terminal, Cpu, Zap, Layers, GitBranch, Play } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface HeroOverviewProps {
  onNavigate: (tab: string) => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="hero-page-container">
      {/* Cinematic Hero Banner with Floating Quantum Particles & Aurora Glows */}
      <div className="hero-cinematic-banner glass-panel spotlight-card">
        {/* Layer 1: Ambient Aurora Mesh */}
        <div className="hero-aurora-glow glow-1" />
        <div className="hero-aurora-glow glow-2" />

        {/* Layer 2: Floating Quantum Quarks / Virtual Vacuum Fluctuations */}
        <div className="quantum-particles-container" aria-hidden="true">
          <span className="quantum-quark quark-1" />
          <span className="quantum-quark quark-2" />
          <span className="quantum-quark quark-3" />
          <span className="quantum-quark quark-4" />
          <span className="quantum-quark quark-5" />
          <span className="quantum-quark quark-6" />
        </div>

        <div className="hero-content">
          <div className="hero-top-badges">
            <span className="hero-pill-badge">
              <Sparkles size={13} className="text-cyan animate-pulse" />
              <span>Qiskit Fall Fest 2026 · SRM University-AP</span>
            </span>
            <span className="hero-pill-badge badge-accent">
              <span>Problem Statement PS-O3</span>
            </span>
          </div>

          <h1 className="hero-headline">
            Co-Designing Quantum Processors for the <br />
            <span className="gradient-text-cinematic">0/1 Knapsack Problem with QAOA</span>
          </h1>

          <p className="hero-description">
            A comprehensive quantum computing study investigating problem formulation, automated penalty calibration, and hardware topology co-design. Comparing our custom <strong>Processor A (Bow-Tie)</strong> and <strong>Processor B (Wheel)</strong> against standard IBM architectures under realistic gate and readout noise.
          </p>

          <div className="hero-actions">
            <button className="btn-primary-cinematic" onClick={() => onNavigate('solver')}>
              <Play size={17} fill="currentColor" />
              <span>Launch Knapsack Studio</span>
              <ArrowRight size={16} />
            </button>

            <button className="btn-secondary-cinematic" onClick={() => onNavigate('topologies')}>
              <Cpu size={17} />
              <span>Explore Chip Topologies</span>
            </button>

            <button className="btn-outline-cinematic" onClick={() => onNavigate('terminal')}>
              <Terminal size={17} />
              <span>Terminal & CLI Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic Stats Ticker with Rolling Numbers */}
      <div className="stats-ticker-grid">
        <div className="stat-ticker-card glass-panel spotlight-card">
          <div className="stat-number font-mono text-cyan">
            <AnimatedNumber value={6.9} decimals={1} suffix="×" />
          </div>
          <div className="stat-label">Quantum Signal Boost</div>
          <div className="stat-sub">vs random guessing</div>
        </div>

        <div className="stat-ticker-card glass-panel spotlight-card">
          <div className="stat-number font-mono text-emerald">
            <AnimatedNumber value={-65} suffix="%" />
          </div>
          <div className="stat-label">SWAP Gate Overhead</div>
          <div className="stat-sub">Bow-Tie vs Linear</div>
        </div>

        <div className="stat-ticker-card glass-panel spotlight-card">
          <div className="stat-number font-mono text-violet">
            5 vs 9
          </div>
          <div className="stat-label">Qubit Compression</div>
          <div className="stat-sub">No slack qubits needed</div>
        </div>

        <div className="stat-ticker-card glass-panel spotlight-card">
          <div className="stat-number font-mono text-amber">
            <AnimatedNumber value={4096} />
          </div>
          <div className="stat-label">Measurement Shots</div>
          <div className="stat-sub">Noisy Aer simulator</div>
        </div>
      </div>

      {/* The Breakthrough & Innovation Section */}
      <div className="innovation-section">
        <div className="section-title-center">
          <span className="chip-badge">Architectural Breakthroughs</span>
          <h2>Why This Solution Outperforms Textbook Approaches</h2>
          <p className="subtitle">
            Most quantum knapsack approaches suffer from massive circuit depth and amplitude dilution. Here is how our architecture solves it:
          </p>
        </div>

        <div className="innovation-grid">
          <div className="innovation-card glass-panel spotlight-card">
            <div className="card-glow-indicator cyan" />
            <div className="inn-icon-box cyan">
              <Layers size={22} />
            </div>
            <h3>1. Unbalanced Penalty (No Slack Qubits)</h3>
            <p>
              Textbook inequality encoding requires 4 extra slack qubits ($5+4=9$ qubits). That creates a $K_9$ dense coupling graph requiring hundreds of CX gates and dilutes optimal probability to $\approx 2.7\%$. Our unbalanced formulation uses <strong>only 5 qubits</strong> and delivers an optimal sample probability of <strong>18.3% (noisy) to 21.7% (ideal)</strong>.
            </p>
            <div className="inn-metric font-mono">5 Qubits vs 9 Qubits · 3–5× Fewer CX Gates</div>
          </div>

          <div className="innovation-card glass-panel spotlight-card">
            <div className="card-glow-indicator violet" />
            <div className="inn-icon-box violet">
              <GitBranch size={22} />
            </div>
            <h3>2. Problem-Aware Chip Topologies</h3>
            <p>
              Knapsack weights couple every pair of items (a $K_5$ interaction graph). Rather than running on a linear chain, our <strong>Processor A Bow-Tie</strong> pairs two triangles via a central hub, directly connecting 6 of 10 pairs. This eliminates <strong>65% of SWAP gates</strong> and slashes CX count from 81 to 52.
            </p>
            <div className="inn-metric font-mono">Bow-Tie: 4 SWAPs vs Linear: 15 SWAPs</div>
          </div>

          <div className="innovation-card glass-panel spotlight-card">
            <div className="card-glow-indicator emerald" />
            <div className="inn-icon-box emerald">
              <Zap size={22} />
            </div>
            <h3>3. CVaR Tail Optimization & INTERP</h3>
            <p>
              Standard QAOA minimizes average energy $\langle C \rangle$, which can be misled by infeasible states. Incorporating <strong>Conditional Value-at-Risk (CVaR $\alpha=0.25$)</strong> concentrates parameter optimization strictly on the lowest quartile of energy states, boosting the optimal sampling rate by $+3.3\%$.
            </p>
            <div className="inn-metric font-mono">CVaR(0.25): P(opt) 21.7% → 25.0%</div>
          </div>
        </div>
      </div>

      {/* Visual Workflow Steps */}
      <div className="workflow-section glass-panel spotlight-card">
        <div className="section-title-left">
          <span className="chip-badge">End-to-End Pipeline</span>
          <h2>The 4-Step Quantum Workflow</h2>
          <p className="subtitle">From mathematical knapsack inputs to physical noisy hardware execution</p>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card glass-panel">
            <div className="step-top-row">
              <span className="step-num font-mono">01</span>
              <span className="step-badge">Classic NP-Hard</span>
            </div>
            <h4>01. 0/1 Knapsack Formulation</h4>
            <p>Encode items as binary qubits: 1 = pack, 0 = leave. Constrain total weight ≤ 15 kg.</p>
          </div>

          <div className="workflow-step-card glass-panel">
            <div className="step-top-row">
              <span className="step-num font-mono">02</span>
              <span className="step-badge">5 Qubits Only</span>
            </div>
            <h4>02. Unbalanced QUBO & Ising</h4>
            <p>Convert into cost function -(Value) + λ₁g + λ₂g² without slack qubits, mapping to Z & ZZ Pauli gates.</p>
          </div>

          <div className="workflow-step-card glass-panel">
            <div className="step-top-row">
              <span className="step-num font-mono">03</span>
              <span className="step-badge">Quantum-Classical</span>
            </div>
            <h4>03. QAOA Circuit & COBYLA</h4>
            <p>Alternate cost Hamiltonian and X-mixer layers over p=2 depths. Optimize angles via classical COBYLA + CVaR.</p>
          </div>

          <div className="workflow-step-card glass-panel">
            <div className="step-top-row">
              <span className="step-num font-mono">04</span>
              <span className="step-badge">Aer Noisy Transpile</span>
            </div>
            <h4>04. Hardware Co-Design (A vs B)</h4>
            <p>Route onto custom Bow-Tie (5q) & Wheel (9q) chips, outperforming standard linear and heavy-hex baselines.</p>
          </div>
        </div>
      </div>

      {/* Quick Jump Callout */}
      <div className="hero-callout-card glass-panel spotlight-card">
        <div className="callout-left">
          <h3>Ready to test the quantum circuits?</h3>
          <p>
            You can interact with the live solver in the browser, explore the processor routing maps, or follow our terminal testing guide to run the Python scripts locally.
          </p>
        </div>
        <div className="callout-buttons">
          <button className="btn-primary-cinematic" onClick={() => onNavigate('solver')}>
            <span>Open Interactive Studio</span>
            <ArrowRight size={16} />
          </button>
          <button className="btn-outline-cinematic" onClick={() => onNavigate('terminal')}>
            <Terminal size={16} />
            <span>Terminal Step-by-Step Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
