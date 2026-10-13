import React, { useState, useRef } from 'react';
import { Rotate3d, Compass, RefreshCw } from 'lucide-react';

interface BlochSphereWidgetProps {
  gamma?: number;
  beta?: number;
}

export const BlochSphereWidget: React.FC<BlochSphereWidgetProps> = ({ gamma = 0.785, beta = 0.523 }) => {
  // Sphere rotation view angles (yaw, pitch in radians)
  const [yaw, setYaw] = useState<number>(0.6);
  const [pitch, setPitch] = useState<number>(0.35);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // State vector angles (theta from Z axis, phi in XY plane)
  // Derive visual angles from QAOA gamma and beta
  const theta = Math.min(Math.PI * 0.9, Math.max(0.1, beta * 1.5));
  const phi = gamma * 2.0;

  const R = 85; // Sphere radius in SVG pixels
  const CX = 130;
  const CY = 120;

  // 3D projection function
  const project = (x: number, y: number, z: number) => {
    // Rotate by yaw around Y axis
    const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
    // Rotate by pitch around X axis
    const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);

    return {
      x: CX + x1,
      y: CY - y2,
      depth: z2,
    };
  };

  // Drag rotation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => prev + dx * 0.015);
    setPitch((prev) => Math.max(-1.2, Math.min(1.2, prev + dy * 0.015)));
  };

  const handleMouseUp = () => setIsDragging(false);

  // Calculate state vector endpoint
  const sx = R * Math.sin(theta) * Math.cos(phi);
  const sy = R * Math.cos(theta);
  const sz = R * Math.sin(theta) * Math.sin(phi);
  const stateProj = project(sx, sy, sz);

  // Project cardinal axes
  const pZPos = project(0, R + 20, 0); // |0>
  const pZNeg = project(0, -R - 20, 0); // |1>
  const pXPos = project(R + 20, 0, 0); // |+>
  const pYPos = project(0, 0, R + 20); // |+i>

  // Generate equator circle points
  const equatorPoints: string[] = [];
  for (let a = 0; a <= Math.PI * 2; a += 0.2) {
    const pt = project(R * Math.cos(a), 0, R * Math.sin(a));
    equatorPoints.push(`${pt.x},${pt.y}`);
  }

  // Generate meridian circle points
  const meridianPoints: string[] = [];
  for (let a = 0; a <= Math.PI * 2; a += 0.2) {
    const pt = project(0, R * Math.cos(a), R * Math.sin(a));
    meridianPoints.push(`${pt.x},${pt.y}`);
  }

  const handleReset = () => {
    setYaw(0.6);
    setPitch(0.35);
  };

  return (
    <div className="bloch-widget-card glass-panel spotlight-card">
      <div className="bloch-header">
        <div className="bloch-title-group">
          <Compass size={15} className="text-cyan animate-spin-slow" />
          <h4>Interactive 3D Bloch Sphere</h4>
        </div>
        <button className="bloch-reset-btn" onClick={handleReset} title="Reset view angle">
          <RefreshCw size={12} />
          <span>Reset</span>
        </button>
      </div>
      <p className="bloch-sub">
        Drag to rotate in 3D. State vector |ψ⟩ precesses under Cost (Z-angle γ = {gamma.toFixed(2)}) and Mixer (X-angle β = {beta.toFixed(2)}) unitaries.
      </p>

      <div
        className="bloch-canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg viewBox="0 0 260 240" className="bloch-svg">
          <defs>
            <radialGradient id="sphereGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="rgba(0, 242, 254, 0.08)" />
              <stop offset="70%" stopColor="rgba(139, 92, 246, 0.03)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.4)" />
            </radialGradient>
            <filter id="blochGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sphere Outer Glass Halo */}
          <circle cx={CX} cy={CY} r={R} fill="url(#sphereGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />

          {/* Meridian and Equator rings */}
          <polygon
            points={equatorPoints.join(' ')}
            fill="none"
            stroke="rgba(0, 242, 254, 0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <polygon
            points={meridianPoints.join(' ')}
            fill="none"
            stroke="rgba(139, 92, 246, 0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Coordinate Axes */}
          {/* Z Axis (|0> to |1>) */}
          <line x1={CX} y1={CY} x2={pZPos.x} y2={pZPos.y} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
          <line x1={CX} y1={CY} x2={pZNeg.x} y2={pZNeg.y} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="2 2" />
          <text x={pZPos.x} y={pZPos.y - 4} fill="#00f2fe" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">|0⟩</text>
          <text x={pZNeg.x} y={pZNeg.y + 12} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">|1⟩</text>

          {/* X Axis (|+>) */}
          <line x1={CX} y1={CY} x2={pXPos.x} y2={pXPos.y} stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />
          <text x={pXPos.x + 8} y={pXPos.y + 4} fill="#a78bfa" fontSize="10" textAnchor="start" fontFamily="JetBrains Mono">|+⟩</text>

          {/* Y Axis (|+i>) */}
          <line x1={CX} y1={CY} x2={pYPos.x} y2={pYPos.y} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
          <text x={pYPos.x} y={pYPos.y + 12} fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">|+i⟩</text>

          {/* State Vector Arrow */}
          <line
            x1={CX}
            y1={CY}
            x2={stateProj.x}
            y2={stateProj.y}
            stroke="#00f2fe"
            strokeWidth="2.8"
            strokeLinecap="round"
            filter="url(#blochGlow)"
          />
          {/* Arrow Tip */}
          <circle cx={stateProj.x} cy={stateProj.y} r="5" fill="#ffffff" stroke="#00f2fe" strokeWidth="2" filter="url(#blochGlow)" />
          <text
            x={stateProj.x + 10}
            y={stateProj.y - 6}
            fill="#ffffff"
            fontSize="11"
            fontWeight="700"
            fontFamily="JetBrains Mono"
          >
            |ψ⟩
          </text>
        </svg>

        <div className="bloch-hint">
          <Rotate3d size={12} />
          <span>Click & drag to rotate view</span>
        </div>
      </div>
    </div>
  );
};
