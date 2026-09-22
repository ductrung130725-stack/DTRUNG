# DTRUNG Redeem Web

## Chạy trên máy
1. Cài Node.js 18+.
2. Mở Terminal trong thư mục này.
3. Chạy:
   `node server.js`
4. Game: http://localhost:3000/
5. Trang tạo code: http://localhost:3000/admin

## Admin key
Mặc định là `doi-key-nay-ngay`.
Trước khi đưa lên mạng, đổi nó bằng biến môi trường `ADMIN_KEY`.

Windows PowerShell:
`$env:ADMIN_KEY="mat-khau-cua-ban"; node server.js`

Linux/macOS:
`ADMIN_KEY="mat-khau-cua-ban" node server.js`

## Cách tạo code
Trong `/admin`, nhập:
- Mã redeem
- Xu
- Lượt Hỗn Chiến
- Số lần mỗi người được dùng
- Tổng lượt dùng

Game sẽ kiểm tra code trực tiếp với server và ghi nhận lượt đã dùng.

Lưu ý: đây là backend tối giản, dữ liệu nằm trong `data/codes.json`. Nếu triển khai thật cho nhiều người chơi, nên dùng database/hosting có backup.
