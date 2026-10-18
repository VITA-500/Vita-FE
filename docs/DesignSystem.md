# Design System

VITA FE는 Tailwind CSS 4의 `@theme` token과 `src/shared/ui` 공통 컴포넌트를 기반으로 디자인 시스템을 관리한다. 현재 단계에서는 별도 패키지형 디자인 시스템이 아니라, 제품 코드 안에서 바로 재사용되는 lightweight design system이다.

## Tokens

전역 토큰은 `src/app/globals.css`에 둔다.

| Token                                      | Purpose                                        |
| ------------------------------------------ | ---------------------------------------------- |
| `brand`, `brand-hover`, `brand-soft`       | VITA primary action, emphasis, soft background |
| `surface`, `surface-warm`, `surface-muted` | page and panel background                      |
| `text-primary`, `text-secondary`           | main copy and supporting copy                  |
| `border`, `border-soft`                    | card, input, section border                    |
| `hero-*`, `display-*`, `title-*`, `body-*` | responsive typography scale                    |

색상은 되도록 hex 값을 직접 쓰지 않고 token class를 우선 사용한다.

```tsx
className = "bg-brand text-white hover:bg-brand-hover";
className = "bg-surface-muted text-text-secondary";
```

## Component Ownership

| Location                  | Use                                                                  |
| ------------------------- | -------------------------------------------------------------------- |
| `shared/ui/atoms`         | 더 쪼갤 수 없는 UI primitive                                         |
| `shared/ui/molecules`     | atom 조합, 자체 상태가 거의 없는 UI                                  |
| `shared/ui/organisms`     | 자체 상태·동작이 있는 UI 묶음 (도메인을 모르는 것만)                 |
| `shared/providers`        | ThemeProvider, ToastProvider 등 앱 전역 provider                     |
| `shared/layout`           | Header, Footer, page-level layout controls                           |
| `entities/*/ui`           | 특정 데이터에 묶인 작은 UI (매장 핀, 영업 상태 배지, 요금제 카드 등) |
| `features/*/components`   | 특정 feature에 묶인 UI                                               |
| `app/{route}/_components` | 한 화면을 조립하는 컴포넌트 (여러 feature를 합치는 곳)               |

Feature UI가 두 곳 이상에서 반복되기 전까지는 `shared/ui`로 올리지 않는다. 반복되거나 정책이 생긴 컴포넌트만 shared로 이동한다. 특정 데이터(매장, 요금제, 상담 등)를 아는 컴포넌트는 여러 곳에서 쓰더라도 `shared`가 아니라 해당 `entities/*/ui`에 둔다.

## Shared UI Hierarchy

`shared/ui`는 Atomic Design의 세 단계만 사용한다. templates·pages 단계는 `app`이 맡는다. Atomic 구분은 `shared/ui`에만 적용하고, `entities`·`features` 안 컴포넌트에는 적용하지 않는다.

| 단계        | 기준                                                                                                  | 현재 컴포넌트                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `atoms`     | 하나의 요소 수준. 다른 shared UI를 import하지 않고 내부 상태가 없다.                                  | Button, Card, TextField, Select, Logo, UserAvatar, AnimatedLockIcon, BenefitCategoryIcon                                         |
| `molecules` | 여러 요소로 된 하나의 조작·표시 단위. 다른 shared UI는 import하지 않고, 상태는 열림 여부 정도만 둔다. | SearchInput, FilterDropdown, CalendarDateField, ConfirmCheckbox, RailTooltip, ThemeToggleButton, WarningNotice                   |
| `organisms` | 다른 shared UI(atom·organism)를 조합하거나, portal·포커스·단계 진행 같은 동작을 가진다.               | Accordion, ChecklistCard, GuidedStepFlow, InfoTable, Modal, PlanCard, PortalDialog, LogoutConfirmDialog, StatCard, StepGuideCard |

페이지 레이아웃용 컴포넌트(Section, MotionReveal)는 `shared/layout`, 앱 전역 provider(ThemeProvider, ToastProvider)는 `shared/providers`에 둔다.

- 판단 순서: ① 다른 shared UI를 import하면 organism ② 아니면, 여러 요소를 묶은 조작·표시 단위이면 molecule ③ 둘 다 아니면 atom.
- 아래 단계는 위 단계를 import하지 않는다(atoms → molecules·organisms import 금지, molecules → organisms import 금지). organism끼리는 import할 수 있다(예: LogoutConfirmDialog → PortalDialog).
- Storybook title도 같은 구분을 따른다: `Shared/Atoms/Button`, `Shared/Molecules/SearchInput`, `Shared/Organisms/Modal`.
- 한 feature에서만 쓰는 컴포넌트(예: 채팅 답변 카드)는 단계 분류 대상이 아니며, 해당 feature나 entity로 옮긴다.

## Shared UI Rules

### Button

- 주요 CTA는 `Button` 또는 `ButtonLink`의 `primary`를 사용한다.
- 보조 액션은 `secondary`, `outline`, `ghost`를 사용한다.
- 위험 액션은 `danger` 또는 `dangerGhost`만 사용한다.
- 로딩이 필요한 제출 액션은 `isLoading`을 사용한다.

### Dialog

- portal 기반 확인 모달은 `PortalDialog`를 사용한다.
- 로그아웃처럼 재사용되는 확인 UX는 `shared/ui`에 둔다.
- feature 문구와 액션이 강한 모달은 feature component에 두되, surface/overlay는 `PortalDialog`로 통일한다.

### Form

- 단일 입력 필드는 `TextField`를 우선 사용한다.
- 검색 목적 입력은 `SearchInput`을 우선 사용한다.
- select UI는 native select wrapping이 필요한 경우 `Select`를 사용한다.
- feature 전용 form field가 반복되면 먼저 feature 내부 공통 컴포넌트로 묶고, 두 feature 이상에서 반복될 때 `shared/ui`로 올린다.

### Admin

- 관리자 화면은 `Button`, `Card`, `Modal`, `SearchInput`, `Select`를 우선 사용한다.
- 삭제/비활성화처럼 되돌리기 어려운 액션은 `ConfirmCheckbox`와 danger button variant를 함께 사용한다.
- 관리자 라우트는 `shared/constants/routes`를 통해 참조한다.

### Feedback

- 짧은 성공/완료 안내는 `showToast`를 사용한다.
- 페이지를 막는 확인은 dialog를 사용한다.
- 에러 메시지는 가능한 사용자 행동 기준으로 작성한다.

## State UI

| State   | Rule                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------ |
| Loading | 인증 상태 확인처럼 잠깐 잘못된 UI가 보일 수 있으면 skeleton 또는 neutral placeholder를 사용한다. |
| Empty   | 리스트 내부에 작게 숨기지 않고, 사용자가 다음 행동을 알 수 있게 안내한다.                        |
| Error   | API 원문을 그대로 노출하지 않고 서비스 문장으로 바꾼다.                                          |
| Guest   | 로그인 유도는 가능하지만 화면 진입 자체를 막지 않는 범위를 명확히 한다.                          |

## Dark Mode

- `dark:` variant를 모든 주요 surface에 함께 적용한다.
- white overlay는 `dark:bg-white/10`, dark panel은 `dark:bg-zinc-950`을 기본으로 한다.
- 지도, 외부 iframe, bitmap asset은 다크모드에서 컨테이너 edge가 남지 않는지 확인한다.

## Storybook

공통 UI 또는 재사용 가치가 있는 feature component는 Storybook story를 유지한다.

```bash
npm run storybook
npm run build-storybook
```

Storybook build의 큰 chunk warning은 문서 번들 특성상 실패로 보지 않는다. 실제 실패는 exit code와 build completed 여부로 판단한다.
