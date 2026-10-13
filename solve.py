#!/usr/bin/env python
"""Quick CLI: solve ANY small 0/1 knapsack with the 5-qubit-style QAOA pipeline.

    python solve.py                                   # the hardcoded QFF instance
    python solve.py --values 6 5 8 9 --weights 2 3 6 7 --capacity 9 --p 2
"""
import argparse, numpy as np
from src.problem import Knapsack, build_qubo, calibrate_penalty, qubo_to_ising
from src.qaoa import QAOA

ap = argparse.ArgumentParser()
ap.add_argument("--values", type=int, nargs="+", default=[10, 4, 7, 5, 8])
ap.add_argument("--weights", type=int, nargs="+", default=[5, 3, 4, 2, 6])
ap.add_argument("--capacity", type=int, default=15)
ap.add_argument("--p", type=int, default=2, help="QAOA layers")
ap.add_argument("--cvar", type=float, default=1.0, help="CVaR alpha (1.0 = mean energy)")
a = ap.parse_args()

prob = Knapsack(a.values, a.weights, a.capacity)
assert prob.n <= 12, "statevector demo: keep n <= 12 items"
opt = prob.brute_force()
kw, _ = calibrate_penalty(prob, "unbalanced")
if kw is None:
    raise SystemExit("penalty calibration failed for this instance (try other values)")
q = build_qubo(prob, "unbalanced", **kw)
H, h, J, _ = qubo_to_ising(q)
qa = QAOA(q, h, J, a.p)
x, e, _ = qa.train(alpha=a.cvar)
pr = qa.probs(x)
rng = np.random.default_rng(42)
shots = rng.choice(len(pr), size=4096, p=pr / pr.sum())
cands = {}
for s in shots:
    xs = tuple((int(s) >> i) & 1 for i in range(prob.n))
    cands[xs] = cands.get(xs, 0) + 1
feas = [(prob.evaluate(xs)[0], xs) for xs in cands if prob.is_feasible(xs)]
v, best = max(feas)
print(f"qubits={q.n}  penalty={ {k: round(float(val), 3) for k, val in kw.items()} }  <C>={e:.3f}")
print(f"QAOA best feasible sample: {best}  value={v}  weight={prob.evaluate(best)[1]}/{a.capacity}  items={[i for i, b in enumerate(best) if b]}")
print(f"Brute-force optimum      : {opt['best_x']}  value={opt['best_value']}  -> {'MATCH' if v == opt['best_value'] else 'gap=' + str(opt['best_value'] - v)}")
