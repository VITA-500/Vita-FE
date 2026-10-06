import { segmentStreamingAnswer } from "@/features/chat/lib/chatStreamSegments";

/**
 * 스트리밍 답변을 읽기 편한 속도로 풀어 보여준다.
 *
 * - 글: 초당 약 30자로 한 글자씩. 받은 글이 많이 밀리면 조금씩만 빨라진다.
 * - 목록·표·안내 카드: 다 받을 때까지 멈추고 로딩 블록(`isPreparingBlock`)을 보여준 뒤,
 *   완성되면 통째로 보여주고 잠깐 쉬었다가 다음 글을 이어서 보여준다.
 */

export type TextRevealState = {
  content: string;
  isPreparingBlock: boolean;
};

/** 기본 속도(초당 글자 수) */
const BASE_CHARS_PER_SECOND = 30;
/** 밀린 글이 많을 때 최대 속도 */
const MAX_CHARS_PER_SECOND = 70;
/** 카드·목록을 보여준 뒤 다음 글을 이어가기 전 쉬는 시간 */
const BLOCK_PAUSE_MS = 450;
/** 답변이 끝난 뒤 남은 글을 기다려 주는 최대 시간. 넘기면 나머지를 한 번에 보여준다. */
const FINISH_TIMEOUT_MS = 20000;

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;

export const createTextReveal = (
  onUpdate: (state: TextRevealState) => void,
) => {
  let target = "";
  let isDone = false;
  let cursor = 0;
  let budget = 0;
  let lastTime: number | null = null;
  let pauseUntil = 0;
  let isPreparingBlock = false;
  let lastEmitted = "";
  let lastEmittedPreparing = false;
  let frameId: number | null = null;
  let waiters: Array<() => void> = [];

  const emit = () => {
    const content = target.slice(0, cursor);

    if (content === lastEmitted && isPreparingBlock === lastEmittedPreparing) {
      return;
    }

    lastEmitted = content;
    lastEmittedPreparing = isPreparingBlock;
    onUpdate({ content, isPreparingBlock });
  };

  const flushWaiters = () => {
    waiters.splice(0).forEach((resolve) => resolve());
  };

  /** 줄 머리의 "## " 같은 기호와 "**"는 글자 하나씩 보여주지 않고 한 번에 넘긴다. */
  const skipMarkup = () => {
    const isLineStart = cursor === 0 || target[cursor - 1] === "\n";

    if (isLineStart) {
      const prefix = target.slice(cursor).match(/^(#{1,6}\s+)/);

      if (prefix) cursor += prefix[1].length;
    }

    while (target.startsWith("**", cursor)) cursor += 2;
  };

  const tick = (now: number) => {
    frameId = null;

    const elapsed = lastTime === null ? 16 : Math.min(now - lastTime, 100);
    lastTime = now;

    if (now < pauseUntil) {
      schedule();
      return;
    }

    const backlog = target.length - cursor;
    const speed = Math.min(
      MAX_CHARS_PER_SECOND,
      BASE_CHARS_PER_SECOND + backlog / 8,
    );

    budget = Math.min(budget + (elapsed / 1000) * speed, 6);

    const segments = segmentStreamingAnswer(target, isDone);
    let isWaiting = false;

    isPreparingBlock = false;

    while (cursor < target.length) {
      const segment = segments.find((item) => cursor < item.end);

      if (!segment) break;

      if (segment.kind === "hold") {
        isWaiting = true;
        break;
      }

      if (segment.kind === "block") {
        if (!segment.complete) {
          isPreparingBlock = true;
          isWaiting = true;
          break;
        }

        cursor = segment.end;
        budget = 0;
        pauseUntil = now + BLOCK_PAUSE_MS;
        break;
      }

      if (budget < 1) break;

      skipMarkup();
      cursor += 1;

      if (
        cursor < target.length &&
        isHighSurrogate(target.charCodeAt(cursor - 1))
      ) {
        cursor += 1;
      }

      budget -= 1;
    }

    cursor = Math.min(cursor, target.length);
    emit();

    if (cursor >= target.length && isDone) {
      flushWaiters();
      return;
    }

    if (cursor < target.length || isWaiting || now < pauseUntil) {
      schedule();
    } else {
      // 받은 글을 다 보여줬다. 다음 글이 오면 push에서 다시 시작한다.
      lastTime = null;
    }
  };

  function schedule() {
    frameId ??= window.requestAnimationFrame(tick);
  }

  return {
    /** 지금까지 받은 답변 전체 */
    push(text: string) {
      if (!text.startsWith(target.slice(0, cursor))) {
        cursor = 0;
      }

      target = text;
      schedule();
    },
    /** 최종 답변까지 다 보여주면 resolve된다. 스트리밍으로 받은 글이 없으면 바로 끝난다. */
    finish(text: string) {
      if (target === "" && cursor === 0) {
        this.cancel();
        return Promise.resolve();
      }

      isDone = true;
      this.push(text);

      return new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          cursor = target.length;
          isPreparingBlock = false;
          emit();
          flushWaiters();
        }, FINISH_TIMEOUT_MS);

        waiters.push(() => {
          window.clearTimeout(timeoutId);
          resolve();
        });
      });
    },
    cancel() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }

      flushWaiters();
      waiters = [];
    },
  };
};
