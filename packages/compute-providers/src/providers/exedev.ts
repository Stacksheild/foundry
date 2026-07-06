import type { ComputeProvider, ComputeProviderConfig, VmSpec, VmInfo } from "../types.js";

const EXEC_ENDPOINT = "https://exe.dev/exec";
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000; // matches exe.dev's own server-side /exec limit

/**
 * exe.dev's entire API is one HTTPS endpoint: POST https://exe.dev/exec, where
 * the request body is a raw exe.dev CLI command string (e.g. "new --name foo"),
 * authenticated with a bearer token, JSON-in/JSON-out. There is no stdin/pty —
 * this adapter only supports one-shot lifecycle commands (create/list/destroy),
 * not interactive shells. See https://exe.dev/docs/https-api.
 */
export class ExeDevProvider implements ComputeProvider {
  readonly name = "exedev";
  private token: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: ComputeProviderConfig = {}) {
    this.token = config.token ?? process.env.EXE_DEV_TOKEN ?? "";
    this.baseUrl = config.baseUrl ?? EXEC_ENDPOINT;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async create(spec: VmSpec): Promise<VmInfo> {
    const raw = await this.exec(buildNewCommand(spec));
    return parseVmInfo(raw);
  }

  async list(): Promise<VmInfo[]> {
    const raw = await this.exec("ls --json");
    const parsed = JSON.parse(raw) as { vms: Array<Record<string, unknown>> };
    return parsed.vms.map(toVmInfo);
  }

  async destroy(name: string): Promise<void> {
    await this.exec(`rm ${shellEscape(name)}`);
  }

  private async exec(command: string): Promise<string> {
    if (!this.token) throw new Error("EXE_DEV_TOKEN is not set");

    const bodyBytes = Buffer.byteLength(command, "utf-8");
    if (bodyBytes > MAX_BODY_BYTES) {
      throw new Error(`exe.dev command exceeds the 64KB body limit (${bodyBytes} bytes)`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.token}`,
          "content-type": "text/plain",
        },
        body: command,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`exe.dev /exec error: ${res.status} ${await res.text()}`);
      }
      return await res.text();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `exe.dev /exec timed out after ${this.timeoutMs}ms (server enforces a 30s limit)`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildNewCommand(spec: VmSpec): string {
  const parts = ["new", "--name", shellEscape(spec.name)];
  if (spec.cpu !== undefined) parts.push("--cpu", String(spec.cpu));
  if (spec.memory) parts.push("--memory", spec.memory);
  if (spec.disk) parts.push("--disk", spec.disk);
  if (spec.image) parts.push("--image", spec.image);
  if (spec.env) {
    for (const [k, v] of Object.entries(spec.env)) {
      parts.push("--env", shellEscape(`${k}=${v}`));
    }
  }
  if (spec.comment) parts.push("--comment", shellEscape(spec.comment));
  if (spec.command) parts.push("--command", shellEscape(spec.command));
  if (spec.integration) parts.push("--integration", spec.integration);
  if (spec.noEmail) parts.push("--no-email");
  if (spec.prompt) parts.push("--prompt", shellEscape(spec.prompt));
  parts.push("--json");
  return parts.join(" ");
}

function shellEscape(value: string): string {
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function toVmInfo(raw: Record<string, unknown>): VmInfo {
  return {
    name: String(raw.vm_name),
    httpsUrl: String(raw.https_url),
    region: String(raw.region),
    status: String(raw.status),
    sshDest: String(raw.ssh_dest),
  };
}

function parseVmInfo(raw: string): VmInfo {
  return toVmInfo(JSON.parse(raw) as Record<string, unknown>);
}
