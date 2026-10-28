---
paths:
  - "src/**/*.tsx"
---

# Ảnh — mọi ảnh đi qua `@/components/ui/image`

**Mọi ảnh trong `src/` phải render bằng `Image` từ `@/components/ui/image`** —
không có `<img>` trần ở nơi nào khác (file này là chỗ duy nhất được viết `<img>`).
Ảnh nội dung (ticket, asset, comment, ảnh vừa chọn để upload) phải click được
để mở trình xem. Dùng component có sẵn, **không** dùng Antd hay thư
viện lightbox khác:

```tsx
import { ImageGroup, Image } from "@/components/ui/image";

// 1 ảnh
<Image src={fileUrl(path)} alt="…" className="size-full object-cover" />

// Nhiều ảnh trong một dãy → một trình xem chung, có prev / next + thumbnail
<ImageGroup>
  {urls.map((url, i) => (
    <Image key={url} src={url} alt={`Image ${i + 1}`} />
  ))}
</ImageGroup>
```

Trình xem (`ImagePreview`) đã có: lật ngang / dọc, xoay trái / phải, zoom
(nút, cuộn chuột, double-click, phím `+` `-`), kéo để di chuyển, reset,
đếm `n / total`, phím `←` `→`, `Esc` để đóng, thumbnail ở dưới khi có nhiều
ảnh. Thiếu tính năng thì **mở rộng `ui/image.tsx`**, không viết
lightbox riêng ở màn hình khác.

## Bắt buộc

- Không viết `<img>` ngoài `ui/image.tsx`; không dùng `next/image` trực tiếp —
  cần tối ưu ảnh thì thêm vào `Image` để mọi nơi cùng hưởng.
- Danh sách ≥ 2 ảnh liền nhau → bọc trong **một** `<ImageGroup>`; thứ tự trong
  trình xem theo thứ tự DOM.
- Thumbnail nhỏ mà có bản lớn → truyền `previewSrc` cho bản lớn.
- Nút thao tác trên ảnh (xoá, chọn) là nút nhỏ ở góc, **không phủ kín ảnh** —
  nếu không, click không tới được ảnh.

## Cẩn thận khi sửa trình xem (`ImagePreview`)

Các hành vi dưới đây đã có lỗi thật — sửa `ui/image.tsx` phải giữ nguyên:

- **Không bao giờ để ảnh ra khỏi màn hình.** Mọi thay đổi vị trí / scale /
  rotate đi qua `anchor()`: chiều nào ảnh nhỏ hơn khung → neo về giữa; chiều
  nào lớn hơn → mép ảnh không được lọt vào trong khung. Lúc đang kéo thì tự do,
  **thả tay ra là snap về** trong giới hạn (có transition). Thêm thao tác mới
  (nút, phím, gesture) mà quên `anchor()` là lỗi.
- **Kích thước dùng `offsetWidth/offsetHeight`** (không bị transform ảnh hưởng)
  nhân `scale`; xoay 90° / 270° thì **đổi chỗ rộng ↔ cao**. Đừng dùng
  `getBoundingClientRect()` của ảnh — nó đã gồm transform.
- **Zoom bằng cuộn chuột zoom vào đúng điểm con trỏ**, không phải tâm:
  `x' = px - (px - x) * (scale' / scale)` với `p` tính từ tâm khung. Nút zoom
  và phím `+` `-` thì zoom quanh tâm. Double-click cũng zoom vào điểm click.
- **Cuộn chuột chỉ có tác dụng khi con trỏ nằm trên ảnh** — `onWheel` gắn vào
  `<img>`, không gắn vào khung/stage.
- Transition tắt trong lúc kéo (state `dragging`, không đọc `ref` trong render),
  bật lại khi thả để thấy hiệu ứng neo.
- Đổi ảnh (prev / next / thumbnail) hoặc mở lại → reset transform về ban đầu.
- **Ảnh full màn hình, nằm dưới các nút.** Stage là `absolute inset-0 z-0`;
  top bar, toolbar, thumbnails, nút prev / next là lớp `absolute … z-10` phủ
  lên trên — không xếp chúng thành hàng flex chiếm chỗ của ảnh. Vùng phủ phía
  dưới là `pointer-events-none`, chỉ các nút là `pointer-events-auto`, để kéo /
  cuộn trên ảnh không bị chặn ở khoảng trống.

## Ngoại lệ

Avatar, icon, logo, ảnh trang trí, và ảnh nằm trong một control khác (option
của select, trigger của popover) vẫn dùng `Image` nhưng truyền `preview={false}`.

## Cấm

- Cài `antd`, `react-image-lightbox`, `yet-another-react-lightbox`, …
- Tự viết overlay `fixed inset-0` + `useState(previewing)` để xem ảnh.
