/** Splits a byte stream into text lines, buffering partial lines across chunks. */
export async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    yield* lines;
  }
  if (buffer.trim()) yield buffer;
}

/** Extracts the payload from "data: ..." lines of a Server-Sent Events stream. */
export async function* readSSEData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  for await (const line of readLines(body)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) yield trimmed.slice(5).trim();
  }
}
