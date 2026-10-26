# 🤖 NHẬT KÝ SỬ DỤNG AI (AI_LOG.md)

**Dự án**: Study Planner (Topic 01) — Học phần Lập trình Mobile (`TH7011101 - 23DTH1`)  
**Nhóm sinh viên**: `1923050251` • `1923050209` • `1923050707`  
**Thời gian thực hiện**: 24/10/2026 – 28/10/2026

---

## Nguyên Tắc Sử Dụng AI Của Nhóm
1. **Không sao chép mù quáng**: Mọi đoạn code do AI gợi ý đều được cả 3 thành viên đọc hiểu, kiểm tra chéo với đặc tả đề bài và thử nghiệm biên trước khi đưa vào nhánh chính.
2. **Sàng lọc thiết kế UI**: Chỉ trích xuất các thành phần phù hợp với nghiệp vụ *Study Planner* từ file `Student Planner App (Community).fig`, từ chối toàn bộ các màn hình dư thừa không thuộc phạm vi đề bài.

---

## Nhật Ký Chi Tiết Theo Từng Ngày & Module

### 📅 Ngày 1 (24/10/2026) — Module 1: Data Model, Bảng Màu Token & Bộ Xử Lý Múi Giờ

- **Câu hỏi đặt cho AI**:
  > *"Làm thế nào để trích xuất bảng màu Light/Dark từ file thiết kế `Student Planner App (Community).fig` vào 1 file token duy nhất `src/theme/tokens.ts` và viết hàm tính khoảng cách ngày nộp bài `getCalendarDayDiff(dueAt, now)` để 'Due tomorrow' luôn đúng vào lúc 23:30 đêm lẫn 08:00 sáng?"*

- **Phần Nhóm Chấp Nhận (Accepted)**:
  - Cấu trúc interface `User`, `Course`, `Assignment` với chế độ TypeScript `strict: true` tại `src/types/domain.ts`.
  - Kiến trúc `src/theme/tokens.ts` cung cấp hook `useAppTheme()` quản lý toàn bộ bảng màu `LIGHT_COLORS` và `DARK_COLORS`.
  - Công thức chuẩn hóa ngày địa phương `startOfLocalDay(dateInput)` dùng `new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime()` và `getCalendarDayDiff` chia cho `86_400_000` ms.

- **Phần Nhóm Từ Chối & Sửa Đổi (Rejected & Modified)**:
  - ❌ **Từ chối 1 (Lỗi múi giờ `toISOString()`)**: Bản nháp đầu tiên của AI dùng `new Date(dateInput).toISOString().slice(0, 10)` để lấy chuỗi ngày `YYYY-MM-DD` trước khi trừ ngày. Nhóm phát hiện ở múi giờ Việt Nam (`UTC+7`), mốc `2026-10-27 01:00:00` (1 giờ sáng ngày 27/10 giờ VN) khi gọi `toISOString()` sẽ bị lùi về `2026-10-26T18:00:00.000Z` (ngày 26/10 UTC), làm bài tập hạn ngày mai bị nhận nhầm thành *Due Today*! Nhóm đã loại bỏ hoàn toàn `toISOString().slice(0, 10)` và thay bằng `startOfLocalDay()` theo giờ địa phương của thiết bị.
  - ❌ **Từ chối 2 (Độ tương phản màu chữ trong Figma)**: Màu `Light/Label/Secondary` nguyên bản trong file Figma có độ mờ 60% trên nền xám chỉ đạt tỷ lệ tương phản ~3.1:1 (vi phạm yêu cầu `contrast >= 4.5:1`). Nhóm đã chuyển toàn bộ sang định nghĩa token tại `tokens.ts`, điều chỉnh `textSecondary` ở Light mode đạt tương phản 8.0:1 và `textTertiary` đạt tương phản 5.9:1.

---

### 📅 Ngày 2 (25/10/2026) — Module 2 & Module 3: Xác Thực `SecureStore`, CRUD API & Tiến Độ Động

- **Câu hỏi đặt cho AI**:
  > *"Thiết kế luồng lưu trữ phiên đăng nhập bằng `expo-secure-store` kết hợp Zustand store và viết các hooks TanStack Query cho Courses & Assignments kèm thống kê tiến độ từng môn."*

- **Phần Nhóm Chấp Nhận (Accepted)**:
  - Đóng gói 3 hàm `saveSessionSecurely()`, `loadSessionSecurely()`, `clearSessionSecurely()` trong `src/services/authStorage.ts`.
  - Cấu trúc Zustand store `useAuthStore.ts` gồm 3 pha `'hydrating' | 'authenticated' | 'unauthenticated'` và Route Guard tại `app/_layout.tsx`.
  - Hàm thuần túy `computeCourseProgress(courses, assignments)` trong `src/utils/progressSelector.ts`.

- **Phần Nhóm Từ Chối & Sửa Đổi (Rejected & Modified)**:
  - ❌ **Từ chối 1 (Lưu `completedCount` tĩnh trong `Course`)**: AI ban đầu đề xuất thêm trường `completedAssignmentsCount: number` vào đối tượng `Course` và tăng/giảm trường này khi sửa bài tập. Điều này vi phạm trực tiếp yêu cầu đề bài (*"Progress statistics: completed versus outstanding per course, computed, never stored"*). Nhóm đã xóa trường đó khỏi `Course` và bắt buộc tính động từ mảng `assignments` mỗi lần render.
  - ❌ **Từ chối 2 (Quên xóa cache TanStack Query khi Sign Out)**: AI ban đầu chỉ xóa token trong `SecureStore` khi người dùng bấm Sign Out, khiến dữ liệu cache trong bộ nhớ RAM của `queryClient` vẫn còn tồn tại nếu đăng nhập tài khoản khác. Nhóm đã bổ sung lệnh `queryClient.clear()` và `clearOfflineSnapshot()` ngay bên trong hàm `signOut()`.

---

### 📅 Ngày 3 (26/10/2026) — Module 4 & Module 5: Lọc UI Figma, Home Planner, Offline-First & Optimistic Rollback

- **Câu hỏi đặt cho AI**:
  > *"Trong file `Student Planner App (Community).fig` có hơn 120 frames, cần giữ lại những màn hình nào cho ứng dụng Study Planner? Đồng thời cài đặt `useToggleCompleteMutation` có Optimistic Update và Rollback khi lỗi."*

- **Phần Nhóm Chấp Nhận (Accepted)**:
  - Lọc giữ lại đúng các thành phần phù hợp từ Figma: `Scopebars` (chuyển đổi Weekly/List View), `Calendar` (lịch 7 ngày), `LessonCard` (thẻ bài tập), `ViewCard-news` (chuyển thể thành Widget 48h tới), `.Field` và `Button=Primary`.
  - Cấu trúc `onMutate`, `onError`, `onSettled` trong `useToggleCompleteMutation()` tại `src/hooks/useStudyQueries.ts`.

- **Phần Nhóm Từ Chối & Sửa Đổi (Rejected & Modified)**:
  - ❌ **Từ chối 1 (Các màn hình thừa trong file `.fig`)**: Nhóm loại bỏ hoàn toàn các màn hình Chat (`Open Chat`, `Dialog groups`), Bản đồ khu giảng đường (`Corpus`, `Route to building corpus`), Thẻ đọc sách (`Reader's ticket`, `Add wallet`) và Chặn hồ sơ (`Blocking profile`) vì không phục vụ nghiệp vụ quản lý kế hoạch học tập.
  - ❌ **Từ chối 2 (Thiếu `cancelQueries` trong `onMutate`)**: Đoạn code Optimistic Update đầu tiên của AI không gọi `await queryClient.cancelQueries({ queryKey: ['assignments'] })` trước khi ghi đè cache, dễ gây ra race condition nếu một truy vấn `GET /assignments` cũ hoàn tất muộn và ghi đè lên trạng thái optimistic. Nhóm đã bổ sung `await qc.cancelQueries(...)` và lưu `previousAssignments` vào context để rollback an toàn tuyệt đối.

---

### 📅 Ngày 4 & 5 (27/10/2026 – 28/10/2026) — Module 6: Thông Báo Cục Bộ, Deep Link & Kiểm Thử Tự Động

- **Câu hỏi đặt cho AI**:
  > *"Cài đặt thông báo nhắc hạn bằng `expo-notifications` mở thẳng màn hình `/assignment/[id]` khi chạm vào, và viết 3 bài test tự động (Pure-logic, Component, Critical Path)."*

- **Phần Nhóm Chấp Nhận (Accepted)**:
  - Hàm `scheduleAssignmentReminder` và `scheduleDemoReminderIn5Seconds` gắn payload `data: { assignmentId: id, url: '/assignment/' + id }`.
  - Lắng nghe cả `getLastNotificationResponseAsync()` (khi app mở từ trạng thái đóng) và `addNotificationResponseReceivedListener` (khi app đang chạy nền) tại `app/_layout.tsx`.
  - 3 file kiểm thử tự động trong thư mục `__tests__/` kiểm chứng đầy đủ múi giờ 23:30 vs 08:00, trạng thái Empty/Error + Retry, bộ lọc và Optimistic Rollback khi lỗi 500.

- **Phần Nhóm Từ Chối & Sửa Đổi (Rejected & Modified)**:
  - ❌ **Từ chối (Không hủy thông báo cũ khi bài tập đã hoàn thành)**: AI ban đầu chỉ lập lịch thông báo khi tạo bài tập mà quên hủy lịch khi sinh viên đánh dấu bài tập sang `completed` hoặc xóa bài tập, dẫn đến việc bài tập làm xong vẫn kêu chuông nhắc hạn. Nhóm đã bổ sung `cancelScheduledReminder(assignment.notificationId)` ngay khi bài tập chuyển sang `completed` hoặc bị xóa.
