"""Circuit metrics + solution-quality metrics."""
import numpy as np
from .processors import NOISE


def circuit_metrics(logical, routed, n_swap):
    ops = routed.count_ops()
    n_cx = ops.get("cx", 0)
    n_1q = sum(v for k, v in ops.items() if k in ("rz", "sx", "x"))
    n_meas = ops.get("measure", 0)
    logical_cx = 2 * logical.count_ops().get("rzz", 0)
    esp = ((1 - NOISE["p2"]) ** n_cx) * ((1 - NOISE["p1"]) ** n_1q) * ((1 - NOISE["readout"]) ** n_meas)
    return {"depth": routed.depth(), "cx_depth": routed.depth(lambda i: i.operation.num_qubits == 2),
            "cx_count": n_cx, "logical_cx": logical_cx, "swaps": n_swap,
            "cx_overhead": n_cx - logical_cx, "1q_gates": n_1q, "esp": esp}


def counts_to_dist(counts, n):
    """Aer key 'b_{n-1}..b_0' -> dict {(z_0..z_{n-1}): prob}."""
    tot = sum(counts.values())
    return {tuple(int(c) for c in reversed(k.replace(" ", ""))): v / tot for k, v in counts.items()}


def quality(dist, q, problem, opt_x, opt_val):
    """dist over full bitstrings -> item-level metrics."""
    p_opt = p_feas = ev = 0.0
    best = (-1, None)
    for z, pr in dist.items():
        x = z[:problem.n]
        v, w = problem.evaluate(x)
        if w <= problem.capacity:
            p_feas += pr; ev += pr * v
            if v > best[0]: best = (v, x)
            if tuple(x) == tuple(opt_x): p_opt += pr
    return {"P(optimal)": p_opt, "P(feasible)": p_feas,
            "E[value | feasible]": ev / p_feas if p_feas else 0.0,
            "best_sampled_value": best[0], "approx_ratio": best[0] / opt_val if best[0] > 0 else 0.0}


def hellinger_fidelity(p, q):
    keys = set(p) | set(q)
    return float(sum(np.sqrt(p.get(k, 0) * q.get(k, 0)) for k in keys) ** 2)


def probs_to_dist(pr, n, cutoff=1e-9):
    return {tuple((i >> b) & 1 for b in range(n)): float(v) for i, v in enumerate(pr) if v > cutoff}
