import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findConfigPath, loadConfig } from "../config.js";

describe("findConfigPath", () => {
  it("returns null when no config exists anywhere up the tree", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-config-test-"));
    try {
      expect(findConfigPath(tmp)).toBeNull();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("finds a config in the starting directory", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-config-test-"));
    try {
      writeFileSync(join(tmp, "foundry.config.yml"), "framework: react-vite\n");
      expect(findConfigPath(tmp)).toBe(join(tmp, "foundry.config.yml"));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("walks up to find a config in a parent directory", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-config-test-"));
    const nested = join(tmp, "a", "b", "c");
    try {
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(tmp, "foundry.config.yml"), "framework: react-vite\n");
      expect(findConfigPath(nested)).toBe(join(tmp, "foundry.config.yml"));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("loadConfig", () => {
  it("returns {} when no config is found", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-config-test-"));
    try {
      expect(loadConfig(tmp)).toEqual({});
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("parses a real golden-path config", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-config-test-"));
    try {
      writeFileSync(
        join(tmp, "foundry.config.yml"),
        "framework: react-vite\napiBase: https://api.internal.example.com\nauth: oidc\ndefaultTemplate: metrics-dashboard\n",
      );
      expect(loadConfig(tmp)).toEqual({
        framework: "react-vite",
        apiBase: "https://api.internal.example.com",
        auth: "oidc",
        defaultTemplate: "metrics-dashboard",
      });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("throws a clear error for a non-mapping top level", () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-config-test-"));
    try {
      writeFileSync(join(tmp, "foundry.config.yml"), "- just\n- a\n- list\n");
      expect(() => loadConfig(tmp)).toThrow(/expected a YAML mapping/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
