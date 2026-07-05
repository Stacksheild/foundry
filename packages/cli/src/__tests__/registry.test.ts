import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listTemplates, getTemplate } from "../templates/registry.js";

function makeTemplate(dir: string, id: string, manifest: Record<string, unknown> | null) {
  const templateDir = join(dir, id);
  mkdirSync(templateDir, { recursive: true });
  if (manifest) {
    writeFileSync(join(templateDir, "foundry.plugin.json"), JSON.stringify(manifest));
  }
}

describe("listTemplates", () => {
  it("returns an empty array for a nonexistent directory", () => {
    expect(listTemplates("/does/not/exist")).toEqual([]);
  });

  it("discovers directories with a valid manifest and skips those without", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-registry-test-"));
    try {
      makeTemplate(tmp, "valid", { name: "valid", version: "0.1.0", description: "d", type: "template" });
      mkdirSync(join(tmp, "no-manifest"));

      const templates = listTemplates(tmp);
      expect(templates.map((t) => t.id)).toEqual(["valid"]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("throws a clear error for a manifest missing required fields", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-registry-test-"));
    try {
      makeTemplate(tmp, "broken", { name: "broken" });
      expect(() => listTemplates(tmp)).toThrow(/missing required field/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("throws a clear error for an unsupported plugin type", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-registry-test-"));
    try {
      makeTemplate(tmp, "bad-type", { name: "x", version: "0.1.0", description: "d", type: "deploy-adapter" });
      expect(() => listTemplates(tmp)).toThrow(/unsupported plugin type/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("getTemplate", () => {
  it("returns null for an unknown id", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-registry-test-"));
    try {
      expect(getTemplate(tmp, "nope")).toBeNull();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("returns the matching entry for a known id", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-registry-test-"));
    try {
      makeTemplate(tmp, "valid", { name: "valid", version: "0.1.0", description: "d", type: "template" });
      const entry = getTemplate(tmp, "valid");
      expect(entry?.manifest.name).toBe("valid");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
