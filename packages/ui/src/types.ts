export type ScreenId = "home" | "build" | "dashboard" | "deploy";

export interface Session {
  id: number;
  title: string;
  prompt: string;
  time: string;
}

export type AppStatus = "healthy" | "deploying" | "warning" | "error";
export type AppEnv = "production" | "staging" | "dev";

export interface AppRecord {
  id: number;
  name: string;
  env: AppEnv;
  status: AppStatus;
  deploy: string;
  team: string;
  ver: string;
}

export interface Suggestion {
  cat: string;
  title: string;
  desc: string;
  cta: string;
}
