"""Processor A / B models: coupling graphs, basis gates and the synthetic noise model."""
import json, os
import networkx as nx
from qiskit.transpiler import CouplingMap
from qiskit_aer.noise import NoiseModel, depolarizing_error, ReadoutError

BASIS = ["rz", "sx", "x", "cx"]
NOISE = {"p1": 0.001, "p2": 0.005, "readout": 0.01}   # guide: 0.1% / 0.5% / 1.0%
TRANSPILE = {"optimization_level": 1, "seed": 42, "shots": 4096}

# ---- topology library ---------------------------------------------------------
# A (5 qubits)
A_LINEAR = [(0, 1), (1, 2), (2, 3), (3, 4)]                                  # guide reference 1
A_TREE = [(0, 1), (1, 2), (1, 3), (3, 4)]                                    # guide reference 2
A_RING = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0)]                            # ours (alt): ring, +1 edge
A_BOWTIE = [(0, 1), (0, 2), (1, 2), (2, 3), (2, 4), (3, 4)]                  # OURS: 2 triangles sharing a hub
# B (9 qubits)
B_HEAVYHEX = [(0, 1), (1, 2), (1, 6), (2, 3), (2, 6), (2, 5), (3, 4), (4, 5), (5, 6), (6, 7), (6, 8), (8, 0)]  # guide reference
B_GRID = [(0, 1), (1, 2), (3, 4), (4, 5), (6, 7), (7, 8), (0, 3), (3, 6), (1, 4), (4, 7), (2, 5), (5, 8)]      # ours (alt): 3x3 grid, same 12 edges
B_WHEEL = [(i, (i + 1) % 8) for i in range(8)] + [(8, i) for i in range(8)]                                   # OURS: ring of 8 + hub qubit 8 (16 edges)

TOPOLOGIES = {
    "A_linear (ref)": (5, A_LINEAR),
    "A_tree (ref)": (5, A_TREE),
    "A_ring (ours-alt)": (5, A_RING),
    "A_bowtie (ours)": (5, A_BOWTIE),
    "B_heavyhex (ref)": (9, B_HEAVYHEX),
    "B_grid (ours-alt)": (9, B_GRID),
    "B_wheel (ours)": (9, B_WHEEL),
}
# the two official processors used for headline numbers
PROCESSOR_A, PROCESSOR_B = "A_bowtie (ours)", "B_wheel (ours)"

RATIONALE = {
    "A_bowtie (ours)": "The QUBO penalty (w.x)^2 couples every pair of items (K5). Two triangles sharing a degree-4 hub make "
                       "6 of 10 pairs directly adjacent with only 6 edges (diameter 2 vs 4 for a chain).",
    "B_wheel (ours)": "The 9-qubit slack encoding is K9-dense. A ring of 8 plus a hub qubit wired to every ring node has "
                      "diameter 2; it spends 4 extra edges over heavy-hex (16 vs 12) to cut CX count ~30 %. "
                      "Trade-off: the hub serialises gates, so circuit depth rises.",
}


def coupling_graph(name):
    n, edges = TOPOLOGIES[name]
    g = nx.Graph(); g.add_nodes_from(range(n)); g.add_edges_from(edges)
    return g


def coupling_map(name):
    n, edges = TOPOLOGIES[name]
    return CouplingMap([list(e) + [] for e in edges] + [[b, a] for a, b in edges])


def noise_model(p1=None, p2=None, ro=None):
    p1 = NOISE["p1"] if p1 is None else p1
    p2 = NOISE["p2"] if p2 is None else p2
    ro = NOISE["readout"] if ro is None else ro
    nm = NoiseModel(basis_gates=BASIS)
    nm.add_all_qubit_quantum_error(depolarizing_error(p1, 1), ["rz", "sx", "x"])
    nm.add_all_qubit_quantum_error(depolarizing_error(p2, 2), ["cx"])
    nm.add_all_qubit_readout_error(ReadoutError([[1 - ro, ro], [ro, 1 - ro]]))
    return nm


def export_json(outdir="processors"):
    os.makedirs(outdir, exist_ok=True)
    for tag, name in (("A", PROCESSOR_A), ("B", PROCESSOR_B)):
        n, edges = TOPOLOGIES[name]
        g = coupling_graph(name)
        cfg = {"name": f"Processor {tag} ({name})", "num_qubits": n,
               "coupling_map": [list(e) for e in edges], "basis_gates": BASIS,
               "diameter": nx.diameter(g), "avg_degree": round(2 * len(edges) / n, 2),
               "noise": {"1q_depolarizing": NOISE["p1"], "cx_depolarizing": NOISE["p2"], "readout": NOISE["readout"]},
               "transpile": TRANSPILE, "rationale": RATIONALE[name],
               "reference_baselines": [k for k in TOPOLOGIES if k.startswith(tag)]}
        json.dump(cfg, open(f"{outdir}/processor_{tag}.json", "w"), indent=2)
