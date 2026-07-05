import { ExeDevProvider } from "./providers/exedev.js";
import type { ComputeProvider, ComputeProviderConfig } from "./types.js";

export type { ComputeProvider, ComputeProviderConfig, VmSpec, VmInfo } from "./types.js";
export { ExeDevProvider };

// "aws" | "azure" are reserved for future work — not implemented. Adding a
// provider here should follow the exact recipe packages/agent-core uses for
// createAdapter(): add the class, add it to this union, add it to the switch.
export type ComputeProviderName = "exedev";

export function createComputeProvider(
  name: ComputeProviderName,
  config: ComputeProviderConfig = {},
): ComputeProvider {
  switch (name) {
    case "exedev":
      return new ExeDevProvider(config);
  }
}
