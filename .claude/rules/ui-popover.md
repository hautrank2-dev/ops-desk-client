---
description: Mọi dropdown / combobox / menu nổi phải dùng Popover (hoặc Select, DropdownMenu) của shadcn trong src/components/ui, không tự dựng bằng div absolute.
paths:
  - "src/**/*.tsx"
---

# Popover & lớp nổi — dùng primitive của shadcn

Repo dùng shadcn/ui trên nền `@base-ui/react`. Mọi thứ "nổi" phía trên trang
phải đi qua primitive có sẵn trong `src/components/ui/`:

| Nhu cầu | Dùng |
| --- | --- |
| Combobox / select có search, panel filter, picker tuỳ biến | `Popover`, `PopoverTrigger`, `PopoverContent` (`@/components/ui/popover`) |
| Chọn 1 giá trị từ danh sách tĩnh | `Select` (`@/components/ui/select`) |
| Menu hành động | `DropdownMenu` |
| Form / xác nhận | `Dialog`, `Sheet`, `PopupConfirm` |

## Bắt buộc

- `PopoverTrigger` chính là nút mở — không bọc thêm `<button onClick={toggle}>`.
- Điều khiển mở/đóng bằng `open` + `onOpenChange` của `Popover` khi cần (ví dụ
  đóng sau khi chọn, reset ô search khi đóng).
- Độ rộng theo trigger: `className="w-(--anchor-width)"` trên `PopoverContent`;
  bỏ padding mặc định bằng `p-0 gap-0` khi tự dựng header/list bên trong.
- Không tự thêm `z-50`, `backdrop-blur`, `shadow` cho panel — `PopoverContent`
  đã có (và đã render qua Portal nên không bị cắt bởi `overflow-hidden`).

## Cấm

- `autoFocus` trên input bên trong `PopoverContent` — popup chưa định vị xong
  nên trang bị cuộn lên đầu. Dùng `initialFocus={inputRef}` của `PopoverContent`.

- Panel `absolute` + `useState(open)` tự viết.
- `document.addEventListener("mousedown", …)` để bắt click ra ngoài —
  Popover đã xử lý click-outside, Esc và focus.
- Cài thêm thư viện popover/floating khác (`@floating-ui/*`, `react-popper`, …).

`src/components/ui/asset-combobox.tsx` là code cũ còn vi phạm — sửa theo rule
này khi đụng tới.
