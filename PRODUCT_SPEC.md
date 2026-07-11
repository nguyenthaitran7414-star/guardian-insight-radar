# PRODUCT SPECIFICATION (PRODUCT_SPEC.md)
## Guardian Insight Radar - Voice of Customer MVP

### 1. PRODUCT PURPOSE
**Guardian Insight Radar** là một nền tảng Voice of Customer (VoC) vận hành bằng Trí tuệ Nhân tạo (AI), giúp chuyển hóa các phản hồi rời rạc của khách hàng từ nhiều kênh phân phối thành các hành động kinh doanh được ưu tiên cụ thể.
Mục tiêu cốt lõi của ứng dụng là giúp Guardian:
1. **Hợp nhất dữ liệu phản hồi** từ nhiều kênh bán hàng và chăm sóc khách hàng khác nhau.
2. **Phân tích sắc thái (sentiment), chủ đề (topics) và ý định của khách hàng (intent)** một cách tự động.
3. **Phát hiện các vấn đề mới nổi (emerging/rising issues)** trước khi chúng bùng phát.
4. **Giải thích nguyên nhân gốc rễ (root causes)** của các vấn đề dựa trên phản hồi thực tế.
5. **So sánh vị thế cạnh tranh** của Guardian với hai đối thủ lớn là Hasaki và Watsons.
6. **Đề xuất hành động thực thi** kèm theo phòng ban chịu trách nhiệm tương ứng.
7. **Tạo lập báo cáo tóm tắt điều hành (executive brief)** cô đọng cho ban giám đốc.

---

### 2. CORE PRODUCT PRINCIPLE
> [!IMPORTANT]
> **Nguyên tắc cốt lõi**: Đây không chỉ là một bảng điều khiển phân tích cảm xúc (sentiment dashboard) thông thường.
> Giá trị lớn nhất của sản phẩm nằm ở khả năng: **"Xác định vấn đề nào của khách hàng mà Guardian cần giải quyết trước, giải thích lý do tại sao nó xảy ra và đề xuất hành động tiếp theo là gì."**

---

### 3. TARGET USERS
*   **Customer Service Team (Đội ngũ CSKH)**: Theo dõi khiếu nại, phát hiện lỗi hệ thống hoặc thái độ phục vụ để xử lý kịp thời.
*   **Marketing Team (Đội ngũ Tiếp thị)**: Đánh giá hiệu quả chương trình khuyến mãi, phản hồi của khách hàng về chiến dịch truyền thông và thương hiệu.
*   **E-commerce Team (Đội ngũ Thương mại điện tử)**: Giám sát trải nghiệm mua sắm trực tuyến (ứng dụng, website, gian hàng TMĐT), vấn đề đóng gói và giao hàng.
*   **Commercial Team (Đội ngũ Thương mại/Mua hàng)**: Đánh giá danh mục sản phẩm, chất lượng sản phẩm từ nhà cung cấp và định giá.
*   **Business Leaders (Ban điều hành)**: Xem bức tranh tổng cảnh cạnh tranh và các hành động chiến lược ưu tiên cao nhất qua báo cáo tóm tắt điều hành.

---

### 4. MVP FEATURES
1.  **Nhập dữ liệu CSV (Import CSV)**: Cho phép tải lên tệp CSV chứa danh sách phản hồi từ khách hàng.
2.  **Dán phản hồi trực tiếp (Paste Customer Feedback)**: Cho phép người dùng dán nhanh một hoặc nhiều đoạn văn bản đánh giá của khách hàng để phân tích ngay lập tức.
3.  **Tải dữ liệu mô phỏng (Load Demo Data)**: Nút bấm tải dữ liệu chuẩn bị sẵn của Guardian, Hasaki và Watsons qua các kênh phân phối để người dùng trải nghiệm ngay mà không cần tệp tin.
4.  **Chuẩn hóa cấu trúc dữ liệu (Normalization)**: Đưa tất cả dữ liệu từ các kênh khác nhau về một cấu trúc chung thống nhất.
5.  **Phân tích cảm xúc (Sentiment Analysis)**: Phân loại Tích cực (Positive), Trung lập (Neutral), Tiêu cực (Negative) kèm theo điểm số chi tiết.
6.  **Phân loại chủ đề (Theme Classification)**: Nhận diện phản hồi thuộc về nhóm nào (Chất lượng sản phẩm, Giao hàng, Dịch vụ khách hàng, Giá cả, Đóng gói, Trải nghiệm app/web...).
7.  **Phân loại ý định (Customer Intent Classification)**: Xác định phản hồi là Khiếu nại (Complaint), Thắc mắc (Inquiry), Khen ngợi (Praise), hay Góp ý (Suggestion).
8.  **Xác định điểm đau (Pain Points)**: Trích xuất các khó khăn cụ thể mà khách hàng gặp phải.
9.  **Nhận diện nhu cầu ẩn giấu (Hidden Needs)**: Phát hiện những kỳ vọng chưa được nói ra trực tiếp của khách hàng.
10. **Phân tích nguyên nhân gốc rễ (Root Cause Analysis)**: Sử dụng LLM để giải thích tại sao vấn đề xảy ra dựa trên các dữ kiện trong dữ liệu đầu vào.
11. **Phát hiện vấn đề mới nổi (Rising Issues Detection)**: Xác định các chủ đề tiêu cực có xu hướng gia tăng đột biến về tần suất trong thời gian gần đây.
12. **Xếp hạng mức độ ưu tiên (Priority Ranking)**: Đánh giá mức độ nghiêm trọng và lượng hóa độ ưu tiên của các vấn đề (ví dụ: dựa trên số lượng phản hồi tiêu cực, tầm ảnh hưởng).
13. **So sánh đối thủ cạnh tranh (Competitor Benchmark)**: So sánh điểm số cảm xúc, thị phần thảo luận (Share of Voice), và các thế mạnh/điểm yếu chính giữa Guardian, Hasaki và Watsons.
14. **Trích dẫn bằng chứng thực tế (Evidence Extraction)**: Hiển thị các câu trích dẫn trực tiếp từ đánh giá của khách hàng để làm bằng chứng cho mỗi vấn đề phân tích được.
15. **Đề xuất hành động và phòng ban chịu trách nhiệm (Action Recommendation & Assignment)**: Gán cụ thể công việc cần làm cho các phòng ban (E-commerce, Marketing, Commercial, CSKH).
16. **Tóm tắt điều hành (Executive Brief)**: Tự động tổng hợp thành văn bản tóm tắt cấp cao bằng tiếng Việt dành cho Ban Giám đốc.

---

### 5. MAIN SCREENS & LAYOUT DESIGN
1.  **Nhập dữ liệu (Data Import)**
    *   Khu vực tải tệp CSV (kèm file mẫu tải xuống).
    *   Khu vực văn bản (Text area) để dán nhanh các đánh giá.
    *   Nút bấm "Nạp Dữ liệu Demo" (Quick Load Simulated Demo Data) được dán nhãn rõ ràng là **Dữ liệu giả lập (Simulated Data)**.
    *   Bảng hiển thị trạng thái dữ liệu đã nạp (số lượng bản ghi, nguồn dữ liệu, thời gian).
2.  **Bảng điều khiển Tổng quan (Overview Dashboard)**
    *   Thẻ chỉ số chính (KPI cards): Tổng số phản hồi, Chỉ số hài lòng (CSAT ước lượng từ rating), % Tiêu cực/Tích cực, Tổng số vấn đề cần xử lý gấp.
    *   Biểu đồ xu hướng cảm xúc theo thời gian (Recharts Line/Area Chart).
    *   Biểu đồ cơ cấu kênh phân phối (Recharts Pie Chart) và phân phối theo thương hiệu (Guardian, Hasaki, Watsons).
    *   Bảng phân phối chủ đề (Themes Distribution).
3.  **Radar Vấn đề (Issue Radar)**
    *   Danh sách các vấn đề được xếp hạng ưu tiên (Priority Matrix).
    *   Bộ lọc theo Mức độ nghiêm trọng, Chủ đề, và Kênh phân phối.
    *   Trực quan hóa các vấn đề mới nổi (Rising Issues) với chỉ số tăng trưởng đột biến.
4.  **Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)**
    *   Giao diện tương tác cho phép chọn một vấn đề cụ thể từ danh sách.
    *   Trình bày sơ đồ phân tích nguyên nhân gốc rễ (dạng cây hoặc chuỗi nguyên nhân).
    *   Trích xuất bằng chứng (quotes) từ các bình luận thực tế của khách hàng.
    *   Đề xuất hành động sửa chữa cụ thể kèm phòng ban chịu trách nhiệm.
5.  **So sánh Đối thủ (Competitor Benchmark)**
    *   Biểu đồ so sánh phân phối cảm xúc giữa Guardian, Hasaki và Watsons.
    *   So sánh điểm số theo từng khía cạnh chủ đề (Ví dụ: Hasaki được đánh giá tốt hơn về Tốc độ giao hàng, Guardian được đánh giá cao về Uy tín sản phẩm chính hãng nhưng bị phàn nàn về Giá cả hoặc Khuyến mãi).
    *   Bảng ma trận SWOT so sánh nhanh.
6.  **Báo cáo Điều hành (Executive Brief)**
    *   Nút bấm "Tạo Tóm tắt Điều hành mới".
    *   Giao diện hiển thị văn bản tóm tắt định dạng Markdown trực quan bằng tiếng Việt.
    *   Tóm tắt tình hình hiện tại, các vấn đề khẩn cấp nhất, và bảng phân chia hành động hành chính cho các trưởng bộ phận.
    *   Tích hợp tính năng Sao chép nhanh (Copy to Clipboard) hoặc Xuất file (Export).

---

### 6. NON-GOALS (PHẠM VI KHÔNG THỰC HIỆN)
Để đảm bảo tính khả thi cao nhất cho một dự án Hackathon MVP, các tính năng sau đây được xác định rõ là **KHÔNG xây dựng**:
*   *Không* làm tính năng Đăng nhập/Đăng ký (Authentication) hay Phân quyền người dùng (User roles).
*   *Không* kết nối cơ sở dữ liệu vật lý lâu dài (Postgres, MongoDB...) - mọi dữ liệu được quản lý trong trạng thái ứng dụng (React Context/State) và lưu trữ cục bộ tạm thời (SessionStorage/LocalStorage) hoặc tải lên trực tiếp.
*   *Không* tích hợp API trực tiếp với Shopee, Lazada, TikTok Shop, GrabMart hay các hệ thống tổng đài CSKH.
*   *Không* cào dữ liệu web tự động (Web scraping).
*   *Không* thực hiện chuyển đổi giọng nói thành văn bản (Call transcription) hay phân tích hình ảnh đánh giá (Image analysis).
*   *Không* xây dựng ứng dụng di động (Mobile App).
*   *Không* thiết kế kiến trúc đa tác nhân (Multi-agent architecture) phức tạp.
*   *Không* tinh chỉnh mô hình AI (Model fine-tuning).

---

### 7. TECHNICAL STACK & ARCHITECTURE PREFERENCES
*   **Framework**: Next.js (Phiên bản ổn định mới nhất, sử dụng App Router).
*   **Ngôn ngữ**: TypeScript để tối ưu hóa an toàn kiểu dữ liệu.
*   **Styling**: Tailwind CSS cho việc xây dựng giao diện nhanh chóng, thẩm mỹ hiện đại.
*   **Biểu đồ**: Recharts để trực quan hóa số liệu trực quan, tương tác mượt mà.
*   **Xử lý CSV**: Papa Parse để phân tích cú pháp tệp CSV tải lên ở phía Client.
*   **Xác thực dữ liệu**: Zod để định nghĩa schema và validate dữ liệu đầu vào.
*   **AI Integration**: Sử dụng Gemini API (Gemini 2.5 Flash hoặc Pro) chỉ thông qua các Route Handler phía máy chủ (Server-side API routes ở `/api/analyze`...). Tuyệt đối không để lộ API Key ở phía Client.
*   **Bảo mật**: API Key được lưu trong biến môi trường `.env.local`.
*   **Ngôn ngữ giao diện**: 100% tiếng Việt, thiết kế hiện đại, chuyên nghiệp theo phong cách phân tích bán lẻ cao cấp.
