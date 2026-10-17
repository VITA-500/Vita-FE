# HTTP 응답 처리 리팩토링

- 기준 SHA: `d9047035c3065cada5a24688eae0d28a98af7be6`.
- 브랜치: `feat/fe1-http-transport-refactor`.
- 독립 worktree: `C:/Vita-FE/build/fe-http-refactor`.
- 목적: 일반 HTTP와 게스트 채팅의 URL 조합·성공 응답 파싱·에러 상세 타입 중복 제거.
- 기존 `createChatApiUrl` 호출 계약은 보존한다.
- 쿠키/게스트 헤더, CSRF 재시도, timeout, 일반 API의 text 오류 fallback과 게스트 API의 JSON 오류 fallback은 유지한다.
- 성공 본문을 읽는 동안에도 timeout 정리가 앞서 실행되지 않도록 `runRequest`에서 파싱 완료를 await한다.

## 검증 제약

`npm ci`는 디스크 공간 부족(ENOSPC)으로 실패했다. 이 worktree에 생성된 불완전한 node_modules는 정리했다.
원본의 의존성 복구 후 추가 검증 결과를 기록한다. 설치가 성공한 것으로 취급하지 않는다.
원본 폴더에서 작업 도중 나타난 지도 훅 3개의 미커밋 변경은 worktree에 포함하지 않았다.

부모 프로젝트 의존성으로 실행한 보조 검증: lint 통과, 전체 테스트 209개 중 208개 통과(기존 ChatSessionMenu 실패 1건).
독립 npm ci 재시도도 ENOSPC로 실패했다. 실패한 worktree node_modules는 제거하고 원본의 정상 설치는 보존했다.
기본 build는 독립 Next 설치가 없는 worktree의 Turbopack root 해석 오류로 실패했다.
build-storybook은 VirtualAlloc/메모리 부족으로 실패했다. 독립 설치와 빌드 검증을 완료하기 전까지 초안이다.

## 회귀 검증 대상

기존 shared HTTP/채팅 서비스 계약 테스트와 신규 게스트 transport 테스트:
절대 URL 유지, 게스트 인증과 cookie omit, JSON 성공 응답, 204/빈 200 성공, 구조화된 오류 상세, 비JSON 게스트 오류 fallback.

## 기준 코드에서 재현된 실패

소스 변경이 없는 `docs/fe-refactoring-audit` 브랜치에서 다음 실패를 재현했다.

- ChatSessionMenu: 정규화한 30/30을 기대하지만 원본 입력 길이 38/30 표시.
- 기본 Next.js Turbopack 빌드: globals.css 처리 자식 프로세스 연결 실패.

이 두 문제는 별도 수정이며 이 브랜치에서 동작을 바꾸지 않는다.
