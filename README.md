# PS-O3 · Combinatorial 0/1 Knapsack with QAOA on Custom Processors

[![Qiskit Fall Fest 2026](https://img.shields.io/badge/Qiskit%20Fall%20Fest-2026-blueviolet.svg)](https://qiskit.org)
[![Institution](https://img.shields.io/badge/Institution-SRM%20University--AP-00f2fe.svg)](https://srmap.edu.in)
[![Qiskit Version](https://img.shields.io/badge/Qiskit-2.5.2-6929c4.svg)](https://qiskit.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Solving the NP-hard 0/1 Knapsack problem using the Quantum Approximate Optimization Algorithm (QAOA) on hand-designed quantum processor architectures (Processor A vs Processor B) under realistic noise models.**
> Developed for **Qiskit Fall Fest 2026 · SRM University-AP (Phase 1)**.

---

## 📑 Table of Contents
1. [The Idea in 60 Seconds](#-the-idea-in-60-seconds)
2. [What We Added Beyond the Brief](#-what-we-added-beyond-the-brief)
3. [Key Benchmark Results](#-key-benchmark-results)
4. [Interactive Web Platform & Studio](#-interactive-web-platform--studio)
5. [Quickstart & Reproduction Guide](#-quickstart--reproduction-guide)
   - [Option 1: Interactive Web Platform (Recommended)](#option-1-interactive-web-platform-recommended)
   - [Option 2: Terminal / CLI Solver](#option-2-terminal--cli-solver)
   - [Option 3: End-to-End Jupyter Research Notebook](#option-3-end-to-end-jupyter-research-notebook)
6. [Repository Structure](#-repository-structure)
7. [Mathematical Formulation](#-mathematical-formulation)
8. [Hardware Topologies (Processor A & B)](#-hardware-topologies-processor-a--b)
9. [Citation & Team](#-citation--team)

---

## ⚡ The Idea in 60 Seconds

The 0/1 Knapsack problem is an archetype of NP-hard combinatorial optimization: pack a subset of items to maximize total profit without exceeding a strict capacity constraint $W$.

1. **Knapsack $\rightarrow$ QUBO:** Each item $i$ is represented by a binary qubit $x_i \in \{0, 1\}$. The cost objective is formulated as:
   $$\text{Cost}(x) = - \sum_i v_i x_i + P(x)$$
   where $P(x)$ penalizes violating the maximum weight limit $\sum_i w_i x_i \le W$.
2. **QUBO $\rightarrow$ Ising Hamiltonian:** By mapping binary variables to Pauli-$Z$ operators via $x_i = \frac{I - Z_i}{2}$, the cost problem translates directly into an Ising Hamiltonian $H_C = \sum_i h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j$.
3. **QAOA Execution:** Beginning in a uniform superposition $|+\rangle^{\otimes n}$, the state evolves through $p$ alternating layers:
   $$|\psi(\boldsymbol{\gamma}, \boldsymbol{\beta})\rangle = \prod_{l=1}^p e^{-i \beta_l H_M} e^{-i \gamma_l H_C} |+\rangle^{\otimes n}$$
   A classical optimizer (COBYLA) tunes the $2p$ parameters to steer quantum amplitudes into optimal, legal packings.
4. **Hardware Reality:** The knapsack constraint induces an all-to-all connectivity requirement (every item couples to every other item). On physical quantum hardware with sparse connectivity graphs, the transpiler must insert SWAP gates, inflating CX gate counts and subjecting the circuit to two-qubit gate noise. **How you design and wire the quantum processor's coupling map determines computational survival.**

**Benchmark Instance (Hardcoded from Phase 1 Guide):**
- Values: `[10, 4, 7, 5, 8]`
- Weights: `[5, 3, 4, 2, 6]`
- Capacity: $W = 15$
- **Brute-Force Optimal Solution:** Items $\{0, 1, 2, 3\}$ $\rightarrow$ **Total Value = 26**, **Total Weight = 14**.

---

## 🔬 What We Added Beyond the Brief

| Novel Methodology | Technical Description | Real-World Impact |
|---|---|---|
| **Unbalanced Penalization** *(Zero Slack Qubits)* | Replaced textbook slack variable expansions (which require $5+4 = 9$ qubits) with an asymmetric penalty: $\mathcal{P}(x) = \lambda_1 g(x) + \lambda_2 g(x)^2$, where $g(x) = \sum w_i x_i - W$. | Fits within 5 qubits (runs on Processor A). Yields **$3\times$ to $5\times$ fewer CX gates** and **$7\times$ better probability than random guessing**. |
| **Classical Penalty Calibration** | Systematic grid-search across $\lambda_1, \lambda_2$ enforcing that the Hamiltonian ground state is the exact knapsack optimum while maximizing the spectral gap $\Delta E = E_1 - E_0$. | Eliminates empirical guesswork; guarantees mathematical alignment between quantum energy minimum and knapsack optimality. |
| **Problem-Aware Coupling Maps** | Custom **Bow-Tie** topology for Processor A (6 edges) and **Wheel** topology for Processor B (16 edges) engineered around central routing hubs. | **$-65\%$ SWAP gates** and **$-36\%$ CX gates** compared to standard linear topologies. |
| **Multi-Seed Routing Robustness** | Evaluated transpilation across 20 distinct random seeds (reporting mean $\pm$ std dev) alongside official seed 42. | Defends against seed-selection bias and ensures reproducible hardware metrics. |
| **INTERP Warm Starts + CVaR** | Layer interpolation heuristic for $p \ge 2$ coupled with Conditional Value-at-Risk ($\alpha = 0.25$) expectation calculation. | Focuses optimizer updates on the lowest 25% energy quantile, boosting $P(\text{opt})$ from $0.217 \rightarrow 0.250$. |
| **Guaranteed-Feasible Decoder** | Post-measurement repair routine that greedy-filters infeasible bitstrings into guaranteed-legal packings. | Zero invalid solutions returned to end users. |

---

## 📊 Key Benchmark Results

Evaluated at QAOA depth $p=2$, under the official thermal relaxation and depolarizing noise model ($e_{1q} = 0.1\%$, $e_{2q} = 0.5\%$, readout $= 1.0\%$, optimization level 1, seed 42, 4096 shots):

| Processor Topology | Qubits | Transpiled Depth | CX Gates | Transpiler SWAPs | Est. Success Prob. | Noisy $P(\text{opt})$ | Hellinger Fidelity |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **A Linear** *(Reference)* | 5 | 112 | 81 | 15 | 0.58 | 0.170 | 0.955 |
| **A Bow-Tie ★** *(Ours)* | 5 | **95** | **52** | **4** | **0.67** | **0.183** | **0.967** |
| **B Heavy-Hex** *(Reference)* | 9 (Slack) | 250 | 244 | 34 | 0.22 | 0.027 | 0.878 |
| **B Wheel ★** *(Ours)* | 9 (Slack) | 289 | **168** | **8** | **0.33** | 0.026 | **0.909** |

### Critical Findings:
1. **Connectivity Beats Raw Qubit Count:** Processor B possesses 9 physical qubits, but the 5-qubit unbalanced formulation outperforms the 9-qubit slack formulation by **$>6.5\times$** in sampled fidelity under noise.
2. **Bow-Tie Superiority:** Placing the heaviest constrained variables near the degree-4 central hub (`q2`) dropped transpiler SWAP insertions from 15 down to 4.
3. **Robustness:** QAOA sampled the true brute-force optimum (Value 26) on all processors across both ideal and noisy simulation.

---

## 🖥️ Interactive Web Platform & Studio

This repository includes a full-stack, cinematic cyber-quantum dashboard built with **FastAPI** (Python backend executing live Qiskit Aer simulations) and **React 19 + TypeScript + Vite**.

```
  ┌─────────────────────────────────────────────────────────────┐
  │                   QUANTUM KNAPSACK STUDIO                   │
  ├─────────────────────────────────────────────────────────────┤
  │  [Hero Overview]   [Knapsack Studio]   [Hardware Topology]   │
  │  [Benchmark Lab]   [Research Insights] [Terminal Guide]     │
  └─────────────────────────────────────────────────────────────┘
```

### Visual & Interactive Highlights:
- **Live Knapsack Studio:** Modify items, weights, and knapsack capacity interactively; choose between Unbalanced vs Slack formulations and trigger live QAOA execution with real-time HUD sequencing.
- **3D Interactive Bloch Sphere:** Real-time 3D projected spherical coordinate visualizer allowing mouse drag-to-rotate interaction, tracking precessing quantum state vector $|\psi\rangle$.
- **2D Energy Landscape Map:** Animated contour valley map $E(\gamma, \beta)$ illustrating the classical COBYLA optimizer trajectory descending into the global minimum.
- **Hardware Coupling Topology Explorer:** Real-time SVG coupling graphs with traveling photon pulses along active edges and central hub resonance halos.
- **Quantum Circuit Conveyor Belt:** Visual 5-wire gate conveyor with interactive "Pulse Gate Sequence" traveling wave beam.
- **Entropy & Noise Simulator:** Interactive slider ($0\times$ to $8\times$) displaying live quantum decoherence, fidelity degradation, and wave-function collapse.
- **Terminal CLI Guide:** Built-in interactive cheatsheet with OS toggles (macOS/Linux vs Windows) and 1-click command copying.

---

## 🚀 Quickstart & Reproduction Guide

### Prerequisites
- Python 3.10 – 3.14
- (Optional for frontend development) Node.js 18+

```bash
git clone https://github.com/VaatsavKrishnaPolisetty/Combinatorial-0-1-Knapsack-Problem.git
cd Combinatorial-0-1-Knapsack-Problem
pip install -r requirements.txt
```

---

### Option 1: Interactive Web Platform (Recommended)

Launch the unified FastAPI server which serves both the live quantum calculation API and the pre-built web dashboard:

```bash
python server.py
```
Open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

*(If you want to modify the React frontend source code, run `cd frontend && npm install && npm run dev` to launch the Vite hot-reloading dev server).*

---

### Option 2: Terminal / CLI Solver

Solve any arbitrary knapsack problem instance directly from the command line using `solve.py`:

```bash
# Run the official benchmark instance
python solve.py

# Or specify custom items and capacity:
python solve.py --values 10 4 7 5 8 --weights 5 3 4 2 6 --capacity 15 --p 2 --shots 4096
```

**Sample Output:**
```
============================================================
PS-O3 · Quantum 0/1 Knapsack Solver (QAOA)
============================================================
Items: 5 | Capacity: 15
Values:  [10, 4, 7, 5, 8]
Weights: [5, 3, 4, 2, 6]

Brute-force optimum:
  Items: [0, 1, 2, 3] (Bitstring: 11110)
  Total Value: 26 | Total Weight: 14

QAOA Result (Unbalanced, p=2):
  Optimal Angles: gamma=[0.384, 0.712], beta=[0.518, 0.291]
  Top Sample: 11110 (P = 0.2173) -> Items: [0, 1, 2, 3] (Feasible: True)
  Match: 100.0% Optimal
============================================================
```

---

### Option 3: End-to-End Jupyter Research Notebook

Execute the comprehensive research notebook to regenerate all experimental data, publication figures, and LaTeX tables:

```bash
jupyter nbconvert --to notebook --execute --inplace main.ipynb
```
*Execution takes ~75 seconds and automatically populates `results/tables/` and `results/figures/`.*

---

## 📁 Repository Structure

```
.
├── README.md                      # Comprehensive project documentation
├── report.md                      # Academic project report & judging breakdown
├── requirements.txt               # Python dependencies (Qiskit 2.5, Aer, FastAPI, etc.)
├── server.py                      # FastAPI web server & live quantum solver endpoints
├── solve.py                       # Standalone CLI knapsack solver
├── main.ipynb                     # Executed end-to-end Jupyter experiment notebook
│
├── src/                           # Modular quantum algorithmic pipeline
│   ├── problem.py                 # Knapsack, QUBO formulation, penalty calibration, Ising
│   ├── qaoa.py                    # QAOA variational ansatz, statevector training, CVaR, INTERP
│   ├── processors.py              # Custom topologies (A Bow-tie, B Wheel, references), noise models
│   ├── routing.py                 # Transpilation, SWAP counting, multi-seed robustness
│   ├── metrics.py                 # Depth, CX, SWAP, ESP, Hellinger fidelity, P(optimal)
│   └── visualization.py           # Coupling maps, energy landscapes, probability histograms
│
├── processors/                    # Exported hardware coupling specifications
│   ├── processor_A.json           # Processor A (Bow-Tie, 5 qubits, 6 edges)
│   └── processor_B.json           # Processor B (Wheel, 9 qubits, 16 edges)
│
├── frontend/                      # Cyber-Quantum Web Dashboard (React 19 + TypeScript + Vite)
│   ├── src/                       # React components, Bloch sphere, Energy landscape, Topology
│   ├── dist/                      # Turnkey pre-compiled static assets (served by server.py)
│   ├── package.json               # Node packages
│   └── vite.config.ts             # Vite build configuration
│
├── results/                       # Empirical research outputs
│   ├── tables/                    # CSV & LaTeX benchmark comparison tables
│   └── figures/                   # High-resolution SVG & PNG visualizations
│
└── assets/                        # Design media and visual documentation
```

---

## 📐 Mathematical Formulation

### 1. Unbalanced Penalty Without Slack Qubits
Given item values $v \in \mathbb{R}^n$, weights $w \in \mathbb{R}^n$, and capacity $W$:
$$\min_{x \in \{0,1\}^n} \left( -\sum_{i=1}^n v_i x_i + \lambda_1 g(x) + \lambda_2 g(x)^2 \right)$$
where constraint violation is:
$$g(x) = \sum_{i=1}^n w_i x_i - W$$
The quadratic term penalizes excessive weight, while the linear term steepens the slope for overweight states and rewards packing close to capacity.

### 2. Penalty Calibration
Parameters $\lambda_1, \lambda_2$ are tuned by minimizing:
$$\mathcal{L}(\lambda_1, \lambda_2) = \mathbb{I}(x^* \ne x_{\text{GS}}) \cdot 10^4 - \Delta E$$
where $x^*$ is the brute-force optimum, $x_{\text{GS}}$ is the ground state of $H_C$, and $\Delta E = E_1 - E_0$ is the spectral gap between the ground state and the first excited state.

---

## 🏛️ Hardware Topologies (Processor A & B)

```
       Processor A (Bow-Tie, 5q)                   Processor B (Wheel, 9q)

             q0 ──┐     ┌── q3                           q1 ─── q2 ─── q3
                  │     │                                │  \   │   /  │
                  q2 (Hub)                               q8 ── q0 ──── q4
                  │     │                                │  / (Hub) \  │
             q1 ──┘     └── q4                           q7 ─── q6 ─── q5
```

- **Processor A (Bow-Tie):** Degree-4 central hub `q2` with two symmetric triangles `(q0, q1, q2)` and `(q2, q3, q4)`. Maximizes bipartite cross-talk efficiency for 5 items.
- **Processor B (Wheel):** Central hub `q0` connected to an 8-qubit outer ring. Ensures that any variable pair can communicate in $\le 2$ hops through the hub, minimizing SWAP overhead for slack-qubit circuits.

---

## 🔒 Security & Privacy
- Sensitive files, local environment variables (`.env`), and personal credentials are fully excluded via `.gitignore`.
- All Qiskit simulations run locally on `qiskit-aer` without requiring external cloud tokens or IBM Quantum API keys.

---

## 👨‍💻 Author & Acknowledgements
- **Author:** P.L.K. Vaatsav Krishna ([@VaatsavKrishnaPolisetty](https://github.com/VaatsavKrishnaPolisetty))
- **Event:** Qiskit Fall Fest 2026, SRM University-AP
- Built with [Qiskit](https://qiskit.org), [FastAPI](https://fastapi.tiangolo.com), [React](https://react.dev), and [Lucide Icons](https://lucide.dev).
