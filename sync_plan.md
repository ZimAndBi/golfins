# Kế hoạch đồng bộ hệ thống Golfins sang máy mới

Chào anh, đây là các bước chi tiết để anh có thể đồng bộ toàn bộ dự án (bao gồm Code, Database và các tệp tin trong MinIO) sang máy tính khác.

## 1. Thành phần cần đồng bộ
Dựa trên cấu trúc dự án hiện tại, chúng ta cần đồng bộ 3 phần chính:
- **Mã nguồn (Codebase)**: Bao gồm toàn bộ backend services, frontend và cấu hình Nginx.
- **Cơ sở dữ liệu (Database)**: Dữ liệu Postgres trong container `golfins-postgres`.
- **Dữ liệu tập tin (Storage)**: Các tài liệu/văn bản lưu trữ trong `golfins-minio` (MinIO).

## 2. Trạng thái hiện tại
Em đã hoàn thành việc tạo các bản sao lưu cần thiết trong thư mục dự án của anh (`e:\docker\golfins`):
- ✅ **Postgres Backup**: `golfins_db_backup.sql`
- ✅ **MinIO Backup**: `minio_backup.tar` (Dữ liệu blobs/files)
- ✅ **Code & Config**: Thư mục hiện tại đã sẵn sàng để nén.

## 3. Các bước tiếp theo

### Bước 1: Đóng gói (Trên máy cũ)
Anh hãy nén toàn bộ thư mục `e:\docker\golfins` thành một file `.zip` hoặc `.7z`.
> **Lưu ý**: Đảm bảo bao gồm cả file `.env` (file này chứa các chìa khóa bảo mật và cấu hình môi trường).

### Bước 2: Khôi phục (Trên máy mới)
1. **Giải nén**: Đưa code và các file backup vào máy mới.
2. **Khởi động**: 
   ```powershell
   docker-compose up -d postgres minio
   ```
3. **Phục hồi Database**:
   ```powershell
   # Nạp dữ liệu vào container Postgres
   cat golfins_db_backup.sql | docker exec -i golfins-postgres psql -U golfins_user golfins
   ```
4. **Phục hồi MinIO**:
   ```powershell
   # Giải nén dữ liệu vào volume minio_data
   docker run --rm -v minio_data:/to -v ${PWD}:/from alpine tar -xvf /from/minio_backup.tar -C /to
   ```
5. **Khởi động tất cả**: 
   ```powershell
   docker-compose up -d
   ```

---
**Dữ liệu của anh đã sẵn sàng.** Anh chỉ việc nén thư mục và chuyển sang máy mới theo hướng dẫn trên ạ!
