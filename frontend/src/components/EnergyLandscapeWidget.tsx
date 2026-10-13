import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, TrendingDown } from 'lucide-react';

export const EnergyLandscapeWidget: React.FC = () => {
  // Simulated COBYLA optimization steps descending into minimum
  const trajectory = [
    { step: 0, gamma: 0.8, beta: 2.4, energy: -12.4 },
    { step: 1, gamma: 1.1, beta: 2.1, energy: -15.1 },
    { step: 2, gamma: 1.4, beta: 1.8, energy: -17.8 },
    { step: 3, gamma: 1.6, beta: 1.4, energy: -19.9 },
    { step: 4, gamma: 1.7, beta: 1.1, energy: -21.4 },
    { step: 5, gamma: 1.74, beta: 0.95, energy: -22.3 },
    { step: 6, gamma: 1.75, beta: 0.85, energy: -22.7 },
    { step: 7, gamma: 1.75, beta: 0.80, energy: -22.85 }, // Global Minimum
  ];

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < trajectory.length - 1 ? prev + 1 : 0));
    }, 700);
    return () => clearInterval(interval);
  }, [isPlaying, trajectory.length]);

  // Coordinate mapping for SVG (width 320, height 200)
  const mapCoords = (g: number, b: number) => {
    const x = 30 + (g / 3.14) * 250;
    const y = 175 - (b / 3.14) * 150;
    return { x, y };
  };

  const currentPt = mapCoords(trajectory[currentStep].gamma, trajectory[currentStep].beta);

  return (
    <div className="landscape-widget-card glass-panel spotlight-card">
      <div className="landscape-header">
        <div className="landscape-title-group">
          <TrendingDown size={15} className="text-amber" />
          <h4>Energy Landscape $E(\gamma, \beta)$ & COBYLA Descent</h4>
        </div>
        <div className="landscape-controls">
          <button className="control-btn-icon" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button className="control-btn-icon" onClick={() => setCurrentStep(0)} title="Reset trajectory">
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      <p className="landscape-sub">
        Visualizing classical COBYLA converging on optimal variational angles $(\gamma^*, \beta^*)$ to minimize the Hamiltonian expectation value.
      </p>

      {/* 2D Contour Map Canvas */}
      <div className="landscape-svg-container">
        <svg viewBox="0 0 320 200" className="landscape-svg">
          <defs>
            <radialGradient id="contourValley" cx="62%" cy="65%" r="60%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="25%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#312e81" />
              <stop offset="75%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#07090e" />
            </radialGradient>
            <filter id="optGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Contour Background */}
          <rect x="25" y="15" width="270" height="165" rx="6" fill="url(#contourValley)" stroke="rgba(255,255,255,0.08)" />

          {/* Simulated Contour Rings */}
          <ellipse cx="195" cy="120" rx="80" ry="50" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="195" cy="120" rx="55" ry="34" fill="none" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
          <ellipse cx="195" cy="120" rx="30" ry="18" fill="rgba(0, 242, 254, 0.08)" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="1.2" />

          {/* Global Minimum Target Star */}
          <circle cx="195" cy="120" r="3" fill="#00f2fe" filter="url(#optGlow)" />
          <text x="195" y="136" fill="#00f2fe" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">GLOBAL MIN</text>

          {/* Optimizer Path Polyline */}
          <polyline
            points={trajectory
              .slice(0, currentStep + 1)
              .map((p) => {
                const pt = mapCoords(p.gamma, p.beta);
                return `${pt.x},${pt.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Step Nodes */}
          {trajectory.slice(0, currentStep + 1).map((p, idx) => {
            const pt = mapCoords(p.gamma, p.beta);
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={idx === currentStep ? '#ffffff' : '#f59e0b'}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Current Optimizer Position Marker */}
          <circle cx={currentPt.x} cy={currentPt.y} r="8" fill="none" stroke="#f59e0b" strokeWidth="2" filter="url(#optGlow)" className="animate-ping-once" />
          <circle cx={currentPt.x} cy={currentPt.y} r="5" fill="#f59e0b" filter="url(#optGlow)" />

          {/* Axes labels */}
          <text x="160" y="194" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">Cost Angle γ (radians)</text>
          <text x="12" y="100" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90 12,100)" fontFamily="JetBrains Mono">Mixer Angle β</text>
        </svg>
      </div>

      {/* Trajectory Step Ticker */}
      <div className="landscape-status-bar">
        <span className="step-tag font-mono">Step {trajectory[currentStep].step} / {trajectory.length - 1}</span>
        <span className="step-angles font-mono">
          γ = {trajectory[currentStep].gamma.toFixed(2)} | β = {trajectory[currentStep].beta.toFixed(2)}
        </span>
        <span className="step-energy font-mono text-cyan">
          ⟨C⟩ = {trajectory[currentStep].energy.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
