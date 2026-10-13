"""Problem formulation: 0/1 Knapsack -> QUBO -> Ising cost Hamiltonian.

Two encodings of the capacity constraint  sum_i w_i x_i <= W :

  * "slack"      : binary slack bits turn <= into =, penalty A (w.x + s - W)^2
                   -> n_items + ceil(log2(W+1)) qubits  (5 + 4 = 9 for this instance)
  * "unbalanced" : NO slack qubits. Penalty  l1*g + l2*g^2  with g = w.x - W
                   (g <= 0 feasible). Linear term rewards slack, quadratic term
                   punishes overflow -> only n_items qubits (5), fits Processor A.
"""
from dataclasses import dataclass, field
from itertools import product
import numpy as np
from qiskit.quantum_info import SparsePauliOp

# ---- hardcoded instance from the QFF Phase-1 guide (PS-O3) -------------------
VALUES = [10, 4, 7, 5, 8]
WEIGHTS = [5, 3, 4, 2, 6]
CAPACITY = 15


@dataclass
class Knapsack:
    values: list = field(default_factory=lambda: list(VALUES))
    weights: list = field(default_factory=lambda: list(WEIGHTS))
    capacity: int = CAPACITY

    @property
    def n(self):
        return len(self.values)

    def evaluate(self, x):
        x = np.asarray(x)
        return int(np.dot(self.values, x)), int(np.dot(self.weights, x))

    def is_feasible(self, x):
        return self.evaluate(x)[1] <= self.capacity

    def brute_force(self):
        """Classical reference: enumerate all 2^n subsets."""
        rows = []
        for x in product([0, 1], repeat=self.n):
            v, w = self.evaluate(x)
            rows.append((x, v, w, w <= self.capacity))
        feas = [r for r in rows if r[3]]
        best = max(feas, key=lambda r: r[1])
        return {"best_x": best[0], "best_value": best[1], "best_weight": best[2],
                "n_feasible": len(feas), "n_total": len(rows), "all": rows}

    def greedy_repair(self, x):
        """Practical post-processing: drop lowest value/weight items until feasible."""
        x = list(x)
        while not self.is_feasible(x):
            chosen = [i for i in range(self.n) if x[i]]
            drop = min(chosen, key=lambda i: self.values[i] / self.weights[i])
            x[drop] = 0
        return tuple(x)


# ---- QUBO container ----------------------------------------------------------
@dataclass
class QUBO:
    lin: np.ndarray      # coefficient of z_i
    quad: np.ndarray     # upper-triangular coefficient of z_i z_j (i<j)
    offset: float
    n_items: int
    kind: str

    @property
    def n(self):
        return len(self.lin)

    def cost_vector(self):
        """C(z) for every z in {0,1}^n; index bit i == z_i (Qiskit little-endian)."""
        n = self.n
        idx = np.arange(2 ** n)
        bits = ((idx[:, None] >> np.arange(n)) & 1).astype(float)
        return self.offset + bits @ self.lin + np.einsum("ki,ij,kj->k", bits, self.quad, bits)


def _square(a, b):
    """(a.z + b)^2 over binary z  ->  (lin, quad, offset)   (z^2 = z)."""
    a = np.asarray(a, float)
    n = len(a)
    lin = a ** 2 + 2 * b * a
    quad = np.triu(2 * np.outer(a, a), 1)
    return lin, quad, b ** 2


def build_qubo(p: Knapsack, kind="unbalanced", A=None, l1=None, l2=None):
    n = p.n
    v, w, W = np.array(p.values, float), np.array(p.weights, float), float(p.capacity)
    if kind == "slack":
        m = int(np.floor(np.log2(W))) + 1
        c = 2.0 ** np.arange(m)
        a = np.concatenate([w, c])
        lin, quad, off = _square(a, -W)
        lin, quad, off = A * lin, A * quad, A * off
        lin[:n] -= v
        return QUBO(lin, quad, off, n, "slack")
    if kind == "unbalanced":
        lin2, quad2, off2 = _square(w, -W)           # g^2
        lin = -v + l1 * w + l2 * lin2
        quad = l2 * quad2
        off = l1 * (-W) + l2 * off2
        return QUBO(lin, quad, off, n, "unbalanced")
    raise ValueError(kind)


def calibrate_penalty(p: Knapsack, kind):
    """Classical grid search for penalty weights. Picks the setting whose
    ground state is the TRUE optimum with the largest normalised spectral gap
    (a bigger gap = an easier landscape for QAOA)."""
    best_x = p.brute_force()["best_x"]
    best, best_score = None, -1
    grid = np.linspace(0.5, 12, 24) if kind == "slack" else None
    cands = ([dict(A=a) for a in grid] if kind == "slack" else
             [dict(l1=a, l2=b) for a in np.linspace(0, 8, 33) for b in np.linspace(0.05, 2.0, 40)])
    for kw in cands:
        q = build_qubo(p, kind, **kw)
        c = q.cost_vector()
        order = np.argsort(c)
        gs = int(order[0])
        z = [(gs >> i) & 1 for i in range(q.n)]
        if tuple(z[:p.n]) != tuple(best_x):
            continue
        # distinct x-assignments: gap to best state with different item vector
        gap = next(c[j] - c[gs] for j in order
                   if tuple(((int(j) >> i) & 1) for i in range(p.n)) != tuple(best_x))
        score = gap / (c.max() - c.min())
        if score > best_score:
            best, best_score = kw, score
    return best, best_score


# ---- QUBO -> Ising cost Hamiltonian -----------------------------------------
def qubo_to_ising(q: QUBO):
    """z = (1 - Z)/2.  Returns SparsePauliOp H (diagonal) with identical spectrum."""
    n = q.n
    h = np.zeros(n)
    J = {}
    const = q.offset
    for i in range(n):
        const += q.lin[i] / 2
        h[i] += -q.lin[i] / 2
        for j in range(i + 1, n):
            c = q.quad[i, j]
            if c == 0:
                continue
            const += c / 4
            h[i] += -c / 4
            h[j] += -c / 4
            J[(i, j)] = c / 4
    terms = [("Z", [i], h[i]) for i in range(n) if abs(h[i]) > 1e-12]
    terms += [("ZZ", [i, j], c) for (i, j), c in J.items()]
    H = SparsePauliOp.from_sparse_list(terms + [("I", [0], const)], num_qubits=n)
    return H.simplify(), h, J, const


def decode(q: QUBO, index_or_bits):
    """Bit string (z_0..z_{n-1}) -> item selection x (drops slack bits)."""
    if isinstance(index_or_bits, (int, np.integer)):
        bits = [(int(index_or_bits) >> i) & 1 for i in range(q.n)]
    else:
        bits = list(index_or_bits)
    return tuple(bits[:q.n_items])
