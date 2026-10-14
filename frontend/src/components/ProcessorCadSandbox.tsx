import React, { useState, useEffect, useCallback } from 'react';
import { Zap, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { CustomTranspileResult } from '../types';

export const ProcessorCadSandbox: React.FC = () => {
  const [numQubits, setNumQubits] = useState<number>(5);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [edges, setEdges] = useState<[number, number][]>([
    [0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4] // Bow-tie default
  ]);
  const [transpileResult, setTranspileResult] = useState<CustomTranspileResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Geometric layout of nodes for 5q and 9q
  const getCoordinates = (n: number) => {
    if (n === 5) {
      return [
        { id: 0, x: 120, y: 70 },
        { id: 1, x: 120, y: 230 },
        { id: 2, x: 260, y: 150, isHub: true },
        { id: 3, x: 400, y: 70 },
        { id: 4, x: 400, y: 230 },
      ];
    } else {
      // 9 qubits: ring of 8 around center hub q8 (or q0)
      const cx = 260;
      const cy = 150;
      const r = 100;
      const nodes = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2;
        nodes.push({
          id: i,
          x: Math.round(cx + r * Math.cos(angle)),
          y: Math.round(cy + r * Math.sin(angle)),
        });
      }
      nodes.push({ id: 8, x: cx, y: cy, isHub: true });
      return nodes;
    }
  };

  const nodes = getCoordinates(numQubits);

  // Run custom transpiler on server
  const runTranspile = useCallback(async (currentEdges: [number, number][], qCount: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/transpile-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_qubits: qCount,
          edges: currentEdges,
          p: 2,
          formulation: 'unbalanced',
        }),
      });
      if (res.ok) {
        const json: CustomTranspileResult = await res.json();
        setTranspileResult(json);
      }
    } catch (e) {
      console.error('Transpile custom error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on mount or topology change
  useEffect(() => {
    runTranspile(edges, numQubits);
  }, [edges, numQubits, runTranspile]);

  const handleNodeClick = (nodeId: number) => {
    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else if (selectedNode === nodeId) {
      setSelectedNode(null); // Deselect
    } else {
      // Toggle edge between selectedNode and nodeId
      const u = Math.min(selectedNode, nodeId);
      const v = Math.max(selectedNode, nodeId);
      const exists = edges.some(([a, b]) => a === u && b === v);

      let newEdges: [number, number][];
      if (exists) {
        newEdges = edges.filter(([a, b]) => !(a === u && b === v));
      } else {
        newEdges = [...edges, [u, v]];
      }
      setEdges(newEdges);
      setSelectedNode(null);
    }
  };

  const handleApplyPreset = (presetName: string) => {
    setSelectedNode(null);
    if (presetName === 'bowtie') {
      setNumQubits(5);
      setEdges([[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4]]);
    } else if (presetName === 'linear5') {
      setNumQubits(5);
      setEdges([[0, 1], [1, 2], [2, 3], [3, 4]]);
    } else if (presetName === 'ring5') {
      setNumQubits(5);
      setEdges([[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]);
    } else if (presetName === 'wheel9') {
      setNumQubits(9);
      const ringEdges: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
        [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7],
      ];
      setEdges(ringEdges);
    } else if (presetName === 'heavyhex9') {
      setNumQubits(9);
      setEdges([
        [0, 1], [1, 2], [1, 6], [2, 3], [2, 6], [2, 5],
        [3, 4], [4, 5], [5, 6], [6, 7], [6, 8], [8, 0]
      ]);
    } else if (presetName === 'clear') {
      setEdges([]);
    }
  };

  return (
    <div className="glass-panel processor-cad-card spotlight-card">
      {/* Header */}
      <div className="cad-header">
        <div>
          <div className="chip-badge-cyan">Architecture Co-Design CAD</div>
          <h3>Interactive Custom Processor Architect & Live Transpiler</h3>
          <p className="subtitle">
            The guide states: <em>"There is no single correct coupling map. Your architecture is part of your solution."</em> 
            Click any two qubits below to add/remove coupling edges. Qiskit transpiles the Knapsack circuit in real-time.
          </p>
        </div>

        <div className="cad-controls-wrap">
          <div className="qubit-budget-toggle">
            <span className="text-xs text-muted font-mono">Qubit Budget:</span>
            <button
              className={`cad-btn-toggle ${numQubits === 5 ? 'active' : ''}`}
              onClick={() => {
                setNumQubits(5);
                setEdges([[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4]]);
                setSelectedNode(null);
              }}
            >
              5 Qubits (Proc A)
            </button>
            <button
              className={`cad-btn-toggle ${numQubits === 9 ? 'active' : ''}`}
              onClick={() => {
                setNumQubits(9);
                handleApplyPreset('wheel9');
              }}
            >
              9 Qubits (Proc B)
            </button>
          </div>
        </div>
      </div>

      {/* Presets Row */}
      <div className="cad-presets-row">
        <span className="presets-label">Topological Presets:</span>
        <button className="cad-pill-btn" onClick={() => handleApplyPreset('bowtie')}>
          ★ Processor A (Bow-Tie)
        </button>
        <button className="cad-pill-btn" onClick={() => handleApplyPreset('linear5')}>
          Processor A (Linear Chain)
        </button>
        <button className="cad-pill-btn" onClick={() => handleApplyPreset('ring5')}>
          Processor A (Ring)
        </button>
        <button className="cad-pill-btn" onClick={() => handleApplyPreset('wheel9')}>
          ★ Processor B (Wheel)
        </button>
        <button className="cad-pill-btn" onClick={() => handleApplyPreset('heavyhex9')}>
          Processor B (Heavy-Hex)
        </button>
        <button className="cad-pill-btn text-rose" onClick={() => handleApplyPreset('clear')}>
          Clear Edges
        </button>
      </div>

      {/* Main CAD Split: Canvas on Left, Live Transpiler Analytics on Right */}
      <div className="cad-workbench-grid">
        {/* Interactive SVG Canvas */}
        <div className="cad-canvas-box glass-panel">
          <div className="cad-canvas-hint font-mono">
            {selectedNode === null ? (
              <span>Click a qubit to start drawing an edge...</span>
            ) : (
              <span className="text-cyan animate-pulse">
                Selected qubit <strong>q{selectedNode}</strong>: now click another qubit to connect or disconnect!
              </span>
            )}
          </div>

          <svg viewBox="0 0 520 300" className="cad-svg">
            <defs>
              <linearGradient id="cadEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Render Edges */}
            {edges.map(([u, v], i) => {
              const nodeU = nodes.find(n => n.id === u);
              const nodeV = nodes.find(n => n.id === v);
              if (!nodeU || !nodeV) return null;
              const isSelectedEdge = selectedNode === u || selectedNode === v;

              return (
                <line
                  key={`cad-edge-${i}`}
                  x1={nodeU.x}
                  y1={nodeU.y}
                  x2={nodeV.x}
                  y2={nodeV.y}
                  stroke={isSelectedEdge ? '#00f2fe' : 'url(#cadEdgeGrad)'}
                  strokeWidth={isSelectedEdge ? '3.5' : '2.2'}
                  strokeLinecap="round"
                  className="cad-svg-edge"
                />
              );
            })}

            {/* Render Nodes */}
            {nodes.map((n) => {
              const isSelected = selectedNode === n.id;
              const degree = edges.filter(([u, v]) => u === n.id || v === n.id).length;

              return (
                <g
                  key={`cad-node-${n.id}`}
                  onClick={() => handleNodeClick(n.id)}
                  style={{ cursor: 'pointer' }}
                  className="cad-node-group"
                >
                  {/* Selection Glow Ring */}
                  {isSelected && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="28"
                      fill="none"
                      stroke="#00f2fe"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-spin-slow"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isSelected ? '22' : '18'}
                    fill={isSelected ? '#0e2d42' : n.isHub ? '#141e33' : '#080d1a'}
                    stroke={isSelected ? '#00f2fe' : n.isHub ? '#38bdf8' : '#8b5cf6'}
                    strokeWidth={isSelected ? '3' : '2'}
                    className="cad-node-circle"
                  />

                  {/* Label */}
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    q{n.id}
                  </text>

                  {/* Degree Badge */}
                  <text
                    x={n.x}
                    y={n.y - 24}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    deg: {degree}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="cad-canvas-footer">
            <span className="font-mono text-xs text-muted">
              Active Edges: <strong className="text-cyan">{edges.length}</strong> · Physical Qubits: <strong className="text-cyan">{numQubits}</strong>
            </span>
            <button onClick={() => setSelectedNode(null)} className="btn-cad-reset">
              Deselect
            </button>
          </div>
        </div>

        {/* Right: Live Qiskit Transpiler Telemetry */}
        <div className="cad-telemetry-panel glass-panel">
          <div className="telemetry-top-bar">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-cyan" />
              <h4 className="m-0 font-mono text-xs uppercase tracking-wider text-white">Live Transpiler Output</h4>
            </div>
            {loading && <RefreshCw size={13} className="spin-icon text-cyan" />}
          </div>

          {transpileResult?.connected ? (
            <div className="cad-metrics-stack">
              <div className="metric-chip-card">
                <div className="chip-label">Transpiled Depth</div>
                <div className="chip-value font-mono text-cyan">{transpileResult.depth}</div>
                <div className="chip-sub">Total quantum gate steps</div>
              </div>

              <div className="metric-chip-card">
                <div className="chip-label">Total CX Gates</div>
                <div className="chip-value font-mono text-violet">{transpileResult.cx_count}</div>
                <div className="chip-sub">Two-qubit error drivers</div>
              </div>

              <div className="metric-chip-card">
                <div className="chip-label">Routing SWAPs Inserted</div>
                <div className="chip-value font-mono text-amber">{transpileResult.swaps}</div>
                <div className="chip-sub">Overhead over all-to-all</div>
              </div>

              <div className="metric-chip-card">
                <div className="chip-label">Estimated Success Prob (ESP)</div>
                <div className="chip-value font-mono text-emerald">
                  {(transpileResult.esp * 100).toFixed(1)}%
                </div>
                <div className="chip-sub">Hardware execution fidelity</div>
              </div>

              <div className="cad-graph-properties">
                <div className="prop-row font-mono">
                  <span>Graph Diameter:</span>
                  <span className="text-cyan">{transpileResult.diameter}</span>
                </div>
                <div className="prop-row font-mono">
                  <span>Avg Shortest Path:</span>
                  <span className="text-cyan">{transpileResult.avg_path} hops</span>
                </div>
                <div className="prop-row font-mono">
                  <span>Qiskit Transpile Time:</span>
                  <span className="text-muted">{transpileResult.transpile_latency_ms} ms</span>
                </div>
              </div>

              <div className="cad-pareto-card">
                <div className="pareto-badge-row">
                  <ShieldCheck size={16} className={transpileResult.pareto_optimal ? 'text-emerald' : 'text-amber'} />
                  <span className="font-mono text-xs font-bold text-white">
                    {transpileResult.pareto_optimal ? '★ Pareto-Optimal Coupling Choice' : 'Sub-Optimal: Elevated Routing Overhead'}
                  </span>
                </div>
                <p className="text-xs text-muted m-0 mt-1">
                  {transpileResult.pareto_optimal 
                    ? 'Excellent connectivity! Achieves low SWAP count with minimal edge budget.'
                    : 'Consider adding a central routing hub (e.g., Bow-Tie / Wheel) to shorten diameter.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="cad-disconnected-warning">
              <AlertTriangle size={24} className="text-rose mb-2" />
              <h5 className="text-rose font-bold m-0">Coupling Graph Disconnected</h5>
              <p className="text-xs text-muted mt-1">
                {transpileResult?.error || 'Every qubit must be reachable from other qubits. Connect isolated nodes to enable Qiskit routing.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
