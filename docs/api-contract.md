# VITA Frontend API Contract

백엔드 구현 전 프론트 mock 화면과 맞춘 1차 계약입니다. 실제 경로명은 백엔드 라우팅 정책에 맞춰 조정할 수 있지만, 응답 필드는 이 구조를 기준으로 협의합니다.

## Chat

### `POST /api/chat`

사용자 질문을 보내고 FAQ 기반 답변을 받습니다.

Request:

```json
{
  "message": "요금제를 변경하고 싶어요.",
  "sessionId": "optional-session-id"
}
```

Response:

```json
{
  "answer": "요금제 변경은 현재 약정, 결합 할인, 데이터 사용량을 함께 확인한 뒤 선택하는 것이 좋아요.",
  "status": "done",
  "sources": [
    {
      "id": "faq-plan-001",
      "title": "요금제 변경 가능 시점과 유의사항",
      "category": "요금제"
    }
  ],
  "actions": [
    {
      "label": "가까운 매장 보기",
      "type": "store_map"
    }
  ]
}
```

Status values:

- `generating`
- `done`
- `failed`

## Stores

### `GET /api/stores/nearby?lat={lat}&lng={lng}`

사용자 위치 기준 가까운 매장 목록을 받습니다.

Response:

```json
{
  "stores": [
    {
      "id": "gangnam-001",
      "name": "VITA 강남역점",
      "address": "서울 강남구 강남대로 396",
      "phone": "02-0000-0001",
      "lat": 37.498095,
      "lng": 127.02761,
      "distanceText": "약 320m"
    }
  ]
}
```

Frontend behavior:

- 프론트는 응답의 `lat`, `lng`로 지도 마커를 표시합니다.
- 길찾기는 프론트에서 카카오맵 링크를 엽니다.
- 카카오 REST/Admin 키는 프론트에 넣지 않습니다.
