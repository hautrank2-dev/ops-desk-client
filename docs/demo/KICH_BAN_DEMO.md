# Kịch bản demo OpsDesk (Web + Backend)

> Phạm vi: **ops-desk-client** (Next.js, port 3004) và **ops-desk-server** (NestJS + MongoDB, port 3003). Không demo mobile.
> Thời lượng: khoảng **20 phút**, gồm 15 phút demo và 5 phút hỏi đáp.
> Kịch bản bám theo code ở `ops-desk-client@9b5e87c` / `ops-desk-server@ebefd58` (28/09/2026).
> Mục **6. Vùng cấm** liệt kê những thao tác đang lỗi. Hãy đọc mục này trước khi tập.

---

## 0. Bối cảnh dự án: cần nói rõ ngay từ đầu

> **OpsDesk gồm 3 project: `ops-desk-server` (NestJS), `ops-desk-client` (Next.js) và `ops-desk-mobile-app` (Expo/React Native). Cả 3 được làm ra để HỌC và LUYỆN công nghệ, và phần lớn code được tự viết tay, hầu như không dùng AI.**

Điều này cần được nhấn mạnh xuyên suốt buổi demo:

- **Mục tiêu là học, không phải sản phẩm thương mại.** Mỗi project là nơi thực hành một stack cụ thể:
  - **Backend:** NestJS module/DTO/guard, Mongoose, JWT, upload Cloudinary, Swagger, RxJS.
  - **Web:** Next.js App Router, React Query, react-hook-form + zod, shadcn/base-ui, Tailwind.
  - **Mobile:** Expo Router, gluestack-ui, và dùng lại chính backend của web.
- **Hầu hết không dùng AI.** Kiến trúc, cách tổ chức module, luồng nghiệp vụ và phần lớn code do tự tìm hiểu và tự viết. AI chỉ được dùng ở những chỗ phụ trợ, không phải để sinh ra ứng dụng.
- **Lỗi còn tồn tại là một phần của quá trình học.** Những chỗ chưa hoàn thiện (mục 6) nên được trình bày thẳng thắn, như những bài học rút ra và việc sẽ làm tiếp. Không cần che giấu.

---

## 1. Thông điệp chính

OpsDesk quản lý **tài sản** (asset → từng item có serial và vị trí) và **ticket bảo trì/sửa chữa** gắn với các item đó, có phân công, độ ưu tiên, hạn xử lý và luồng thảo luận.

Câu chuyện xuyên suốt buổi demo:

> *"Điều hoà phòng họp không lạnh, chảy nước."*
> Tìm thiết bị → xem ticket liên quan → trao đổi, cập nhật tiến độ → đóng ticket. Sau đó quản trị viên xem số liệu tổng quan và quản lý danh mục.

Năm điểm cần làm nổi bật:

1. Tài sản được quản lý tới **từng item vật lý**, gồm serial, vị trí và trạng thái.
2. Ticket có **mã tự sinh** (`OPS-000123`) và vòng đời: New → Assigned → Doing → Waiting → Done/Cancelled.
3. Khi ticket được tạo, **trạng thái item tự đồng bộ** sang `Maintenance` ở backend.
4. Bình luận dạng **luồng lồng nhau** (3 cấp), đính kèm được ảnh (Cloudinary).
5. Backend có **Swagger**, validate DTO chặt, JWT, và API dashboard riêng theo từng vai trò.

---

## 2. Chuẩn bị

### T-1 ngày

- [ ] `git pull` cả 2 repo, chạy `pnpm install`.
- [ ] Chỉnh seed về đúng ngày demo. `ops-desk-server/scripts/seed-demo.cjs` đang cố định `NOW = 2026-08-23`, nên hạn của ticket đang mở rơi vào khoảng 20/08–22/09/2026. Tính đến ngày demo, **gần như mọi ticket mở đều đã quá hạn**, làm số "overdue" trên dashboard trông rất tệ.
  Sửa dòng `const NOW = new Date('2026-08-23T09:00:00.000Z')` thành ngày demo, rồi chạy:
  ```bash
  node scripts/unseed-demo.cjs
  ```
  ```bash
  node scripts/seed-demo.cjs
  ```
  Seed chỉ **thêm** dữ liệu, không xoá dữ liệu cũ. Danh sách `_id` được ghi vào `locals/seed-demo-ids.json` để rollback.
- [ ] Làm các bản vá ở **mục 7** nếu muốn demo luồng tạo ticket trên web. Nếu không vá, bỏ qua cảnh 3b.
- [ ] Tập toàn bộ kịch bản ít nhất 1 lần trên đúng máy và mạng sẽ dùng khi demo.

### T-30 phút

- [ ] Server: `cd ops-desk-server && pnpm dev`. Kiểm tra http://localhost:3003/docs mở được.
- [ ] Client: `cd ops-desk-client && pnpm dev`. Kiểm tra http://localhost:3004 hiện trang login.
- [ ] `.env` của client có `NEXT_PUBLIC_API_BASE_URL=http://localhost:3003/api`. Trang **Settings** phải để trống, không ghi đè URL.
- [ ] Mở sẵn các tab: (1) web ở trang Login, (2) Swagger `/docs`, (3) một terminal để chạy `curl`.
- [ ] Trình duyệt: zoom 110–125%, tắt thông báo, xoá `localStorage` cũ (DevTools → Application → Clear storage).
- [ ] Ghi sẵn ra giấy mã 2 ticket sẽ dùng, lấy từ danh sách ticket: một ticket **Điều hoà** ở trạng thái `New` hoặc `Assigned`, và một ticket có nhiều bình luận.

### Tài khoản demo (do seed tạo)

Mật khẩu chung nằm ở hằng `DEMO_PASSWORD` trong `ops-desk-server/scripts/seed-demo.cjs`.

| Username | Vai trò | Dùng để |
|---|---|---|
| `minh.nguyen` | admin | Tài khoản chính khi demo |
| `lan.tran` | manager | Minh hoạ phân quyền dashboard (chỉ gọi API) |
| `hung.vo` | user | Minh hoạ bị chặn `403` ở API admin |
| `tuan.hoang` | user, **blocked** | Minh hoạ tài khoản bị khoá không đăng nhập được |

---

## 3. Dòng thời gian

| # | Cảnh | Thời lượng | Màn hình |
|---|---|---|---|
| 0 | Mở đầu, bối cảnh | 1' | Slide hoặc trang Login |
| 1 | Đăng nhập và bảo vệ route | 1'30 | Web `/login` |
| 2 | Tài sản và item | 3' | Web `/assets`, `/assets/[id]`, `/assets/asset-item` |
| 3 | Ticket: xử lý sự cố điều hoà | 4' | Web `/tickets`, `/tickets/[id]` |
| 4 | Danh mục: phòng ban, vị trí, người dùng | 2' | Web `/departments`, `/locations`, `/users` |
| 5 | Backend: Swagger, dashboard API, luồng tạo ticket | 3'30 | Swagger và terminal |
| 6 | Tổng kết và hướng phát triển | 1' | Web |

---

## 4. Kịch bản chi tiết

### Cảnh 0: Mở đầu (1')

**Nói:** "Ở các văn phòng, máy lạnh hỏng, máy in kẹt hay mất mạng thường được báo qua Zalo và rất dễ bị trôi. OpsDesk gom tất cả về một chỗ: biết thiết bị nào đang nằm ở đâu, đang hỏng gì, ai đang xử lý và bao giờ xong."

Giới thiệu kiến trúc trong 1 câu: *Next.js 16 + React Query + shadcn/base-ui ở frontend; NestJS 11 + MongoDB (Mongoose) + JWT + Cloudinary ở backend.*

**Nói (bắt buộc):** "Trước khi bắt đầu, em muốn nói rõ: OpsDesk gồm 3 project là backend, web và mobile. Em làm cả 3 để **học và luyện công nghệ**, và **phần lớn là tự viết tay, hầu như không dùng AI**. Vì vậy, bên cạnh tính năng, mọi người sẽ thấy cả những chỗ em vẫn đang học và cải thiện."

### Cảnh 1: Đăng nhập (1'30)

1. Đăng nhập `minh.nguyen` với **sai mật khẩu**. Form hiện lỗi `Invalid credentials` do server trả về.
2. Đăng nhập `tuan.hoang`. Hiện `User is blocked` (server trả `403`).
3. Đăng nhập `minh.nguyen` với mật khẩu đúng. Ứng dụng chuyển vào trang chính.

**Điểm kỹ thuật:**
- Token JWT được gắn vào mọi request qua interceptor của `httpClient`.
- `ProtectedRoute` gọi `/auth/valid-token` trước khi render layout. Nếu không có token hoặc token sai, người dùng bị đưa về `/login`.
- Demo nhanh: mở `/tickets` trong cửa sổ ẩn danh. Trang tự chuyển về `/login`.

> ⚠️ Trang Dashboard `/` hiện đang dùng **số liệu giả, hard-code** (1,284 assets, 42 tickets…). **Đừng đọc số trên trang này.** Nói: "Đây là layout dashboard, số liệu thật em sẽ lấy từ API ở phần backend", rồi chuyển ngay sang Assets.

### Cảnh 2: Tài sản và item (3')

1. Sidebar → **Assets → Asset List**.
2. Lọc **Type = IT**, gõ **Vendor = Dell**. Kết quả còn `LAP-DELL-5540 – Laptop Dell Latitude 5540`. Bấm **Clear** để bỏ lọc.
   - Nói: bộ lọc có debounce; server tìm kiếm theo partial match và có phân trang.
3. Gõ **Name = Camera** và mở `CAM-DOME-DS2CD`. Asset này có sẵn ảnh thật trên Cloudinary.
   - Tab **Info**: code, vendor, model, mô tả.
   - Tab **Images**: ảnh thiết bị.
   - Tab **Items**: 12 camera, mỗi cái có mã `CAM-DOME-DS2CD-001…`, serial, vị trí và trạng thái.
   - Nói: "Một asset là một *loại* thiết bị. Mỗi item là *một chiếc cụ thể* đang gắn ở một vị trí."
4. Sidebar → **Asset Items**. Lọc **Location = Server Room**. Danh sách còn các item đang đặt trong phòng máy chủ (switch, UPS…).

> ⚠️ Ở cảnh này **không** dùng bộ lọc *Status*, **không** chọn nhiều item để đổi trạng thái hàng loạt, **không** sửa trạng thái item, và **không** lọc asset *Inactive*. Lý do ở mục 6.

### Cảnh 3: Ticket, sự cố điều hoà (4')

**3a. Theo dõi và cập nhật ticket có sẵn** (luồng chính, đang chạy được)

1. Sidebar → **Tickets**. Danh sách có phân trang, mã `OPS-xxxxxx`, và badge màu cho priority/status.
2. Mở ticket **"Điều hoà không lạnh, chảy nước"** đã chuẩn bị.
   - Trang chi tiết hiện đang mở thẳng **form chỉnh sửa**. Trình bày nó như "màn hình xử lý ticket".
   - Chỉ vào: type `Repair`, priority, status, mô tả, tab **Images**.
3. Kéo xuống phần **bình luận**:
   - Chỉ luồng trả lời 3 cấp có sẵn (root → reply → reply). Nói: "Kỹ thuật viên và người báo lỗi trao đổi ngay trên ticket, không cần nhóm chat."
   - **Thêm bình luận:** "Đã vệ sinh dàn lạnh và nạp gas, nhờ anh chị kiểm tra lại." Đính kèm 1 ảnh (≤ 2 ảnh).
   - Sửa lại nội dung bình luận vừa viết để minh hoạ quyền sở hữu: chỉ người viết mới thấy nút sửa/xoá.
4. Cập nhật tiến độ: **Status: Doing → Done**, **Root Cause**: "Bẩn dàn lạnh, thiếu gas", rồi **Save**.
5. Quay lại danh sách. Ticket đã hiện `Done`.

**3b. Tạo ticket mới** *(chỉ làm khi đã vá mục 7.1, nếu chưa thì bỏ qua)*

- **Tickets → New Ticket**. Nhập Title "Máy chiếu mất tín hiệu HDMI", Type `Repair`, Priority `High`, chọn **2 item** máy chiếu, đính kèm 1 ảnh, rồi **Save**.
- Mã `OPS-…` do server sinh. Mở **Asset Items** và lọc theo asset máy chiếu: 2 item vừa chọn đã chuyển sang `Maintenance`.
- Nếu chưa vá, trình diễn đúng luồng này ở **cảnh 5**, bằng API.

### Cảnh 4: Danh mục quản trị (2')

1. **Departments** → **Add**: code `QA`, name "Quality Assurance". Bảng cập nhật ngay.
2. **Locations** → **Add**: code `MEET-B1-01`, name "Phòng họp hầm B1", **floor = B1**.
   Chỉ chọn tầng `B1` hoặc `B2`, lý do ở mục 6.
3. **Users**: chỉ **xem** danh sách. Chỉ ra cột role (admin/manager/user) và status (`tuan.hoang` đang `blocked`, là tài khoản vừa bị chặn đăng nhập ở cảnh 1).

> ⚠️ **Không thêm (Add) và không sửa (Edit) user** trong buổi demo, vì cả hai request đang bị server trả 400 (mục 6). Nếu đã vá mục 7.6 thì có thể tạo `demo.guest`, role `user`, phòng ban `QA`.

### Cảnh 5: Backend (3'30)

Mở http://localhost:3003/docs.

1. **Swagger:** lướt qua các nhóm API: auth, asset, asset-item, ticket, ticket-comment, location, department, user, dashboard.
2. **Đăng nhập lấy token:** `POST /api/auth/signin` với `minh.nguyen`. Copy `token`, bấm **Authorize**, dán `Bearer <token>`.
3. **Dashboard thật:** `GET /api/dashboard/admin`.
   - Chỉ vào `totals` (assets, items, tickets, locations, users), `tickets.open`, `tickets.overdue`, phân bố theo status và priority, `items.byStatus`.
   - Nói: "Dashboard có 3 bản theo vai trò: `/admin`, `/manager`, và `/user`. Bản `/user` chỉ trả số liệu của người đang đăng nhập."
4. **Phân quyền:** đăng nhập `hung.vo`, Authorize lại, gọi `GET /api/dashboard/admin`. Kết quả `403 Not allowed for this role`.
5. **Validation:** `POST /api/department` với body `{}`. Server trả `400` kèm danh sách lỗi từ `class-validator`. Nói: "Server bật `whitelist + forbidNonWhitelisted`, nên field lạ bị từ chối ngay."
6. **Luồng tạo ticket qua API** (dùng khi không làm được cảnh 3b). Chạy trong terminal, thay `$TOKEN`, `$ITEM1` và `$ITEM2` bằng token và `_id` của 2 item lấy từ `GET /api/asset-item?code=PRJ-EPSON`:
   ```bash
   curl -s -X POST http://localhost:3003/api/ticket -H "Authorization: Bearer $TOKEN" -F "title=Máy chiếu mất tín hiệu HDMI" -F "type=Repair" -F "priority=High" -F "assetItems=$ITEM1" -F "assetItems=$ITEM2"
   ```
   - Response có `code: "OPS-…"` do server tự sinh (có retry khi trùng mã).
   - Gọi `GET /api/asset-item/$ITEM1`: `status` là `Maintenance`. Đây là trạng thái item tự đồng bộ theo ticket.
   - Phải gửi **ít nhất 2 item**. Gửi 1 item hiện đang bị 400 (mục 6).

### Cảnh 6: Tổng kết (1')

- Đã có: quản lý tài sản tới cấp item, vòng đời ticket, bình luận lồng nhau kèm ảnh, danh mục, JWT, validate chặt, dashboard API theo vai trò. Có thêm app mobile dùng chung backend (không demo hôm nay).
- **Nhắc lại:** 3 project này là sân tập để học NestJS, Next.js và React Native, và phần lớn được tự viết, hầu như không dùng AI. Những gì học được gồm:
  - thiết kế API và DTO validation;
  - quản lý state và cache ở client;
  - dùng chung một backend cho cả web lẫn mobile;
  - đồng bộ trạng thái giữa ticket và item;
  - và cả những bài học từ lỗi (hợp đồng API lệch giữa client và server, phân quyền).
- Hướng tiếp theo: nối dashboard web với API thật, phân quyền giao diện theo role, thông báo khi được giao ticket, báo cáo SLA/overdue, và quét QR trên item để mở ticket.

---

## 5. Hỏi đáp dự kiến

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Project này có dùng AI để viết không? | Hầu như không. Cả 3 project được làm để học và luyện công nghệ, nên phần lớn code là tự viết tay. AI chỉ hỗ trợ ở phần phụ, không sinh ra ứng dụng. |
| Sao vẫn còn lỗi? | Đây là project học tập. Các lỗi còn lại chủ yếu nằm ở chỗ hợp đồng API giữa client và server bị lệch nhau sau khi refactor, và đã được ghi thành danh sách việc cần sửa. |
| Mã ticket có bị trùng khi nhiều người tạo cùng lúc không? | Mã tăng dần theo mã lớn nhất hiện có. Có unique index, và server tự retry tối đa 5 lần khi đụng khoá trùng. |
| Ảnh lưu ở đâu? | Cloudinary, thư mục `ops-desk/...`. DB chỉ lưu public-id. |
| Phân quyền thế nào? | JWT chứa role (`admin`, `manager`, `user`). API quản trị user dùng `AdminGuard`, dashboard kiểm tra role. *(Nói thật: việc siết xác thực cho toàn bộ route GET đang nằm trong backlog, xem mục 7.3.)* |
| Item đang nằm trong ticket mở thì sao? | Khi tạo ticket hoặc thêm item vào ticket, item chuyển `Maintenance`. Khi gỡ item khỏi ticket, item trở lại `Active`. *(Việc tự trả item về `Active` khi đóng ticket đang nằm trong backlog.)* |
| Dữ liệu demo lấy đâu ra? | Script `seed-demo.cjs`. Dữ liệu được sinh tất định và có thể rollback chính xác bằng `unseed-demo.cjs`. |

---

## 6. Vùng cấm: thao tác đang lỗi, tránh khi demo

Các lỗi dưới đây được xác định bằng cách đọc code (review ngày 28/09/2026). Hãy chạy thử lại khi tập.

| Thao tác trên web | Hiện tượng | Nguyên nhân |
|---|---|---|
| Đọc số trên Dashboard `/` | Số liệu giả | `src/app/(main)/page.tsx` hard-code, chưa gọi `/dashboard/*` |
| Tạo ticket (**New Ticket**) | 400, form không báo lỗi | Form gửi `code` (server đã bỏ field này) và không gửi `assetItems` (server bắt buộc) |
| Ô **search** ở danh sách ticket | Hiện 3 ticket giả `TKT-001…` | Server không có query `search` nên trả 400, và client rơi vào dữ liệu mock trong `catch` |
| Thấy ticket `TKT-00x` bất kỳ lúc nào | Backend đang lỗi hoặc đã tắt | Như dòng trên: danh sách rơi về mock |
| Lọc Status ở Asset Items, sửa status item, đổi status hàng loạt | 400 / 404 | Enum client (`Available/InUse/...`) lệch với server (`Active/Faulty/Maintenance/Retired`). Route `/asset-item/update-status` không tồn tại |
| Cột **Asset** ở trang Asset Items | Luôn hiện "—" | Client đọc `asset`, server trả `assetId` |
| Lọc asset **Inactive** | Ra asset active | `@Type(() => Boolean)` biến `"false"` thành `true` |
| **Add user** | 400 `property username should not exist` | `CreateUserDto.username` chỉ có `@Transform`, thiếu decorator validate nên bị whitelist loại bỏ |
| **Edit user** | 400 | Payload gửi kèm `username`, và `UpdateUserDto.role` thiếu `manager` |
| **Add Asset** mà không kèm ảnh | 500 | `forkJoin([])` không emit giá trị nào (`asset.service.ts`) |
| Đóng ticket (Done/Cancelled) rồi xem item | Item vẫn ở `Maintenance`, `closedAt` trống | `TicketService.update` chưa xử lý chuyển trạng thái. Đừng mở Asset Items để "chứng minh" item đã được trả về |
| Tạo location với tầng 1/2/3/4/5 | 400 | Client gửi chuỗi `"1"`, server chỉ nhận số `0–3` hoặc `B1`/`B2` |
| Upload > 2 ảnh một lần | Lỗi Multer | Server giới hạn `FilesInterceptor('images', 2)` |
| Nút **Cancel Ticket** trong menu | Không làm gì | Chưa có handler |
| API thêm/gỡ item của ticket (`/ticket/:id/items`, `/remove-items`) | 400 | DTO thiếu decorator validate nên bị whitelist loại bỏ |
| API tạo ticket với **1** item (multipart) | 400 `assetItems must be an array` | 1 field multipart được parse thành string |

**Plan B:**
- Nếu web lỗi mạng, chuyển sang Swagger ở cảnh 5 và kể tiếp câu chuyện bằng API.
- Nếu Cloudinary chậm, bỏ bước đính kèm ảnh.

---

## 7. Nên vá trước buổi demo (theo thứ tự ưu tiên)

1. **Tạo ticket trên web** (`src/components/tickets/TicketForm.tsx`): bỏ `code` khỏi schema lúc tạo, thêm chọn asset item (có sẵn `ui/asset-combobox.tsx`), và gửi mỗi id bằng `fd.append("assetItems", id)`. Phía server, thêm transform để 1 giá trị cũng thành mảng.
2. **Search ticket** (`src/app/(main)/tickets/page.tsx`): gửi `title` thay cho `search`, và **xoá dữ liệu mock** trong `catch`.
3. **Dashboard web**: gọi `GET /dashboard/admin` (hoặc bản theo role) thay cho số hard-code. Đây là thay đổi ăn điểm nhất cho buổi demo.
4. **Đồng bộ enum `ItemStatus`** (`src/types/asset-item.ts`) với server: `Active / Faulty / Maintenance / Retired`.
5. **Hiển thị lỗi mutation**: thêm `onError` toast với `response.data.message`, để nếu có lỗi khi demo thì ít nhất cũng hiện thông báo.
6. **Tạo user** (server `src/modules/user/dto/create-user.dto.ts`): thêm `@IsString() @IsNotEmpty()` cho `username`. Chỉ cần 1 dòng, và nó mở lại được bước Add User ở cảnh 4.
7. (Backend, sau demo) `AppGuard` đang luôn `return true`, nên mọi route GET và một số route xoá không cần token. Cần chặn mặc định và thêm `@Public()` cho các route công khai.
