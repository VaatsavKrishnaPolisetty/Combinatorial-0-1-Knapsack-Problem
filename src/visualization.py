"""Plots: coupling maps, convergence, landscape, histograms, architecture comparison."""
import numpy as np, networkx as nx
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from .processors import coupling_graph, TOPOLOGIES

C = {"A": "#2a6fdb", "B": "#e8743b", "ok": "#2a9d6f", "bad": "#c9ced6", "opt": "#e8743b", "ink": "#222831", "grey": "#8a93a0"}
plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.titleweight": "bold", "figure.dpi": 130, "savefig.bbox": "tight"})


def _pos(name):
    n = TOPOLOGIES[name][0]
    g = coupling_graph(name)
    if name == "B_grid (ours-alt)": return {i: (i % 3, -(i // 3)) for i in range(9)}
    if name == "A_linear (ref)": return {i: (i, 0) for i in range(5)}
    if name == "A_bowtie (ours)": return {0: (0, 1), 1: (0, -1), 2: (1, 0), 3: (2, 1), 4: (2, -1)}
    if name == "A_tree (ref)": return {0: (0, 0), 1: (1, 0), 2: (2, 0.8), 3: (2, -0.8), 4: (3, -0.8)}
    if name == "A_ring (ours-alt)": return {i: (np.cos(np.pi / 2 - 2 * np.pi * i / 5), np.sin(np.pi / 2 - 2 * np.pi * i / 5)) for i in range(5)}
    if name == "B_wheel (ours)":
        pos = {i: (np.cos(np.pi / 2 - 2 * np.pi * i / 8), np.sin(np.pi / 2 - 2 * np.pi * i / 8)) for i in range(8)}
        pos[8] = (0, 0); return pos
    return nx.kamada_kawai_layout(g)


def plot_coupling_maps(names, path, ncols=4):
    nrows = -(-len(names) // ncols)
    fig, axs = plt.subplots(nrows, ncols, figsize=(3.0 * ncols, 3.2 * nrows))
    axs = np.atleast_1d(axs).ravel()
    for ax, name in zip(axs, names):
        g = coupling_graph(name)
        col = C["A"] if name.startswith("A") else C["B"]
        nx.draw_networkx(g, _pos(name), ax=ax, node_color=col, edge_color=C["grey"], font_color="white",
                         node_size=420, width=2, font_size=9)
        ax.set_title(f"{name}\n{g.number_of_edges()} edges · diameter {nx.diameter(g)}", fontsize=9); ax.axis("off")
        ax.margins(0.15)
    for ax in axs[len(names):]: ax.axis("off")
    fig.savefig(path); plt.close(fig)


def plot_convergence(trained, path, pmax=3):
    fig, axs = plt.subplots(1, 2, figsize=(9, 3.2))
    for ax, kind, ttl in zip(axs, ("unbalanced", "slack"), ("5-qubit (unbalanced penalty)", "9-qubit (slack bits)")):
        for p in range(1, pmax + 1):
            t = trained[(kind, p)]["trace"]; ax.plot(t, label=f"p={p}", lw=1.6)
        ax.axhline(min(trained[(kind, 1)]["qaoa"].cost), color=C["ink"], ls="--", lw=1, label="exact minimum")
        ax.set_title(ttl); ax.set_xlabel("COBYLA evaluation"); ax.set_ylabel("⟨C⟩")
        lo = min(trained[(kind, 1)]["qaoa"].cost)
        ax.set_ylim(lo - 0.05 * abs(lo) - 1, np.percentile(np.concatenate([trained[(kind, p)]["trace"] for p in range(1, pmax + 1)]), 90))
    axs[0].legend(frameon=False)
    fig.savefig(path); plt.close(fig)


def plot_landscape(gs, bs, Z, path, opt_point=None):
    fig, ax = plt.subplots(figsize=(4.6, 3.6))
    im = ax.pcolormesh(gs, bs, Z, shading="auto", cmap="viridis_r")
    fig.colorbar(im, label="⟨C⟩ (lower is better)")
    if opt_point is not None: ax.plot(*opt_point, "*", color=C["opt"], ms=14, mec="white", label="trained optimum"); ax.legend(frameon=False, loc="upper right")
    ax.set_xlabel("γ (cost angle)"); ax.set_ylabel("β (mixer angle)"); ax.set_title("p=1 QAOA energy landscape")
    fig.savefig(path); plt.close(fig)


def plot_distribution(dist, problem, opt_x, path, title="", top=12):
    """dist: {x tuple: prob} -> bars coloured optimal / feasible / infeasible."""
    items = sorted(dist.items(), key=lambda kv: -kv[1])[:top]
    fig, ax = plt.subplots(figsize=(8, 3.2))
    cols, labs = [], []
    for x, pr in items:
        v, w = problem.evaluate(x)
        cols.append(C["opt"] if tuple(x) == tuple(opt_x) else C["ok"] if w <= problem.capacity else C["bad"])
        labs.append("".join(map(str, x)) + f"\n{v}/{w}")
    ax.bar(range(len(items)), [pr for _, pr in items], color=cols)
    ax.set_xticks(range(len(items))); ax.set_xticklabels(labs, fontsize=8)
    ax.set_ylabel("probability"); ax.set_title(title); ax.set_xlabel("item selection  /  value÷weight  (capacity 15)")
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=C["opt"], label="optimal"), Patch(color=C["ok"], label="feasible"), Patch(color=C["bad"], label="overweight")], frameon=False)
    fig.savefig(path); plt.close(fig)


def _lab(n):
    return n.replace(" (ours)", " ★").replace(" (ref)", " (ref)").replace(" (ours-alt)", " (alt)")


def plot_arch(df, path, p=2):
    """Row 1: Processor A topologies running the 5-qubit encoding. Row 2: Processor B topologies running the 9-qubit one."""
    fig, axs = plt.subplots(2, 4, figsize=(13, 5.6))
    for r, (kind, pre, ttl) in enumerate((("unbalanced", "A", "A · 5-qubit encoding"), ("slack", "B", "B · 9-qubit slack encoding"))):
        d = df[(df.p == p) & (df.fits == True) & (df.formulation == kind) & (df.processor.str.startswith(pre))]
        for ax, (col, t) in zip(axs[r], (("depth", "Circuit depth"), ("cx_count", "CX count"), ("swaps", "SWAPs inserted"), ("esp", "Est. success prob."))):
            names = list(d.processor)
            ax.barh(range(len(names)), d[col], color=[C["A"] if n.startswith("A") else C["B"] for n in names],
                    alpha=1.0)
            ax.set_yticks(range(len(names))); ax.set_yticklabels([_lab(n) for n in names], fontsize=8)
            ax.invert_yaxis(); ax.set_title(f"{t}" + (f"\n{ttl}" if col == "depth" else ""), fontsize=9)
            for i, v_ in enumerate(d[col]): ax.text(v_, i, f" {v_:.3g}", va="center", fontsize=7)
    fig.suptitle(f"Same trained QAOA (p={p}) routed onto each topology · ★ = our co-designed map", y=1.0, fontsize=10)
    fig.tight_layout(); fig.savefig(path); plt.close(fig)


def plot_formulations(df, path):
    """The 5q vs 9q story: routing cost and success probability across p."""
    fig, axs = plt.subplots(1, 3, figsize=(11, 3.1))
    for ax, col, ttl in zip(axs, ("cx_count", "esp", "P(optimal)"), ("CX count", "Est. success prob. (ESP)", "Noisy P(optimal)")):
        for kind, ls in (("unbalanced", "-"), ("slack", "--")):
            for topo, c in (("A_bowtie (ours)", C["A"]), ("B_wheel (ours)", C["B"])):
                d = df[(df.formulation == kind) & (df.processor == topo) & (df.fits == True)]
                if len(d): ax.plot(d.p, d[col], ls, marker="o", color=c, label=f"{'5q' if kind=='unbalanced' else '9q'} on {topo[0]}")
        ax.set_xlabel("QAOA depth p"); ax.set_title(ttl); ax.set_xticks([1, 2, 3])
    axs[0].legend(frameon=False, fontsize=8)
    fig.savefig(path); plt.close(fig)


def plot_noise_sweep(sw, path):
    """Hellinger fidelity of the noisy output distribution vs the ideal one, as noise scales."""
    kinds = list(sw.formulation.unique())
    fig, axs = plt.subplots(1, len(kinds), figsize=(5 * len(kinds), 3.3), squeeze=False)
    for ax, kind in zip(axs[0], kinds):
        for topo, d in sw[sw.formulation == kind].groupby("processor", sort=False):
            star = "(ours" in topo
            ax.plot(d.noise_scale, d.hellinger, marker="o", lw=2 if star else 1.2, ls="-" if star else ":",
                    color=C["A"] if topo.startswith("A") else C["B"], label=topo.replace(" (ours)", " ★").replace(" (ref)", "").replace(" (ours-alt)", ""))
        ax.set_xlabel("noise × official rates (1.0 = guide)"); ax.set_ylabel("fidelity to ideal output")
        ax.set_title("5-qubit encoding" if kind == "unbalanced" else "9-qubit slack encoding"); ax.legend(frameon=False, fontsize=8)
    fig.savefig(path); plt.close(fig)


def plot_pareto(rob_a, rob_b, path):
    """Edge budget vs CX count (mean ± std over transpiler seeds)."""
    fig, axs = plt.subplots(1, 2, figsize=(9, 3.3))
    for ax, d, ttl, col in ((axs[0], rob_a, "Processor A · 5-qubit circuit", C["A"]), (axs[1], rob_b, "Processor B · 9-qubit circuit", C["B"])):
        for _, r in d.iterrows():
            ne = TOPOLOGIES[r.processor][1]; ne = len({frozenset(e) for e in ne})
            ours = "(ours)" in r.processor
            ax.errorbar(ne, r.cx_mean, yerr=r.cx_std, fmt="*" if ours else "o", ms=13 if ours else 7, color=col, mfc=col if ours else "white", capsize=3)
            ax.annotate(r.processor.split(" (")[0], (ne, r.cx_mean), textcoords="offset points", xytext=(6, 5), fontsize=8)
        ax.set_xlabel("coupling edges (hardware cost)"); ax.set_ylabel("CX count after routing"); ax.set_title(ttl)
        ax.margins(0.2)
    fig.savefig(path); plt.close(fig)
