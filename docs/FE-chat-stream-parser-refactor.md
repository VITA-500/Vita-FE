# 채팅 스트림 파서 분리

- 기준 SHA: `d9047035c3065cada5a24688eae0d28a98af7be6`.
- 브랜치: `feat/fe1-chat-stream-parser-refactor`.
- 목적: 이벤트 payload 검증을 SSE 연결·polling transport에서 분리한다.
- `chatStreamEvent.ts`는 타입만 import하며 fetch, env, 타이머, 인증에 의존하지 않는다.
- 기존 `chatStreamTransport`의 parseStreamEvent export는 재수출로 유지한다.
- 검증 함수 본문은 기준 커밋에서 그대로 이동한다. 허용 payload, 취소, 재시도, 복원 정책을 바꾸지 않는다.
- 신규 경계 테스트는 nullable 카드, 알 수 없는 추가 필드, 잘못된 카드, 종료 오류 이벤트를 확인한다.

## 제외 범위

게스트 세션 claim, 새로고침 PENDING 추적, 소유권 전환 취소 정책 변경은 별도 작업이다.
원본 작업 폴더의 미커밋 지도 훅 변경 및 기존 stash는 포함하지 않는다.

## 검증 기록

독립 npm ci와 lint/test/build/build-storybook 결과는 검증 완료 후 기록한다.
현재 독립 npm ci는 ENOSPC로 실패해 불완전한 node_modules를 정리했다.
lint/test/build/build-storybook 실행 시 PowerShell/VirtualAlloc 메모리 부족이 발생했다.
동시 실행 수를 2로 줄인 보조 테스트도 ERR_IPC_CHANNEL_CLOSED로 종료됐다. 테스트 통과로 취급하지 않는다.
파서 함수 본문은 기준 커밋과 문자 단위 비교로 동일함을 확인했다. 이것은 런타임 검증을 대체하지 않는다.
디스크 공간 확보 후 독립 설치와 필수 검증을 재실행하기 전까지 초안이다.
기준 소스에서도 ChatSessionMenu의 30/30 기대와 38/30 표시 불일치, Turbopack CSS 자식 프로세스 연결 오류가 재현됨을 확인했다.
실제 서버 스트리밍·로그인 전환·브라우저 새로고침 E2E는 수행하지 않았다.
