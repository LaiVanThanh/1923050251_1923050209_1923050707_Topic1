# Reflection

## Điều nhóm sẽ làm khác đi

Nếu làm lại, nhóm sẽ kiểm thử luồng ngoại tuyến ngay từ khi có thao tác tạo và sửa dữ liệu. Như vậy, nhóm có thể sớm phát hiện trường hợp thay đổi bị mất khi ứng dụng kết nối lại với API.

## Một lỗi AI mà nhóm đã phát hiện

Khi xử lý hạn nộp, AI từng đề xuất dùng `toISOString().slice(0, 10)` để lấy ngày. Cách này đổi thời gian sang UTC, nên có thể làm ngày bị lệch so với giờ Việt Nam, nhất là gần nửa đêm. Nhóm thay bằng cách chuẩn hóa ngày theo giờ địa phương và kiểm tra nhãn hạn ở cả 08:00 và 23:30.
