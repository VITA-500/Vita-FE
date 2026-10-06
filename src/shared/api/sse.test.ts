import { describe, expect, it } from "vitest";
import { readSseStream, type SseEvent } from "./sse";

const toStream = (chunks: string[]) => {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
};

const collect = async (chunks: string[]) => {
  const events: SseEvent[] = [];

  await readSseStream(toStream(chunks), (event) => events.push(event));

  return events;
};

describe("readSseStream", () => {
  it("parses named events with ids and ignores comment lines", async () => {
    await expect(
      collect([
        "event:connected\ndata:ok\n\n",
        ":keep-alive\n\n",
        'id:3\nevent:assistant_delta\ndata:{"delta":"안녕"}\n\n',
      ]),
    ).resolves.toEqual([
      { event: "connected", data: "ok", id: undefined },
      { event: "assistant_delta", data: '{"delta":"안녕"}', id: "3" },
    ]);
  });

  it("joins events split across chunks, including CRLF split at a boundary", async () => {
    await expect(
      collect([
        "event: assistant_do",
        "ne\r",
        '\ndata: {"content"',
        ':"끝"}\r\n\r\n',
      ]),
    ).resolves.toEqual([
      { event: "assistant_done", data: '{"content":"끝"}', id: undefined },
    ]);
  });

  it("joins multi-line data and defaults the event name to message", async () => {
    await expect(collect(["data: a\ndata: b\n\n"])).resolves.toEqual([
      { event: "message", data: "a\nb", id: undefined },
    ]);
  });

  it("decodes multi-byte characters split between chunks", async () => {
    const bytes = new TextEncoder().encode("data: 요금제\n\n");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 8));
        controller.enqueue(bytes.slice(8));
        controller.close();
      },
    });
    const events: SseEvent[] = [];

    await readSseStream(stream, (event) => events.push(event));

    expect(events).toEqual([
      { event: "message", data: "요금제", id: undefined },
    ]);
  });
});
