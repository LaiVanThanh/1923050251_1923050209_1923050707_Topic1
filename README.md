# Study Planner

Ứng dụng di động giúp sinh viên quản lý môn học, bài tập và hạn nộp.

## Yêu cầu

- Node.js **20.19 trở lên** và npm.
- Android Studio và Android SDK để chạy trên thiết bị hoặc giả lập Android.
- Chạy iOS cần macOS và Xcode.

## Cài đặt và chạy

```bash
git clone https://github.com/LaiVanThanh/1923050251_1923050209_1923050707_Topic1.git
cd 1923050251_1923050209_1923050707_Topic1
npm install
npx expo install --fix
```

Chạy ứng dụng trên Android đã kết nối hoặc giả lập Android:

```bash
npx expo run:android
```

Để khởi động máy chủ phát triển trong những lần tiếp theo:

```bash
npx expo start
```

Có thể chạy giao diện web bằng `npm run web`. Một số chức năng phụ thuộc thiết bị, như thông báo cục bộ và SecureStore, cần được kiểm tra trên bản native.

## API và Đồng bộ Ngoại tuyến

Ứng dụng kết nối tới REST API từ xa với hai tài nguyên `/courses` và `/assignments`:
- Tệp `.env` và hằng số `DEFAULT_API_BASE_URL` trong `src/services/studyApi.ts` đã được cấu hình sẵn trỏ tới máy chủ REST API:
  ```env
  EXPO_PUBLIC_API_BASE_URL=https://my-json-server.typicode.com/LaiVanThanh/1923050251_1923050209_1923050707_Topic1
  ```
- Khi có mạng, mọi thao tác tải danh sách và tạo/sửa/xóa (`GET`, `POST`, `PUT`, `DELETE`) đều được gửi trực tiếp lên máy chủ REST API.
- Khi ngoại tuyến, thao tác tạo/sửa/xóa được lưu vào `AsyncStorage` và xếp vào hàng đợi `study_planner_mutation_queue_v1`. Ngay khi mạng kết nối trở lại, hàm `syncWhenBackOnline()` và `flushOfflineMutationQueue()` tự động gửi toàn bộ thay đổi trong hàng đợi lên máy chủ từ xa.

## Đăng nhập demo

Màn hình đăng nhập hỗ trợ 3 tài khoản sinh viên mẫu hoặc nhập email đúng định dạng và mật khẩu dài ít nhất 6 ký tự. Phiên đăng nhập được mã hóa và lưu trữ trong `Expo SecureStore`.

## Kiểm tra mã nguồn

```bash
npm run typecheck
npm run lint
npm test
```
