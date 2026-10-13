# Report — PS-O3 0/1 Knapsack, QAOA, Processor A vs B

## 1. Method
Instance `v=[10,4,7,5,8]`, `w=[5,3,4,2,6]`, `W=15`. Brute force over 32 subsets: optimum `11110` (value 26, weight 14); 28/32 subsets are feasible (the constraint is fairly loose — only 4 subsets overflow).
Two QUBOs: **slack** (`A(w·x+s−W)²`, 9 qubits, A=2) and **unbalanced** (`λ₁g+λ₂g²`, 5 qubits, λ₁=1.75, λ₂=0.2). Penalties were calibrated classically (ground state = true optimum, largest normalised gap) and the Ising mapping was asserted equal to the QUBO cost table. QAOA (p=1..3) uses `H, RZZ, RZ, RX`, trained with exact statevector expectation + COBYLA (linear-ramp, INTERP and random starts). Noisy evaluation: AerSimulator, depolarising 0.1 % (1q) / 0.5 % (CX), 1 % readout, basis `{rz,sx,x,cx}`, opt-level 1, seed 42, 4096 shots. Angles are trained ideally then executed noisily on every processor so differences isolate routing/noise.

## 2. Processor design (Phase-1 "Step 1")
| Map | Edges | Diameter | Rationale |
|---|---|---|---|
| A linear / tree (guide refs) | 4 | 4 / 3 | baselines |
| A ring (alt) | 5 | 2 | cheap upgrade |
| **A bow-tie ★** | 6 | 2 | two triangles share a hub: 6/10 qubit pairs directly adjacent for an all-to-all (K5) interaction graph |
| B heavy-hex (guide ref) | 12 | 4 | baseline |
| B 3×3 grid (alt) | 12 | 4 | same edge budget as heavy-hex |
| **B wheel ★** | 16 | 2 | ring of 8 + hub: shortest paths for the K9-like slack interaction graph |

## 3. Findings
1. **Encoding beats hardware.** The 5-qubit unbalanced encoding uses 52 CX at p=2 on A; the 9-qubit slack encoding needs 168–246 CX on B. Slack also cannot be placed on Processor A at all (9 > 5 qubits).
2. **Connectivity, not qubit count.** The 5-qubit circuit gives the *same* CX/SWAPs on 9-qubit heavy-hex (52/4) as on our 5-qubit bow-tie — extra qubits add nothing; extra *edges* do. A linear 5-chain needs 81 CX (15 SWAPs).
3. **Edge budget trade-off.** Bow-tie: +2 edges over linear → −36 % CX. Wheel: +4 edges over heavy-hex → −29 % CX (20-seed mean 240→170 ± 3), but depth 242→285 because the hub is a serial bottleneck. Under the guide's gate-error-only noise model, CX dominates, so wheel wins on estimated success probability (0.33 vs 0.22) and output fidelity (0.909 vs 0.878); with strong decoherence (T1/T2, not modelled) the depth increase could erase this.
4. **Noise sweep** (noise × 0…8): the co-designed maps keep higher fidelity to the ideal distribution at every noise level ≥1× (e.g. at 4×: 0.818 vs 0.750 on A; 0.738 vs 0.701 on B).
5. **Quality.** Ideal QAOA p=2: P(optimal)=0.217 (random 0.031); p=3 only 0.226 while CX grows 52→84, so p=2 is the sweet spot on this hardware. CVaR(0.25) raises P(optimal) to 0.250. Noisy P(optimal) 0.183 (A bow-tie). The best *feasible* sample is the true optimum 26 on every processor.

## 4. Limitations (be upfront with judges)
* QAOA samples are infeasible ~26–29 % of the time (random guessing: 12.5 %); the decoder (feasibility filter + greedy repair) is what guarantees a valid answer.
* Slack encoding P(optimal) ≈ random level (0.025–0.034) for every penalty tried (A∈{1,2,4,8}, p≤3): 512 states with one zero-penalty slack configuration per feasible subset dilute amplitude. Deeper p, a better mixer or constraint-preserving ansatz might help; not tested.
* Training uses exact statevectors (noise-free); shot-based/noisy training is future work. Noisy numbers come from one 4096-shot run (seed 42); routing statistics use 20 seeds.
* Tiny 5-item instance; penalties are calibrated by brute force, which does not scale — at scale use unbalanced penalties from the literature plus tuning.
* Noise model has no T1/T2 or crosstalk; real hardware may rank topologies differently.

## 5. Future work
Constraint-preserving mixers (Dicke/XY), noise-aware training, warm-starting from the greedy solution, zero-noise extrapolation, scaling to 8–12 items.
