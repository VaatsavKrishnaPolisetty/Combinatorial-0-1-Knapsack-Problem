export interface KnapsackItem {
  id: number;
  value: number;
  weight: number;
}

export interface TelemetryData {
  python_version: string;
  qiskit_version: string;
  qiskit_aer_version: string;
  pid: number;
  platform?: string;
  memory_mb: number;
  duration_ms: number;
  cobyla_iterations: number;
  timestamp: string;
  host: string;
}

export interface SolveResponse {
  num_items: number;
  capacity: number;
  qubits_used: number;
  formulation: string;
  penalty_params: Record<string, number>;
  expected_energy: number;
  angles: number[];
  shots: number;
  duration_ms?: number;
  cli_command?: string;
  terminal_output?: string;
  telemetry?: TelemetryData;
  optimal_solution: {
    bitstring: string;
    items: number[];
    value: number;
    weight: number;
  };
  qaoa_best_sample: {
    bitstring: string;
    items: number[];
    value: number;
    weight: number;
    is_exact_match: boolean;
  };
  probabilities: {
    p_optimal: number;
    p_feasible: number;
    p_random: number;
    speedup_vs_random: number;
  };
  top_states: Array<{
    state_int: number;
    bitstring: string;
    probability: number;
    value: number;
    weight: number;
    is_feasible: boolean;
    is_optimal: boolean;
  }>;
}

export interface CliExecResult {
  command: string;
  stdout: string;
  stderr: string;
  returncode: number;
  elapsed_ms: number;
  pid: number;
  timestamp: string;
}

export interface TopologyNode {
  id: number;
  x: number;
  y: number;
  isHub?: boolean;
}

export interface TopologyData {
  name: string;
  num_qubits: number;
  edges: [number, number][];
  num_edges: number;
  rationale: string;
  nodes: TopologyNode[];
}

export interface RoutingRobustness {
  processor: string;
  cx_mean: number;
  cx_std: number;
  depth_mean: number;
  depth_std: number;
  swaps_mean: number;
  swaps_std: number;
  n_seeds: number;
  circuit: string;
}

export interface BenchmarkRow {
  formulation: string;
  p: number;
  processor: string;
  logical_qubits: number;
  fits: boolean;
  depth: number;
  cx_depth: number;
  cx_count: number;
  swaps: number;
  esp: number;
  'P(optimal)': number;
  'P(feasible)': number;
  hellinger: number;
}

export interface ZnePoint {
  scale_factor: number;
  cx_count: number;
  circuit_depth: number;
  expectation_energy: number;
  p_optimal: number;
  p_feasible: number;
}

export interface ZneResult {
  ideal_energy: number;
  ideal_p_opt: number;
  unmitigated_noisy_energy: number;
  unmitigated_noisy_p_opt: number;
  linear_mitigated_energy: number;
  linear_mitigated_p_opt: number;
  richardson_energy: number;
  richardson_p_opt: number;
  energy_recovery_pct: number;
  scale_points: ZnePoint[];
  polynomial_coeffs: number[];
  processor: string;
  noise_model: string;
}

export interface CustomTranspileResult {
  connected: boolean;
  error?: string;
  edge_count: number;
  diameter: number;
  avg_path: number;
  depth: number;
  cx_count: number;
  swaps: number;
  esp: number;
  transpile_latency_ms?: number;
  hardware_efficiency_score: number;
  pareto_optimal: boolean;
  edges: [number, number][];
}

export interface ProcessorErrorAttribution {
  id: string;
  name: string;
  category: string;
  qubits: number;
  edges: number;
  cx_total: number;
  swaps: number;
  ideal: number;
  loss_1q: number;
  loss_2q_base: number;
  loss_swap_overhead: number;
  loss_readout: number;
  final_fidelity: number;
  fidelity_pct: number;
  swap_overhead_ratio: number;
}

export interface WaterfallData {
  processors: ProcessorErrorAttribution[];
  key_insight: string;
}

export interface ScalabilityItem {
  n: number;
  capacity: number;
  brute_force_states: number;
  classical_dp_ops: number;
  unbalanced_qubits: number;
  unbalanced_couplers: number;
  unbalanced_cx: number;
  slack_qubits: number;
  slack_couplers: number;
  slack_cx: number;
  crossover_ratio: number;
}

export interface ScalabilityData {
  items_sweep: ScalabilityItem[];
  summary: string;
}
