# SYSTEM TEST PLAN (TEST_PLAN.md)
## Guardian Insight Radar - Voice of Customer MVP

Tài liệu này xác lập quy trình kiểm thử thủ công (Manual Verification), các ca kiểm thử chính (Test Cases) nhằm đảm bảo tính ổn định và chính xác của ứng dụng Hackathon MVP trước khi bàn giao.

---

### 1. MỤC TIÊU VÀ PHẠM VI KIỂM THỬ

*   **Mục tiêu**: Đảm bảo tất cả 16 tính năng MVP hoạt động trơn tru trên trình duyệt Desktop, dữ liệu được phân tích đúng và trả về kết quả tiếng Việt chuẩn xác qua Gemini API.
*   **Phạm vi kiểm thử**:
    *   Kiểm thử chức năng (Functional Testing): Nhập liệu, chuẩn hóa dữ liệu, tích hợp Gemini API, vẽ biểu đồ Recharts, hiển thị kết quả phân tích.
    *   Kiểm thử UI/UX: Độ phản hồi của giao diện máy tính, định dạng tiếng Việt, trạng thái tải (loading indicators), trạng thái trống (empty state).
    *   Kiểm thử bảo mật cơ bản: Xác thực rằng không có API Key nào bị phơi bày ở mã nguồn phía Client (kiểm tra tab Network của Browser).

---

### 2. KỊCH BẢN KIỂM THỬ CHI TIẾT (TEST CASES)

#### Nhóm 1: Nhập dữ liệu (Data Import)

| Mã TC | Tên ca kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **TC-1.1** | Nạp dữ liệu mô phỏng | 1. Truy cập trang Nhập dữ liệu.<br>2. Nhấn nút **"Nạp Dữ liệu Demo"**.<br>3. Kiểm tra số lượng bản ghi hiển thị. | - Hệ thống thông báo nạp thành công.<br>- Hiển thị danh sách phản hồi mẫu của Guardian, Hasaki và Watsons.<br>- Tổng số dòng nạp được tối thiểu 50 phản hồi. | Chưa chạy |
| **TC-1.2** | Tải lên tệp CSV hợp lệ | 1. Nhấp nút tải xuống CSV mẫu.<br>2. Điền thông tin hợp lệ vào file mẫu.<br>3. Kéo thả file lên khu vực tải tệp.<br>4. Nhấn "Xử lý tệp". | - Hệ thống phân tích CSV thành công.<br>- Dữ liệu hiển thị đúng định dạng trên bảng danh sách.<br>- Dẫn người dùng về Dashboard. | Chưa chạy |
| **TC-1.3** | Tải lên tệp CSV không hợp lệ | 1. Tạo tệp CSV có cột sai tên (ví dụ: đổi `brand` thành `hang_hoa`).<br>2. Tải lên hệ thống.<br>3. Kiểm tra thông báo lỗi. | - Hệ thống không nhận file.<br>- Zod hiển thị lỗi xác thực chi tiết ở phía Client (ví dụ: cột không hợp lệ hoặc thiếu cột). | Chưa chạy |
| **TC-1.4** | Dán văn bản đánh giá thô | 1. Copy một bình luận từ Shopee.<br>2. Dán vào Textarea trên giao diện.<br>3. Chọn rating (ví dụ: 1 sao).<br>4. Chọn kênh (Shopee).<br>5. Bấm "Phân tích ngay". | - Hệ thống phân tích thành công và nạp đánh giá này vào danh sách phân tích.<br>- Tự động gọi API Gemini phân tích đơn lẻ đánh giá vừa dán. | Chưa chạy |

#### Nhóm 2: Bảng điều khiển Tổng quan (Overview Dashboard)

| Mã TC | Tên ca kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **TC-2.1** | Trạng thái trống (Empty State) | 1. Khởi động ứng dụng (chưa nạp dữ liệu).<br>2. Nhấp vào tab "Tổng quan". | - Hiển thị màn hình trống với thông điệp: *"Chưa có dữ liệu phân tích. Hãy nạp dữ liệu để bắt đầu."* kèm nút bấm chuyển hướng tới trang Import. | Chưa chạy |
| **TC-2.2** | Hiển thị Biểu đồ & Chỉ số KPI | 1. Nạp dữ liệu demo thành công.<br>2. Truy cập tab "Tổng quan". | - Các số liệu KPI (CSAT, Số lượng phản hồi, % Tiêu cực) hiển thị chính xác.<br>- Các biểu đồ Recharts vẽ đúng tỉ lệ, hover hiển thị tooltip rõ ràng. | Chưa chạy |

#### Nhóm 3: Phân tích & Xếp hạng Vấn đề (Issue Radar)

| Mã TC | Tên ca kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **TC-3.1** | Phân hạng Mức độ ưu tiên | 1. Có dữ liệu demo.<br>2. Truy cập tab "Radar Vấn đề". | - Danh sách vấn đề được sắp xếp theo độ ưu tiên giảm dần.<br>- Các vấn đề nghiêm trọng nhất (ví dụ: Giao hàng trễ, Sản phẩm lỗi) đứng đầu danh sách. | Chưa chạy |
| **TC-3.2** | Lọc dữ liệu trên Radar | 1. Sử dụng bộ lọc Kênh (ví dụ: Lazada).<br>2. Sử dụng bộ lọc Mức độ nghiêm trọng (Tiêu cực). | - Danh sách vấn đề chỉ hiển thị những đánh giá thuộc Lazada hoặc có sắc thái Tiêu cực. | Chưa chạy |

#### Nhóm 4: Phân tích Nguyên nhân gốc rễ (RCA)

| Mã TC | Tên ca kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **TC-4.1** | Gọi API phân tích chi tiết | 1. Chọn một sự cố từ Radar Vấn đề.<br>2. Bấm vào "Xem Phân tích Root Cause".<br>3. Nhấn "Yêu cầu AI Phân tích Sâu" (nếu cần tải mới). | - Hiển thị trạng thái loading chờ đợi.<br>- Phản hồi từ Gemini API hiển thị sơ đồ 5 Whys, Nguyên nhân gốc rễ bằng tiếng Việt.<br>- Có trích dẫn đánh giá thực tế từ khách hàng làm minh chứng. | Chưa chạy |

#### Nhóm 5: So sánh Đối thủ cạnh tranh (Competitor Benchmark)

| Mã TC | Tên ca kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **TC-5.1** | So sánh đa chiều | 1. Đảm bảo dữ liệu demo có phản hồi của Hasaki và Watsons.<br>2. Truy cập tab "So sánh đối thủ". | - Hiển thị biểu đồ so sánh thị phần thảo luận và cảm xúc của 3 bên.<br>- Hiển thị ma trận so sánh điểm mạnh, điểm yếu rõ ràng. | Chưa chạy |

#### Nhóm 6: Tóm tắt Điều hành (Executive Brief)

| Mã TC | Tên ca kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **TC-6.1** | Tạo báo cáo tóm tắt bằng AI | 1. Có dữ liệu trong ứng dụng.<br>2. Truy cập tab "Báo cáo Điều hành".<br>3. Bấm nút "Tạo Báo cáo". | - Hiển thị màn hình Loading.<br>- Trả về báo cáo tiếng Việt định dạng Markdown chuyên nghiệp gồm 4 phần chính.<br>- Kiểm tra không lỗi font chữ tiếng Việt. | Chưa chạy |
| **TC-6.2** | Sao chép báo cáo | 1. Bấm nút "Sao chép Báo cáo" (Copy to Clipboard).<br>2. Thử dán (Paste) vào một file text khác. | - Hiển thị thông báo "Đã sao chép vào bộ nhớ tạm".<br>- Văn bản dán ra trùng khớp hoàn toàn với báo cáo hiển thị trên màn hình. | Chưa chạy |

---

### 3. KIỂM TRA BẢO MẬT & ĐIỀU KIỆN BIÊN (EDGE CASES & SECURITY)

1.  **Thiếu API Key (`GEMINI_API_KEY`)**:
    *   *Kịch bản*: Chạy ứng dụng khi chưa điền API Key trong file `.env.local` hoặc bị lỗi kết nối mạng.
    *   *Kết quả mong đợi*: API Route trả về mã trạng thái lỗi `500` hoặc thông tin lỗi hợp lệ, giao diện hiển thị cảnh báo lỗi bằng tiếng Việt dễ hiểu: *"Không thể kết nối với dịch vụ phân tích AI. Vui lòng kiểm tra cấu hình hệ thống."*, không làm sập ứng dụng (no crash).
2.  **Rò rỉ API Key ở Client**:
    *   *Kịch bản*: Mở Chrome DevTools -> tab Network -> kiểm tra các API gửi đi từ Client.
    *   *Kết quả mong đợi*: Không có yêu cầu nào gửi trực tiếp đến tên miền `googleapis.com` từ phía trình duyệt. Tất cả các yêu cầu phân tích đều được định tuyến qua server cục bộ (ví dụ: `http://localhost:3000/api/...`).
3.  **Tải dữ liệu trống hoặc quá ít**:
    *   *Kịch bản*: Tải file CSV chỉ có 1 đánh giá hoặc không có đánh giá tiêu cực nào.
    *   *Kết quả mong đợi*: Giao diện không bị vỡ biểu đồ (các biểu đồ Recharts xử lý tốt trường hợp chia cho 0 hoặc dữ liệu rỗng), hiển thị thông điệp phù hợp.
