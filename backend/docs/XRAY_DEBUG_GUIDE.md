# Hướng dẫn Debug với AWS X-Ray Annotations và Metadata

## Tổng quan

Tài liệu này hướng dẫn cách sử dụng AWS X-Ray annotations và metadata để debug lỗi "danh sách sản phẩm không hiển thị" và các vấn đề khác trong ứng dụng e-commerce.

## Các Annotations và Metadata đã được thêm

### 1. Product Controller Annotations

#### GetProducts Operation
- **Annotations:**
  - `category`: Loại sản phẩm được filter
  - `brand`: Thương hiệu được filter
  - `sort`: Cách sắp xếp (price-low, price-high, rating)
  - `page`: Trang hiện tại
  - `limit`: Số lượng sản phẩm mỗi trang
  - `total_count`: Tổng số sản phẩm
  - `products_found`: Số sản phẩm tìm thấy
  - `response_products_count`: Số sản phẩm trong response
  - `response_total_pages`: Tổng số trang
  - `response_current_page`: Trang hiện tại

- **Metadata:**
  - `query_params`: Tất cả query parameters
  - `query_filter`: Filter query được sử dụng
  - `category_counts`: Số lượng sản phẩm theo category
  - `products_sample`: Mẫu 3 sản phẩm đầu tiên
  - `response_data`: Toàn bộ response data

#### GetProductById Operation
- **Annotations:**
  - `product_id`: ID sản phẩm được request
  - `product_found`: Có tìm thấy sản phẩm hay không
  - `error_type`: Loại lỗi (product_not_found, database_error)

- **Metadata:**
  - `request_params`: Parameters từ request
  - `product_info`: Thông tin chi tiết sản phẩm
  - `error_details`: Chi tiết lỗi nếu có

#### SearchProducts Operation
- **Annotations:**
  - `search_query`: Từ khóa tìm kiếm
  - `query_type`: Kiểu dữ liệu của query
  - `is_array`: Query có phải array không
  - `validation_failed`: Validation có thất bại không
  - `search_term`: Từ khóa đã được trim
  - `search_limit`: Giới hạn kết quả tìm kiếm
  - `results_count`: Số kết quả tìm thấy
  - `suggestions_count`: Số suggestions cuối cùng

- **Metadata:**
  - `raw_query`: Query gốc từ request
  - `search_criteria`: Tiêu chí tìm kiếm
  - `search_results`: Kết quả tìm kiếm
  - `final_suggestions`: Suggestions cuối cùng

#### UploadProductImage Operation
- **Annotations:**
  - `has_file`: Có file được upload không
  - `file_size`: Kích thước file
  - `file_mimetype`: Loại MIME của file
  - `validation_failed`: Validation có thất bại không
  - `bucket_name`: Tên S3 bucket
  - `region`: AWS region
  - `upload_success`: Upload có thành công không
  - `upload_error`: Có lỗi upload không

- **Metadata:**
  - `file_info`: Thông tin chi tiết file
  - `s3_params`: Parameters cho S3 upload
  - `upload_result`: Kết quả upload
  - `upload_error_details`: Chi tiết lỗi upload

### 2. XRayHelper Class

Class helper cung cấp các method tiện ích:

- `addBasicMetadata()`: Thêm metadata cơ bản
- `addSuccessAnnotations()`: Thêm success annotations
- `addErrorAnnotations()`: Thêm error annotations
- `addDatabaseAnnotations()`: Thêm database operation annotations
- `addProductAnnotations()`: Thêm product-specific annotations
- `withSubsegment()`: Tạo subsegment với error handling
- `addPerformanceAnnotations()`: Thêm performance annotations

## Cách Debug "Danh sách sản phẩm không hiển thị"

### 1. Kiểm tra X-Ray Console

1. Mở AWS X-Ray Console
2. Vào phần **Traces**
3. Tìm traces có operation name là `GetProducts`
4. Kiểm tra các annotations và metadata

### 2. Các bước Debug

#### Bước 1: Kiểm tra Request
- Xem annotation `http_method` và `url`
- Kiểm tra `query_params` trong metadata
- Xác nhận user có quyền truy cập

#### Bước 2: Kiểm tra Query Building
- Xem annotations: `category`, `brand`, `sort`, `page`, `limit`
- Kiểm tra `query_filter` trong metadata
- Xác nhận query được tạo đúng

#### Bước 3: Kiểm tra Database Operations
- Xem annotation `total_count`
- Kiểm tra `category_counts` trong metadata
- Xem annotation `products_found`
- Kiểm tra `products_sample` trong metadata

#### Bước 4: Kiểm tra Response
- Xem annotations: `response_products_count`, `response_total_pages`
- Kiểm tra `response_data` trong metadata
- Xác nhận response có đúng format

### 3. Các lỗi thường gặp và cách debug

#### Lỗi: Không có sản phẩm nào được trả về
**Triệu chứng:** `products_found = 0`, `total_count = 0`
**Nguyên nhân có thể:**
- Database trống
- Query filter quá nghiêm ngặt
- Lỗi kết nối database

**Cách debug:**
1. Kiểm tra `query_filter` trong metadata
2. Xem có lỗi database trong error annotations không
3. Kiểm tra `category_counts` để xem có sản phẩm trong database không

#### Lỗi: Sản phẩm có trong database nhưng không hiển thị
**Triệu chứng:** `total_count > 0` nhưng `products_found = 0`
**Nguyên nhân có thể:**
- Lỗi pagination (page, limit)
- Lỗi sorting
- Sản phẩm không match với filter

**Cách debug:**
1. Kiểm tra `page` và `limit` annotations
2. Xem `sortOption` trong metadata
3. Kiểm tra `query_filter` có đúng không

#### Lỗi: Response không đúng format
**Triệu chứng:** Frontend không parse được response
**Nguyên nhân có thể:**
- Response structure sai
- Missing required fields
- Data type không đúng

**Cách debug:**
1. Kiểm tra `response_data` trong metadata
2. Xem `response_status` có phải 200 không
3. Kiểm tra `products_sample` để xem data structure

### 4. Sử dụng X-Ray Filtering

#### Filter theo Error
```
annotation.status = "error"
```

#### Filter theo Operation
```
annotation.operation = "GetProducts"
```

#### Filter theo Product Category
```
annotation.category = "gaming"
```

#### Filter theo Performance
```
annotation.operation_duration_ms > 1000
```

### 5. Monitoring và Alerting

#### CloudWatch Alarms
Tạo alarms dựa trên:
- Error rate cao
- Response time chậm
- Database connection failures

#### SNS Notifications
Gửi notification khi:
- GetProducts operation fails
- Database errors xảy ra
- Performance degradation

## Best Practices

1. **Consistent Naming**: Sử dụng naming convention nhất quán cho annotations
2. **Meaningful Values**: Đảm bảo annotations có giá trị hữu ích cho debugging
3. **Performance Impact**: Không thêm quá nhiều metadata có thể ảnh hưởng performance
4. **Error Handling**: Luôn handle errors và thêm error annotations
5. **Documentation**: Cập nhật documentation khi thêm annotations mới

## Troubleshooting Checklist

- [ ] X-Ray daemon đang chạy
- [ ] ENABLE_XRAY environment variable = 'true'
- [ ] AWS credentials được cấu hình đúng
- [ ] IAM permissions cho X-Ray
- [ ] Network connectivity đến X-Ray service
- [ ] Application logs không có errors
- [ ] Database connection hoạt động
- [ ] Query parameters hợp lệ
- [ ] Response format đúng
- [ ] Frontend có thể parse response 