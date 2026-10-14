import React, { useState } from 'react';
import { Cpu, Network, ShieldAlert, Zap, Radio, Sliders } from 'lucide-react';
import type { TopologyData, RoutingRobustness } from '../types';
import { ProcessorCadSandbox } from './ProcessorCadSandbox';

interface TopologyExplorerProps {
  topologies: Record<string, TopologyData>;
  robustness: RoutingRobustness[];
}

export const TopologyExplorer: React.FC<TopologyExplorerProps> = ({ topologies, robustness }) => {
  const [viewMode, setViewMode] = useState<'reference' | 'cad'>('reference');
  const [selectedGroup, setSelectedGroup] = useState<'A' | 'B'>('A');
  const [activeTopologyKey, setActiveTopologyKey] = useState<string>('A_bowtie (ours)');
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  const groupAKeys = ['A_bowtie (ours)', 'A_linear (ref)', 'A_tree (ref)', 'A_ring (ours-alt)'];
  const groupBKeys = ['B_wheel (ours)', 'B_heavyhex (ref)', 'B_grid (ours-alt)'];

  const currentKeys = selectedGroup === 'A' ? groupAKeys : groupBKeys;
  const activeTopo = topologies[activeTopologyKey] || topologies['A_bowtie (ours)'];

  const currentRobustness = robustness.find(r => r.processor === activeTopologyKey);

  // Group comparison baselines
  const baselineKey = selectedGroup === 'A' ? 'A_linear (ref)' : 'B_heavyhex (ref)';
  const coDesignedKey = selectedGroup === 'A' ? 'A_bowtie (ours)' : 'B_wheel (ours)';

  const baselineRob = robustness.find(r => r.processor === baselineKey);
  const coDesignedRob = robustness.find(r => r.processor === coDesignedKey);

  const cxReduction = (baselineRob && coDesignedRob)
    ? Math.round(((baselineRob.cx_mean - coDesignedRob.cx_mean) / baselineRob.cx_mean) * 100)
    : 0;

  const swapReduction = (baselineRob && coDesignedRob)
    ? Math.round(((baselineRob.swaps_mean - coDesignedRob.swaps_mean) / baselineRob.swaps_mean) * 100)
    : 0;

  return (
    <div className="topology-container">
      {/* Top Mode Selector: Reference vs CAD Sandbox */}
      <div className="topo-mode-bar glass-panel spotlight-card">
        <button
          className={`topo-mode-tab-btn ${viewMode === 'reference' ? 'active' : ''}`}
          onClick={() => setViewMode('reference')}
        >
          <Cpu size={16} />
          <span>Reference Processor Topologies</span>
        </button>
        <button
          className={`topo-mode-tab-btn ${viewMode === 'cad' ? 'active' : ''}`}
          onClick={() => setViewMode('cad')}
        >
          <Sliders size={16} />
          <span>Interactive CAD & Coupling Sandbox (Live Wiring)</span>
          <span className="chip-badge cyan-badge">Feature 2 • Real-Time Qiskit</span>
        </button>
      </div>

      {viewMode === 'cad' ? (
        <ProcessorCadSandbox />
      ) : (
        <>
          {/* Top Selector Banner */}
          <div className="glass-panel topo-header-card spotlight-card">
            <div className="topo-group-switch">
              <button
                className={`group-switch-btn ${selectedGroup === 'A' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedGroup('A');
                  setActiveTopologyKey('A_bowtie (ours)');
                }}
              >
                <Cpu size={18} />
                <div>
                  <div className="group-btn-title">Processor A (5 Qubits)</div>
                  <div className="group-btn-sub">Bow-Tie ★ vs Linear Chain</div>
                </div>
              </button>

              <button
                className={`group-switch-btn ${selectedGroup === 'B' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedGroup('B');
                  setActiveTopologyKey('B_wheel (ours)');
                }}
              >
                <Network size={18} />
                <div>
                  <div className="group-btn-title">Processor B (9 Qubits)</div>
                  <div className="group-btn-sub">Wheel ★ vs Heavy-Hex Architecture</div>
                </div>
              </button>
            </div>

            {/* Advantage Highlight */}
            <div className="topo-summary-stat">
              <div className="stat-highlight-pill animate-pulse-subtle">
                <Zap size={15} className="text-cyan" />
                <span>Co-Design Impact: <strong>-{cxReduction}% CX Gates</strong> & <strong>-{swapReduction}% SWAPs</strong></span>
              </div>
            </div>
          </div>

          <div className="topo-main-grid">
            {/* Left: SVG Canvas Graph & Architecture Details */}
            <div className="glass-panel topo-visual-panel spotlight-card">
          {/* Topology Selector Tabs */}
          <div className="topo-subtabs">
            {currentKeys.map(k => {
              const isSelected = activeTopologyKey === k;
              const isOurs = k.includes('ours');
              return (
                <button
                  key={k}
                  className={`topo-tab-btn ${isSelected ? 'active' : ''} ${isOurs ? 'featured' : ''}`}
                  onClick={() => setActiveTopologyKey(k)}
                >
                  <span>{k.replace(' (ours)', ' ★').replace(' (ref)', '')}</span>
                </button>
              );
            })}
          </div>

          {/* SVG Coupling Map with Traveling Photon Pulses */}
          <div className="svg-canvas-container">
            {activeTopo ? (
              <svg viewBox="0 0 520 360" className="coupling-svg">
                <defs>
                  <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="photonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="1" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                  </linearGradient>

                  <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="photonGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Base Static Coupling Lines */}
                {activeTopo.edges.map(([u, v], idx) => {
                  const nodeU = activeTopo.nodes.find(n => n.id === u);
                  const nodeV = activeTopo.nodes.find(n => n.id === v);
                  if (!nodeU || !nodeV) return null;

                  const isConnectedToHover = hoveredNodeId === u || hoveredNodeId === v;

                  return (
                    <line
                      key={`base-edge-${idx}`}
                      x1={nodeU.x}
                      y1={nodeU.y}
                      x2={nodeV.x}
                      y2={nodeV.y}
                      stroke="url(#edgeGrad)"
                      strokeWidth={isConnectedToHover ? "3.8" : "2"}
                      strokeOpacity={isConnectedToHover ? "1" : "0.5"}
                      strokeLinecap="round"
                      className="svg-base-edge"
                    />
                  );
                })}

                {/* Layer 2: Traveling Photon Pulses along Edges */}
                {activeTopo.edges.map(([u, v], idx) => {
                  const nodeU = activeTopo.nodes.find(n => n.id === u);
                  const nodeV = activeTopo.nodes.find(n => n.id === v);
                  if (!nodeU || !nodeV) return null;

                  const reverse = idx % 2 === 1;
                  const x1 = reverse ? nodeV.x : nodeU.x;
                  const y1 = reverse ? nodeV.y : nodeU.y;
                  const x2 = reverse ? nodeU.x : nodeV.x;
                  const y2 = reverse ? nodeU.y : nodeV.y;

                  return (
                    <line
                      key={`photon-pulse-${idx}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#photonGrad)"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      filter="url(#photonGlow)"
                      className="svg-photon-line"
                      style={{ animationDuration: `${2.2 + (idx % 3) * 0.4}s` }}
                    />
                  );
                })}

                {/* Clean Geometric Nodes */}
                {activeTopo.nodes.map((n) => {
                  const isHub = n.isHub;
                  const isHovered = hoveredNodeId === n.id;

                  return (
                    <g
                      key={`node-${n.id}`}
                      className="svg-node-group"
                      onMouseEnter={() => setHoveredNodeId(n.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Hub Continuous Pulsing Halo */}
                      {isHub && (
                        <>
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r="28"
                            fill="none"
                            stroke="#00f2fe"
                            strokeWidth="1.5"
                            className="hub-wave-ring"
                          />
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r="22"
                            fill="rgba(0, 242, 254, 0.18)"
                            className="hub-pulse-ring"
                          />
                        </>
                      )}


                      {/* Main Node Circle */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={isHub ? "20" : isHovered ? "19" : "17"}
                        fill={isHub ? "#0d1f38" : isHovered ? "#162544" : "#0d1424"}
                        stroke={isHub ? "#00f2fe" : isHovered ? "#38bdf8" : "#8b5cf6"}
                        strokeWidth={isHub ? "3" : isHovered ? "2.5" : "2"}
                        filter={isHub || isHovered ? "url(#glowFilter)" : undefined}
                        className="node-core-circle"
                      />

                      {/* Node Label */}
                      <text
                        x={n.x}
                        y={n.y + 5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isHub ? "13" : "12"}
                        fontWeight="600"
                        fontFamily="JetBrains Mono, monospace"
                        pointerEvents="none"
                      >
                        q{n.id}
                      </text>

                      {isHub && (
                        <text
                          x={n.x}
                          y={n.y - 25}
                          textAnchor="middle"
                          fill="#00f2fe"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="Outfit, sans-serif"
                          pointerEvents="none"
                          className="hub-title-text"
                        >
                          CENTRAL HUB
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="canvas-placeholder">Loading coupling map...</div>
            )}
          </div>

          <div className="topo-rationale-box">
            <div className="rationale-header-row">
              <Radio size={14} className="text-cyan animate-pulse" />
              <h4>Architectural Rationale</h4>
            </div>
            <p>{activeTopo?.rationale}</p>
          </div>
        </div>

        {/* Right: Routing & Transpiler Benchmark Stats */}
        <div className="glass-panel topo-metrics-panel spotlight-card">
          <h3>Routing & Transpilation Metrics</h3>
          <p className="panel-sub">Evaluated over 20 transpiler seeds (mean ± std dev)</p>

          {currentRobustness && (
            <div className="robustness-cards-list">
              <div className="metric-spec-card glass-panel">
                <div className="spec-label">CX Gates (Two-Qubit Error Drivers)</div>
                <div className="spec-val font-mono">
                  {currentRobustness.cx_mean.toFixed(1)} <span className="spec-std">± {currentRobustness.cx_std.toFixed(1)}</span>
                </div>
                <div className="spec-bar-track">
                  <div
                    className="spec-bar-fill fill-cyan"
                    style={{ width: `${Math.min(100, (currentRobustness.cx_mean / 260) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="metric-spec-card glass-panel">
                <div className="spec-label">Transpiler SWAP Insertions</div>
                <div className="spec-val font-mono">
                  {currentRobustness.swaps_mean.toFixed(1)} <span className="spec-std">± {currentRobustness.swaps_std.toFixed(1)}</span>
                </div>
                <div className="spec-bar-track">
                  <div
                    className="spec-bar-fill fill-violet"
                    style={{ width: `${Math.min(100, (currentRobustness.swaps_mean / 45) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="metric-spec-card glass-panel">
                <div className="spec-label">Transpiled Circuit Depth</div>
                <div className="spec-val font-mono">
                  {currentRobustness.depth_mean.toFixed(1)} <span className="spec-std">± {currentRobustness.depth_std.toFixed(1)}</span>
                </div>
                <div className="spec-bar-track">
                  <div
                    className="spec-bar-fill fill-amber"
                    style={{ width: `${Math.min(100, (currentRobustness.depth_mean / 300) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comparative Edge-Budget Trade-Off Card */}
          <div className="edge-tradeoff-box glass-panel">
            <div className="tradeoff-header">
              <ShieldAlert size={16} className="text-amber" />
              <h4>The Hardware Edge-Budget Trade-Off</h4>
            </div>
            <ul className="tradeoff-list">
              <li>
                <strong>Processor A (Bow-Tie):</strong> Spends only <strong>+2 edges</strong> over the linear chain (6 vs 4) to eliminate <strong>65% of SWAPs</strong> (15 $\rightarrow$ 4).
              </li>
              <li>
                <strong>Processor B (Wheel):</strong> Spends <strong>+4 edges</strong> over heavy-hex (16 vs 12) to cut CX gates from <strong>240 down to 170 (-29%)</strong>.
              </li>
              <li>
                <strong>Hub Serialisation Bottleneck:</strong> Because all outer nodes connect to the central hub, two-qubit operations across the hub cannot execute in parallel, causing depth to slightly increase (242 $\rightarrow$ 285). However, under two-qubit depolarizing gate error (0.5%), <strong>fewer CX gates consistently beats circuit depth!</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )}
</div>
  );
};
