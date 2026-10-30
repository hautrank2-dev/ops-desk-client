---
paths:
  - "src/**/*.{ts,tsx}"
---

# Gọi API — chỉ dùng `httpClient`

Mọi lời gọi API đi qua `httpClient` từ `@/lib/httpClient`. Nó lo sẵn base URL,
gắn token, và serialize query (mảng lặp key, bỏ `undefined`/`null`).

## Cấm

- `fetch(...)` để gọi API.
- Tạo thêm axios instance, hoặc gọi `axios` trực tiếp.
- Tự gắn header `Authorization` hay tự ghép base URL.

## Ngoại lệ

`src/components/ai/chat-widget/hook.ts` đang dùng `fetch` cho `POST /ai/chat`
vì đây là SSE stream. Đây là ngoại lệ duy nhất; không thêm chỗ mới.
