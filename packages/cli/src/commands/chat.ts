import { Command } from "commander";
import { createAdapter, pickAdapter, type Provider } from "@foundry/agent-core";

export const chatCommand = new Command("chat")
  .description("Stream a chat completion from a real LLM adapter — local/dev only, never exposed publicly")
  .argument("<prompt>", "The message to send")
  .option("-p, --provider <name>", "anthropic, openai, or ollama — skips model-router selection")
  .option("-m, --model <id>", "Model id (only used with --provider)")
  .option("-t, --task-type <type>", "code-generation, chat, analysis, etc. — passed to model-router")
  .action(async (prompt: string, opts: { provider?: Provider; model?: string; taskType?: string }) => {
    try {
      const adapter = opts.provider
        ? createAdapter(opts.provider, { model: opts.model })
        : pickAdapter({ taskType: opts.taskType as never, prompt }).adapter;

      if (!opts.provider) {
        console.error(`(model-router picked ${adapter.provider}/${adapter.model})\n`);
      }

      for await (const chunk of adapter.stream([{ role: "user", content: prompt }])) {
        process.stdout.write(chunk);
      }
      process.stdout.write("\n");
    } catch (err) {
      console.error(`Chat failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });
