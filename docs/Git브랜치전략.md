# Git 브랜치 전략 — VITA

관련: [05_역할별실행가이드.md](./05_역할별실행가이드.md) | [08_개발표준.md](./08_개발표준.md)

## 1. 브랜치 구조

```
main        ← 배포(prod) 브랜치, 항상 안정 상태 유지
  └─ dev       ← 개발 통합 브랜치, 팀 전체 작업이 모이는 곳
        └─ feat/*   ← 기능별 작업 브랜치 (담당자별로 생성)
```

| 브랜치   | 용도                   | 배포 대상                 | 직접 push 가능 여부 |
| -------- | ---------------------- | ------------------------- | ------------------- |
| `main`   | 발표/데모용 안정 버전  | EC2 prod                  | 불가 (PR 병합만)    |
| `dev`    | 팀 전체 통합 개발 버전 | EC2 dev                   | 불가 (PR 병합만)    |
| `feat/*` | 개별 기능 개발         | 없음 (로컬/개인 테스트용) | 가능                |

## 2. 브랜치 네이밍 규칙

```
feat/{담당영역}-{기능명}
```

| 예시                     | 설명                  |
| ------------------------ | --------------------- |
| `feat/be1-auth-signup`   | BE1, 회원가입 기능    |
| `feat/be2-faq-embedding` | BE2, FAQ 임베딩 배치  |
| `feat/be3-rag-search`    | BE3, RAG 검색 API     |
| `feat/be4-chat-api`      | BE4, Chat API         |
| `feat/be5-store-nearest` | BE5, 가까운 매장 API  |
| `feat/be6-docker-setup`  | BE6, Docker 환경 구성 |
| `feat/fe1-chat-ui`       | FE1, 채팅 화면        |
| `feat/fe2-admin-faq`     | FE2, 관리자 FAQ 화면  |

기타 유형: `fix/*`(버그 수정), `hotfix/*`(prod 긴급 수정, `main`에서 분기), `docs/*`(문서 작업)

## 3. 작업 흐름

```
1. dev에서 최신 상태 pull
   git checkout dev
   git pull origin dev

2. feat 브랜치 생성
   git checkout -b feat/be2-faq-embedding

3. 작업 및 커밋

4. 원격에 push
   git push origin feat/be2-faq-embedding

5. GitHub에서 dev ← feat 으로 Pull Request 생성

6. 코드 리뷰 후 병합 (Squash and Merge 권장)

7. dev에 병합되면 GitHub Actions가 자동으로 EC2 dev에 배포

8. dev가 일정 수준 안정화되면, dev → main으로 PR 생성

9. main 병합 시 GitHub Actions가 자동으로 EC2 prod에 배포
```

## 4. Pull Request 규칙

| 항목         | 규칙                                                          |
| ------------ | ------------------------------------------------------------- |
| PR 대상      | 원칙적으로 `feat/* → dev`                                     |
| 리뷰어       | 최소 1명 이상 승인 후 병합 (같은 영역 담당자 또는 BE6)        |
| 병합 방식    | Squash and Merge                                              |
| PR 제목      | `{type}: {변경 내용 요약}` 형식 (커밋 컨벤션과 동일)          |
| 병합 전 확인 | 로컬 `docker-compose.local.yml`에서 정상 동작 확인 후 PR 생성 |

**PR 제목 예시**

```
feat: FAQ 임베딩 배치 스크립트 구현
fix: JWT 토큰 만료 시 401 대신 500 반환되던 문제 수정
docs: BE6 Docker 환경 구성 가이드 작성
```

**PR 템플릿**

레포의 `.github/PULL_REQUEST_TEMPLATE.md`로 관리 — PR 생성 시 자동으로 채워진다. 내용은 아래와 같다.

```
## 📋 변경 요약

<!-- 이 PR이 뭘 하는지 1~3줄로 -->



## 🏷️ 관련 역할/Phase

- [ ] BE1 - 아키텍처/공통/인증
- [ ] BE2 - FAQ 데이터/임베딩
- [ ] BE3 - RAG 검색
- [ ] BE4 - LLM/Chat API
- [ ] BE5 - 매장/위치
- [ ] BE6 - 공통기반/통합/DevOps
- [ ] FE1 - 인증/AI Chat
- [ ] FE2 - 지도/관리자/UI

Phase: `Phase 1` / `Phase 2` / `Phase 3` (택1, 지우고 남기기)

관련 이슈/문서: <!-- 예: 04_API명세서.md 3.4절, #12 -->

## 🔍 무엇을 왜 바꿨나

<!--
- 어떤 문제/요구사항 때문에 이 변경이 필요했는지
- 대안이 있었다면 왜 이 방식을 선택했는지 (특히 유사도 threshold, 프롬프트 구성, 응답 상태전이 관련 변경 시 중요)
-->



## 🔒 보안 체크리스트 (08_개발표준.md 3절, 해당하는 것만 체크)

- [ ] DB 자격증명이 하드코딩되지 않고 환경변수로 주입됨
- [ ] pgvector 유사도 검색 등 native query가 파라미터 바인딩을 사용함 (문자열 연결 없음)
- [ ] PII(이름/전화/이메일)가 로그·API 응답 양쪽에서 마스킹 처리됨
- [ ] 에러 응답에 `e.getMessage()`나 스택트레이스가 그대로 노출되지 않음
- [ ] `System.out.println` 대신 SLF4J 사용
- [ ] 관리자 API(`/admin/**`)에 `role=ADMIN` 체크가 실제로 걸려있음

## 🧪 RAG/LLM 관련 변경인 경우 (해당 시만 작성)

- [ ] 유사도 threshold 변경이 "관련 정보 없음" 폴백 케이스에 영향 주는지 확인함
- [ ] 프롬프트 변경 시 실제 응답 샘플로 전/후 비교 테스트함
- [ ] 응답 상태(`PENDING`/`COMPLETED`/`FAILED`/`RETRYING`) 전이에 영향 있는지 확인함
- LLM 응답 latency: <!-- 예: 평균 N ms (Bedrock/Ollama 중 무엇 기준인지 명시) -->

## 📸 스크린샷/데모 (프론트 또는 관리자/지도 화면 변경 시)

<!-- 스크린샷, GIF, 또는 응답 예시 캡처 -->



## 🙋 리뷰어에게

<!-- 특별히 봐줬으면 하는 부분, 애매했던 판단, 논의하고 싶은 지점 -->
```

## 5. 커밋 메시지 컨벤션

```
{type}: {변경 내용 요약}
```

| type       | 의미                          |
| ---------- | ----------------------------- |
| `feat`     | 새 기능 추가                  |
| `fix`      | 버그 수정                     |
| `refactor` | 리팩토링 (기능 변화 없음)     |
| `docs`     | 문서 수정                     |
| `chore`    | 빌드/설정/의존성 등 기타 작업 |
| `test`     | 테스트 코드 추가/수정         |

제목은 명령형/현재형, 간결하게. 여러 변경사항을 한 커밋에 욱여넣지 않는다.

## 6. dev → main 병합 시점

- BE6이 진행하는 통합 테스트(Phase 2) 완료 후 병합을 원칙으로 함
- 발표/데모 일정에 맞춰 사전에 main 동결(freeze) 시점을 팀 전체에 공지
- 동결 이후에는 발표 관련 긴급 수정(`hotfix/*`)만 `main`에 직접 반영

## 7. 충돌(Conflict) 처리 원칙

```
git checkout feat/be2-faq-embedding
git fetch origin
git merge origin/dev
# 충돌 해결 후
git push origin feat/be2-faq-embedding
```

같은 파일을 여러 명이 동시에 건드릴 가능성이 있는 영역(공통 Response/Exception, API 규격 등)은
사전에 Slack/노션에서 작업 시점을 조율해 충돌을 최소화한다.

## 8. 기타 원칙

- `feat/*` 브랜치는 병합 후 삭제 (원격/로컬 모두)
- 장기간(1주 이상) 방치된 feat 브랜치는 주간 스크럼 때 진행 상황 공유
- `.env`, 빌드 산출물(`build/`, `.gradle/` 등)은 `.gitignore`로 관리
