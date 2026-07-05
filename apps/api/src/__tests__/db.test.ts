import { describe, it, expect } from "vitest";
import { openDb, createSession, appendMessage, listSessions, getSession } from "../db.js";

describe("db", () => {
  it("creates a session and retrieves it with its messages", () => {
    const db = openDb();
    const id = createSession(db, "Build a dashboard", "Build a team productivity dashboard");
    appendMessage(db, id, "user", "Build a team productivity dashboard");
    appendMessage(db, id, "assistant", "Sure, here's a plan...");

    const result = getSession(db, id);
    expect(result?.session.title).toBe("Build a dashboard");
    expect(result?.messages).toHaveLength(2);
    expect(result?.messages[0]?.role).toBe("user");
    expect(result?.messages[1]?.role).toBe("assistant");
  });

  it("returns null for an unknown session id", () => {
    const db = openDb();
    expect(getSession(db, 999)).toBeNull();
  });

  it("lists sessions newest first", () => {
    const db = openDb();
    const first = createSession(db, "First", "first prompt");
    const second = createSession(db, "Second", "second prompt");

    const sessions = listSessions(db);
    expect(sessions.map((s) => s.id)).toEqual([second, first]);
  });
});
