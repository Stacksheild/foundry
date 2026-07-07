import { describe, it, expect, afterEach } from "vitest";
import middleware from "./middleware.js";

describe("Basic Auth gate", () => {
  afterEach(() => {
    delete process.env.FOUNDRY_DEMO_USERNAME;
    delete process.env.FOUNDRY_DEMO_PASSWORD;
  });

  it("passes through when FOUNDRY_DEMO_USERNAME/PASSWORD are unset", () => {
    const res = middleware(new Request("https://example.com/"));
    expect(res).toBeUndefined();
  });

  it("rejects missing/wrong credentials and allows the right one when set", () => {
    process.env.FOUNDRY_DEMO_USERNAME = "demo";
    process.env.FOUNDRY_DEMO_PASSWORD = "secret123";

    const noAuth = middleware(new Request("https://example.com/"));
    expect(noAuth?.status).toBe(401);
    expect(noAuth?.headers.get("www-authenticate")).toContain("Basic");

    const wrongAuth = middleware(
      new Request("https://example.com/", {
        headers: { authorization: `Basic ${btoa("demo:wrong")}` },
      }),
    );
    expect(wrongAuth?.status).toBe(401);

    const rightAuth = middleware(
      new Request("https://example.com/", {
        headers: { authorization: `Basic ${btoa("demo:secret123")}` },
      }),
    );
    expect(rightAuth).toBeUndefined();
  });

  it("only splits on the first colon, so passwords containing ':' are preserved", () => {
    process.env.FOUNDRY_DEMO_USERNAME = "demo";
    process.env.FOUNDRY_DEMO_PASSWORD = "sec:ret:123";

    const rightAuth = middleware(
      new Request("https://example.com/", {
        headers: { authorization: `Basic ${btoa("demo:sec:ret:123")}` },
      }),
    );
    expect(rightAuth).toBeUndefined();

    const truncatedGuess = middleware(
      new Request("https://example.com/", {
        headers: { authorization: `Basic ${btoa("demo:sec")}` },
      }),
    );
    expect(truncatedGuess?.status).toBe(401);
  });
});
