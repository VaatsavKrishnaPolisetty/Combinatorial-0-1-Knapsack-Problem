import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Zap, RefreshCw, Cpu, Activity, Binary } from 'lucide-react';
import type { KnapsackItem, SolveResponse } from '../types';
import { AnimatedNumber } from './AnimatedNumber';
import { BlochSphereWidget } from './BlochSphereWidget';
import { EnergyLandscapeWidget } from './EnergyLandscapeWidget';
import { CircuitConveyorWidget } from './CircuitConveyorWidget';
import { QuantumSparkBurst } from './QuantumSparkBurst';

interface KnapsackStudioProps {
  onSolve: (data: any) => Promise<SolveResponse>;
  loading: boolean;
  results: SolveResponse | null;
}

export const KnapsackStudio: React.FC<KnapsackStudioProps> = ({ onSolve, loading, results }) => {
  // Initial competition items
  const [items, setItems] = useState<KnapsackItem[]>([
    { id: 0, value: 10, weight: 5 },
    { id: 1, value: 4, weight: 3 },
    { id: 2, value: 7, weight: 4 },
    { id: 3, value: 5, weight: 2 },
    { id: 4, value: 8, weight: 6 },
  ]);

  const [capacity, setCapacity] = useState<number>(15);
  const [layersP, setLayersP] = useState<number>(2);
  const [formulation, setFormulation] = useState<string>('unbalanced');
  const [cvarAlpha, setCvarAlpha] = useState<number>(1.0);
  const [shots, setShots] = useState<number>(4096);
  const [solveStage, setSolveStage] = useState<number>(1);
  const [sparkTrigger, setSparkTrigger] = useState<boolean>(false);

  // Trigger spark explosion on 100% exact match
  useEffect(() => {
    if (results?.qaoa_best_sample.is_exact_match) {
      setSparkTrigger(false);
      const timer = setTimeout(() => setSparkTrigger(true), 150);
      return () => clearTimeout(timer);
    }
  }, [results]);

  // 3-Stage Sequencer when loading
  useEffect(() => {
    if (loading) {
      setSolveStage(1);
      const timer1 = setTimeout(() => setSolveStage(2), 250);
      const timer2 = setTimeout(() => setSolveStage(3), 500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setSolveStage(1);
    }
  }, [loading]);

  const presets = [
    {
      name: 'QFF Official Instance',
      values: [10, 4, 7, 5, 8],
      weights: [5, 3, 4, 2, 6],
      cap: 15,
      desc: 'Items {0,1,2,3}, Value 26, Weight 14',
    },
    {
      name: 'High Density 4-Item',
      values: [12, 10, 7, 4],
      weights: [4, 5, 3, 2],
      cap: 9,
      desc: 'Tight constraint benchmark',
    },
    {
      name: '6-Item Scaled',
      values: [9, 12, 6, 8, 14, 5],
      weights: [3, 5, 2, 4, 6, 2],
      cap: 13,
      desc: '6 qubits, all-to-all coupling',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setItems(p.values.map((v, i) => ({ id: i, value: v, weight: p.weights[i] })));
    setCapacity(p.cap);
  };

  const handleAddItem = () => {
    if (items.length >= 8) return;
    const nextId = items.length;
    setItems([...items, { id: nextId, value: 6, weight: 3 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length <= 3) return;
    const updated = items.filter(it => it.id !== id).map((it, idx) => ({ ...it, id: idx }));
    setItems(updated);
  };

  const handleUpdateItem = (id: number, field: 'value' | 'weight', val: number) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: Math.max(1, val) } : it));
  };

  const handleRun = () => {
    onSolve({
      values: items.map(i => i.value),
      weights: items.map(i => i.weight),
      capacity,
      p: layersP,
      cvar_alpha: cvarAlpha,
      formulation,
      shots,
    });
  };

  const totalPossibleWeight = items.reduce((acc, it) => acc + it.weight, 0);
  const isOverLimit = totalPossibleWeight > capacity && capacity < 8;

  return (
    <div className="studio-container">
      {/* Top Banner & Presets */}
      <div className="glass-panel studio-header-card spotlight-card">
        <div className="studio-header-meta">
          <div className="chip-badge">Problem Statement PS-O3</div>
          <h2>0/1 Knapsack QAOA Parameter Studio</h2>
          <p className="subtitle">
            Configure items and quantum circuit parameters. The QAOA circuit will encode the constraint into an Ising Hamiltonian and find the optimal combination.
          </p>
        </div>

        <div className="presets-group">
          <span className="presets-label">Quick Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              className="preset-pill-btn"
              onClick={() => handleApplyPreset(p)}
              title={p.desc}
            >
              <Sparkles size={13} className="text-cyan" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="studio-grid">
        {/* Left Column: Item Configuration */}
        <div className="glass-panel studio-panel spotlight-card">
          <div className="panel-title-bar">
            <div>
              <h3>Knapsack Items ({items.length})</h3>
              <p className="panel-sub">Assign values & weights to each item variable</p>
            </div>
            <button
              className="action-btn-sm"
              onClick={handleAddItem}
              disabled={items.length >= 8}
              title={items.length >= 8 ? 'Max 8 items for fast statevector' : 'Add Item'}
            >
              <Plus size={15} />
              <span>Add Item</span>
            </button>
          </div>

          <div className="items-list">
            {items.map((it) => {
              const density = (it.value / it.weight).toFixed(2);
              return (
                <div key={it.id} className="item-row glass-panel">
                  <div className="item-id-badge">
                    <span className="qubit-label font-mono">q{it.id}</span>
                    <span className="item-title">Item {it.id}</span>
                  </div>

                  <div className="item-input-group">
                    <label>Value</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={it.value}
                      onChange={(e) => handleUpdateItem(it.id, 'value', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="item-input-group">
                    <label>Weight</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={it.weight}
                      onChange={(e) => handleUpdateItem(it.id, 'weight', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="item-density-badge" title="Value-to-Weight Ratio">
                    <span className="density-label">v/w</span>
                    <span className="density-val font-mono">{density}</span>
                  </div>

                  <button
                    className="delete-item-btn"
                    onClick={() => handleRemoveItem(it.id)}
                    disabled={items.length <= 3}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Knapsack Capacity Slider with Fluid Spring & Warning Shake */}
          <div className={`capacity-slider-box ${isOverLimit ? 'capacity-warning-shake' : ''}`}>
            <div className="capacity-header">
              <span className="capacity-label">Knapsack Max Capacity (W)</span>
              <span className="capacity-val font-mono">
                <AnimatedNumber value={capacity} suffix=" kg" />
              </span>
            </div>
            <input
              type="range"
              min="5"
              max={Math.max(25, totalPossibleWeight)}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="custom-range-slider"
            />
            <div className="capacity-bar-track">
              <div
                className={`capacity-bar-fill ${capacity < 10 ? 'fill-warning' : 'fill-normal'} capacity-fluid-shimmer`}
                style={{ width: `${Math.min(100, (capacity / totalPossibleWeight) * 100)}%` }}
              />
            </div>
            <div className="capacity-footer-text">
              Total Weight of All Items: <span className="font-mono">{totalPossibleWeight} kg</span>
            </div>
          </div>
        </div>

        {/* Right Column: QAOA Circuit Parameters & Run */}
        <div className="glass-panel studio-panel spotlight-card">
          <div className="panel-title-bar">
            <div>
              <h3>QAOA Quantum Circuit Config</h3>
              <p className="panel-sub">Select layers, formulation & optimization objective</p>
            </div>
          </div>

          {/* Formulation Selection */}
          <div className="form-group">
            <label className="form-label">Constraint Formulation</label>
            <div className="segmented-control">
              <button
                className={`segment-btn ${formulation === 'unbalanced' ? 'active' : ''}`}
                onClick={() => setFormulation('unbalanced')}
              >
                <div className="segment-title">Unbalanced Penalty ★</div>
                <div className="segment-desc">5 Qubits · No Slack · 3–5× fewer CX</div>
              </button>
              <button
                className={`segment-btn ${formulation === 'slack' ? 'active' : ''}`}
                onClick={() => setFormulation('slack')}
              >
                <div className="segment-title">Textbook Slack</div>
                <div className="segment-desc">9 Qubits · Dense K9 interaction</div>
              </button>
            </div>
          </div>

          {/* Layer Depth p */}
          <div className="form-group">
            <label className="form-label">QAOA Alternating Layers (p)</label>
            <div className="layer-picker">
              {[1, 2, 3].map((pVal) => (
                <button
                  key={pVal}
                  className={`layer-btn ${layersP === pVal ? 'active' : ''}`}
                  onClick={() => setLayersP(pVal)}
                >
                  <span className="layer-num font-mono">p = {pVal}</span>
                  <span className="layer-meta">
                    {pVal === 1 ? 'Fast' : pVal === 2 ? 'Sweet Spot ★' : 'High CX Depth'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CVaR Slider */}
          <div className="form-group">
            <div className="slider-label-row">
              <label className="form-label">CVaR Tail Objective (α)</label>
              <span className="val-badge font-mono">{cvarAlpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={cvarAlpha}
              onChange={(e) => setCvarAlpha(parseFloat(e.target.value))}
              className="custom-range-slider"
            />
            <div className="slider-help-text">
              {cvarAlpha === 1.0 ? 'Standard expected energy ⟨C⟩' : `Concentrates on lowest ${Math.round(cvarAlpha * 100)}% tail solutions`}
            </div>
          </div>

          {/* Shots */}
          <div className="form-group">
            <div className="slider-label-row">
              <label className="form-label">Aer Simulated Measurement Shots</label>
              <span className="val-badge font-mono">{shots} shots</span>
            </div>
            <div className="shots-selector">
              {[1024, 2048, 4096].map((s) => (
                <button
                  key={s}
                  className={`shot-pill ${shots === s ? 'active' : ''}`}
                  onClick={() => setShots(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Stage Quantum HUD Sequencer (Active when loading) */}
          {loading && (
            <div className="quantum-hud-sequencer glass-panel">
              <div className="hud-title-bar">
                <Activity size={14} className="text-cyan spin-icon" />
                <span className="hud-label font-mono">QUANTUM EXECUTION HUD</span>
              </div>
              <div className="hud-steps">
                <div className={`hud-step ${solveStage >= 1 ? 'active' : ''}`}>
                  <Binary size={13} className="hud-icon" />
                  <span>[01] Calibrating Penalties (λ₁, λ₂)</span>
                </div>
                <div className={`hud-step ${solveStage >= 2 ? 'active' : ''}`}>
                  <Cpu size={13} className="hud-icon" />
                  <span>[02] Tuning QAOA Angles with COBYLA</span>
                </div>
                <div className={`hud-step ${solveStage >= 3 ? 'active' : ''}`}>
                  <Zap size={13} className="hud-icon" />
                  <span>[03] Collapsing Wave-Function ({shots} shots)</span>
                </div>
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="run-button-container">
            <button
              className={`run-solve-btn ${loading ? 'loading' : 'animate-pulse-glow'}`}
              onClick={handleRun}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  <span>Executing Quantum Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Run QAOA Solver</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section with Rolling Counters & Staggered Bar Cascade */}
      {results && (
        <div className="glass-panel results-container glass-panel-glow spotlight-card">
          <div className="results-header">
            <div>
              <div className="chip-badge-success">Quantum Execution Succeeded</div>
              <h2>Solution Breakdown & Optimization Metrics</h2>
            </div>
            <div className="results-tags">
              <span className="result-tag font-mono">Qubits: {results.qubits_used}</span>
              <span className="result-tag font-mono">⟨C⟩: {results.expected_energy}</span>
              <span className="result-tag font-mono">Shots: {results.shots}</span>
            </div>
          </div>

          {/* Big Comparison Cards with Animated Rolling Numbers */}
          <div className="comparison-cards-row">
            {/* QAOA Sampled Best */}
            <div className="solution-card qaoa-card glass-panel spotlight-card" style={{ position: 'relative' }}>
              <QuantumSparkBurst trigger={sparkTrigger} />
              <div className="sol-badge">
                <Sparkles size={15} className="text-cyan" />
                <span>QAOA Sampled Solution</span>
              </div>
              <div className="sol-hero-val font-mono">
                Value:{' '}
                <span className="highlight-text">
                  <AnimatedNumber value={results.qaoa_best_sample.value} />
                </span>
              </div>
              <div className="sol-details">
                <div>
                  Weight:{' '}
                  <strong className="font-mono">
                    <AnimatedNumber value={results.qaoa_best_sample.weight} /> / {capacity} kg
                  </strong>
                </div>
                <div>Packed Items: <strong className="font-mono">[{results.qaoa_best_sample.items.join(', ')}]</strong></div>
                <div>State Bitstring: <span className="bitstring-pill font-mono">|{results.qaoa_best_sample.bitstring}⟩</span></div>
              </div>
              <div className="match-status">
                {results.qaoa_best_sample.is_exact_match ? (
                  <span className="status-badge-match animate-pulse-subtle">
                    <ShieldCheck size={16} /> Matches Global Optimum 100%
                  </span>
                ) : (
                  <span className="status-badge-warning">
                    <AlertTriangle size={16} /> Gap to optimum: {results.optimal_solution.value - results.qaoa_best_sample.value}
                  </span>
                )}
              </div>
            </div>

            {/* Classical Brute Force Ground Truth */}
            <div className="solution-card truth-card glass-panel spotlight-card">
              <div className="sol-badge">
                <CheckCircle2 size={15} className="text-emerald" />
                <span>Classical Brute-Force Optimum</span>
              </div>
              <div className="sol-hero-val font-mono">
                Value:{' '}
                <span className="text-emerald">
                  <AnimatedNumber value={results.optimal_solution.value} />
                </span>
              </div>
              <div className="sol-details">
                <div>
                  Weight:{' '}
                  <strong className="font-mono">
                    <AnimatedNumber value={results.optimal_solution.weight} /> / {capacity} kg
                  </strong>
                </div>
                <div>Packed Items: <strong className="font-mono">[{results.optimal_solution.items.join(', ')}]</strong></div>
                <div>Ground State: <span className="bitstring-pill font-mono">|{results.optimal_solution.bitstring}⟩</span></div>
              </div>
              <div className="match-status">
                <span className="status-badge-verified">
                  Verified against 2^{items.length} = {Math.pow(2, items.length)} subsets
                </span>
              </div>
            </div>

            {/* Quantum Advantage Metric */}
            <div className="solution-card speedup-card glass-panel spotlight-card">
              <div className="sol-badge">
                <Zap size={15} className="text-amber" />
                <span>Sampling Signal Boost</span>
              </div>
              <div className="sol-hero-val font-mono">
                <span className="text-amber">
                  <AnimatedNumber value={results.probabilities.speedup_vs_random} decimals={1} suffix="×" />
                </span>
              </div>
              <div className="sol-details">
                <div>
                  P(Optimal State):{' '}
                  <strong className="font-mono">
                    <AnimatedNumber value={results.probabilities.p_optimal * 100} decimals={1} suffix="%" />
                  </strong>
                </div>
                <div>
                  Random Guessing:{' '}
                  <strong className="font-mono">
                    <AnimatedNumber value={results.probabilities.p_random * 100} decimals={1} suffix="%" />
                  </strong>
                </div>
                <div>
                  P(Feasible Samples):{' '}
                  <strong className="font-mono">
                    <AnimatedNumber value={results.probabilities.p_feasible * 100} decimals={1} suffix="%" />
                  </strong>
                </div>
              </div>
              <div className="match-status">
                <span className="status-badge-advantage">
                  Optimal probability boosted by {results.probabilities.speedup_vs_random}×
                </span>
              </div>
            </div>
          </div>

          {/* Top States Quantum Distribution Chart with Staggered Cascading Bars */}
          <div className="distribution-section">
            <h3>Top Measured Quantum States (Wave-Function Breakdown)</h3>
            <p className="panel-sub">Probability amplitude distribution cascading from lowest energy eigenstates</p>

            <div className="distribution-bars-list">
              {results.top_states.map((st, idx) => (
                <div key={idx} className="dist-row">
                  <div className="dist-meta font-mono">
                    <span className="dist-bit">|{st.bitstring}⟩</span>
                    <span className="dist-info">val:{st.value} wt:{st.weight}</span>
                  </div>

                  <div className="dist-bar-track">
                    <div
                      className={`dist-bar-fill dist-bar-cascade ${st.is_optimal ? 'bar-optimal' : st.is_feasible ? 'bar-feasible' : 'bar-infeasible'}`}
                      style={{
                        width: `${Math.min(100, st.probability * 400)}%`,
                        animationDelay: `${idx * 65}ms`,
                      }}
                    />
                  </div>

                  <div className="dist-prob font-mono">
                    {(st.probability * 100).toFixed(2)}%
                  </div>

                  <div className="dist-tags">
                    {st.is_optimal && <span className="mini-tag tag-opt animate-pulse-subtle">OPTIMAL</span>}
                    {st.is_feasible ? (
                      <span className="mini-tag tag-feas">FEASIBLE</span>
                    ) : (
                      <span className="mini-tag tag-infeas">OVERWEIGHT</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Quantum Mechanics & Unitary Circuit Suite */}
          <div className="quantum-mechanics-suite">
            <div className="section-title-left" style={{ marginBottom: '16px' }}>
              <div className="chip-badge">Physical Unitaries & Optimization Suite</div>
              <h3>Interactive Quantum Mechanics & Gate Circuit Suite</h3>
              <p className="panel-sub">
                Inspect single-qubit Bloch state vectors, 2D variational energy contours, and gate propagations
              </p>
            </div>

            <div className="mechanics-grid-row">
              <BlochSphereWidget
                gamma={results.angles && results.angles.length > 0 ? results.angles[0] : 0.785}
                beta={results.angles && results.angles.length > 1 ? results.angles[1] : 0.523}
              />
              <EnergyLandscapeWidget />
            </div>

            <CircuitConveyorWidget layersP={layersP} />
          </div>
        </div>
      )}
    </div>
  );
};
