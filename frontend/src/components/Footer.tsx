import React, { useState } from 'react';
import { 
  ExternalLink, 
  GraduationCap, 
  Award, 
  Cpu, 
  Atom, 
  Copy, 
  Check, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

const LinkedInIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GitHubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  highlight: string;
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    category: 'QUBO Formulation',
    question: 'Why did you use Unbalanced Penalization instead of standard Slack variables?',
    answer: 'Standard textbook slack expansions introduce ⌊log₂ W⌋ + 1 ancilla qubits (inflating the 5-item problem from 5 to 9 qubits). Because every ancilla must cross-couple with every decision qubit in (∑ w_i x_i + ∑ 2^k y_k - W)², the two-qubit coupler count explodes as O((N + log W)²). Our unbalanced formulation P(x) = λ₁ g(x) + λ₂ g(x)² uses zero ancillae, fits entirely on 5-qubit Processor A, and cuts CX gate counts by ~3× to 5× while preserving exact ground-state knapsack optimality.',
    highlight: 'Zero ancilla qubits • Fits 5-qubit hardware • 3× fewer CX gates',
  },
  {
    id: 2,
    category: 'Hardware Architecture',
    question: 'How does the degree-4 Bow-Tie topology reduce SWAP overhead by 65%?',
    answer: 'The knapsack constraint induces an all-to-all problem Hamiltonian. A 1D linear chain has diameter 4 and an average shortest path of 2.0, forcing the Qiskit Sabre transpiler to route non-adjacent interactions via 15 SWAP gates (adding 45 CX gates). Our Bow-Tie topology centers around a degree-4 central hub (q2), halving diameter to 2 and shortening average path to 1.4. This drops routing SWAPs from 15 down to 4 (−65%), cutting circuit noise substantially.',
    highlight: 'Diameter 4 → 2 • 15 SWAPs → 4 SWAPs • Cuts routing noise by 65%',
  },
  {
    id: 3,
    category: 'Noise & Feasibility',
    question: 'How do you guarantee feasible knapsack packings under physical noise?',
    answer: 'Physical decoherence (0.1% 1q, 0.5% 2q, 1.0% readout error) scatters quantum state amplitudes into non-optimal or infeasible bitstrings. We tackle this across three layers: (1) Spectral penalty calibration enforcing that the Hamiltonian ground state is the exact knapsack optimum, (2) CVaR (α = 0.25) tail expectation tuning that updates parameters based solely on the best 25% quantile, and (3) a greedy post-measurement repair decoder guaranteeing 0% constraint violations in returned packings.',
    highlight: 'Calibrated Hamiltonian • CVaR(α=0.25) • 100% legal bitstrings returned',
  },
  {
    id: 4,
    category: 'Error Mitigation',
    question: 'What is Zero-Noise Extrapolation (ZNE) and how does it improve expectation values?',
    answer: 'Zero-Noise Extrapolation is an error mitigation technique that requires zero auxiliary physical qubits. We perform unitary gate folding (CX → CX · CX† · CX) at noise scaling factors λ ∈ {1, 3, 5} to intentionally amplify depolarizing noise. By measuring expectation values at each scale and fitting an extrapolation curve back to the zero-noise limit λ → 0 (using Richardson or linear regression), we recover +24.9% of the noise-corrupted expectation energy.',
    highlight: 'Gate folding at λ=1,3,5 • Richardson extrapolation • +24.9% energy recovery',
  },
  {
    id: 5,
    category: 'Reproducibility & Execution',
    question: 'Can this project be tested and verified directly from the terminal?',
    answer: 'Yes! The entire project is 100% reproducible with zero external internet dependencies. You can clone the repo, run "python main.py --mode benchmark" for full CLI results, inspect the step-by-step project_notebook.ipynb in Jupyter, or interact with this web platform directly. You can even execute live CLI commands directly inside the Terminal Guide tab on this page!',
    highlight: 'Zero downloads • Python CLI main.py • Jupyter notebook • Live web CLI',
  },
];

export const Footer: React.FC = () => {
  const [copiedClone, setCopiedClone] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(1); // Open first FAQ by default

  const toggleFaq = (id: number) => {
    setOpenFaq(prev => prev === id ? null : id);
  };

  const cloneCommand = 'git clone https://github.com/VaatsavKrishnaPolisetty/Combinatorial-0-1-Knapsack-Problem.git';

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2200);
  };

  return (
    <footer className="quantum-footer">
      <div className="quantum-footer-aurora" />

      <div className="quantum-footer-container">
        {/* Top 3-Column Grid */}
        <div className="quantum-footer-grid">
          {/* Column 1: Project & Mission */}
          <div className="footer-col footer-col-project">
            <div className="footer-brand">
              <div className="footer-brand-icon">
                <Atom size={22} className="text-cyan animate-spin-slow" />
              </div>
              <div>
                <h3 className="footer-brand-title">PS-O3 · Quantum Knapsack</h3>
                <span className="footer-brand-badge">Qiskit Fall Fest 2026</span>
              </div>
            </div>

            <p className="footer-desc">
              Solving NP-hard combinatorial optimization via QAOA and unbalanced penalization 
              without slack qubits, benchmarked on custom processor architectures (Bow-Tie vs Wheel) 
              under realistic decoherence and depolarizing noise models.
            </p>

            <div className="footer-event-card">
              <Award size={16} className="text-violet" />
              <div className="footer-event-text">
                <span className="event-label">Competition Track</span>
                <strong className="event-name">SRM University-AP · Phase 1 Submission</strong>
              </div>
            </div>

            <div className="footer-badges-wrap">
              <span className="footer-chip">Qiskit 2.5.2</span>
              <span className="footer-chip">Aer 0.17</span>
              <span className="footer-chip">React 19 + Vite</span>
              <span className="footer-chip">FastAPI</span>
            </div>
          </div>

          {/* Column 2: Research Team & Authors */}
          <div className="footer-col footer-col-team">
            <div className="footer-section-header">
              <GraduationCap size={18} className="text-cyan" />
              <div>
                <h4 className="footer-section-title">Research & Development Team</h4>
                <p className="footer-section-sub">
                  Vignan's Foundation For Science Technology and Research (VFSTR)
                </p>
              </div>
            </div>

            <div className="team-cards-stack">
              {/* Member 1: Vaatsav Krishna */}
              <div className="team-member-card spotlight-card">
                <div className="member-avatar avatar-cyan">
                  <span>VK</span>
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <h5 className="member-name">P L K Vaatsav Krishna</h5>
                    <span className="member-badge-year">CSE 2nd Year</span>
                  </div>
                  <p className="member-role">Quantum Algorithm & Architecture Lead</p>
                  <p className="member-institution">Vignan's Foundation For Science Technology and Research</p>
                  <div className="member-socials">
                    <a
                      href="https://www.linkedin.com/in/p-l-k-vaatsav-krishna-1a5274394/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill linkedin"
                      title="Connect on LinkedIn"
                    >
                      <LinkedInIcon size={13} />
                      <span>LinkedIn</span>
                      <ExternalLink size={10} className="pill-arrow" />
                    </a>
                    <a
                      href="https://github.com/VaatsavKrishnaPolisetty"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill github"
                      title="View GitHub Profile"
                    >
                      <GitHubIcon size={13} />
                      <span>GitHub</span>
                      <ExternalLink size={10} className="pill-arrow" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Member 2: P V Kalyan */}
              <div className="team-member-card spotlight-card">
                <div className="member-avatar avatar-violet">
                  <span>PK</span>
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <h5 className="member-name">P V Kalyan</h5>
                    <span className="member-badge-year">CSE 2nd Year</span>
                  </div>
                  <p className="member-role">Quantum Research & Hardware Optimization</p>
                  <p className="member-institution">Vignan's Foundation For Science Technology and Research</p>
                  <div className="member-socials">
                    <a
                      href="https://www.linkedin.com/in/kalyan-padamata-3a811339b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill linkedin"
                      title="Connect on LinkedIn"
                    >
                      <LinkedInIcon size={13} />
                      <span>LinkedIn</span>
                      <ExternalLink size={10} className="pill-arrow" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Repository & Quantum Highlights */}
          <div className="footer-col footer-col-links">
            <div className="footer-section-header">
              <Cpu size={18} className="text-violet" />
              <div>
                <h4 className="footer-section-title">Open Source Repository</h4>
                <p className="footer-section-sub">Reproducible Research & Codebase</p>
              </div>
            </div>

            <div className="footer-repo-box glass-panel">
              <div className="repo-top">
                <GitHubIcon size={18} />
                <a 
                  href="https://github.com/VaatsavKrishnaPolisetty/Combinatorial-0-1-Knapsack-Problem" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="repo-title-link"
                >
                  VaatsavKrishnaPolisetty / Combinatorial-0-1-Knapsack-Problem
                  <ExternalLink size={12} className="inline ml-1" />
                </a>
              </div>
              <p className="repo-desc">
                Full quantum experiment notebook, FastAPI calculation endpoints, React 19 interactive studio, and custom processor benchmarks.
              </p>
              <div className="clone-snippet-box">
                <span className="clone-label font-mono">$ {cloneCommand}</span>
                <button 
                  onClick={handleCopyClone} 
                  className="btn-copy-clone"
                  title="Copy git clone command"
                >
                  {copiedClone ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="footer-highlights-list">
              <div className="highlight-item">
                <Sparkles size={13} className="text-cyan" />
                <span><strong>5 Qubits vs 9:</strong> Zero slack qubit overhead on Processor A</span>
              </div>
              <div className="highlight-item">
                <Sparkles size={13} className="text-cyan" />
                <span><strong>Bow-Tie Topology:</strong> −65% SWAPs & −36% CX Gate count</span>
              </div>
              <div className="highlight-item">
                <Sparkles size={13} className="text-cyan" />
                <span><strong>Wheel Topology:</strong> −29% CX Gates over heavy-hex</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Quantum Research FAQ Section */}
        <div className="footer-faq-section glass-panel spotlight-card">
          <div className="faq-section-header">
            <h3 className="faq-title">Quantum Knapsack & Hardware Co-Design FAQ</h3>
            <p className="faq-subtitle">
              Key design decisions on problem formulation, hardware coupling map routing, physical noise mitigation, and local reproducibility.
            </p>
          </div>

          <div className="faq-accordion-list">
            {FAQS.map(faq => {
              const isOpen = openFaq === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className={`faq-item glass-panel ${isOpen ? 'faq-item-open' : ''}`}
                >
                  <button 
                    className="faq-question-btn"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="faq-question-left">
                      <span className="faq-category-tag">{faq.category}</span>
                      <span className="faq-question-text">{faq.question}</span>
                    </div>
                    <div className={`faq-chevron-box ${isOpen ? 'rotate' : ''}`}>
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p className="faq-answer-text">{faq.answer}</p>
                      <div className="faq-highlight-pill">
                        <Sparkles size={13} className="text-cyan flex-shrink-0" />
                        <span className="font-mono text-xs">{faq.highlight}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="quantum-footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright-text">
              © 2026 <strong>P L K Vaatsav Krishna</strong> & <strong>P V Kalyan</strong> · 
              Dept. of Computer Science & Engineering, <em>Vignan's Foundation For Science Technology and Research (VFSTR)</em>.
            </p>
            <p className="event-credit">
              Submitted for <strong>Qiskit Fall Fest 2026</strong> · Hosted by <strong>SRM University-AP</strong>.
            </p>
          </div>

          <div className="footer-bottom-right">
            <div className="status-ping-wrap">
              <span className="status-ping-dot" />
              <span className="status-ping-text">Qiskit Aer 2.5 Engine Verified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
