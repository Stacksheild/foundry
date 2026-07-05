import type { FastifyInstance } from "fastify";
import { createAdapter, pickAdapter, type ChatMessage, type Provider } from "@foundry/agent-core";

interface ChatBody {
  messages: ChatMessage[];
  taskType?: string;
  provider?: Provider;
  model?: string;
}

/**
 * Real, streaming LLM chat — deliberately NOT wired into the public apps/web
 * demo (anyone can hit that URL; this would burn API budget / expose model
 * choice to strangers). Only registered when FOUNDRY_ENABLE_AGENT=true, for
 * local dev and CLI use (see packages/cli's `chat` command).
 */
export async function registerChatRoute(app: FastifyInstance): Promise<void> {
  if (process.env.FOUNDRY_ENABLE_AGENT !== "true") return;

  app.post<{ Body: ChatBody }>("/build/chat", async (request, reply) => {
    const { messages, taskType, provider, model } = request.body ?? ({} as ChatBody);
    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({ error: "body.messages (non-empty array) is required" });
    }

    let adapter;
    try {
      adapter = provider
        ? createAdapter(provider, { model })
        : pickAdapter({ taskType: taskType as never, prompt: messages.at(-1)?.content }).adapter;
    } catch (err) {
      return reply.code(422).send({ error: err instanceof Error ? err.message : "failed to select a model" });
    }

    reply.raw.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    try {
      for await (const chunk of adapter.stream(messages)) {
        reply.raw.write(chunk);
      }
    } catch (err) {
      reply.raw.write(`\n[stream error: ${err instanceof Error ? err.message : "unknown"}]`);
    } finally {
      reply.raw.end();
    }
  });
}
