# 🎓 Study Planner (Topic 01) — Học phần Lập trình Mobile (TH7011101 - 23DTH1)

> **Trường Đại học Công Nghệ Đồng Nai (DNTU)**  
> **Mã nhóm / Repository**: `1923050251_1923050209_1923050707_Topic1`  
> **Thành viên thực hiện**: `1923050251` • `1923050209` • `1923050707`

---

## 1. Tổng Quan Kiến Trúc & Phân Rã 6 Module Nghiệp Vụ Khép Kín

Dự án được phát triển theo phương pháp **Phân rã 6 Module Chức năng Nghiệp vụ Khép kín** (thay vì chia cắt cứng Backend/Frontend) để đảm bảo mọi thành viên đều nắm vững toàn diện từ Data Model, TanStack Query, Zustand Selectors, Expo SecureStore, Offline Cache cho tới Giao diện 4 trạng thái và Kiểm thử tự động:

| Module | Tên Module | Các File Cốt Lõi | Điểm Nhấn Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **Module 1** | **Core, Theme Tokens & Timezone Engine** | `src/types/domain.ts`<br>`src/theme/tokens.ts`<br>`src/utils/dateUtils.ts`<br>`src/components/ScreenStateView.tsx`<br>`src/components/AccessibleButton.tsx` | • TypeScript `strict: true`.<br>• 100% mã màu Light/Dark nằm duy nhất tại `tokens.ts` (độ tương phản chữ thân bài ≥ 4.5:1).<br>• Giải quyết triệt để bài toán lệch múi giờ địa phương (UTC+7): `getCalendarDayDiff` trả về đúng `1` (*Due Tomorrow*) ở cả mốc `08:00` sáng và `23:30` đêm. |
| **Module 2** | **Authentication & Session Persistence** | `src/services/authStorage.ts`<br>`src/store/useAuthStore.ts`<br>`app/_layout.tsx`<br>`app/(auth)/sign-in.tsx` | • Ba pha xác thực (`hydrating`, `authenticated`, `unauthenticated`).<br>• Lưu phiên bảo mật bằng `Expo SecureStore` (không dùng `AsyncStorage` cho bí mật).<br>• Khi `signOut()`, xóa sạch `SecureStore` đồng thời gọi `queryClient.clear()`. |
| **Module 3** | **Courses, Assignments (CRUD API) & Computed Progress** | `src/services/studyApi.ts`<br>`src/hooks/useStudyQueries.ts`<br>`src/utils/progressSelector.ts`<br>`app/(tabs)/courses.tsx`<br>`app/modal/editor.tsx` | • Không tạo cột `completedCount` trong bảng `Course`.<br>• Thống kê tiến độ (`Completed vs. Outstanding` và `%`) luôn tính toán động qua `computeCourseProgress(courses, assignments)` (*computed, never stored*). |
| **Module 4** | **Planner Views (Weekly / List), Filters & 48h Widget** | `src/store/usePlannerFilterStore.ts`<br>`src/components/DueNext48hWidget.tsx`<br>`src/components/AssignmentLessonCard.tsx`<br>`app/(tabs)/index.tsx` | • Widget 48 giờ tới nổi bật đầu màn hình Home.<br>• Cùng một nguồn dữ liệu hiển thị dưới 2 góc nhìn (`Weekly View` 7 cột ngày theo `startOfLocalDay` & `List View`).<br>• Bộ lọc kết hợp theo Môn học và Trạng thái với Zustand selectors. |
| **Module 5** | **Offline-First, Optimistic Rollback & Photo Attachment** | `src/services/queryClient.ts`<br>`src/components/OfflineBanner.tsx`<br>`app/assignment/[id].tsx` | • Lưu cache bền vững kèm mốc `lastSyncedAt` và `OfflineBanner` khi mất mạng.<br>• `useToggleCompleteMutation()` cập nhật tức thì (`onMutate`) và tự động khôi phục (`onError` rollback) khi server trả về lỗi 500.<br>• Đính kèm ảnh chụp ghi chú viết tay / bảng trắng bằng `expo-image-picker`. |
| **Module 6** | **Local Notifications, Deep Linking & Quality Gate** | `src/services/notifications.ts`<br>`__tests__/pureLogic.test.ts`<br>`__tests__/homeComponent.test.tsx`<br>`__tests__/criticalPath.test.tsx` | • Lập lịch thông báo nhắc hạn cục bộ kèm nút *"Gửi thông báo nhắc thử sau 5 giây"* để demo trực tiếp.<br>• Chạm vào thông báo mở thẳng `/assignment/[id]` (Expo Linking). |

---

## 2. Sàng Lọc & Chuyển Thể Giao Diện Từ File Thiết Kế Figma (`Student Planner App (Community).fig`)

Nhóm đã phân tích toàn bộ file thiết kế `Student Planner App (Community).fig` (gồm 4 Pages: `Project`, `UI kit`, `Presentation`, `Thumbnail`) và **chỉ lọc lấy các thành phần UI phù hợp với nghiệp vụ Study Planner**, loại bỏ các màn hình không liên quan:

### ✅ Các thành phần UI được chọn lọc và đưa vào ứng dụng:
1. **`UI kit -> Color` & `Typography`**:
   - Chuyển hóa hệ màu `Light/*` và `Dark/*` cùng 8 màu đồ họa (`Blue`, `Indigo`, `Purple`, `Teal`, `Green`, `Orange`, `Pink`, `Red`) vào duy nhất file `src/theme/tokens.ts`, đồng thời tinh chỉnh độ tương phản đạt chuẩn **WCAG AA ≥ 4.5:1**.
   - Áp dụng đúng thang chữ từ Figma (`LargeTitle 34/41`, `Title 1 27/32`, `Title 2 22/28`, `Title 3 19/24`, `Headline 17/24`, `Body 17/24`, `Subheadline 15/20`, `Footnote 13/18`, `Caption 12/16`).
2. **`3.2. Login` & `3.3. Password` + `UI kit -> .Field (r=16)` & `Button=Primary (r=16)`**:
   - Áp dụng cho màn hình `app/(auth)/sign-in.tsx` (Màn hình 1/5+).
3. **`1. Schedule`, `1.1.1. Select a date in schedule` + `UI kit -> ViewCard-news (r=16)`, `Scopebars`, `Calendar (Date circle r=44)`, `LessonCard`, `TableSubheadings`**:
   - `ViewCard-news`: Chuyển thể thành **Widget 48 giờ tới** (`DueNext48hWidget.tsx`).
   - `Scopebars`: Thanh chuyển đổi mượt mà giữa **Weekly View** và **List View**.
   - `Calendar`: Thanh lịch 7 ngày trong tuần trên chế độ **Weekly View**.
   - `LessonCard`: Thẻ bài tập hiển thị cột giờ (`Time`) bên trái, tên môn học in hoa, tiêu đề bài tập, nhãn hạn nộp (`Due Today`, `Due Tomorrow`, `Overdue`) và nút hoàn thành `≥ 44×44` bên phải.
4. **`1.3. Academic items`, `1.2. Academic semesters` & `1. Profile`**:
   - Áp dụng cho màn hình `app/(tabs)/courses.tsx` (Màn hình 2/5+) hiển thị danh sách môn học kèm thanh tiến độ động và hồ sơ sinh viên.
5. **`1.2. Add note`, `ModalStack` & `ModalActionBar`**:
   - Áp dụng cho Modal tạo/sửa môn học và bài tập `app/modal/editor.tsx` (Màn hình 3/5+).
6. **`1.1. Open Subject`, `2.1. Open Notes` & `3.1. Add file` / `3.2. Added file`**:
   - Áp dụng cho màn hình chi tiết bài tập `app/assignment/[id].tsx` (Màn hình 5/5+) có ghi chú, đính kèm ảnh chụp bảng trắng/vở viết tay và đặt lịch thông báo nhắc hạn.

### ❌ Các màn hình trong file `.fig` đã lọc bỏ (Không phù hợp yêu cầu đề bài):
- Nhắn tin & Nhóm chat (`1. Open Chat`, `1.5. Dialog groups`, `MessageBubbleSend`, `CardMessage`).
- Bản đồ tòa nhà trường học (`4.1 Corpus`, `4.2. Route to building corpus`, `Map`).
- Thẻ thư viện & Ví điện tử (`2.1. Reader's ticket`, `2.1.1. Add wallet`, `Wallet`).
- Tìm kiếm & Chặn người dùng (`1. Search recent user`, `4.2.1. Blocking profile`).

---

## 3. Hướng Dẫn Cài Đặt & Chạy Thử Trên Máy Sạch

### Yêu cầu môi trường
- **Node.js**: `>= 18.x` (khuyến nghị `v20` hoặc `v22/v24`)
- **npm**: `>= 9.x`
- Thiết bị thật cài **Expo Go** (iOS/Android), máy ảo Android Studio / Xcode Simulator, hoặc trình duyệt Web.

### Các bước cài đặt
```bash
# 1. Di chuyển vào thư mục dự án
cd 1923050251_1923050209_1923050707_Topic1

# 2. Cài đặt phụ thuộc
npm install --legacy-peer-deps

# 3. Khởi chạy máy chủ phát triển Expo
npx expo start
```

### Tùy chọn kết nối Remote API ngoài (MockAPI.io / JSON Server)
Ứng dụng đã tích hợp sẵn dữ liệu khởi tạo 6 môn học học kỳ của sinh viên CNTT DNTU cùng bộ lưu trữ đồng bộ ngoại tuyến. Nếu muốn trỏ sang máy chủ MockAPI.io hoặc JSON Server riêng, chỉ cần đặt biến môi trường:
```bash
EXPO_PUBLIC_API_BASE_URL=https://<your-mockapi-id>.mockapi.io/api/v1 npx expo start
```

---

## 4. Kiểm Định Chất Lượng Toàn Diện (Quality Gate)

Chạy lần lượt 3 lệnh kiểm định bắt buộc:

```bash
# 1. Kiểm tra kiểu dữ liệu TypeScript (strict: true, 0 lỗi)
npx tsc --noEmit

# 2. Kiểm tra quy chuẩn code & quy tắc 0 mã màu hex ngoài tokens.ts
npm run lint

# 3. Chạy 3 bộ kiểm thử tự động (Pure-logic, Component, Critical Path)
npx jest --watchAll=false
```

---

## 5. Kịch Bản Demo Nhanh Trong Buổi Bảo Vệ (Live Demo Checklist)

1. **Đăng nhập & Duy trì phiên (`SecureStore`)**:
   - Chọn nhanh tài khoản `1923050251` tại màn hình Sign In → Bấm **Đăng nhập**.
   - Đóng hẳn ứng dụng (Force Quit) → Mở lại: ứng dụng vào thẳng màn hình Home Planner.
   - Qua tab **Môn học & Hồ sơ** → Bấm **Đăng xuất (Sign Out)** → Phiên bị xóa sạch khỏi `SecureStore` và `queryClient.clear()`.
2. **Lịch tuần, Danh sách, Bộ lọc & Widget 48 giờ**:
   - Quan sát **Widget 48 giờ tới** nổi bật ở đầu màn hình Home.
   - Bấm chuyển đổi giữa **Weekly View** và **List View**, lọc theo trạng thái (`Pending` / `Completed`) và theo từng môn học.
3. **Thống kê Tiến độ Động (*Computed, Never Stored*)**:
   - Xem tỷ lệ hoàn thành từng môn tại tab **Môn học & Hồ sơ**.
   - Đánh dấu hoàn thành 1 bài tập hoặc tạo bài tập mới qua nút `+ Bài tập` (Modal) → Thanh tiến độ môn học tương ứng nhảy số tức thì.
4. **Offline-First & Optimistic Rollback**:
   - Trong tab **Môn học & Hồ sơ**, bật **✈️ Bật giả lập Offline Mode** → Dải băng `OfflineBanner` xuất hiện ngay ở đầu ứng dụng kèm thời gian tải thành công cuối cùng.
   - Mở chi tiết 1 bài tập → Bật **🧪 Bật giả lập Lỗi Server 500** → Bấm **✅ Đánh dấu Hoàn thành Ngay**: giao diện nhảy sang `COMPLETED` ngay lập tức rồi tự động **Rollback** về `PENDING` kèm thông báo lỗi rõ ràng.
5. **Đính kèm Ảnh ghi chú & Nhắc hạn Thông báo Cục bộ sau 5 giây**:
   - Trong màn hình chi tiết bài tập, chọn ảnh từ thư viện / chụp ảnh bảng trắng.
   - Bấm nút **⏰ Gửi thông báo nhắc thử sau 5 giây** → Chờ thông báo hiện lên và chạm vào để kiểm chứng **Deep Link** mở thẳng màn hình chi tiết bài tập.
