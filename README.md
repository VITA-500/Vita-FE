# Vita

AI 통신 상담 서비스 구현 프로젝트의 프론트엔드입니다. 사용자는 통신 서비스 관련 질문을 채팅으로 입력하고, FAQ 기반 답변과 가까운 매장 안내를 받을 수 있습니다.

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- next-themes
- motion
- driver.js

## 실행 방법

```bash
npm install
npm run dev
```

프로덕션 검증:

```bash
npm run lint
npm run build
```

## 환경 변수

`.env.example`을 기준으로 `.env.local`을 생성합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=카카오맵_JAVASCRIPT_KEY
```

## 프로젝트 구조

```text
src/
  app/                 Next.js 라우트와 전역 설정
    (auth)/            인증 관련 화면
    (marketing)/       랜딩 페이지 레이아웃
    (service)/         서비스 화면 레이아웃
    chat/              AI 상담 화면

  features/            도메인/기능 단위 코드
    home/              랜딩 화면 섹션과 체험 상담
    chat/              채팅 UI, 투어, 채팅 타입
    store/             매장 위치 타입, mock 데이터, 카카오맵 로더

  shared/              앱 전역에서 재사용되는 코드
    api/               백엔드 API 요청 공통 유틸
    config/            환경변수 접근
    constants/         라우트, 화면 문구
    layout/            Header, Footer 등 레이아웃 컴포넌트
    lib/               공통 유틸
    ui/                Button, TextField, Logo 등 공통 UI
```

## 현재 프론트 범위

- 랜딩 페이지
- 로그인 화면
- AI 상담 화면
- 모바일/태블릿/데스크톱 반응형
- 다크 모드
- 체험 상담 모달
- 카카오맵 연동 준비
- 백엔드 API 연결 준비
