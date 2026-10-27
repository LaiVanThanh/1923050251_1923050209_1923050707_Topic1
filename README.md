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

## API

Ứng dụng cần API có hai tài nguyên REST: `/courses` và `/assignments`. Để dùng máy chủ API của nhóm, tạo tệp `.env` ở thư mục gốc:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-api-base-url
```

Giá trị là địa chỉ gốc của API, không thêm `/courses` hoặc `/assignments` vào cuối. Khởi động lại Expo sau khi đổi `.env`. Nếu không cấu hình địa chỉ API, ứng dụng dùng dữ liệu mẫu lưu cục bộ.

## Đăng nhập demo

Màn hình đăng nhập hiện dùng luồng demo cục bộ. Nhập email đúng định dạng và mật khẩu dài ít nhất 6 ký tự để vào ứng dụng; không cần tạo tài khoản trên máy chủ.

## Kiểm tra mã nguồn

```bash
npm run typecheck
npm run lint
npm test
```


