export type SseEvent = {
  /** `event:` 필드. 없으면 SSE 기본값인 "message". */
  event: string;
  data: string;
  id?: string;
};

/**
 * fetch 응답 본문(text/event-stream)을 읽어 SSE 이벤트 단위로 넘겨준다.
 *
 * EventSource는 GET만 되고 헤더(X-Guest-Id, CSRF)를 붙일 수 없어서 POST 스트리밍에는 쓸 수 없다.
 * 그래서 fetch로 받은 ReadableStream을 직접 SSE 규칙대로 해석한다.
 * - 빈 줄에서 이벤트 하나가 끝난다. 청크가 줄 중간에서 잘려도 다음 청크와 이어 붙여 처리한다.
 * - `data:` 여러 줄은 줄바꿈으로 합친다. `:`로 시작하는 줄(keep-alive 주석)은 무시한다.
 */
export const readSseStream = async (
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void,
) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "";
  let dataLines: string[] = [];
  let lastEventId: string | undefined;

  const dispatch = () => {
    if (dataLines.length > 0) {
      onEvent({
        event: eventName || "message",
        data: dataLines.join("\n"),
        id: lastEventId,
      });
    }

    eventName = "";
    dataLines = [];
  };

  const processLine = (line: string) => {
    if (line === "") {
      dispatch();
      return;
    }

    if (line.startsWith(":")) {
      return;
    }

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    let value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);

    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    if (field === "event") {
      eventName = value;
    } else if (field === "data") {
      dataLines.push(value);
    } else if (field === "id") {
      lastEventId = value;
    }
  };

  const flushLines = (isFinal: boolean) => {
    // "\r\n"이 청크 경계에서 "\r" / "\n"으로 갈리면 빈 줄로 오해할 수 있어 끝의 "\r"은 다음 청크로 넘긴다.
    const carry = !isFinal && buffer.endsWith("\r") ? "\r" : "";
    const lines = (carry ? buffer.slice(0, -1) : buffer).split(/\r\n|\r|\n/);

    // 마지막 조각은 아직 줄이 끝나지 않았을 수 있다. 다음 청크와 합쳐서 처리한다.
    buffer = isFinal ? "" : (lines.pop() ?? "") + carry;

    lines.forEach(processLine);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      flushLines(false);
    }

    buffer += decoder.decode();

    if (buffer) {
      flushLines(true);
    }

    // 마지막 빈 줄 없이 스트림이 닫혀도 모아 둔 이벤트는 넘긴다.
    dispatch();
  } finally {
    reader.releaseLock();
  }
};
