"""Transpilation / layout routing onto a processor and noisy execution."""
from qiskit import transpile
from qiskit_aer import AerSimulator
from .processors import BASIS, TRANSPILE, coupling_map, noise_model

SWAP_BASIS = BASIS + ["swap"]


def route(circ, topo):
    """Returns (final circuit in {rz,sx,x,cx}, number of SWAPs inserted by the router)."""
    cm = coupling_map(topo)
    kw = dict(coupling_map=cm, optimization_level=TRANSPILE["optimization_level"],
              seed_transpiler=TRANSPILE["seed"])
    # pass 1: keep SWAPs as explicit gates so the routing overhead can be counted
    with_swaps = transpile(circ, basis_gates=SWAP_BASIS, **kw)
    n_swap = with_swaps.count_ops().get("swap", 0)
    # pass 2: official basis
    final = transpile(circ, basis_gates=BASIS, **kw)
    return final, n_swap


def run_noisy(tcirc, shots=None, seed=42, nm=None):
    sim = AerSimulator(noise_model=nm or noise_model(), seed_simulator=seed)
    return sim.run(tcirc, shots=shots or TRANSPILE["shots"]).result().get_counts()


def run_ideal(tcirc, shots=None, seed=42):
    return AerSimulator(seed_simulator=seed).run(tcirc, shots=shots or TRANSPILE["shots"]).result().get_counts()


def routing_robustness(logical, topos, seeds=range(20)):
    """Routing is stochastic: re-transpile with many seeds and report mean ± std."""
    import numpy as np, pandas as pd
    from qiskit import transpile
    rows = []
    for topo in topos:
        cm = coupling_map(topo)
        if cm.size() < logical.num_qubits: continue
        cx, dp, sw = [], [], []
        for s in seeds:
            kw = dict(coupling_map=cm, optimization_level=1, seed_transpiler=s)
            a = transpile(logical, basis_gates=BASIS, **kw)
            b = transpile(logical, basis_gates=SWAP_BASIS, **kw)
            cx.append(a.count_ops().get("cx", 0)); dp.append(a.depth()); sw.append(b.count_ops().get("swap", 0))
        rows.append(dict(processor=topo, cx_mean=np.mean(cx), cx_std=np.std(cx), depth_mean=np.mean(dp), depth_std=np.std(dp),
                         swaps_mean=np.mean(sw), swaps_std=np.std(sw), n_seeds=len(list(seeds))))
    return pd.DataFrame(rows)
