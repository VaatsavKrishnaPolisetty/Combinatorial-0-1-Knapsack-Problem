"""Zero-Noise Extrapolation (ZNE) Error Mitigation for QAOA Knapsack.
Implements unitary gate folding (CX -> CX CX^dagger CX) to systematically scale noise
and Richardson / polynomial extrapolation back to the zero-noise limit (lambda -> 0).
"""
import numpy as np
from typing import Dict, List, Tuple, Any
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error, ReadoutError

from src.problem import Knapsack, build_qubo, calibrate_penalty, qubo_to_ising
from src.qaoa import QAOA
from src.processors import TOPOLOGIES, noise_model


def fold_circuit_cx(circuit: QuantumCircuit, scale_factor: float) -> QuantumCircuit:
    """Folds two-qubit CX gates to scale effective depolarizing noise.
    Scale factor must be an odd integer (1, 3, 5, ...) or fractional via stochastic folding.
    For scale factor = 1: original circuit.
    For scale factor = 3: every CX -> CX + CX + CX (since CX^dagger = CX).
    For scale factor = 5: every CX -> CX + CX + CX + CX + CX.
    """
    scale = int(round(scale_factor))
    if scale <= 1:
        return circuit.copy()
    
    num_folds = (scale - 1) // 2  # Each fold adds 2 CX gates
    folded = circuit.copy_empty_like()
    
    for instruction in circuit.data:
        op = instruction.operation
        qubits = instruction.qubits
        clbits = instruction.clbits
        
        folded.append(op, qubits, clbits)
        if op.name == 'cx':
            for _ in range(num_folds):
                folded.append(op, qubits, clbits)
                folded.append(op, qubits, clbits)
                
    return folded


def run_zne_mitigation(
    values: List[int] = [10, 4, 7, 5, 8],
    weights: List[int] = [5, 3, 4, 2, 6],
    capacity: int = 15,
    p: int = 2,
    cvar_alpha: float = 1.0,
    noise_rates: Tuple[float, float, float] = (0.001, 0.005, 0.01),
    shots: int = 4096,
    scale_factors: List[float] = [1.0, 3.0, 5.0],
    seed: int = 42
) -> Dict[str, Any]:
    """Runs QAOA knapsack under official Aer noise model at scale factors [1, 3, 5]
    and computes Richardson / Linear zero-noise extrapolated expectation values.
    """
    prob = Knapsack(values, weights, capacity)
    opt = prob.brute_force()
    opt_bitstring = "".join(str(b) for b in opt["best_x"])
    
    kw, gap = calibrate_penalty(prob, "unbalanced")
    if kw is None:
        kw = {"lam1": 1.75, "lam2": 0.2}
    
    q = build_qubo(prob, "unbalanced", **kw)
    H, h, J, _ = qubo_to_ising(q)
    qa = QAOA(q, h, J, p)
    
    # Train angles on ideal statevector
    angles, ideal_energy, _ = qa.train(alpha=cvar_alpha, maxiter=80)
    ideal_probs = qa.probs(angles)
    
    # Ideal P(opt)
    opt_idx = int(opt_bitstring, 2)
    ideal_p_opt = float(ideal_probs[opt_idx]) if opt_idx < len(ideal_probs) else 0.0
    
    # Generate parameterized bound circuit with measurements
    circuit = qa.bound(angles)
    circuit.measure_all()
    
    # Transpile to Processor A Bow-Tie
    n_qubits, edges = TOPOLOGIES["A_bowtie (ours)"]
    coupling = [list(e) for e in edges] + [[v, u] for u, v in edges]
    transpiled_base = transpile(
        circuit,
        coupling_map=coupling,
        basis_gates=['rz', 'sx', 'x', 'cx'],
        optimization_level=1,
        seed_transpiler=seed
    )
    
    nm = noise_model(*noise_rates)
    sim = AerSimulator(noise_model=nm)
    
    scale_results = []
    
    for s_fac in scale_factors:
        folded_circ = fold_circuit_cx(transpiled_base, s_fac)
        
        job = sim.run(folded_circ, shots=shots, seed_simulator=seed)
        counts = job.result().get_counts()
        
        # Calculate noisy expectation energy & P(opt)
        noisy_p_opt = 0.0
        exp_energy = 0.0
        feasible_count = 0
        
        for bitstr, cnt in counts.items():
            prob_sample = cnt / shots
            clean_str = bitstr.replace(" ", "")
            # Take last n bits for problem qubits
            bits = tuple(int(clean_str[-1 - i]) for i in range(prob.n))
            val, wt = prob.evaluate(bits)
            if prob.is_feasible(bits):
                feasible_count += cnt
                # Energy contribution = -val
                energy_val = -val
            else:
                pen = kw.get('lam1', 1.75) * (wt - capacity) + kw.get('lam2', 0.2) * ((wt - capacity) ** 2)
                energy_val = -val + pen
                
            exp_energy += energy_val * prob_sample
            if "".join(str(b) for b in bits) == opt_bitstring:
                noisy_p_opt += prob_sample
                
        scale_results.append({
            "scale_factor": s_fac,
            "cx_count": folded_circ.count_ops().get("cx", 0),
            "circuit_depth": folded_circ.depth(),
            "expectation_energy": round(float(exp_energy), 3),
            "p_optimal": round(float(noisy_p_opt), 4),
            "p_feasible": round(float(feasible_count / shots), 4)
        })
        
    # Extrapolations back to scale_factor = 0.0
    lambdas = np.array([r["scale_factor"] for r in scale_results])
    energies = np.array([r["expectation_energy"] for r in scale_results])
    p_opts = np.array([r["p_optimal"] for r in scale_results])
    
    # 1. Linear Fit: y = a*x + b -> at x=0, y=b
    poly_e = np.polyfit(lambdas, energies, deg=1)
    linear_mitigated_energy = float(poly_e[1])
    
    poly_p = np.polyfit(lambdas, p_opts, deg=1)
    linear_mitigated_p_opt = float(poly_p[1])
    
    # 2. Richardson Extrapolation with 2 points (lambda=1 and lambda=3)
    # y(0) = (3*y(1) - y(3)) / 2
    if len(scale_results) >= 2:
        richardson_energy = float((3.0 * energies[0] - energies[1]) / 2.0)
        richardson_p_opt = float((3.0 * p_opts[0] - p_opts[1]) / 2.0)
    else:
        richardson_energy = linear_mitigated_energy
        richardson_p_opt = linear_mitigated_p_opt
        
    return {
        "ideal_energy": round(float(ideal_energy), 3),
        "ideal_p_opt": round(float(ideal_p_opt), 4),
        "unmitigated_noisy_energy": scale_results[0]["expectation_energy"],
        "unmitigated_noisy_p_opt": scale_results[0]["p_optimal"],
        "linear_mitigated_energy": round(linear_mitigated_energy, 3),
        "linear_mitigated_p_opt": round(max(0.0, linear_mitigated_p_opt), 4),
        "richardson_energy": round(richardson_energy, 3),
        "richardson_p_opt": round(max(0.0, richardson_p_opt), 4),
        "energy_recovery_pct": round(min(100.0, max(0.0, (scale_results[0]["expectation_energy"] - linear_mitigated_energy) / (scale_results[0]["expectation_energy"] - ideal_energy) * 100)), 1) if abs(scale_results[0]["expectation_energy"] - ideal_energy) > 1e-4 else 100.0,
        "scale_points": scale_results,
        "polynomial_coeffs": [round(float(c), 4) for c in poly_e],
        "processor": "Processor A (Bow-Tie ★)",
        "noise_model": f"depol_1q={noise_rates[0]*100}%, cx_depol={noise_rates[1]*100}%, ro={noise_rates[2]*100}%"
    }
