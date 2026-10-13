import React, { useRef, useState, useEffect } from 'react';
import { Cpu, Atom, BarChart3, FileText, Sparkles, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'hero', label: 'Overview', icon: Sparkles },
    { id: 'solver', label: 'Knapsack Studio', icon: Atom },
    { id: 'topologies', label: 'Chip Topologies', icon: Cpu },
    { id: 'benchmarks', label: 'Noise & Routing', icon: BarChart3 },
    { id: 'terminal', label: 'Terminal Guide', icon: Terminal },
    { id: 'insights', label: 'Research Findings', icon: FileText },
  ];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navContainerRef = useRef<HTMLElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateSlider = () => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const activeEl = tabRefs.current[activeIndex];
    const containerEl = navContainerRef.current;

    if (activeEl && containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      setSliderStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [activeTab]);

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="brand-group" onClick={() => setActiveTab('hero')} style={{ cursor: 'pointer' }}>
          <div className="brand-badge">
            <span className="brand-dot"></span>
            <span className="brand-event">Qiskit Fall Fest 2026 · SRM AP</span>
          </div>
          <h1 className="brand-title">
            PS-O3 · <span className="gradient-text">Quantum Knapsack QAOA</span>
          </h1>
        </div>

        <nav className="nav-tabs" role="tablist" ref={navContainerRef}>
          {/* Fluid Sliding Background Pill */}
          <div
            className="nav-sliding-pill"
            style={{
              transform: `translateX(${sliderStyle.left}px)`,
              width: `${sliderStyle.width}px`,
              opacity: sliderStyle.opacity,
            }}
          />

          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                role="tab"
                aria-selected={isActive}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} className="tab-icon" />
                <span className="tab-text">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
