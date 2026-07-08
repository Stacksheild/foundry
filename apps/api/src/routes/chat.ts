import type { FastifyInstance } from "fastify";
import { createAdapter, pickAdapter, type ChatMessage, type Provider } from "@foundry/agent-core";
import { getDb, createSession, appendMessage } from "../db.js";

interface ChatBody {
  messages: ChatMessage[];
  sessionId?: number;
  taskType?: string;
  provider?: Provider;
  model?: string;
}

function makeTitle(prompt: string): string {
  return prompt.length > 46 ? `${prompt.slice(0, 43)}…` : prompt;
}

/**
 * Real, streaming LLM chat — deliberately NOT wired into the public apps/web
 * demo (anyone can hit that URL; this would burn API budget / expose model
 * choice to strangers). Only registered when FOUNDRY_ENABLE_AGENT=true, for
 * local dev and CLI use (see packages/cli's `chat` command).
 *
 * Persists each turn to SQLite (packages/api/src/db.ts) — see routes/sessions.ts
 * for reading history back.
 */
export async function registerChatRoute(app: FastifyInstance): Promise<void> {
  if (process.env.FOUNDRY_ENABLE_AGENT !== "true") return;

  app.post<{ Body: ChatBody }>("/build/chat", async (request, reply) => {
    const { messages, sessionId, taskType, provider, model } = request.body ?? ({} as ChatBody);
    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({ error: "body.messages (non-empty array) is required" });
    }

    let adapter;
    try {
      const envProvider = process.env.FOUNDRY_DEFAULT_PROVIDER as Provider | undefined;
      if (provider) {
        adapter = createAdapter(provider, { model });
      } else if (envProvider) {
        adapter = createAdapter(envProvider, { model: model ?? process.env.FOUNDRY_DEFAULT_MODEL });
      } else {
        adapter = pickAdapter({ taskType: taskType as never, prompt: messages.at(-1)?.content }).adapter;
      }
    } catch (err) {
      return reply.code(422).send({ error: err instanceof Error ? err.message : "failed to select a model" });
    }

    const db = getDb();
    const lastUserMessage = messages.at(-1);
    const activeSessionId =
      sessionId ?? createSession(db, makeTitle(lastUserMessage?.content ?? ""), lastUserMessage?.content ?? "");
    if (lastUserMessage) appendMessage(db, activeSessionId, lastUserMessage.role, lastUserMessage.content);

    // Writing to reply.raw bypasses Fastify's reply lifecycle, so headers
    // accumulated by plugins — crucially @fastify/cors's
    // Access-Control-Allow-Origin, without which browsers block the stream —
    // must be carried over explicitly.
    const accumulatedHeaders = Object.fromEntries(
      Object.entries(reply.getHeaders()).filter(([, v]) => v !== undefined),
    ) as Record<string, string | number | string[]>;
    reply.raw.writeHead(200, {
      ...accumulatedHeaders,
      "content-type": "text/plain; charset=utf-8",
      "x-foundry-session-id": String(activeSessionId),
    });

    let assistantContent = "";
    try {
      for await (const chunk of adapter.stream(messages)) {
        assistantContent += chunk;
        reply.raw.write(chunk);
      }
    } catch (err) {
      assistantContent += `\n[stream error: ${err instanceof Error ? err.message : "unknown"}]`;
      reply.raw.write(assistantContent);
    } finally {
      if (assistantContent) appendMessage(db, activeSessionId, "assistant", assistantContent);
      reply.raw.end();
    }
  });
}
