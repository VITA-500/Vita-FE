# Frontend Architecture

VITA FE는 Next.js App Router 기반이며, Feature-Sliced Design(FSD)을 참고한 `app / widgets / features / entities / shared` 구조를 사용한다. `app`은 라우트와 페이지 조립을, `widgets`는 여러 feature를 화면 영역으로 조립하는 책임을 맡는다. 공용 UI(`shared/ui`)는 Atomic Design의 `atoms / molecules / organisms`로 나눈다.

## Layer Responsibilities

| Layer          | Responsibility                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/app`      | 라우트, 레이아웃, provider 조립, 페이지 단위 화면 조립                                                                |
| `src/widgets`  | 여러 feature를 화면의 독립 영역으로 조립: 채팅 사이드바, 매장 지도 패널 등                                            |
| `src/features` | 사용자 동작 단위 기능: 채팅 대화, 매장 검색, 길찾기, 예약하기, 로그인, 관리자 화면별 관리 기능 등                     |
| `src/entities` | 데이터(도메인) 단위: 매장, 제휴 혜택, 예약, 위치, 경로, 상담, FAQ, 피드백, 사용자, 요금제의 API·모델·작은 UI          |
| `src/shared`   | 도메인을 모르는 재사용 코드: API client, config, constants, layout, 범용 hook, utility, UI(atoms/molecules/organisms) |

`entities`는 FSD의 entities 계층과 같은 의미다. 사용자 화면과 관리자 화면이 같은 데이터를 다루면 같은 entity를 공유하고, 관리자 전용 API만 entity 안에 따로 둔다.

## Import Rules

```text
app  →  widgets  →  features  →  entities  →  shared
```

- 위 계층은 아래 계층만 import할 수 있다. 아래 계층은 위 계층을 import하지 않는다.
  - `shared`는 `entities`, `features`, `app`을 import하지 않는다.
  - `entities`는 `features`, `widgets`, `app`을 import하지 않는다.
  - `features`는 `widgets`, `app`을 import하지 않는다.
- 같은 계층의 다른 slice는 직접 import하지 않는다.
  - feature 간 직접 import 금지(예: `features/chat` → `features/store`). 여러 feature를 합쳐야 하면 `app`에서 조립하거나, 공통 데이터는 `entities`로 내린다.
  - entity 간 import는 기본적으로 금지한다. 꼭 필요하면 FSD의 `@x` 공개 API를 사용한다: 예약이 매장 타입을 써야 하면 `entities/store/@x/reservation.ts`에서 필요한 것만 export하고, 예약 쪽은 `@/entities/store/@x/reservation`만 import한다.
- slice 외부에서는 공개 API(`index.ts`)로만 import한다. `@/entities/store`는 허용, `@/entities/store/model/storeMappers` 같은 내부 경로 import는 금지.
- route path, UI text, env 접근은 문자열을 흩뿌리지 않고 `shared/constants`, `shared/config`를 우선 사용한다.
- 위 규칙은 `eslint.config.mjs`의 `no-restricted-imports`로 검사한다. 현재 단계는 `warn`이라 커밋·빌드를 막지 않으므로, PR 전에 `npm run lint` 경고를 0으로 맞춘다. `error` 전환은 팀 합의 후 진행한다.
- 상대 경로(`../../`)로 계층을 넘는 import는 검사되지 않으므로 계층 밖은 `@/` 경로로 import한다. 상대 경로는 같은 라우트 안(`./_components` 등)에서만 쓴다.

## Folder Structure

### app

```text
app/{route}
  page.tsx        라우트 진입. 화면 틀과 조립만 둔다.
  layout.tsx
  _components/    이 라우트의 화면 조립 컴포넌트 (예: chat의 ChatPageSidebar, ChatModeContent, ChatStoreMap)
  _hooks/         이 라우트 화면에서만 쓰는 상태 훅 (예: login의 useAuthForm, chat의 useChatSidebarOpen)
  _lib/           이 라우트에서만 쓰는 순수 함수 (예: chat의 chatPageParams — 주소 파라미터 해석)
```

- 페이지 전체 조립과 라우트에 종속된 조립은 app이 맡는다. 여러 feature를 하나의 독립적인 화면 영역으로 묶는 경우에는 widget을 사용한다.

- `_`로 시작하는 폴더는 Next.js 라우트에서 제외된다(private folder).
- 라우트별 데이터 Provider는 해당 페이지 또는 레이아웃에서 조립하며, 전역 관리자 레이아웃에서 모든 도메인 데이터를 선조회하지 않는다.

### widgets

```text
widgets/{widget}
  *.tsx          여러 feature를 화면 영역으로 조립하는 UI
  *.stories.tsx  위젯 단위 시각적 검증
```

- widget은 반드시 여러 라우트에서 재사용되어야 하는 공통 컴포넌트가 아니다. 화면에서 독립적인 영역을 형성하고 여러 feature를 연결하면 widget으로 둔다.
- feature는 사용자 액션·업무 흐름을 완성하고, widget은 그 feature들을 화면 영역으로 배치한다.
- widget은 feature와 entity를 import할 수 있지만, feature가 widget을 import하거나 widget끼리 서로 import하지 않는다.
- 현재 widget: `chat-sidebar`, `store-map-panel`.

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

현재 entity: `store`, `benefit`, `reservation`, `location`, `route`, `chat`, `faq`, `feedback`, `user`. `@x` 공개 API는 `store/@x/route`, `route/@x/store`, `feedback/@x/chat`이 있다. 요금제(`plan`)는 BE 관리자 API만 있어 FE entity는 아직 없다.

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
  lib/          cn, date, geo(좌표·거리), browserStorage, desktopBreakpoint, kakaoMapScript·kakaoMapTypes(카카오맵 SDK 로더·타입)
  config/  constants/  layout/
```

- `shared`에는 도메인을 모르는 코드만 둔다. 매장·요금제·상담처럼 특정 데이터에 묶인 UI는 `entities/*/ui` 또는 `features/*/components`에 둔다.
- 카카오맵 SDK 로더·타입·준비 훅(`shared/hooks/useKakaoMapReady`)은 매장을 모르는 코드라 `shared`에 둔다. 매장 핀·카메라·범위 맞춤처럼 매장 지도 화면에 묶인 코드는 `features/store/map`에 둔다.
- `shared/ui` 하위 분류 기준은 [DesignSystem](./DesignSystem.md)을 따른다.

## Refactoring Rules

- 하나의 컴포넌트 파일은 화면 조합과 표시를 중심으로 유지하며, 400줄을 넘기면 하위 컴포넌트·도메인 훅·helper로 분리한다.
- 파일을 분리할 때 기존 파일의 일부만 별도 staging하지 않고, 하나의 책임 단위에 속한 파일을 함께 커밋한다.
- API 조회·mutation은 entity의 `api`와 `model`(query hook)로 분리하고, 화면 컴포넌트에서 직접 fetch하지 않는다.
- 서버 데이터 조회는 TanStack Query로 통일한다. 같은 데이터는 같은 쿼리 키를 써서 화면이 달라도 캐시를 공유한다. 직접 만든 요청 순서 관리(request id, `isCurrentRequest` 등)는 새로 추가하지 않는다.
- 대시보드 집계는 현재 화면 목록을 재사용하지 않고 별도 집계 query를 사용한다.
- 파일 이동 PR과 로직 변경 PR은 분리한다. 이동 PR은 `git mv`와 import 경로 수정만 포함한다.
- 파일을 옮길 때는 사용처의 import를 모두 새 경로로 바꾸고, 옛 경로에 재내보내기 파일을 남기지 않는다. 진행 중인 다른 브랜치가 그 경로를 쓰고 있을 때만 예외로 두고, 그 브랜치가 머지되면 바로 지운다.

## API Boundary

- 모든 fetch는 `shared/api`의 `requestJson`(스트리밍은 shared 스트리밍 transport)을 사용한다. feature·entity에서 `fetch`를 직접 호출하지 않는다.
- 인증 쿠키 기반 요청을 위해 `credentials: "include"`를 공통으로 적용한다. 게스트 채팅처럼 예외가 필요하면 공통 함수의 옵션으로 처리한다.
- API별 함수는 entity의 `api/`에 둔다. feature에 `*Service` 같은 별칭 객체를 따로 만들지 않고 entity API(`chatApi`, `adminStoreApi` 등)를 그대로 쓴다.
- FE가 부르는 API 경로는 BE 컨트롤러에 실제로 있는 것만 둔다. BE에 아직 없는 API는 mock adapter로 두고, 호출 코드를 미리 만들지 않는다.
- 백엔드 미구현 기능은 mock adapter를 유지하되, 실제 API가 확정되면 entity의 `api/` 안에서만 교체한다.

## Migration (2026-10 구조 리팩토링, 완료)

| 단계 | 내용                                                                                                         | 상태 |
| ---- | ------------------------------------------------------------------------------------------------------------ | ---- |
| 0    | 진행 중 리팩토링 브랜치 머지, 이 문서·DesignSystem 갱신, ESLint 경계 규칙(warn)                              | 완료 |
| 1    | `shared` 정리: `shared/ui` atomic 분류, `shared/hooks`, `shared/providers`                                   | 완료 |
| 2    | `entities` 생성: entity별 `api`·`model` 이동, 중복 API 통합                                                  | 완료 |
| 3    | 조회를 TanStack Query로 통일(지도는 동작 테스트 선행)                                                        | 완료 |
| 4    | 채팅 ↔ 매장 지도 결합 해소(feature 간 직접 import 제거)                                                      | 완료 |
| 5    | features 안을 역할·화면별 하위 폴더로 분리(`store`, `admin`, `chat`), 랜딩 섹션은 `app/(marketing)`으로 이동 | 완료 |
| 6    | `app/{route}/_components`·`_hooks`·`_lib`로 라우트 조립 분리(로그인, 채팅)                                   | 완료 |
| 7    | 화면 영역 조립을 `widgets`로 분리(`chat-sidebar`, `store-map-panel`)                                         | 완료 |
| 8    | 재내보내기 파일 삭제, 쓰지 않는 API 호출 코드 삭제, 문서 정리                                                | 완료 |
| 9    | ESLint 경계 규칙 `error` 전환                                                                                | 보류 |

- 5단계는 처음에 `store`를 별도 feature(store-search·store-map 등)로 나누려 했으나, feature끼리 서로 import하는 구조가 되어 되돌리고 feature 안 하위 폴더 방식으로 바꿨다.
- ESLint 경계 규칙은 팀 합의 전까지 `warn`으로 두고, PR마다 경고 0을 확인한다.

## Current Slices

현재 feature slice:

- `admin`: 관리자 화면. `common`(셸·권한 확인·공통 입력·페이지·데이터 Provider·쿼리 키·폼 스키마), `dashboard`, `partners`(매장+혜택 탭), `stores`, `benefits`, `faq`, `users`, `feedback`(답변 피드백) 하위 폴더로 나뉜다. 화면별 데이터 훅은 각 폴더의 `hooks/`에 둔다.
- `auth`: 로그인·회원가입·OAuth 요청(`authService`), 헤더 로그인 버튼(`HeaderControls`), 마이페이지(`ProfilePanel`). 로그인 상태(`AuthProvider`, `useAuthUser`)·토큰·로그인 복귀 경로는 `entities/user`에 있다.
- `chat`: 채팅 기능. `conversation`(대화 흐름·입력창·전송·스트리밍 표시·투어), `message`(메시지 목록·말풍선·마크다운·진행 단계·답변 피드백), `cards`(요금제 카드·카드 레일), `store`(매장 답변 카드·채팅 지도 슬롯·지도 데이터), `sidebar`(사이드바 내부 기능·상담 목록·메뉴), `search`(상담 검색), `settings`(채팅 설정) 하위 폴더로 나뉜다. 화면 영역 조립체 `ChatSidebar`는 `widgets/chat-sidebar`에 둔다.
- `store`: 매장 기능. `panel`(패널 상태·하위 조립), `search`(검색·목록·필터), `benefit`(제휴 혜택), `map`(지도·핀·카메라), `route`(길찾기), `reservation`(예약), `detail`(매장 상세) 하위 폴더로 나뉜다. 화면 영역 조립체 `StoreMapPanel`은 `widgets/store-map-panel`에 두며, 카카오맵 로더·타입은 `shared`에 있다.

랜딩 화면 섹션과 헤더는 feature가 아니라 `app/(marketing)/_components`에 둔다(마케팅 레이아웃에서만 쓰는 화면 조립).

현재 app 라우트:

- `(marketing)`: 랜딩(`_components`: 섹션 4개, 헤더)
- `(auth)/login`: 로그인·회원가입(`_components`: AuthForm, SocialLoginButtons / `_hooks`: useAuthForm)
- `oauth/callback`: OAuth 콜백
- `(service)/admin/*`: 관리자 화면 배치(`features/admin` 사용)
- `chat`: 채팅·매장 지도·마이페이지(`_components`: ChatPageSidebar, ChatModeContent, ChatPageDialogs, ChatStoreMap / `_hooks`: useChatSidebarOpen, useRailTooltip, useChatStoreMapState / `_lib`: chatPageParams, chatStoreMapView)

## Current Phase Boundary

- Phase 1: 인증, OAuth, 비로그인 UX, 핵심 화면 UI, 관리자 화면 뼈대, mock 기반 동작, 자동화 테스트 기반
- Phase 2: 채팅 세션, 메시지, AI 응답, 매장, FAQ 등 실제 백엔드 기능 API 연동
