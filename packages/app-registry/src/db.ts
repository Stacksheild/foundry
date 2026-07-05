// Uses Node's built-in node:sqlite (experimental as of Node 22/24) — same
// rationale as apps/api's chat db: avoids a native-module build step.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type AppEnv = "dev" | "staging" | "production";
export type AppStatus = "healthy" | "deploying" | "warning" | "error";

export interface AppRecord {
  id: number;
  name: string;
  env: AppEnv;
  status: AppStatus;
  version: string;
  team: string | null;
  url: string | null;
  vmName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterAppInput {
  name: string;
  env?: AppEnv;
  team?: string;
  version?: string;
}

export interface UpdateAppInput {
  env?: AppEnv;
  status?: AppStatus;
  version?: string;
  url?: string;
  vmName?: string;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    env TEXT NOT NULL DEFAULT 'dev',
    status TEXT NOT NULL DEFAULT 'healthy',
    version TEXT NOT NULL DEFAULT '0.1.0',
    team TEXT,
    url TEXT,
    vm_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const SELECT_COLUMNS = `
  id, name, env, status, version, team, url, vm_name AS vmName,
  created_at AS createdAt, updated_at AS updatedAt
`;

export function openDb(path: string = ":memory:"): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

let sharedDb: DatabaseSync | null = null;

/** Lazily-opened singleton; path from FOUNDRY_REGISTRY_DB_PATH. */
export function getDb(): DatabaseSync {
  if (!sharedDb) {
    sharedDb = openDb(process.env.FOUNDRY_REGISTRY_DB_PATH ?? "apps/api/.data/foundry-registry.db");
  }
  return sharedDb;
}

export class DuplicateAppError extends Error {
  constructor(name: string) {
    super(`An app named "${name}" is already registered`);
    this.name = "DuplicateAppError";
  }
}

export function registerApp(db: DatabaseSync, input: RegisterAppInput): AppRecord {
  const existing = getApp(db, input.name);
  if (existing) throw new DuplicateAppError(input.name);

  db.prepare("INSERT INTO apps (name, env, version, team) VALUES (?, ?, ?, ?)").run(
    input.name,
    input.env ?? "dev",
    input.version ?? "0.1.0",
    input.team ?? null,
  );
  const record = getApp(db, input.name);
  if (!record) throw new Error("Failed to read back the app record after insert");
  return record;
}

export function listApps(db: DatabaseSync): AppRecord[] {
  return db.prepare(`SELECT ${SELECT_COLUMNS} FROM apps ORDER BY id DESC`).all() as unknown as AppRecord[];
}

export function getApp(db: DatabaseSync, name: string): AppRecord | null {
  const row = db.prepare(`SELECT ${SELECT_COLUMNS} FROM apps WHERE name = ?`).get(name);
  return (row as AppRecord | undefined) ?? null;
}

export function updateApp(db: DatabaseSync, name: string, input: UpdateAppInput): AppRecord | null {
  const existing = getApp(db, name);
  if (!existing) return null;

  db.prepare(
    "UPDATE apps SET env = ?, status = ?, version = ?, url = ?, vm_name = ?, updated_at = datetime('now') WHERE name = ?",
  ).run(
    input.env ?? existing.env,
    input.status ?? existing.status,
    input.version ?? existing.version,
    input.url ?? existing.url,
    input.vmName ?? existing.vmName,
    name,
  );
  return getApp(db, name);
}
