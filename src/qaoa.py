"""QAOA built from basic Qiskit gates (H, RZ, RZZ, RX) + exact statevector training."""
import numpy as np
from scipy.optimize import minimize
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import Statevector


class QAOA:
    def __init__(self, qubo, h, J, p=1):
        self.q, self.h, self.J, self.p = qubo, h, J, p
        self.n = qubo.n
        self.cost = qubo.cost_vector()
        # normalise angles so gamma lives on a comparable scale for every instance
        self.scale = max(np.abs(h).max(), max(abs(v) for v in J.values()))
        self.gam = ParameterVector("γ", p)
        self.bet = ParameterVector("β", p)
        self.circuit = self._build()

    def _build(self, measure=False):
        n = self.n
        qc = QuantumCircuit(n, name=f"QAOA_p{self.p}")
        qc.h(range(n))
        for k in range(self.p):
            for (i, j), c in self.J.items():
                qc.rzz(2 * self.gam[k] * c / self.scale, i, j)
            for i in range(n):
                if abs(self.h[i]) > 1e-12:
                    qc.rz(2 * self.gam[k] * self.h[i] / self.scale, i)
            qc.rx(2 * self.bet[k], range(n))
        return qc

    def bound(self, params, measure=True):
        qc = self.circuit.assign_parameters(
            dict(zip(list(self.gam) + list(self.bet), params)))
        if measure:
            qc.measure_all()
        return qc

    def probs(self, params):
        return Statevector(self.bound(params, measure=False)).probabilities()

    def expectation(self, params, alpha=1.0):
        """Mean cost (alpha=1) or CVaR_alpha of the cost distribution."""
        pr = self.probs(params)
        if alpha >= 1:
            return float(pr @ self.cost)
        o = np.argsort(self.cost)
        c, w = self.cost[o], pr[o]
        cum, tot, acc = np.cumsum(w), 0.0, 0.0
        for ci, wi, cu in zip(c, w, cum):
            take = min(wi, alpha - acc)
            if take <= 0:
                break
            tot += take * ci
            acc += take
        return tot / alpha

    def initial_ramp(self, delta=0.75):
        """Linear-ramp (annealing-inspired) start: gamma up, beta down."""
        t = (np.arange(self.p) + 0.5) / self.p
        return np.concatenate([delta * t, delta * (1 - t)])

    def train(self, alpha=1.0, n_random=4, seed=42, maxiter=400, x0=None, extra_starts=()):
        rng = np.random.default_rng(seed)
        starts = [self.initial_ramp()] if x0 is None else [np.asarray(x0)]
        starts += [np.asarray(e) for e in extra_starts]
        starts += [rng.uniform(0, np.pi / 2, 2 * self.p) for _ in range(n_random)]
        best, trace_best = None, None
        for s in starts:
            trace = []
            f = lambda x: (trace.append(self.expectation(x, alpha)) or trace[-1])
            r = minimize(f, s, method="COBYLA", options={"maxiter": maxiter, "rhobeg": 0.3})
            if best is None or r.fun < best.fun:
                best, trace_best = r, trace
        return best.x, best.fun, trace_best

    def landscape(self, g_max=1.6, b_max=np.pi / 2, res=40):
        """p=1 energy surface <C>(gamma, beta)."""
        assert self.p == 1
        gs, bs = np.linspace(0, g_max, res), np.linspace(0, b_max, res)
        Z = np.array([[self.expectation([g, b]) for g in gs] for b in bs])
        return gs, bs, Z


def interp_params(prev, p_new):
    """INTERP warm start (Zhou et al. 2020): stretch optimal p-1 angles to p layers."""
    prev = np.asarray(prev); k = len(prev) // 2
    g, b = prev[:k], prev[k:]
    def stretch(a):
        a = np.concatenate([[a[0]], a, [a[-1]]]) if k == 1 else a
        return np.interp(np.linspace(0, 1, p_new), np.linspace(0, 1, len(a)), a)
    return np.concatenate([stretch(g), stretch(b)])
