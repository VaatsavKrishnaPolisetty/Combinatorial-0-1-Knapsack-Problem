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
