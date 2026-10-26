# VITA Frontend API Contract

이 문서는 `C:\Vita-BE`의 현재 컨트롤러와 DTO를 기준으로 작성한 FE 계약 문서다. 과거 mock 계약(`/api/chat`, `/api/stores`)은 현재 계약이 아니다.

## 공통 규칙

- API base URL은 `NEXT_PUBLIC_API_BASE_URL`이다.
- 회원 요청은 `credentials: include`와 HttpOnly access-token cookie를 사용한다.
- 비회원 채팅은 `X-Guest-Id` UUID 헤더와 `credentials: omit`을 사용한다.
- 쿠키 인증 상태의 쓰기 요청은 `GET /auth/csrf` 응답의 `headerName`, `token`을 CSRF 헤더로 보낸다. 로그인·회원가입 및 쿠키 인증이 없는 게스트 요청은 BE CSRF 면제 대상이다.
- 오류 응답은 wrapper 없이 `{ code, message, fieldErrors }` 형식이다. `fieldErrors`는 `VALIDATION_ERROR`일 때만 `{ field, message }` 배열로 제공될 수 있다.
- 관리자 API 권한 검증은 BE가 담당한다.

주요 오류 코드는 `UNAUTHORIZED`(401), `FORBIDDEN`(403), `VALIDATION_ERROR`(400), `NOT_FOUND`(404), `CONFLICT` 계열(409)이다. 로그인 실패는 계정 존재 여부·정지 여부·비밀번호 오류를 구분하지 않고 `INVALID_CREDENTIALS`(401)로 응답한다. BE에 별도 계정 잠금 오류 코드는 없다.

## Auth

| Method | Path           | 설명                             |
| ------ | -------------- | -------------------------------- |
| POST   | `/auth/signup` | 회원가입                         |
| POST   | `/auth/login`  | 로그인, access token cookie 발급 |
| POST   | `/auth/logout` | 로그아웃                         |
| GET    | `/auth/csrf`   | CSRF token 발급                  |
| GET    | `/users/me`    | 현재 사용자 조회                 |
| PATCH  | `/users/me`    | 마이페이지 수정                  |

OAuth 시작 경로는 `{API_BASE_URL}/oauth2/authorization/{provider}`이며 provider는 `google`, `kakao`, `naver`다.

## Chat

세션 API:

- `POST /chat/sessions`: 회원 또는 게스트 세션 생성
- `GET /chat/sessions`: 회원 세션 목록
- `POST /chat/sessions/{sessionId}/claim`: 게스트 세션을 회원 계정으로 이전
- `PATCH /chat/sessions/{sessionId}/pin`: 회원 세션 고정
- `PATCH /chat/sessions/{sessionId}/title`: 회원 세션 이름 변경(1~30자)
- `DELETE /chat/sessions/{sessionId}`: 회원 세션 소프트 삭제

질문 전송:

```json
POST /chat/sessions/{sessionId}/messages
{"content":"가까운 매장을 알려줘","lat":37.5,"lng":127.0}
```

응답은 `messageId`, `status`, `answer`, `relatedFaqIds`, `plans`, `createAt`, `latencyMs`를 가진다. `status`는 `PENDING`, `COMPLETED`, `FAILED`, `RETRYING`이다.

`PENDING`인 경우 `GET /chat/sessions/{sessionId}/events`를 `text/event-stream`으로 구독한다. 이벤트는 `connected`, `assistant_status`, `assistant_delta`, `assistant_done`, `assistant_error`이며, status 단계는 `thinking`, `retrieving_faq`, `generating`, `retrying`이다. 스트림이 끊기면 `GET /chat/sessions/{sessionId}/messages`로 저장된 답변을 polling한다.

피드백은 `POST /chat/messages/{messageId}/feedback`으로 보내며 body는 `{ "feedback": "LIKE" | "DISLIKE" | null, "comment": "..." }`다.

## Stores, directions, reservations

| Method | Path                             | 주요 계약                                                                                   |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/stores/nearest`                | `lat`, `lng` 필수                                                                           |
| GET    | `/stores/nearby`                 | `lat`, `lng`, `radius` 필수; `storeType`, `category`, `benefitId`, `openNow`, `openAt` 선택 |
| GET    | `/stores/{storeId}`              | 매장 상세                                                                                   |
| GET    | `/stores/{storeId}/directions`   | `fromLat`, `fromLng`, `mode` 필수                                                           |
| POST   | `/stores/{storeId}/reservations` | 회원·통신 매장만 예약, `date`, `time` 요청                                                  |
| GET    | `/benefits/list`                 | 제휴 혜택 목록                                                                              |
| GET    | `/benefits/{category}/stores`    | 제휴 매장 목록                                                                              |

directions의 `mode`는 `car`, `walk`, `bicycle`, `transit`이다. 응답은 `path`, `segments`, `routes`를 가지며, 경로 후보는 `tags`, `routeType`, `distanceMeters`, `durationSeconds`, `fare`, `transfers`, `taxiFare`, `toll`, `segments`, `guides`를 포함할 수 있다. `guides`는 `guidance`, `name`, `distanceMeters`, `lat`, `lng`으로 구성되는 회전/진행 안내이며 FE가 표시한다.

예약 응답은 `reservationId`, `storeId`, `storeName`, `date`, `time`, `status`(`CONFIRMED`)다.

## Admin

현재 FE가 사용하는 관리자 API는 `/admin/stores`, `/admin/benefits`, `/admin/faqs`, `/admin/users`, `/admin/plans`, `/admin/stats/chat`, `/admin/traces`다.

요금제 API:

| Method | Path                    | 설명                                                      |
| ------ | ----------------------- | --------------------------------------------------------- |
| GET    | `/admin/plans`          | `page`, `size`, `keyword`, `sortBy` 기반 서버 페이지 목록 |
| POST   | `/admin/plans`          | 요금제 등록, 성공 시 201                                  |
| PATCH  | `/admin/plans/{planId}` | 요금제 부분 수정                                          |
| DELETE | `/admin/plans/{planId}` | 요금제 비활성화                                           |

요금제 등록 필수값은 `planCode`, `name`, `summary`, `price`, `networkType`, `targetGroup`, `dataPolicy`, `voicePolicy`, `smsPolicy`, `description`이다. 문자열 최대 길이는 각각 `50`, `100`, `255`, `20`, `20`, `20`, `20`, `20`이며 `price`, `minAge`, `maxAge`는 0 이상, `baseDataMb`, `exhaustedSpeedKbps`, `voiceMinutes`, `smsCount`는 양수다. 수정은 필드 생략과 명시적 `null`을 구분한다. 알 수 없는 필드는 거부된다.

현재 BE controller의 요금제 목록 필터에는 `targetGroup`이 없으므로, 대상 그룹을 선택하면 FE는 100건 단위로 서버의 전체 페이지를 조회한 뒤 필터링한다. 일반 목록 조회는 사용자가 선택한 `page`·`size`를 서버에 전달한다. 가입 연령은 0~150세의 정수이며 최소 연령은 최대 연령을 넘을 수 없다. 대상 그룹별 고정 연령 범위는 BE 계약에 없다.

Trace 목록도 공통 `PageResponse`(`content`, `totalCount`, `totalPages`, `currentPage`)를 사용한다. 소셜 계정의 이메일 및 매장 전화번호·영업시간 등은 null일 수 있으며, 화면 표시 시 빈 값으로 정규화한다. 비밀번호는 공백 없이 8자 이상이며 영문·숫자·특수문자를 모두 포함해야 한다. 비밀번호 원문은 trim하지 않는다.

목록 응답은 다음 `PageResponse` 형태다.

```json
{ "content": [], "totalCount": 0, "totalPages": 0, "currentPage": 0 }
```

## 계약 변경 원칙

- BE DTO/컨트롤러가 변경되면 이 문서와 `src/entities/*/api` 타입을 함께 갱신한다.
- FE에서 아직 사용하지 않는 BE 필드도 계약 타입에는 가능한 한 보존한다.
- mock은 API 계약을 대체하지 않으며 Storybook·API 미설정 환경의 fallback으로만 사용한다.
