import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExeDevProvider } from "../providers/exedev.js";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("ExeDevProvider", () => {
  it("throws without a token, never calling fetch", async () => {
    const provider = new ExeDevProvider({ token: "" });
    await expect(provider.list()).rejects.toThrow(/EXE_DEV_TOKEN/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reads the token from EXE_DEV_TOKEN when not passed explicitly", async () => {
    vi.stubEnv("EXE_DEV_TOKEN", "env-token");
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse({ vms: [] }));

    const provider = new ExeDevProvider();
    await provider.list();

    const [, init] = vi.mocked(global.fetch).mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer env-token" });
  });

  it("builds the expected `new` command string", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        vm_name: "foo",
        https_url: "https://foo.exe.xyz",
        region: "lon",
        status: "running",
        ssh_dest: "foo.exe.xyz",
      }),
    );

    const provider = new ExeDevProvider({ token: "test-token" });
    const vm = await provider.create({ name: "foo", cpu: 2, memory: "4GB" });

    const [url, init] = vi.mocked(global.fetch).mock.calls[0]!;
    expect(url).toBe("https://exe.dev/exec");
    expect((init as RequestInit).body).toBe('new --name "foo" --cpu 2 --memory 4GB --json');
    expect(vm).toEqual({
      name: "foo",
      httpsUrl: "https://foo.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "foo.exe.xyz",
    });
  });

  it("defaults region/status to \"unknown\" when the real `new --json` response omits them", async () => {
    // Captured live from exe.dev: `new --json` doesn't report region/status
    // the way `ls --json` does for existing VMs.
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        vm_name: "foundry-probe-2",
        https_url: "https://foundry-probe-2.exe.xyz",
        ssh_dest: "foundry-probe-2.exe.xyz",
      }),
    );

    const provider = new ExeDevProvider({ token: "test-token" });
    const vm = await provider.create({ name: "foundry-probe-2" });

    expect(vm.region).toBe("unknown");
    expect(vm.status).toBe("unknown");
  });

  it("parses `ls --json` into VmInfo[]", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        vms: [
          {
            vm_name: "bloggy",
            https_url: "https://bloggy.exe.xyz",
            region: "lon",
            status: "running",
            ssh_dest: "bloggy.exe.xyz",
          },
        ],
      }),
    );

    const provider = new ExeDevProvider({ token: "test-token" });
    const vms = await provider.list();

    expect(vms).toHaveLength(1);
    expect(vms[0]!.name).toBe("bloggy");
  });

  it("posts `rm <name>` on destroy", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response("", { status: 200 }));

    const provider = new ExeDevProvider({ token: "test-token" });
    await provider.destroy("foo");

    const [, init] = vi.mocked(global.fetch).mock.calls[0]!;
    expect((init as RequestInit).body).toBe('rm "foo"');
  });

  it("throws a clear error on a non-OK response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response("bad token", { status: 401 }));

    const provider = new ExeDevProvider({ token: "test-token" });
    await expect(provider.list()).rejects.toThrow(/exe\.dev \/exec error: 401/);
  });

  it("rejects commands over the 64KB body limit without calling fetch", async () => {
    const provider = new ExeDevProvider({ token: "test-token" });
    const huge = "x".repeat(70 * 1024);

    await expect(provider.create({ name: "foo", comment: huge })).rejects.toThrow(/64KB/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("surfaces a clear timeout error when the request hangs", async () => {
    vi.mocked(global.fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit)?.signal;
          signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    const provider = new ExeDevProvider({ token: "test-token", timeoutMs: 10 });
    await expect(provider.list()).rejects.toThrow(/timed out after 10ms/);
  });
});
