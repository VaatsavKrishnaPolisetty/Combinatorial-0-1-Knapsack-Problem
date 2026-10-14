import React, { useState } from 'react';
import { Activity, Zap, Play, Layers, TrendingUp, BarChart2 } from 'lucide-react';
import type { BenchmarkRow } from '../types';
import { AnimatedNumber } from './AnimatedNumber';
import { ZneMitigationWidget } from './ZneMitigationWidget';
import { ErrorWaterfallWidget } from './ErrorWaterfallWidget';
import { ScalabilityHorizonWidget } from './ScalabilityHorizonWidget';

interface BenchmarkLabProps {
  benchmarks: {
    benchmark_full?: BenchmarkRow[];
    noise_sweep?: any[];
  };
}

export const BenchmarkLab: React.FC<BenchmarkLabProps> = ({ benchmarks }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'zne' | 'waterfall' | 'scalability' | 'all'>('matrix');
  const [selectedP, setSelectedP] = useState<number>(2);
  const [selectedFormulation, setSelectedFormulation] = useState<string>('all');
  const [noiseMultiplier, setNoiseMultiplier] = useState<number>(1);
  const [isDecaying, setIsDecaying] = useState<boolean>(false);

  const rows = benchmarks.benchmark_full || [];

  const filteredRows = rows.filter(r => {
    const matchP = r.p === selectedP;
    const matchForm = selectedFormulation === 'all' || r.formulation === selectedFormulation;
    return matchP && matchForm;
  });

  // Noise sweep lookup based on project's noise_sweep.csv
  const noiseSweepData: Record<number, { bowtie: number; linear: number; wheel: number; heavyhex: number }> = {
    0: { bowtie: 100.0, linear: 100.0, wheel: 100.0, heavyhex: 100.0 },
    1: { bowtie: 96.7, linear: 95.5, wheel: 90.9, heavyhex: 87.8 },
    2: { bowtie: 91.2, linear: 88.4, wheel: 82.5, heavyhex: 78.9 },
    4: { bowtie: 81.8, linear: 75.0, wheel: 73.8, heavyhex: 70.1 },
    8: { bowtie: 64.2, linear: 52.8, wheel: 58.1, heavyhex: 51.4 },
  };

  const currentFidelities = noiseSweepData[noiseMultiplier] || noiseSweepData[1];

  const handleRunDecayCycle = () => {
    setIsDecaying(true);
    const steps = [0, 1, 2, 4, 8];
    steps.forEach((s, idx) => {
      setTimeout(() => {
        setNoiseMultiplier(s);
        if (idx === steps.length - 1) setIsDecaying(false);
      }, idx * 600);
    });
  };

  // Calculate synthetic peak height vs noise floor
  const peakProb = Math.max(0.04, 0.22 - noiseMultiplier * 0.021);
  const noiseFloor = Math.min(0.08, 0.01 + noiseMultiplier * 0.009);

  return (
    <div className="benchmarks-container">
      {/* Benchmark Sub-Navigation Bar */}
      <div className="bench-section-nav glass-panel spotlight-card">
        <button
          className={`bench-nav-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          <Activity size={15} />
          <span>Routing & Noise Matrix</span>
        </button>

        <button
          className={`bench-nav-btn ${activeTab === 'zne' ? 'active' : ''}`}
          onClick={() => setActiveTab('zne')}
        >
          <Zap size={15} className="text-cyan" />
          <span>ZNE Error Mitigation Lab</span>
          <span className="chip-badge cyan-badge">Feature 1</span>
        </button>

        <button
          className={`bench-nav-btn ${activeTab === 'waterfall' ? 'active' : ''}`}
          onClick={() => setActiveTab('waterfall')}
        >
          <Layers size={15} className="text-violet" />
          <span>Error Attribution Waterfall</span>
          <span className="chip-badge cyan-badge">Feature 3</span>
        </button>

        <button
          className={`bench-nav-btn ${activeTab === 'scalability' ? 'active' : ''}`}
          onClick={() => setActiveTab('scalability')}
        >
          <TrendingUp size={15} className="text-emerald" />
          <span>Scalability Horizon</span>
          <span className="chip-badge cyan-badge">Feature 4</span>
        </button>

        <button
          className={`bench-nav-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <BarChart2 size={15} />
          <span>Complete Research Suite (All)</span>
        </button>
      </div>

      {/* Feature 1: ZNE Error Mitigation Lab */}
      {(activeTab === 'zne' || activeTab === 'all') && (
        <div className="bench-module-section">
          <ZneMitigationWidget />
        </div>
      )}

      {/* Feature 3: Quantum Error Attribution Waterfall */}
      {(activeTab === 'waterfall' || activeTab === 'all') && (
        <div className="bench-module-section">
          <ErrorWaterfallWidget />
        </div>
      )}

      {/* Feature 4: Empirical Scalability Horizon */}
      {(activeTab === 'scalability' || activeTab === 'all') && (
        <div className="bench-module-section">
          <ScalabilityHorizonWidget />
        </div>
      )}

      {/* Matrix & Noise Decay Lab */}
      {(activeTab === 'matrix' || activeTab === 'all') && (
        <>
          {/* Header Banner */}
          <div className="glass-panel bench-header-card spotlight-card">
        <div className="bench-header-meta">
          <div className="chip-badge">Noisy Aer Simulator Benchmarking</div>
          <h2>Hardware Routing & Noise Performance Matrix</h2>
          <p className="subtitle">
            Simulated under the official Qiskit Fall Fest noise model: 0.1% 1-qubit depolarizing error, 0.5% CX two-qubit error, and 1.0% readout error across 4,096 measurement shots.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bench-filters">
          <div className="filter-group">
            <span className="filter-label">QAOA Depth:</span>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                className={`filter-btn ${selectedP === p ? 'active' : ''}`}
                onClick={() => setSelectedP(p)}
              >
                p = {p}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-label">Formulation:</span>
            {['all', 'unbalanced', 'slack'].map(f => (
              <button
                key={f}
                className={`filter-btn ${selectedFormulation === f ? 'active' : ''}`}
                onClick={() => setSelectedFormulation(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Entropy & Noise Decay Lab (Animation #3) */}
      <div className="glass-panel noise-decay-lab-card spotlight-card">
        <div className="noise-decay-header">
          <div>
            <div className="chip-badge">Interactive Simulation Lab</div>
            <h3>Quantum Entropy Decay Visualizer (Noise Multiplier 0× → 8×)</h3>
            <p className="panel-sub">
              Drag the slider to inject environmental noise and watch the wave-function peak decay into thermal entropy. Notice how Bow-Tie stays resilient while the linear baseline collapses.
            </p>
          </div>
          <button className="btn-pulse-circuit" onClick={handleRunDecayCycle} disabled={isDecaying}>
            <Play size={13} fill="currentColor" />
            <span>{isDecaying ? 'Simulating Decay...' : 'Play Decay Cycle'}</span>
          </button>
        </div>

        {/* Noise Slider */}
        <div className="noise-slider-wrapper">
          <div className="slider-label-row">
            <span className="font-mono text-cyan font-bold">
              Noise Multiplier: {noiseMultiplier}× {noiseMultiplier === 0 ? '(Zero Noise Ideal)' : noiseMultiplier === 1 ? '(Official 1× Model)' : '(Heavy Decoherence)'}
            </span>
            <span className="val-badge font-mono">
              CX Error: {(0.5 * Math.max(0.1, noiseMultiplier)).toFixed(2)}% | 1q Error: {(0.1 * Math.max(0.1, noiseMultiplier)).toFixed(2)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={noiseMultiplier}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              // Snap to valid benchmark multipliers [0, 1, 2, 4, 8]
              const closest = [0, 1, 2, 4, 8].reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
              setNoiseMultiplier(closest);
            }}
            className="custom-range-slider"
          />
          <div className="slider-ticks font-mono">
            <span>0× (Ideal)</span>
            <span>1× (QFF Baseline)</span>
            <span>2×</span>
            <span>4× (Heavy)</span>
            <span>8× (Thermal Limit)</span>
          </div>
        </div>

        {/* Real-time Fidelity Comparison Meters */}
        <div className="fidelity-meters-row">
          <div className="fidelity-meter-col glass-panel">
            <div className="meter-label">
              <span className="text-cyan font-bold">Processor A (Bow-Tie ★)</span>
              <span className="font-mono">{currentFidelities.bowtie.toFixed(1)}%</span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill fill-cyan"
                style={{ width: `${currentFidelities.bowtie}%`, transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </div>
            <div className="meter-sub font-mono">
              Hellinger Fidelity: <AnimatedNumber value={currentFidelities.bowtie} decimals={1} suffix="%" />
            </div>
          </div>

          <div className="fidelity-meter-col glass-panel">
            <div className="meter-label">
              <span className="text-muted font-bold">Processor A (Linear Baseline)</span>
              <span className="font-mono">{currentFidelities.linear.toFixed(1)}%</span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill fill-amber"
                style={{ width: `${currentFidelities.linear}%`, transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </div>
            <div className="meter-sub font-mono">
              Hellinger Fidelity: <AnimatedNumber value={currentFidelities.linear} decimals={1} suffix="%" />
            </div>
          </div>

          <div className="fidelity-meter-col glass-panel">
            <div className="meter-label">
              <span className="text-emerald font-bold">Bow-Tie Advantage</span>
              <span className="font-mono text-emerald">+{(currentFidelities.bowtie - currentFidelities.linear).toFixed(1)}%</span>
            </div>
            <div className="meter-advantage-badge">
              {currentFidelities.bowtie - currentFidelities.linear > 5 ? (
                <span className="text-emerald font-mono">Resilient under noise</span>
              ) : (
                <span className="text-muted font-mono">Low noise regime</span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Wave-Function Decay Bars */}
        <div className="decay-bars-section">
          <div className="decay-bars-title font-mono">Wave-Function Signal Dissipation:</div>
          <div className="decay-visual-grid">
            <div className="decay-bar-card">
              <div className="bar-title font-mono">|11110⟩ (Optimal State)</div>
              <div className="mini-progress-track" style={{ height: '14px', width: '100%' }}>
                <div
                  className="mini-progress-fill bar-optimal"
                  style={{ width: `${peakProb * 400}%`, transition: 'width 350ms ease' }}
                />
              </div>
              <div className="bar-caption font-mono">{(peakProb * 100).toFixed(1)}% probability</div>
            </div>

            <div className="decay-bar-card">
              <div className="bar-title font-mono">|Noise Floor⟩ (31 other states avg)</div>
              <div className="mini-progress-track" style={{ height: '14px', width: '100%' }}>
                <div
                  className="mini-progress-fill"
                  style={{ width: `${noiseFloor * 500}%`, background: 'rgba(255,255,255,0.25)', transition: 'width 350ms ease' }}
                />
              </div>
              <div className="bar-caption font-mono">{(noiseFloor * 100).toFixed(1)}% background entropy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Benchmark Data Table */}
      <div className="glass-panel table-panel spotlight-card">
        <div className="table-responsive">
          <table className="quantum-table">
            <thead>
              <tr>
                <th>Processor Map</th>
                <th>Encoding</th>
                <th>Circuit Depth</th>
                <th>CX Gates</th>
                <th>SWAP Overhead</th>
                <th>Est. Success (ESP)</th>
                <th>Noisy P(opt)</th>
                <th>Hellinger Fidelity</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                const isBowtie = r.processor.includes('bowtie');
                const isWheel = r.processor.includes('wheel');
                const isHighlighted = isBowtie || isWheel;

                return (
                  <tr key={idx} className={isHighlighted ? 'row-highlighted' : ''}>
                    <td className="font-semibold">
                      <span className="proc-name">{r.processor}</span>
                      {isHighlighted && <span className="star-badge">★ Co-Designed</span>}
                    </td>
                    <td>
                      <span className={`encoding-badge ${r.formulation}`}>
                        {r.formulation === 'unbalanced' ? '5q Unbalanced' : '9q Slack'}
                      </span>
                    </td>
                    <td className="font-mono">{r.depth}</td>
                    <td className="font-mono font-bold text-cyan">{r.cx_count}</td>
                    <td className="font-mono text-violet">{r.swaps}</td>
                    <td className="font-mono">
                      <div className="esp-cell">
                        <span>{(r.esp * 100).toFixed(1)}%</span>
                        <div className="mini-progress-track">
                          <div className="mini-progress-fill" style={{ width: `${r.esp * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="font-mono font-bold text-emerald">
                      {(r['P(optimal)'] * 100).toFixed(2)}%
                    </td>
                    <td className="font-mono">
                      {(r.hellinger * 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Noise Sweep & CVaR Deep Dive Cards */}
      <div className="bench-deepdive-grid">
        {/* Card 1: Noise Scaling Sweep */}
        <div className="glass-panel deepdive-card spotlight-card">
          <div className="deepdive-header">
            <Activity size={18} className="text-cyan" />
            <h3>Noise Scaling Sweep (0× to 8× Noise Multipliers)</h3>
          </div>
          <p className="deepdive-sub">
            Testing robustness under amplified environmental noise: co-designed topologies retain superior Hellinger fidelity at every non-zero noise level.
          </p>

          <div className="noise-sweep-summary">
            <div className="noise-stat-row">
              <span className="noise-level">At 1× Official Noise:</span>
              <span className="noise-val font-mono">Bow-Tie: <strong>96.7%</strong> vs Linear: <strong>95.5%</strong> Fidelity</span>
            </div>
            <div className="noise-stat-row">
              <span className="noise-level">At 4× Heavy Noise:</span>
              <span className="noise-val font-mono">Bow-Tie: <strong>81.8%</strong> vs Linear: <strong>75.0%</strong> (+6.8% advantage)</span>
            </div>
            <div className="noise-stat-row">
              <span className="noise-level">Processor B (4× Noise):</span>
              <span className="noise-val font-mono">Wheel: <strong>73.8%</strong> vs Heavy-Hex: <strong>70.1%</strong> Fidelity</span>
            </div>
          </div>
        </div>

        {/* Card 2: CVaR Objective Enhancement */}
        <div className="glass-panel deepdive-card spotlight-card">
          <div className="deepdive-header">
            <Zap size={18} className="text-amber" />
            <h3>CVaR (Conditional Value at Risk) Objective</h3>
          </div>
          <p className="deepdive-sub">
            Replacing standard expectation energy ⟨C⟩ with CVaR(α=0.25) tail optimization lifts the sampling concentration on the optimal state.
          </p>

          <div className="cvar-comparison-table">
            <div className="cvar-col glass-panel">
              <div className="cvar-title">Mean Energy (α = 1.0)</div>
              <div className="cvar-metric font-mono">21.7%</div>
              <div className="cvar-label">P(Optimal State)</div>
              <div className="cvar-sub font-mono">⟨C⟩ = -22.95</div>
            </div>

            <div className="cvar-arrow">
              <Zap size={20} className="text-amber" />
            </div>

            <div className="cvar-col glass-panel glass-panel-glow">
              <div className="cvar-title">CVaR (α = 0.25) ★</div>
              <div className="cvar-metric font-mono text-cyan">25.0%</div>
              <div className="cvar-label">P(Optimal State) (+3.3% lift)</div>
              <div className="cvar-sub font-mono">Tail Concentrated</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
  );
};
