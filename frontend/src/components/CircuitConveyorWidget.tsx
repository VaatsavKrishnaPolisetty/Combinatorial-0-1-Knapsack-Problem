import React, { useState } from 'react';
import { Layers, Play } from 'lucide-react';

interface CircuitConveyorWidgetProps {
  layersP?: number;
}

export const CircuitConveyorWidget: React.FC<CircuitConveyorWidgetProps> = ({ layersP = 2 }) => {
  const [pulsing, setPulsing] = useState<boolean>(false);

  const handlePulse = () => {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 2400);
  };

  const qubits = [0, 1, 2, 3, 4];

  return (
    <div className="circuit-conveyor-card glass-panel spotlight-card">
      <div className="circuit-header">
        <div className="circuit-title-group">
          <Layers size={15} className="text-cyan" />
          <h4>QAOA Quantum Circuit Gate Sequence (p={layersP})</h4>
        </div>
        <button className="btn-pulse-circuit" onClick={handlePulse} disabled={pulsing}>
          <Play size={12} fill="currentColor" />
          <span>{pulsing ? 'Propagating Unitaries...' : 'Pulse Gate Sequence'}</span>
        </button>
      </div>
      <p className="circuit-sub">
        State preparation H^5 followed by alternating non-commuting Cost (Rzz) and Mixer (Rx) unitary evolutions.
      </p>

      <div className="circuit-wires-canvas">
        {/* Animated Traveling Quantum Wave Front */}
        {pulsing && <div className="circuit-traveling-pulse" />}

        {qubits.map((q) => (
          <div key={q} className="circuit-wire-row">
            {/* Qubit Label */}
            <div className="wire-qubit-tag font-mono">q{q}</div>

            {/* Wire Line with Gates */}
            <div className="wire-track">
              <div className="wire-line" />

              {/* Stage 1: Hadamard Superposition */}
              <div className={`gate-box gate-h ${pulsing ? 'gate-glow-h' : ''}`}>
                <span>H</span>
              </div>

              {/* Stage 2: Cost Layer RZZ Couplers */}
              <div className={`gate-box gate-rzz ${pulsing ? 'gate-glow-cost' : ''}`}>
                <span>Rzz(γ₁)</span>
              </div>

              {/* Stage 3: Mixer Layer RX */}
              <div className={`gate-box gate-rx ${pulsing ? 'gate-glow-mixer' : ''}`}>
                <span>Rx(β₁)</span>
              </div>

              {/* Stage 4: Second Layer if p >= 2 */}
              {layersP >= 2 && (
                <>
                  <div className={`gate-box gate-rzz ${pulsing ? 'gate-glow-cost' : ''}`}>
                    <span>Rzz(γ₂)</span>
                  </div>
                  <div className={`gate-box gate-rx ${pulsing ? 'gate-glow-mixer' : ''}`}>
                    <span>Rx(β₂)</span>
                  </div>
                </>
              )}

              {/* Stage 5: Measurement Meter */}
              <div className={`gate-box gate-measure ${pulsing ? 'gate-glow-measure' : ''}`}>
                <span>M</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="circuit-legend font-mono">
        <span className="legend-item"><span className="legend-dot dot-h" /> H: Uniform Superposition</span>
        <span className="legend-item"><span className="legend-dot dot-rzz" /> Rzz: Cost Layer (Ising Coupling)</span>
        <span className="legend-item"><span className="legend-dot dot-rx" /> Rx: Mixer Layer (Transverse Field)</span>
        <span className="legend-item"><span className="legend-dot dot-m" /> M: Z-Basis Readout</span>
      </div>
    </div>
  );
};
