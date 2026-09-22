# Frontend Architecture

VITA FE는 Next.js App Router 기반이며, Feature-Sliced Design을 참고한 `app / features / shared` 중심의 FSD-lite 구조를 사용한다. 정석 FSD의 모든 layer를 도입하기보다 현재 프로젝트 규모에 맞게 단순한 책임 경계를 유지한다.

## Layer Responsibilities

| Layer          | Responsibility                                                                            |
| -------------- | ----------------------------------------------------------------------------------------- |
| `src/app`      | 라우트, 레이아웃, provider 조립, 페이지 단위 composition                                  |
| `src/features` | 인증, 채팅, 매장 지도처럼 도메인 기능 단위의 상태, UI, 타입, API adapter                  |
| `src/shared`   | 여러 feature에서 재사용하는 API client, config, constants, layout, utility, UI primitives |

## Import Rules

- `app`은 `features`와 `shared`를 조립할 수 있다.
- `features`는 `shared`를 import할 수 있다.
- `shared`는 `features`와 `app`을 import하지 않는다.
- feature 간 직접 import는 피하고, 공통화가 필요하면 `shared`로 이동한다.
- route path, UI text, env 접근은 문자열을 흩뿌리지 않고 `shared/constants`, `shared/config`를 우선 사용한다.

## Feature Structure

Feature 내부는 필요에 따라 아래 구조를 사용한다.

```text
features/{feature}
  components/   feature 전용 UI
  hooks/        feature 전용 상태/브라우저 연동
  lib/          feature 전용 helper/API adapter
  types.ts      feature 타입
  constants.ts  feature 상수
```

모든 폴더를 기계적으로 만들지 않고, 실제 파일이 필요할 때만 추가한다.

## Shared UI

`src/shared/ui`는 여러 화면에서 반복되는 기본 UI만 둔다.

- `Button`, `Modal`, `SearchInput`, `Select`, `TextField`처럼 재사용되는 조작 UI
- `LogoutConfirmDialog`, `ThemeToggleButton`, `ToastProvider`처럼 앱 전역 UX에 가까운 UI
- 정보형 컴포넌트는 여러 화면에서 반복될 때만 shared에 둔다.

Feature에 강하게 묶인 UI는 `features/{feature}/components`에 둔다.

현재 feature slice:

- `auth`: 인증 상태, 로그인/회원가입/OAuth service, auth provider
- `home`: 랜딩 화면 섹션
- `chat`: 채팅 UI, 사이드바, 검색, 비로그인 채팅 UX
- `store`: 매장 지도, 매장 목록, 카카오맵 로더

## API Boundary

- 모든 fetch는 `shared/api/requestJson`을 우선 사용한다.
- 인증 쿠키 기반 요청을 위해 `credentials: "include"`를 공통으로 적용한다.
- API별 함수는 feature의 `lib/*Service.ts`에 둔다.
- 백엔드 미구현 기능은 mock adapter를 유지하되, 실제 API가 확정되면 service 단에서만 교체한다.

## Current Phase Boundary

- Phase 1: 인증, OAuth, 비로그인 UX, 핵심 화면 UI, mock 기반 동작, 자동화 테스트 기반
- Phase 2: 채팅 세션, 메시지, AI 응답, 매장, FAQ 등 실제 백엔드 기능 API 연동
