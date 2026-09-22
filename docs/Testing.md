# Testing

VITA FE는 Phase 1부터 Vitest와 Testing Library 기반 자동화 테스트를 사용한다.

## Commands

```bash
npm run test
npm run lint
npm run build
```

PR 전에는 위 세 명령을 기본 검증으로 실행한다.

## Test Scope

| Type      | Scope                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Unit      | API wrapper, token storage, service URL 생성, 순수 helper              |
| Component | 인증 상태별 UI, 모달, 버튼 동작, 비로그인/로그인 분기                  |
| Manual QA | OAuth provider 로그인, 배포 redirect URI, 실제 백엔드 세션/cookie 흐름 |

## Current Coverage

- `requestJson`
  - base URL 조합
  - `credentials: "include"`
  - API error 변환
  - empty response 처리
- `tokenStorage`
  - auth hint 저장/삭제
- `authService`
  - OAuth authorization URL 생성
- `AuthProvider`
  - guest ready 상태
  - auth hint 기반 사용자 로드
  - 401 발생 시 auth hint 제거
- `GuestNewChatDialog`
  - 비로그인 새 상담 안내 문구
  - 닫기/채팅 지우기 액션

## Testing Rules

- UI 테스트는 사용자에게 보이는 label, role, text를 우선 사용한다.
- 구현 세부 class에 강하게 의존하지 않는다.
- 단, 강조 스타일처럼 명시적인 UX 요구가 있는 경우에만 class를 확인한다.
- OAuth 실제 provider 흐름은 외부 서비스와 redirect URI에 의존하므로 자동화하지 않는다.
- 새 인증/공통 API 로직을 추가하면 최소 1개 이상의 회귀 테스트를 함께 추가한다.
