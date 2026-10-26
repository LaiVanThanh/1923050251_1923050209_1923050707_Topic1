# 📄 BẢN PHẢN TƯ 1 TRANG (ONE-PAGE REFLECTION)

**Dự án**: Study Planner (Topic 01) — Học phần Lập trình Mobile (`TH7011101 - 23DTH1`)  
**Nhóm thực hiện**: `1923050251` • `1923050209` • `1923050707`

---

## 1. Nhìn Lại Quy Trình Chia 6 Module Chức Năng Khép Kín

Khi bắt đầu dự án 5 ngày với 3 thành viên, quyết định quan trọng nhất giúp nhóm về đích đúng hạn mà không bị nghẽn tiến độ (bottleneck) vào đêm cuối là **chia hệ thống thành 6 Module Chức năng Nghiệp vụ Khép kín** thay vì chia cắt truyền thống *1 người làm Backend/API — 2 người làm Giao diện*.

Nhờ việc chốt chặt hợp đồng dữ liệu (`src/types/domain.ts`) và bảng màu token duy nhất (`src/theme/tokens.ts`) ngay từ Ngày 1:
- Mọi màn hình đều tái sử dụng chung khung 4 trạng thái `ScreenStateView` (`Loading`, `Error + Retry`, `Empty`, `Content`) và `AccessibleButton` (`>= 44×44`).
- Khi tích hợp file thiết kế `Student Planner App (Community).fig`, nhóm đã chủ động phân tích và **lọc lấy đúng tinh hoa UI/UX** (thang chữ iOS SF Pro, bố cục `LessonCard`, thanh chuyển đổi `Scopebars`, lịch tuần `Calendar`, ô nhập `.Field` bo góc `16px`) và kiên quyết loại bỏ các màn hình ngoài phạm vi (như Chat nhóm, Bản đồ khu nhà học, Ví thư viện). Điều này giúp ứng dụng vừa có thẩm mỹ hiện đại, vừa tập trung 100% vào bài toán quản lý lịch học và hạn nộp bài tập.

---

## 2. Phân Tích Lỗi Sai Điển Hình Của AI Mà Nhóm Đã Phát Hiện & Khắc Phục

### 🔍 Lỗi của AI: Sử dụng `toISOString()` gây sai lệch ngày ở múi giờ Việt Nam (`UTC+7`)

Khi nhóm yêu cầu AI gợi ý hàm tính khoảng cách ngày lịch giữa hạn nộp (`dueAt`) và thời điểm hiện tại (`now`) để hiển thị nhãn **Due Tomorrow (Hạn ngày mai)**, AI đã sinh ra đoạn code như sau:

```ts
// ❌ CODE SAI DO AI GỢI Ý BAN ĐẦU:
function getDayDiffWrong(dueAt: string, now: Date): number {
  const dueDay = new Date(dueAt.slice(0, 10)); // Cắt chuỗi YYYY-MM-DD từ UTC ISO!
  const nowDay = new Date(now.toISOString().slice(0, 10));
  return Math.round((dueDay.getTime() - nowDay.getTime()) / 86400000);
}
```

### ⚠️ Tại sao đoạn code trên gây lỗi nghiêm trọng tại Việt Nam (`UTC+7`)?
Hàm `toISOString()` luôn chuyển đổi thời gian về múi giờ gốc **UTC (`UTC+0`)** (lùi đi 7 tiếng so với giờ Việt Nam):
- Giả sử sinh viên mở ứng dụng lúc **23:30 đêm ngày 26/10/2026** (giờ Việt Nam) -> `now.toISOString()` là `2026-10-26T16:30:00.000Z` (ngày `2026-10-26`).
- Nhưng nếu sinh viên có một bài tập hạn nộp vào **01:00 sáng ngày mai (27/10/2026 giờ Việt Nam)** -> chuỗi ISO UTC của `dueAt` lại là `2026-10-26T18:00:00.000Z` (vẫn là ngày `2026-10-26` theo giờ UTC!).
- Kết quả là hàm của AI tính ra `diff = 0` (**Due Today**) thay vì `diff = 1` (**Due Tomorrow**), hoặc ngược lại khi sinh viên mở app lúc **06:00 sáng** (`23:00` đêm hôm trước theo UTC) thì mọi bài tập hôm nay đều bị đẩy thành ngày mai! Đây chính là bẫy kỹ thuật được đề bài cảnh báo: *"Timezone and date handling. 'Due tomorrow' must mean the same thing at 23:30 as it does at 08:00."*

### ✅ Cách nhóm khắc phục triệt để trong `src/utils/dateUtils.ts`:
Nhóm đã viết hàm `startOfLocalDay(dateInput)` sử dụng các phương thức theo **múi giờ địa phương của thiết bị** (`getFullYear()`, `getMonth()`, `getDate()`):

```ts
// ✅ CODE ĐÚNG TRONG DỰ ÁN (src/utils/dateUtils.ts):
export function startOfLocalDay(dateInput: DateInput): number {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}

export function getCalendarDayDiff(dueAt: DateInput, now: DateInput = new Date()): number {
  return Math.round((startOfLocalDay(dueAt) - startOfLocalDay(now)) / 86_400_000);
}
```
Nhờ đó, mọi thời điểm trong ngày 26/10 (dù là `08:00` sáng hay `23:30` đêm giờ địa phương) đều được quy về đúng mốc `2026-10-26 00:00:00.000 Local`, và mọi thời điểm trong ngày 27/10 đều quy về `2026-10-27 00:00:00.000 Local`. Hiệu số luôn bằng đúng `86_400_000 ms` (`1 ngày`), được chứng minh bằng bài kiểm thử tự động `__tests__/pureLogic.test.ts`.

---

## 3. Điều Nhóm Sẽ Làm Khác Đi Nếu Thực Hiện Lại Dự Án

1. **Viết bộ kiểm thử biên (Edge-case Tests) ngay trước khi dựng giao diện (TDD)**: Ở Module 1, việc viết test cho `getCalendarDayDiff` ngay từ đầu đã giúp nhóm tiết kiệm hàng giờ gỡ lỗi trên giao diện lịch tuần. Nếu làm lại, nhóm sẽ áp dụng TDD tương tự cho cả luồng hàng đợi ngoại tuyến (Offline Mutation Queue) ngay từ Ngày 2.
2. **Thiết lập quy tắc ESLint cấm mã màu Hex từ phút đầu tiên**: Việc cấu hình rule `no-restricted-syntax` trong `eslint.config.mjs` để tự động báo lỗi nếu bất kỳ thành viên nào gõ mã màu `#...` ngoài file `src/theme/tokens.ts` đã giúp nhóm giữ kỷ luật thiết kế tuyệt đối khi gộp nhánh Git.
