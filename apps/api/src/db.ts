// Uses Node's built-in node:sqlite (experimental as of Node 22/24, but
// avoids a native-module build step entirely — a good fit for local/dev
// storage per the architecture doc's "SQLite (dev) -> Postgres (prod)" plan).
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface ChatSession {
  id: number;
  title: string;
  prompt: string;
  createdAt: string;
}

export interface ChatMessageRow {
  id: number;
  sessionId: number;
  role: string;
  content: string;
  createdAt: string;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export function openDb(path: string = ":memory:"): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

let sharedDb: DatabaseSync | null = null;

/** Lazily-opened singleton for route handlers; path from FOUNDRY_DB_PATH. */
export function getDb(): DatabaseSync {
  if (!sharedDb) {
    sharedDb = openDb(process.env.FOUNDRY_DB_PATH ?? "apps/api/.data/foundry.db");
  }
  return sharedDb;
}

export function createSession(db: DatabaseSync, title: string, prompt: string): number {
  const result = db
    .prepare("INSERT INTO sessions (title, prompt) VALUES (?, ?)")
    .run(title, prompt);
  return Number(result.lastInsertRowid);
}

export function appendMessage(db: DatabaseSync, sessionId: number, role: string, content: string): void {
  db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)").run(
    sessionId,
    role,
    content,
  );
}

export function listSessions(db: DatabaseSync): ChatSession[] {
  const rows = db
    .prepare("SELECT id, title, prompt, created_at AS createdAt FROM sessions ORDER BY id DESC")
    .all();
  return rows as unknown as ChatSession[];
}

export function getSession(
  db: DatabaseSync,
  id: number,
): { session: ChatSession; messages: ChatMessageRow[] } | null {
  const session = db
    .prepare("SELECT id, title, prompt, created_at AS createdAt FROM sessions WHERE id = ?")
    .get(id) as ChatSession | undefined;
  if (!session) return null;

  const messages = db
    .prepare(
      "SELECT id, session_id AS sessionId, role, content, created_at AS createdAt FROM messages WHERE session_id = ? ORDER BY id ASC",
    )
    .all(id) as unknown as ChatMessageRow[];

  return { session, messages };
}
