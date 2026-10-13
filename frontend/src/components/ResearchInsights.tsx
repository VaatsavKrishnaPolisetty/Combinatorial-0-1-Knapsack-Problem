import React from 'react';
import { Lightbulb, Target, AlertCircle, Rocket, ShieldCheck } from 'lucide-react';

export const ResearchInsights: React.FC = () => {
  return (
    <div className="insights-container">
      {/* Header Banner */}
      <div className="glass-panel insights-header-card">
        <div className="chip-badge">Key Findings & Architectural Evaluation</div>
        <h2>Research Findings & Takeaways for Judges</h2>
        <p className="subtitle">
          Summary of mathematical formulation breakthroughs, hardware co-design principles, and real-world NISQ execution constraints.
        </p>
      </div>

      <div className="insights-grid">
        {/* Insight 1 */}
        <div className="glass-panel insight-card">
          <div className="insight-card-header">
            <div className="icon-wrapper icon-cyan">
              <Lightbulb size={20} />
            </div>
            <h3>1. Formulation Beats Hardware</h3>
          </div>
          <p>
            The textbook slack-variable encoding introduces 4 auxiliary qubits to represent inequality limits, yielding a 9-qubit dense graph that requires <strong>168–246 CX gates</strong> and completely dilutes amplitude (P(opt) ≈ 2.7%, essentially random level).
          </p>
          <div className="insight-takeaway font-mono">
            Unbalanced Penalty (5q): 52 CX · P(opt)=18.3% (6.9× over random) · Fits on Processor A
          </div>
        </div>

        {/* Insight 2 */}
        <div className="glass-panel insight-card">
          <div className="insight-card-header">
            <div className="icon-wrapper icon-violet">
              <Target size={20} />
            </div>
            <h3>2. Connectivity Trumps Qubit Count</h3>
          </div>
          <p>
            Processor B features 9 qubits, but our 5-qubit circuit runs with identical CX/SWAP counts (52 CX / 4 SWAPs) on 9-qubit heavy-hex as it does on our 5-qubit Bow-Tie. Having more qubits does not help an all-to-all constrained problem—having <strong>direct physical edges between coupled pairs</strong> does.
          </p>
          <div className="insight-takeaway font-mono">
            Adding idle qubits = 0% gain; Co-designed edge placement = -36% CX gates
          </div>
        </div>

        {/* Insight 3 */}
        <div className="glass-panel insight-card">
          <div className="insight-card-header">
            <div className="icon-wrapper icon-emerald">
              <ShieldCheck size={20} />
            </div>
            <h3>3. Pareto Edge-Budget Optimization</h3>
          </div>
          <p>
            Physical superconducting quantum chips have strict limits on qubit coupling complexity. Our Bow-Tie topology uses only <strong>6 edges (diameter 2)</strong>, achieving 6 of 10 pairwise connections directly. The Wheel topology spends +4 edges over heavy-hex to cut CX by 29%, with a minor depth tradeoff due to hub serialisation.
          </p>
          <div className="insight-takeaway font-mono">
            Bow-Tie: -65% SWAPs, -36% CX · Wheel: -29% CX gates
          </div>
        </div>

        {/* Insight 4: Limitations & Honesty */}
        <div className="glass-panel insight-card">
          <div className="insight-card-header">
            <div className="icon-wrapper icon-amber">
              <AlertCircle size={20} />
            </div>
            <h3>4. Honest Limitations & Decoder Role</h3>
          </div>
          <p>
            Raw QAOA samples can violate the weight constraint ~26–29% of the time under noisy measurement. The <strong>practical decoder</strong> (filtering infeasible bitstrings and applying greedy item repair) is the crucial bridge that turns noisy quantum probability distributions into 100% valid knapsack solutions.
          </p>
          <div className="insight-takeaway font-mono">
            Decoder ensures 100% valid packing; Best sampled value = 26 (Brute-Force Optimum)
          </div>
        </div>
      </div>

      {/* Roadmap / Future Work Card */}
      <div className="glass-panel roadmap-card">
        <div className="roadmap-header">
          <Rocket size={20} className="text-cyan" />
          <h3>Phase 2 & Future Quantum Research Horizons</h3>
        </div>
        <div className="roadmap-items">
          <div className="roadmap-item">
            <span className="roadmap-num font-mono">01</span>
            <div>
              <strong>Constraint-Preserving Mixers (XY / Dicke Hamiltonians):</strong>
              <p>Confine quantum state evolution strictly within feasible subspace, completely eliminating overweight samples.</p>
            </div>
          </div>
          <div className="roadmap-item">
            <span className="roadmap-num font-mono">02</span>
            <div>
              <strong>Zero-Noise Extrapolation (ZNE):</strong>
              <p>Error mitigation using pulse scaling to reconstruct zero-noise expectation values from noisy simulator data.</p>
            </div>
          </div>
          <div className="roadmap-item">
            <span className="roadmap-num font-mono">03</span>
            <div>
              <strong>Warm-Starting QAOA:</strong>
              <p>Initialize qubit rotation angles from classical continuous knapsack relaxations for faster variational convergence.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
