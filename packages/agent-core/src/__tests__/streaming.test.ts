import { describe, it, expect } from "vitest";
import { readLines, readSSEData } from "../streaming.js";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const v of iter) out.push(v);
  return out;
}

describe("readLines", () => {
  it("splits complete lines across chunk boundaries", async () => {
    const lines = await collect(readLines(streamOf(["foo\nb", "ar\nbaz"])));
    expect(lines).toEqual(["foo", "bar", "baz"]);
  });

  it("yields a trailing line with no final newline", async () => {
    const lines = await collect(readLines(streamOf(["only one line"])));
    expect(lines).toEqual(["only one line"]);
  });
});

describe("readSSEData", () => {
  it("extracts only data: lines, ignoring event:/comments/blank lines", async () => {
    const sse = "event: message\ndata: {\"a\":1}\n\ndata: {\"a\":2}\n\n";
    const data = await collect(readSSEData(streamOf([sse])));
    expect(data).toEqual(['{"a":1}', '{"a":2}']);
  });
});
