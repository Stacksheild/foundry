import { describe, it, expect } from "vitest";
import { openDb, registerApp, listApps, getApp, updateApp, DuplicateAppError } from "../db.js";

describe("registerApp", () => {
  it("registers an app with sensible defaults", () => {
    const db = openDb();
    const app = registerApp(db, { name: "checkout-svc" });
    expect(app).toMatchObject({
      name: "checkout-svc",
      env: "dev",
      status: "healthy",
      version: "0.1.0",
      team: null,
      url: null,
      vmName: null,
    });
  });

  it("accepts explicit env/team/version", () => {
    const db = openDb();
    const app = registerApp(db, { name: "checkout-svc", env: "production", team: "Team Alpha", version: "2.0.0" });
    expect(app).toMatchObject({ env: "production", team: "Team Alpha", version: "2.0.0" });
  });

  it("throws DuplicateAppError for a name that's already registered", () => {
    const db = openDb();
    registerApp(db, { name: "checkout-svc" });
    expect(() => registerApp(db, { name: "checkout-svc" })).toThrow(DuplicateAppError);
  });
});

describe("listApps", () => {
  it("lists apps newest first", () => {
    const db = openDb();
    registerApp(db, { name: "first" });
    registerApp(db, { name: "second" });
    expect(listApps(db).map((a) => a.name)).toEqual(["second", "first"]);
  });
});

describe("getApp", () => {
  it("returns null for an unregistered name", () => {
    const db = openDb();
    expect(getApp(db, "nope")).toBeNull();
  });
});

describe("updateApp", () => {
  it("updates only the given fields, leaving the rest untouched", () => {
    const db = openDb();
    registerApp(db, { name: "checkout-svc", team: "Team Alpha" });

    const updated = updateApp(db, "checkout-svc", { status: "deploying", url: "https://checkout.example.com" });
    expect(updated).toMatchObject({
      status: "deploying",
      url: "https://checkout.example.com",
      team: "Team Alpha", // untouched
      env: "dev", // untouched
    });
  });

  it("returns null for an unregistered name", () => {
    const db = openDb();
    expect(updateApp(db, "nope", { status: "error" })).toBeNull();
  });
});
