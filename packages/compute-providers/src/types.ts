export interface VmSpec {
  name: string;
  cpu?: number;
  memory?: string; // e.g. "4GB"
  disk?: string; // e.g. "20GB"
  image?: string;
  env?: Record<string, string>;
  comment?: string;
  command?: string;
  integration?: string;
  noEmail?: boolean;
  prompt?: string;
}

export interface VmInfo {
  name: string;
  httpsUrl: string;
  region: string;
  status: string;
  sshDest: string;
}

/**
 * A compute provider that can create, list, and destroy disposable VMs.
 * Mirrors packages/agent-core's AgentAdapter shape (a readonly identity tag
 * plus verb methods) so the two provider-abstraction layers read the same way.
 */
export interface ComputeProvider {
  readonly name: string;
  create(spec: VmSpec): Promise<VmInfo>;
  list(): Promise<VmInfo[]>;
  destroy(name: string): Promise<void>;
}

export interface ComputeProviderConfig {
  token?: string;
  baseUrl?: string;
  /** Overridable for tests; defaults to exe.dev's own 30s /exec limit. */
  timeoutMs?: number;
}
