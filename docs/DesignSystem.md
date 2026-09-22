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

| Location                | Use                                                  |
| ----------------------- | ---------------------------------------------------- |
| `shared/ui`             | 여러 화면에서 재사용되는 UI primitive 또는 global UI |
| `shared/layout`         | Header, Footer, page-level layout controls           |
| `features/*/components` | 특정 feature에 묶인 UI                               |

Feature UI가 두 곳 이상에서 반복되기 전까지는 `shared/ui`로 올리지 않는다. 반복되거나 정책이 생긴 컴포넌트만 shared로 이동한다.

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
