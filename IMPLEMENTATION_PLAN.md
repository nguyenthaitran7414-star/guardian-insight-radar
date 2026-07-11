# KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION_PLAN.md)
## Guardian Insight Radar - Voice of Customer MVP

Tài liệu này vạch ra chiến lược triển khai chi tiết theo từng giai đoạn (Phases) nhằm hoàn thành ứng dụng MVP Guardian Insight Radar một cách nhanh chóng, chất lượng và hạn chế tối đa rủi ro.

---

### 1. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU (RISK ASSESSMENT)

1.  **Rủi ro quá tải / vượt hạn mức gọi Gemini API (Rate Limits / Costs)**:
    *   *Mô tả*: Trong quá trình demo tại hackathon, việc bấm nút phân tích lại liên tục có thể dẫn tới hết hạn ngạch API miễn phí hoặc phản hồi chậm.
    *   *Phương án giải quyết*: Sử dụng cơ chế lưu trữ cục bộ (Client-side cache/memoization). Các đánh giá trong dữ liệu Demo đã được phân tích sẵn (Pre-analyzed) và đóng gói trực tiếp trong mã nguồn. Chỉ các đánh giá dán mới hoặc tải lên bằng CSV mới gọi đến API Gemini thực tế. Kết quả phân tích mới cũng được lưu tạm vào bộ nhớ hoặc localStorage để tránh gọi lại.
2.  **Rủi ro từ cấu trúc dữ liệu tải lên CSV thiếu đồng bộ**:
    *   *Mô tả*: Tệp CSV do người dùng tải lên có thể thiếu cột, sai định dạng ngày tháng, hoặc chứa các ký tự lạ làm lỗi bộ phân tích.
    *   *Phương án giải quyết*: Sử dụng Papa Parse kết hợp kiểm tra nghiêm ngặt bằng Zod Schema ngay tại Client. Bất kỳ dòng nào lỗi sẽ bị loại bỏ hoặc hiển thị thông báo sửa đổi chi tiết, ngăn chặn dữ liệu bẩn lọt vào luồng phân tích.
3.  **Thiếu cơ sở dữ liệu để lưu trữ**:
    *   *Mô tả*: Ứng dụng không sử dụng cơ sở dữ liệu phía máy chủ (theo yêu cầu phạm vi MVP).
    *   *Phương án giải quyết*: Quản lý toàn bộ dữ liệu phản hồi đã nhập trong React Context hoặc Zustand State. Lưu trữ tạm thời trạng thái này vào LocalStorage / SessionStorage của trình duyệt để người dùng không bị mất dữ liệu khi nhấn tải lại trang (Refresh).
4.  **Tính ổn định của phản hồi JSON cấu trúc từ LLM**:
    *   *Mô tả*: AI đôi lúc trả về định dạng JSON không hợp lệ hoặc thiếu thuộc tính.
    *   *Phương án giải quyết*: Sử dụng tính năng Structured Outputs của Gemini API bằng cách định nghĩa nghiêm ngặt `responseSchema` trong mã nguồn Server và dùng Zod để parse/validate phản hồi từ Gemini trước khi gửi về Client. Nếu lỗi, có cơ chế fallback trả về kết quả mặc định thay vì báo lỗi hệ thống.

---

### 2. CÁC GIAI ĐOẠN TRIỂN KHAI (IMPLEMENTATION PHASES)

#### Giai đoạn 1: Thiết lập dự án & Khung giao diện (Skeleton)
*   **Mục tiêu**: Tạo dự án Next.js mới với TypeScript, Tailwind CSS, thiết lập thư viện biểu đồ Recharts và thiết kế Sidebar điều hướng tĩnh.
*   **Các đầu việc cụ thể**:
    1. Khởi tạo dự án Next.js bằng `npx create-next-app@latest` với cấu hình TypeScript, Tailwind, App Router.
    2. Cấu hình Tailwind CSS, định nghĩa bảng màu (Premium Dark Mode / Clean Retail Analytics).
    3. Xây dựng Layout tổng thể của ứng dụng với Sidebar và thanh tiêu đề (Header).
    4. Tạo 6 trang tương ứng với các tab điều hướng (ở chế độ Skeleton hiển thị tiêu đề và cấu trúc bố cục):
        - `/import` (Nhập dữ liệu)
        - `/dashboard` (Tổng quan)
        - `/radar` (Radar vấn đề)
        - `/root-cause` (Phân tích nguyên nhân)
        - `/benchmark` (So sánh đối thủ)
        - `/brief` (Báo cáo điều hành)

#### Giai đoạn 2: Quản lý trạng thái dữ liệu & Nhập liệu (CSV & Paste)
*   **Mục tiêu**: Hoàn thành tính năng nạp dữ liệu Demo, tải file CSV và dán phản hồi thô. Chuẩn hóa dữ liệu đầu vào.
*   **Các đầu việc cụ thể**:
    1. Thiết kế dữ liệu mô phỏng tiếng Việt phong phú (`demoData.json`) của Guardian, Hasaki, Watsons với đầy đủ sắc thái và chủ đề.
    2. Viết State Provider quản lý tập hợp dữ liệu phản hồi (Feedbacks State) và lưu trữ cục bộ (LocalStorage).
    3. Cài đặt Papa Parse và viết hàm phân tích CSV.
    4. Sử dụng Zod để validate dữ liệu đầu vào.
    5. Thiết kế giao diện trang `/import` hoàn chỉnh với các khu vực tương tác (Upload kéo thả, Paste Textarea, Button Load Demo).

#### Giai đoạn 3: Bảng điều khiển tổng quan (Dashboard Visuals)
*   **Mục tiêu**: Trực quan hóa dữ liệu đã nạp bằng các biểu đồ Recharts.
*   **Các đầu việc cụ thể**:
    1. Viết các hàm helper tính toán tổng hợp từ State (tổng số phản hồi, CSAT trung bình, tỷ lệ cảm xúc).
    2. Cài đặt biểu đồ xu hướng cảm xúc theo thời gian (Line/Area Chart).
    3. Cài đặt biểu đồ cơ cấu kênh phân phối (Donut Chart).
    4. Cài đặt biểu đồ phân bố chủ đề (Bar Chart).
    5. Xây dựng giao diện trang `/dashboard` trực quan, hiện đại.

#### Giai đoạn 4: Radar vấn đề & Tích hợp Gemini API
*   **Mục tiêu**: Xây dựng trang Radar sự cố và viết các Route API Server Next.js kết nối Gemini.
*   **Các đầu việc cụ thể**:
    1. Cấu hình biến môi trường `GEMINI_API_KEY` ở file `.env.local`.
    2. Viết Route API `/api/analyze/feedback` sử dụng thư viện `@google/generative-ai` để phân tích cảm xúc, chủ đề và ý định.
    3. Xây dựng trang `/radar` hiển thị danh sách vấn đề được xếp hạng theo thứ tự ưu tiên (Priority Score = Tần suất phản hồi tiêu cực × Mức độ nghiêm trọng).
    4. Tích hợp bộ lọc kênh phân phối, chủ đề và sắc thái tại trang Radar.

#### Giai đoạn 5: Phân tích nguyên nhân gốc rễ (RCA) & So sánh đối thủ
*   **Mục tiêu**: Hoàn thành trang RCA chi tiết và trang so sánh benchmark cạnh tranh.
*   **Các đầu việc cụ thể**:
    1. Viết Route API `/api/analyze/root-cause` cho phân tích RCA sâu bằng Gemini.
    2. Xây dựng trang `/root-cause` cho phép người dùng chọn một vấn đề tiêu cực nổi cộm và xem AI bóc tách nguyên nhân, đưa ra trích dẫn chứng cứ và đề xuất hành động.
    3. Xây dựng trang `/benchmark` vẽ biểu đồ so sánh chi tiết điểm hài lòng (CSAT), thị phần tiếng nói (Share of Voice) của Guardian, Hasaki, Watsons và lập bảng so sánh điểm mạnh/yếu.

#### Giai đoạn 6: Báo cáo điều hành (Executive Brief) & Hoàn thiện
*   **Mục tiêu**: Viết tính năng tạo tóm tắt báo cáo cấp cao bằng AI và hoàn thiện trải nghiệm người dùng toàn diện.
*   **Các đầu việc cụ thể**:
    1. Viết Route API `/api/analyze/executive-brief` để sinh báo cáo Markdown tiếng Việt.
    2. Xây dựng trang `/brief` hiển thị báo cáo AI cùng nút bấm sao chép và xuất bản.
    3. Thực hiện kiểm thử toàn bộ hệ thống theo `TEST_PLAN.md`.
    4. Tinh chỉnh giao diện, thêm các hiệu ứng micro-animations, loading spinner mượt mà.

---

### 3. THỨ TỰ THỰC THI CHUẨN (EXECUTION ORDER)
Để xây dựng hệ thống một cách tối ưu, chúng ta sẽ đi theo trình tự sau:
1.  **Dựng khung cấu trúc Next.js và thiết lập Tailwind CSS**.
2.  **Định nghĩa kiểu dữ liệu và viết logic Import / Load Demo Data** (Vì không có dữ liệu thì không thể test các màn hình khác).
3.  **Xây dựng Dashboard trực quan hóa dữ liệu** (Giúp kiểm chứng trực quan dữ liệu thô đã nạp đúng chưa).
4.  **Xây dựng Server API kết nối Gemini API** (Nền tảng cho các tính năng thông minh tiếp theo).
5.  **Xây dựng Radar vấn đề & RCA** (Các tính năng phân tích cốt lõi mang lại giá trị cao nhất).
6.  **Xây dựng So sánh đối thủ & Báo cáo điều hành**.
7.  **Kiểm thử, tối ưu và đánh bóng UI**.
