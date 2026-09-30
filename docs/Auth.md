# Auth Flow

VITA FE 인증은 백엔드가 발급하는 HttpOnly cookie를 기준으로 동작한다. 프론트는 access token 값을 직접 읽지 않고, 서버 상태 확인과 UI 깜빡임 방지를 위한 hint cookie만 관리한다.

## Login

1. 사용자가 로그인 폼을 제출한다.
2. `authService.login`이 `POST /auth/login`을 호출한다.
3. 백엔드는 `accessToken`을 HttpOnly cookie로 내려준다.
4. 프론트는 `vita_has_access_token=1` hint cookie를 저장한다.
5. `AuthProvider.refreshUser(true)`로 `/users/me`를 호출해 사용자 정보를 확인한다.

## Signup

1. 사용자가 회원가입 폼을 제출한다.
2. `authService.signup`이 `POST /auth/signup`을 호출한다.
3. 가입 성공 후 로그인 화면으로 이동한다.
4. 자동 로그인은 현재 프론트 책임 범위에 포함하지 않는다.

## OAuth

1. 소셜 로그인 버튼 클릭 시 백엔드 OAuth 시작 주소로 이동한다.
2. provider별 시작 주소는 `/oauth2/authorization/{provider}`다.
3. 소셜 인증 완료 후 백엔드가 `/login/oauth2/code/{provider}` callback을 처리한다.
4. 백엔드가 자체 `accessToken` cookie를 발급한다.
5. 백엔드가 프론트 `/oauth/callback`으로 redirect한다.
6. 프론트 callback 페이지가 `/users/me`를 호출해 로그인 상태를 확정한다.

OAuth provider는 외부 화면과 배포 redirect URI에 의존하므로, 자동화 테스트보다 배포 환경 수동 QA로 최종 확인한다.

## Auth State

`AuthProvider`는 앱 전역 인증 상태를 관리한다.

- `isReady`: 최초 인증 확인 완료 여부
- `isLoading`: 현재 사용자 확인 요청 진행 여부
- `isAuthenticated`: `/users/me`로 확인된 사용자 존재 여부
- `user`: 현재 사용자 정보

초기 렌더링에서 `vita_has_access_token` hint가 있으면 인증 확인 중 UI를 보여준다. 이를 통해 새로고침 시 로그인 버튼이나 비로그인 사이드바가 잠깐 보이는 문제를 줄인다.

## Logout

1. 사용자가 로그아웃을 확인한다.
2. `authService.logout`이 `POST /auth/logout`을 호출한다.
3. 백엔드는 `accessToken`과 OAuth state용 `JSESSIONID`를 만료시킨다.
4. 프론트는 auth hint를 제거한다.
5. `vita-auth-changed` 이벤트로 인증 상태를 갱신한다.

로그아웃 후 홈으로 강제 이동하지 않는다. 현재 화면에서 비로그인 상태 UI로 전환한다.

## Request Rules

- `requestJson`은 모든 요청에 `credentials: "include"`를 적용한다.
- API 에러는 `ApiError`로 변환한다.
- 비로그인 상태의 `/users/me` 401은 정상적인 인증 확인 실패로 취급한다.
- 향후 백엔드 CSRF가 인증 후 쓰기 API에 요구되면 `requestJson` 또는 별도 auth layer에서 공통 처리한다.

## Deployment QA

배포 후 아래 흐름은 직접 확인한다.

- 자체 회원가입 성공
- 자체 로그인 성공
- 카카오 OAuth 로그인 성공
- 네이버 OAuth 로그인 성공
- 구글 OAuth 로그인 성공
- OAuth 로그아웃 후 재로그인 성공
- 새로고침 후 로그인 상태 유지
- 로그아웃 후 비로그인 UI 전환
- 비로그인 상태에서 `/chat` 진입 가능
