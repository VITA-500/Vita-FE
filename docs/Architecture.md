# Frontend Architecture

VITA FE는 Next.js App Router 기반이며, Feature-Sliced Design(FSD)을 참고한 `app / features / entities / shared` 4계층의 FSD-lite 구조를 사용한다. 정석 FSD의 `pages`, `widgets` 계층은 두지 않고, 화면 조립은 `app`이 맡는다. 공용 UI(`shared/ui`)는 Atomic Design의 `atoms / molecules / organisms`로 나눈다.

> 2026-10 구조 리팩토링 진행 중. `entities`와 `shared/ui` 하위 구분은 단계적으로 옮기며, 옮기기 전 코드는 기존 위치(`features/*/lib` 등)에 남아 있다. 진행 순서는 아래 "Migration" 절을 따른다.

## Layer Responsibilities

| Layer          | Responsibility                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/app`      | 라우트, 레이아웃, provider 조립, 페이지 단위 화면 조립(여러 feature를 한 화면에 합치는 곳)                            |
| `src/features` | 사용자 동작 단위 기능: 채팅 대화, 매장 검색, 길찾기, 예약하기, 로그인, 관리자 화면별 관리 기능 등                     |
| `src/entities` | 데이터(도메인) 단위: 매장, 제휴 혜택, 예약, 위치, 경로, 상담, FAQ, 피드백, 사용자, 요금제의 API·모델·작은 UI          |
| `src/shared`   | 도메인을 모르는 재사용 코드: API client, config, constants, layout, 범용 hook, utility, UI(atoms/molecules/organisms) |

`entities`는 FSD의 entities 계층과 같은 의미다. 사용자 화면과 관리자 화면이 같은 데이터를 다루면 같은 entity를 공유하고, 관리자 전용 API만 entity 안에 따로 둔다.

## Import Rules

```text
app  →  features  →  entities  →  shared
```

- 위 계층은 아래 계층만 import할 수 있다. 아래 계층은 위 계층을 import하지 않는다.
  - `shared`는 `entities`, `features`, `app`을 import하지 않는다.
  - `entities`는 `features`, `app`을 import하지 않는다.
- 같은 계층의 다른 slice는 직접 import하지 않는다.
  - feature 간 직접 import 금지(예: `features/chat` → `features/store`). 여러 feature를 합쳐야 하면 `app`에서 조립하거나, 공통 데이터는 `entities`로 내린다.
  - entity 간 import는 기본적으로 금지한다. 꼭 필요하면 FSD의 `@x` 공개 API를 사용한다: 예약이 매장 타입을 써야 하면 `entities/store/@x/reservation.ts`에서 필요한 것만 export하고, 예약 쪽은 `@/entities/store/@x/reservation`만 import한다.
- slice 외부에서는 공개 API(`index.ts`)로만 import한다. `@/entities/store`는 허용, `@/entities/store/model/storeMappers` 같은 내부 경로 import는 금지.
- route path, UI text, env 접근은 문자열을 흩뿌리지 않고 `shared/constants`, `shared/config`를 우선 사용한다.
- 위 규칙은 `eslint.config.mjs`의 `no-restricted-imports`로 검사한다. 리팩토링 기간에는 `warn`으로 두고, 마무리 단계에서 `error`로 올린다. 상대 경로(`../../`)로 계층을 넘는 import는 검사되지 않으므로 계층 밖은 `@/` 경로로 import한다.

## Folder Structure

### app

```text
app/{route}
  page.tsx        라우트 진입. 화면 분기(mode 등)만 둔다.
  layout.tsx
  _components/    이 라우트의 화면 조립 컴포넌트 (예: ChatScreen, MapScreen, ProfileScreen)
```

- `_`로 시작하는 폴더는 Next.js 라우트에서 제외된다(private folder).
- 같은 화면 조립을 여러 라우트에서 쓰게 되면 그때 별도 계층(FSD의 widgets) 도입을 검토한다.
- 라우트별 데이터 Provider는 해당 페이지 또는 레이아웃에서 조립하며, 전역 관리자 레이아웃에서 모든 도메인 데이터를 선조회하지 않는다.

### features

```text
features/{feature}
  components/   feature 전용 UI
  hooks/        feature 전용 상태/브라우저 연동
  lib/          feature 전용 helper
  types.ts      feature 타입
  constants.ts  feature 상수
```

- 모든 폴더를 기계적으로 만들지 않고, 실제 파일이 필요할 때만 추가한다.
- API 호출과 응답 변환은 feature가 아니라 entity에 둔다. feature는 entity의 query hook·mutation을 사용한다.
- feature가 커지면 별도 feature로 쪼개지 않고 feature 안에서 하위 폴더로 나눈다. 하위 폴더끼리는 서로 import할 수 있다(같은 slice).
  - 예: `features/store/{panel,search,benefit,map,route,reservation,detail}/{components,hooks,lib}`
  - feature를 둘로 나누면 서로 import할 수 없어서, 함께 움직이는 검색·지도·길찾기를 묶는 조립 코드가 갈 곳이 없어진다. 그래서 feature를 나누는 건 정말 따로 동작하는 기능일 때만 한다.

### entities

```text
entities/{entity}
  api/          API 호출 함수 (사용자용), admin.ts (관리자용)
  model/        타입, 응답→화면 모델 변환, 쿼리 키·query hook, 도메인 규칙
  ui/           해당 데이터의 작은 UI (매장 핀, 영업 상태 배지, 요금제 카드 등)
  lib/          entity 내부 helper
  @x/           다른 entity에 공개하는 API (필요할 때만)
  index.ts      외부 공개 API
```

예정 entity: `store`, `benefit`, `reservation`, `location`, `route`, `chat`, `faq`, `feedback`, `user`, `plan`

### shared

```text
shared/
  ui/
    atoms/        더 쪼갤 수 없는 UI (Button, TextField, Logo, UserAvatar)
    molecules/    atom 조합, 자체 상태가 거의 없음 (SearchInput, FilterDropdown, CalendarDateField)
    organisms/    자체 상태·동작이 있는 묶음 (Modal, PortalDialog, GuidedStepFlow)
  providers/    ThemeProvider, ToastProvider 등 앱 전역 provider
  hooks/        범용 hook (요소 크기, 뷰포트, 바깥 클릭 등)
  api/          requestJson, 스트리밍, 응답·에러 처리
  lib/          cn, date, browserStorage, kakao-map(SDK 로더·타입·카메라·범위 맞춤)
  config/  constants/  layout/
```

- `shared`에는 도메인을 모르는 코드만 둔다. 매장·요금제·상담처럼 특정 데이터에 묶인 UI는 `entities/*/ui` 또는 `features/*/components`에 둔다.
- 카카오 지도 엔진(SDK 로더, 카메라, 범위 맞춤)은 매장을 모르는 지도 기능이므로 `shared/lib/kakao-map`에 두고, 매장 핀처럼 매장에 묶인 지도 UI는 `entities/store/ui`에 둔다.
- `shared/ui` 하위 분류 기준은 [DesignSystem](./DesignSystem.md)을 따른다.

## Refactoring Rules

- 하나의 컴포넌트 파일은 화면 조합과 표시를 중심으로 유지하며, 400줄을 넘기면 하위 컴포넌트·도메인 훅·helper로 분리한다.
- 파일을 분리할 때 기존 파일의 일부만 별도 staging하지 않고, 하나의 책임 단위에 속한 파일을 함께 커밋한다.
- API 조회·mutation은 entity의 `api`와 `model`(query hook)로 분리하고, 화면 컴포넌트에서 직접 fetch하지 않는다.
- 서버 데이터 조회는 TanStack Query로 통일한다. 같은 데이터는 같은 쿼리 키를 써서 화면이 달라도 캐시를 공유한다. 직접 만든 요청 순서 관리(request id, `isCurrentRequest` 등)는 새로 추가하지 않는다.
- 대시보드 집계는 현재 화면 목록을 재사용하지 않고 별도 집계 query를 사용한다.
- 파일 이동 PR과 로직 변경 PR은 분리한다. 이동 PR은 `git mv`와 import 경로 수정만 포함한다.
- 이동한 파일의 옛 경로에는 리팩토링 기간 동안 `export * from "새 경로"` 재내보내기 파일을 남겨 진행 중인 브랜치가 깨지지 않게 하고, 마무리 단계에서 일괄 삭제한다.

## API Boundary

- 모든 fetch는 `shared/api`의 `requestJson`(스트리밍은 shared 스트리밍 transport)을 사용한다. feature·entity에서 `fetch`를 직접 호출하지 않는다.
- 인증 쿠키 기반 요청을 위해 `credentials: "include"`를 공통으로 적용한다. 게스트 채팅처럼 예외가 필요하면 공통 함수의 옵션으로 처리한다.
- API별 함수는 entity의 `api/`에 둔다(이동 전 코드는 `features/*/lib/*Service.ts`).
- 백엔드 미구현 기능은 mock adapter를 유지하되, 실제 API가 확정되면 entity의 `api/` 안에서만 교체한다.

## Migration

| 단계 | 내용                                                                                      | 종류      |
| ---- | ----------------------------------------------------------------------------------------- | --------- |
| 0    | 진행 중 리팩토링 브랜치 머지, 이 문서·DesignSystem 갱신, ESLint 경계 규칙(warn)           | 문서·설정 |
| 1    | `shared` 정리: `shared/ui` atomic 분류, `shared/hooks`, `shared/providers`                | 이동      |
| 2    | `entities` 생성: entity별 `api`·`model` 이동, 중복 API 통합                               | 이동      |
| 3    | 조회를 TanStack Query로 통일(지도는 동작 테스트 선행)                                     | 로직      |
| 4    | 채팅 ↔ 매장 지도 결합 해소(feature 간 직접 import 제거)                                   | 로직      |
| 5    | `features/store` 안을 하위 폴더(panel·search·benefit·map·route·reservation·detail)로 분리 | 이동      |
| 6    | `app/{route}/_components`로 화면 조립 분리                                                | 로직      |
| 7    | 재내보내기 파일 삭제, ESLint 경계 규칙 `error`, 문서 최종 정리                            | 설정      |

## Current Slices

현재(이동 전) feature slice:

- `admin`: 관리자 대시보드, 회원·FAQ·매장·제휴처·혜택·답변 피드백 관리 UI와 TanStack Query 기반 데이터 상태
- `auth`: 인증 상태, 로그인/회원가입/OAuth service, auth provider
- `chat`: 채팅 UI, 스트리밍, 사이드바, 검색, 비로그인 채팅 UX, 채팅 매장 추천
- `store`: 매장 지도 패널. `panel`(패널 조립·상태), `search`(검색·목록·필터), `benefit`(제휴 혜택), `map`(지도·핀·카메라), `route`(길찾기), `reservation`(예약), `detail`(매장 상세) 하위 폴더로 나뉜다. 카카오맵 로더·타입은 `shared`에 있다.

랜딩 화면 섹션과 헤더는 feature가 아니라 `app/(marketing)/_components`에 둔다(마케팅 레이아웃에서만 쓰는 화면 조립).

## Current Phase Boundary

- Phase 1: 인증, OAuth, 비로그인 UX, 핵심 화면 UI, 관리자 화면 뼈대, mock 기반 동작, 자동화 테스트 기반
- Phase 2: 채팅 세션, 메시지, AI 응답, 매장, FAQ 등 실제 백엔드 기능 API 연동
