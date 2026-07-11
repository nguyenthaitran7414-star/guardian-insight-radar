# AI ANALYSIS & GEMINI SCHEMA (AI_ANALYSIS_SCHEMA.md)
## Guardian Insight Radar - Voice of Customer MVP

Tài liệu này chi tiết cấu trúc tích hợp Gemini API, bao gồm Prompt kỹ thuật (Prompt engineering), các Schema JSON đầu ra bắt buộc (Structured Outputs) và thiết kế Endpoint API Route phía Server.

---

### 1. KIẾN TRÚC KẾT NỐI GEMINI API

*   **Bảo mật**: Mọi cuộc gọi API đến Gemini đều phải thực hiện từ máy chủ Next.js (Server Route `/api/analyze` và `/api/report`). API Key được lưu ở biến môi trường `GEMINI_API_KEY`. Phía Client chỉ gửi yêu cầu HTTP POST kèm dữ liệu thô và nhận về JSON phản hồi đã phân tích.
*   **Model**: Sử dụng dòng mô hình **Gemini 2.5 Flash** (hoặc Pro nếu cần phân tích tóm tắt cực lớn) để đảm bảo tốc độ phản hồi nhanh, giá thành rẻ, hiệu năng cao.
*   **Structured Outputs**: Yêu cầu Gemini phản hồi bằng định dạng JSON chuẩn thông qua cấu hình `responseMimeType: "application/json"` kết hợp với việc mô tả Schema cấu trúc đầu ra trong phần System Instructions hoặc tham số `responseSchema`.

---

### 2. ENDPOINT 1: PHÂN TÍCH VÀ PHÂN LOẠI CHI TIẾT PHẢN HỒI (BATCH ANALYSIS)

*   **URL**: `/api/analyze/feedback`
*   **Method**: `POST`
*   **Payload đầu vào**:
    ```json
    {
      "feedbacks": [
        {
          "id": "voc-1",
          "reviewText": "Giao hàng siêu chậm, đặt hàng từ đầu tuần mà cuối tuần mới nhận được. Hộp giấy bên ngoài bị móp méo hết cả..."
        }
      ]
    }
    ```

#### Gemini System Instructions & Prompt
```text
Bạn là một chuyên gia phân tích dữ liệu bán lẻ và kiến trúc sư Voice of Customer (VoC) của chuỗi cửa hàng chăm sóc sức khỏe & sắc đẹp Guardian tại Việt Nam.
Nhiệm vụ của bạn là phân tích danh sách các phản hồi của khách hàng được cung cấp.
Với mỗi phản hồi, bạn phải trả về một đối tượng JSON chính xác theo cấu trúc Schema được định nghĩa.
Ngôn ngữ phân tích: Tiếng Việt (các trường sentiment, theme, intent giữ nguyên mã tiếng Anh, các trường văn bản mô tả bằng tiếng Việt).

Phân loại Chủ đề (theme) bắt buộc phải là một trong các giá trị:
- "Product Quality" (Chất lượng sản phẩm, hàng giả, hết hạn, dị ứng...)
- "Shipping & Delivery" (Thời gian giao hàng, thái độ shipper, thất lạc đơn hàng...)
- "Customer Service" (Thái độ nhân viên cửa hàng, hotline phản hồi chậm, tư vấn sai...)
- "Pricing & Promotion" (Giá đắt, khuyến mãi không áp dụng được, sai giá...)
- "Packaging" (Đóng gói lỏng lẻo, bể vỡ sản phẩm, không có chống sốc...)
- "App & Web Experience" (Lỗi ứng dụng, không thanh toán được trực tuyến, giao diện khó dùng...)
- "Product Assortment" (Thiếu hàng, không tìm thấy sản phẩm mong muốn, ít mẫu mã...)

Phân loại Ý định (intent) phải là một trong các giá trị:
- "Complaint" (Khiếu nại/Phàn nàn)
- "Inquiry" (Thắc mắc/Hỏi thông tin)
- "Praise" (Khen ngợi/Động viên)
- "Suggestion" (Góp ý/Đề xuất cải tiến)

Điểm số cảm xúc (sentimentScore) nằm trong khoảng từ -1.0 (cực kỳ tiêu cực) đến 1.0 (cực kỳ tích cực). Phân loại cảm xúc (sentiment) tương ứng là 'positive' nếu score > 0.15, 'negative' nếu score < -0.15, và 'neutral' nếu nằm ở giữa.
```

#### JSON Response Schema từ Gemini
```json
{
  "type": "object",
  "properties": {
    "analyses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] },
          "sentimentScore": { "type": "number" },
          "theme": { "type": "string", "enum": ["Product Quality", "Shipping & Delivery", "Customer Service", "Pricing & Promotion", "Packaging", "App & Web Experience", "Product Assortment"] },
          "intent": { "type": "string", "enum": ["Complaint", "Inquiry", "Praise", "Suggestion"] },
          "painPoints": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Các điểm đau cụ thể được chỉ ra trong đánh giá, tối đa 3 ý"
          },
          "hiddenNeeds": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Các nhu cầu chưa được đáp ứng trực tiếp hoặc kỳ vọng của khách hàng"
          }
        },
        "required": ["id", "sentiment", "sentimentScore", "theme", "intent", "painPoints", "hiddenNeeds"]
      }
    }
  },
  "required": ["analyses"]
}
```

---

### 3. ENDPOINT 2: PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

*   **URL**: `/api/analyze/root-cause`
*   **Method**: `POST`
*   **Payload đầu vào**:
    ```json
    {
      "issueName": "Thời gian giao hàng Shopee quá chậm trong kỳ Megasale",
      "feedbacks": [
        { "reviewText": "...đánh giá tiêu cực liên quan đến giao hàng..." }
      ]
    }
    ```

#### Gemini System Instructions & Prompt
```text
Bạn là một chuyên gia phân tích vận hành và quản lý chất lượng chuỗi bán lẻ.
Dựa trên tập hợp các đánh giá tiêu cực của khách hàng về một chủ đề cụ thể (issueName), hãy thực hiện phân tích nguyên nhân gốc rễ (Root Cause Analysis - RCA).
Sử dụng phương pháp "5 Whys" một cách logic để tìm ra nguyên nhân sâu xa nhất.
Đồng thời đề xuất 1-2 hành động khắc phục cụ thể và gán cho phòng ban chịu trách nhiệm tương ứng trong doanh nghiệp bán lẻ (Commercial, E-commerce, CSKH, Marketing).
Trích xuất tối đa 3 câu trích dẫn bằng chứng (evidence quotes) nguyên văn từ phản hồi của khách hàng.
Toàn bộ phản hồi phải được viết bằng tiếng Việt tự nhiên, chuyên nghiệp.
```

#### JSON Response Schema từ Gemini
```json
{
  "type": "object",
  "properties": {
    "issueName": { "type": "string" },
    "detectedRootCause": { 
      "type": "string", 
      "description": "Nguyên nhân cốt lõi sâu xa nhất phát hiện được dựa trên dữ liệu phản hồi" 
    },
    "explanation": { 
      "type": "string", 
      "description": "Lời giải thích chi tiết, logic về cơ chế dẫn tới lỗi (vận dụng phân tích chuỗi nguyên nhân)" 
    },
    "evidenceQuotes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Các câu trích dẫn trực tiếp từ đánh giá của khách hàng thể hiện rõ lỗi này"
    },
    "recommendedActions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action": { "type": "string", "description": "Hành động khắc phục cụ thể cần triển khai" },
          "department": { "type": "string", "enum": ["E-commerce", "Marketing", "Commercial", "Customer Service"] }
        },
        "required": ["action", "department"]
      }
    }
  },
  "required": ["issueName", "detectedRootCause", "explanation", "evidenceQuotes", "recommendedActions"]
}
```

---

### 4. ENDPOINT 3: TẠO BÁO CÁO TÓM TẮT ĐIỀU HÀNH (EXECUTIVE BRIEF)

*   **URL**: `/api/analyze/executive-brief`
*   **Method**: `POST`
*   **Payload đầu vào**:
    ```json
    {
      "aggregatedMetrics": {
        "totalFeedbacks": 450,
        "positivePercentage": 65,
        "negativePercentage": 20,
        "topIssues": ["Giao hàng trễ trên Lazada", "Sản phẩm bị đổ nước tẩy trang do đóng gói kém"]
      },
      "competitorComparison": "Guardian CSAT là 4.2/5, Hasaki là 4.5/5, Watsons là 4.0/5. Hasaki mạnh về vận chuyển và quà tặng kèm."
    }
    ```

#### Gemini System Instructions & Prompt
```text
Bạn là Giám đốc Trải nghiệm Khách hàng (Chief Customer Officer) của Guardian Việt Nam.
Hãy soạn thảo một bản Báo cáo tóm tắt điều hành (Executive Brief) định dạng Markdown gửi tới Ban giám đốc điều hành.
Báo cáo phải viết bằng Tiếng Việt văn phong trang trọng, súc tích, mang tính định hướng hành động cao.
Cấu trúc báo cáo bắt buộc gồm các phần sau:
1. Tóm tắt nhanh tình trạng Voice of Customer hiện tại (Thống kê & Nhận định tổng quan).
2. Top 3 vấn đề nghiêm trọng nhất cần can thiệp khẩn cấp (kèm bằng chứng định lượng).
3. Đánh giá vị thế cạnh tranh so với Hasaki và Watsons (Thế mạnh & Điểm yếu tương đối).
4. Kế hoạch hành động cụ thể phân bổ chi tiết cho từng Trưởng phòng ban (CSKH, Marketing, E-commerce, Mua hàng/Commercial).

Hãy xuất ra văn bản Markdown hoàn chỉnh.
```

#### JSON Response Schema từ Gemini
```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "dateGenerated": { "type": "string" },
    "markdownContent": { 
      "type": "string", 
      "description": "Nội dung báo cáo bằng Markdown tiếng Việt đầy đủ cấu trúc" 
    }
  },
  "required": ["title", "dateGenerated", "markdownContent"]
}
```
