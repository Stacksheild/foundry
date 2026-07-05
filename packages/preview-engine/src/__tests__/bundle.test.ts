import { describe, it, expect } from "vitest";
import { bundleVirtualFiles } from "../bundle";
import { buildPreviewHtml } from "../html";

describe("bundleVirtualFiles", () => {
  it("bundles a single entry file with no imports", async () => {
    const result = await bundleVirtualFiles(
      { "/index.js": 'console.log("hello from preview")' },
      "/index.js",
    );
    expect(result.code).toContain("hello from preview");
    expect(result.warnings).toEqual([]);
  });

  it("resolves a relative import across two virtual files", async () => {
    const result = await bundleVirtualFiles(
      {
        "/index.js": 'import { greet } from "./greet"; console.log(greet("world"));',
        "/greet.js": 'export function greet(name) { return "hi " + name; }',
      },
      "/index.js",
    );
    expect(result.code).toContain("hi ");
    expect(result.code).toContain("world");
  });

  it("reports an error for a genuinely missing module instead of crashing", async () => {
    await expect(
      bundleVirtualFiles({ "/index.js": 'import "./does-not-exist";' }, "/index.js"),
    ).rejects.toThrow();
  });

  it("transforms JSX-like syntax (loader defaults to jsx)", async () => {
    const result = await bundleVirtualFiles(
      { "/index.js": "const el = <div>hi</div>; console.log(el);" },
      "/index.js",
    );
    expect(result.code).not.toContain("<div>");
    expect(result.code).toContain("React.createElement");
  });
});

describe("buildPreviewHtml", () => {
  it("embeds the bundled code in a script tag", () => {
    const html = buildPreviewHtml('console.log("x")');
    expect(html).toContain("<script>console.log(\"x\")</script>");
    expect(html).toContain('<div id="root">');
  });
});
