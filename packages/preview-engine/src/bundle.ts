import * as esbuild from "esbuild-wasm";

let initPromise: Promise<void> | null = null;

/**
 * Initializes the WASM esbuild engine exactly once. esbuild-wasm's Node build
 * (used under Node/vitest/CLI) runs the local binary directly and doesn't
 * accept (or need) a wasmURL — that option is browser-only. In a browser,
 * pass the bundler-resolved URL to esbuild-wasm's .wasm asset (e.g. Vite's
 * `import wasmUrl from "esbuild-wasm/esbuild.wasm?url"`).
 */
export function initializeEngine(wasmURL?: string | URL): Promise<void> {
  if (!initPromise) {
    const isBrowser = typeof window !== "undefined";
    initPromise = isBrowser ? esbuild.initialize({ wasmURL: wasmURL! }) : esbuild.initialize({});
  }
  return initPromise;
}

export interface VirtualFiles {
  /** Maps file path (as referenced by imports, e.g. "/App.jsx") to source text. */
  [path: string]: string;
}

export interface BundleResult {
  code: string;
  warnings: string[];
}

/** An esbuild plugin that resolves and loads modules from an in-memory file map instead of disk. */
function virtualFsPlugin(files: VirtualFiles): esbuild.Plugin {
  return {
    name: "virtual-fs",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path in files) return { path: args.path, namespace: "virtual" };
        if (args.kind === "entry-point") return { path: args.path, namespace: "virtual" };
        // Resolve relative imports (e.g. "./App") against the importer's directory.
        const candidates = [args.path, `${args.path}.js`, `${args.path}.jsx`, `${args.path}.tsx`];
        for (const candidate of candidates) {
          const resolved = candidate.startsWith("/") ? candidate : `/${candidate}`.replace(/^\/\.\//, "/");
          if (resolved in files) return { path: resolved, namespace: "virtual" };
        }
        return { path: args.path, namespace: "virtual", errors: [{ text: `Module not found in preview: ${args.path}` }] };
      });

      build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
        const contents = files[args.path];
        if (contents === undefined) return null;
        const ext = args.path.split(".").pop();
        const loader = ext === "jsx" || ext === "tsx" ? (ext as esbuild.Loader) : "jsx";
        return { contents, loader };
      });
    },
  };
}

/**
 * Bundles a small set of in-memory files (no real filesystem, no network)
 * into a single runnable JS string, entirely client-side-safe: no LLM calls,
 * no server round-trip, just esbuild running as WASM.
 */
export async function bundleVirtualFiles(files: VirtualFiles, entryPoint: string): Promise<BundleResult> {
  await initializeEngine();

  const result = await esbuild.build({
    stdin: undefined,
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    format: "iife",
    plugins: [virtualFsPlugin(files)],
  });

  return {
    code: result.outputFiles?.[0]?.text ?? "",
    warnings: result.warnings.map((w) => w.text),
  };
}
