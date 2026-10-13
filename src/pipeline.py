"""End-to-end experiment: formulate -> train QAOA -> route on A/B -> noisy benchmark."""
import json, time
import numpy as np, pandas as pd
from .problem import Knapsack, build_qubo, calibrate_penalty, qubo_to_ising, decode
from .qaoa import QAOA, interp_params
from .processors import TOPOLOGIES, PROCESSOR_A, PROCESSOR_B, noise_model, NOISE, export_json
from .routing import route, run_noisy, run_ideal
from .metrics import circuit_metrics, counts_to_dist, quality, hellinger_fidelity, probs_to_dist


def formulate(problem):
    out = {}
    for kind in ("unbalanced", "slack"):
        kw, gap = calibrate_penalty(problem, kind)
        kw = {k: float(v) for k, v in kw.items()}
        q = build_qubo(problem, kind, **kw)
        H, h, J, const = qubo_to_ising(q)
        # sanity: Ising spectrum == QUBO cost vector
        diag = np.real(np.diag(H.to_matrix()))
        assert np.allclose(np.sort(diag), np.sort(q.cost_vector())), "Ising mapping mismatch"
        out[kind] = dict(q=q, H=H, h=h, J=J, penalty=kw, gap=gap)
    return out


def train_all(forms, pmax=3, seed=42):
    res = {}
    for kind, f in forms.items():
        for p in range(1, pmax + 1):
            qa = QAOA(f["q"], f["h"], f["J"], p)
            extra = [interp_params(res[(kind, p - 1)]["params"], p)] if p > 1 else []
            x, e, trace = qa.train(seed=seed, extra_starts=extra)
            res[(kind, p)] = dict(qaoa=qa, params=x, energy=e, trace=trace)
    return res


def ideal_quality(problem, forms, trained, opt):
    rows = []
    for (kind, p), t in trained.items():
        q = forms[kind]["q"]
        dist = probs_to_dist(t["qaoa"].probs(t["params"]), q.n)
        # marginalise slack bits -> item vector
        marg = {}
        for z, pr in dist.items(): marg[z[:problem.n]] = marg.get(z[:problem.n], 0) + pr
        e_min = q.cost_vector().min(); e_max = q.cost_vector().max()
        rows.append(dict(formulation=kind, p=p, qubits=q.n, **quality(marg, q, problem, opt["best_x"], opt["best_value"]),
                         energy=t["energy"], ar_energy=(e_max - t["energy"]) / (e_max - e_min)))
    return pd.DataFrame(rows)


def benchmark(problem, forms, trained, opt, topologies=None, ps=(1, 2, 3), nm=None, shots=4096):
    rows, store = [], {}
    topologies = topologies or list(TOPOLOGIES)
    for kind in ("unbalanced", "slack"):
        for p in ps:
            t = trained[(kind, p)]; qa = t["qaoa"]; q = forms[kind]["q"]
            logical = qa.bound(t["params"])
            ideal = probs_to_dist(qa.probs(t["params"]), q.n)
            for topo in topologies:
                nq = TOPOLOGIES[topo][0]
                row = dict(formulation=kind, p=p, processor=topo, logical_qubits=q.n)
                if q.n > nq:
                    row.update(fits=False); rows.append(row); continue
                routed, n_swap = route(logical, topo)
                m = circuit_metrics(logical, routed, n_swap)
                counts = run_noisy(routed, shots=shots, nm=nm)
                dist = counts_to_dist(counts, q.n)
                marg = {}
                for z, pr in dist.items(): marg[z[:problem.n]] = marg.get(z[:problem.n], 0) + pr
                row.update(fits=True, **m, **quality(marg, q, problem, opt["best_x"], opt["best_value"]),
                           hellinger=hellinger_fidelity(ideal, dist))
                rows.append(row); store[(kind, p, topo)] = counts
    return pd.DataFrame(rows), store


def noise_sweep(problem, forms, trained, opt, topos, kind="unbalanced", p=2, scales=(0, 0.5, 1, 2, 4, 8), shots=4096):
    t = trained[(kind, p)]; qa = t["qaoa"]; q = forms[kind]["q"]; logical = qa.bound(t["params"])
    ideal = probs_to_dist(qa.probs(t["params"]), q.n)
    rows = []
    for topo in topos:
        routed, _ = route(logical, topo)
        for s in scales:
            nm = noise_model(NOISE["p1"] * s, NOISE["p2"] * s, NOISE["readout"] * s) if s else None
            counts = run_noisy(routed, shots=shots, nm=nm) if s else run_ideal(routed, shots=shots)
            dist = counts_to_dist(counts, q.n); marg = {}
            for z, pr in dist.items(): marg[z[:problem.n]] = marg.get(z[:problem.n], 0) + pr
            rows.append(dict(processor=topo, formulation=kind, noise_scale=s, hellinger=hellinger_fidelity(ideal, dist), **quality(marg, q, problem, opt["best_x"], opt["best_value"])))
    return pd.DataFrame(rows)


def cvar_vs_mean(problem, forms, trained, opt, p=2, alpha=0.25):
    """Same ansatz, trained on CVaR_alpha instead of the mean energy."""
    f = forms["unbalanced"]; qa = trained[("unbalanced", p)]["qaoa"]
    out = []
    for name, a in (("mean energy", 1.0), (f"CVaR α={alpha}", alpha)):
        x, e, trace = qa.train(alpha=a, extra_starts=[trained[("unbalanced", p)]["params"]])
        dist = probs_to_dist(qa.probs(x), f["q"].n); 
        out.append(dict(objective=name, **quality(dist, f["q"], problem, opt["best_x"], opt["best_value"]), trace=trace))
    return out


def random_baseline(problem, opt):
    """Uniform random guessing over all 2^n item subsets (what 'no quantum' gets)."""
    dist = {tuple(x[0]): 1 / len(opt["all"]) for x in opt["all"]}
    return quality(dist, None, problem, opt["best_x"], opt["best_value"])
