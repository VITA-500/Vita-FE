# 관리자 쿼리 규칙 리팩토링

- 기준: `d9047035c3065cada5a24688eae0d28a98af7be6` (2026-10-17 fetch).
- 브랜치: `feat/fe2-admin-query-refactor`. 분석 보고서는 독립 브랜치 `docs/fe-refactoring-audit`의 `c36686f`.
- 목적: FAQ/매장/혜택 쿼리 prefix와 매장·혜택 상호 무효화 규칙의 중복 제거.
- 실제 쿼리 키, 무효화 범위, 동시 무효화와 완료 대기, mock 상태 처리는 유지한다.
- 회원 목록 키 불일치 등 동작 수정은 포함하지 않는다.

## 검증

- `npm ci`: 성공. 문서 분석 브랜치에서 시작해 동일 package-lock의 이 브랜치에서 완료. 설치 초기 실행 파일이 없던 lint/test는 설치 후 재실행했다.
- `npm run lint`: 성공.
- `npm test`: 50개 파일, 206개 테스트 중 203개 통과. ChatSessionMenu 글자 수 불일치 1건과 AdminDashboard/chatPlanCards timeout 2건.
- timeout 두 파일은 `--maxWorkers=2` 재실행에서 모두 통과. 새 캐시 무효화 테스트도 통과. ChatSessionMenu 실패는 재현된다(기대 30/30, 실제 38/30).
- `npm run build`: sandbox와 일반 실행 모두 Turbopack CSS 처리 자식 프로세스 연결 실패. 컴파일 성공으로 취급하지 않는다.
- `npm run build-storybook`: 성공. chunk 크기 경고 있음.
- 추가 Webpack 진단: sandbox에서 `.next/types/app/(service)/admin` 생성 EPERM. 일반 실행 결과는 후속 기록 참조.
- 실제 API/Kakao 지도/예약 생성 및 Docker 통합 검증은 수행하지 않았다. 병합 가능 판정이나 PR 생성은 하지 않는다.

## 검토 포인트

필터가 다른 여러 매장/혜택 캐시를 실제 QueryClient로 채운 뒤 모두 stale 처리되는지, FAQ 캐시와 기존 데이터는 보존되는지 테스트한다.
기존 useAdminStoreData 테스트도 매장 수정 후 혜택 캐시 무효화를 확인한다.
