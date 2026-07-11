# DATA SCHEMA & VALIDATION (DATA_SCHEMA.md)
## Guardian Insight Radar - Voice of Customer MVP

Tài liệu này định nghĩa cấu trúc dữ liệu thô (Raw Data), cấu trúc dữ liệu chuẩn hóa (Normalized Data) và các quy tắc xác thực (Validation Rules) sử dụng thư viện Zod.

---

### 1. CẤU TRÚC DỮ LIỆU ĐẦU VÀO THÔ (RAW DATA SCHEMA)

Dữ liệu đầu vào của ứng dụng có thể đến từ 3 nguồn:
1. **Dữ liệu giả lập (Demo Data)**: Có cấu trúc hoàn chỉnh.
2. **Tải tệp CSV (CSV Import)**: Người dùng tải lên tệp CSV chứa các đánh giá của khách hàng.
3. **Dán đánh giá (Pasted Text)**: Người dùng dán văn bản đánh giá thô. Khi dán, hệ thống sẽ tự động gán thương hiệu là "Guardian", kênh là "Customer service", rating mặc định hoặc do người dùng chọn, và ngày hiện tại.

#### Định dạng tệp CSV mẫu (CSV Format)
Tệp CSV phải có hàng tiêu đề đầu tiên và hỗ trợ các cột sau:
*   `date`: Định dạng ngày tháng (`YYYY-MM-DD` hoặc `DD/MM/YYYY`).
*   `brand`: Thương hiệu (`Guardian`, `Hasaki`, `Watsons`).
*   `channel`: Kênh đánh giá (`Shopee`, `Lazada`, `TikTok Shop`, `GrabMart`, `Customer service`, `Social media`, `Guardian online store`).
*   `rating`: Điểm đánh giá (Số nguyên từ `1` đến `5`).
*   `review_text`: Nội dung nhận xét của khách hàng (Chuỗi văn bản bằng tiếng Việt).

---

### 2. CẤU TRÚC DỮ LIỆU CHUẨN HÓA (NORMALIZED DATA SCHEMA)

Sau khi nhập dữ liệu thông qua CSV hoặc Dán trực tiếp, hệ thống sẽ chuẩn hóa dữ liệu thành cấu trúc đối tượng TypeScript thống nhất để đưa vào State của ứng dụng.

```typescript
export interface CustomerFeedback {
  id: string;               // UUID hoặc chuỗi định danh duy nhất tự tạo
  date: string;             // ISO Date String (YYYY-MM-DD)
  brand: 'Guardian' | 'Hasaki' | 'Watsons';
  channel: 'Shopee' | 'Lazada' | 'TikTok Shop' | 'GrabMart' | 'Customer service' | 'Social media' | 'Guardian online store';
  rating: number;           // Số nguyên từ 1 đến 5
  reviewText: string;       // Văn bản đánh giá gốc tiếng Việt
  
  // Trạng thái phân tích (Sẽ được điền sau khi qua công cụ phân tích AI hoặc được gắn sẵn trong Demo Data)
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysis?: FeedbackAIAnalysis;
}

export interface FeedbackAIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;   // Điểm số cảm xúc từ -1.0 (rất tiêu cực) đến 1.0 (rất tích cực)
  theme: 'Product Quality' | 'Shipping & Delivery' | 'Customer Service' | 'Pricing & Promotion' | 'Packaging' | 'App & Web Experience' | 'Product Assortment';
  intent: 'Complaint' | 'Inquiry' | 'Praise' | 'Suggestion';
  painPoints: string[];     // Các điểm đau cụ thể (ví dụ: ["giao hàng trễ", "hộp bị móp"])
  hiddenNeeds: string[];    // Nhu cầu ẩn giấu (ví dụ: ["muốn giao hỏa tốc", "cần đóng gói kỹ hơn"])
}
```

---

### 3. XÁC THỰC DỮ LIỆU BẰNG ZOD (ZOD VALIDATION SCHEMAS)

Chúng ta định nghĩa các Schema Zod để kiểm tra tính hợp lệ ở cả Client-side (khi Parse CSV) và Server-side (khi tiếp nhận yêu cầu phân tích).

```typescript
import { z } from 'zod';

// Định nghĩa Enum cho Thương hiệu
export const BrandEnum = z.enum(['Guardian', 'Hasaki', 'Watsons'], {
  errorMap: () => ({ message: 'Thương hiệu phải là Guardian, Hasaki hoặc Watsons' })
});

// Định nghĩa Enum cho Kênh phân phối
export const ChannelEnum = z.enum([
  'Shopee',
  'Lazada',
  'TikTok Shop',
  'GrabMart',
  'Customer service',
  'Social media',
  'Guardian online store'
], {
  errorMap: () => ({ message: 'Kênh phân phối không hợp lệ' })
});

// Schema xác thực một dòng dữ liệu từ CSV
export const CSVRowSchema = z.object({
  date: z.string().refine((val) => {
    // Kiểm tra định dạng ngày yyyy-mm-dd hoặc dd/mm/yyyy
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/;
    return dateRegex.test(val);
  }, { message: 'Định dạng ngày phải là YYYY-MM-DD hoặc DD/MM/YYYY' }),
  brand: BrandEnum,
  channel: ChannelEnum,
  rating: z.preprocess((val) => parseInt(val as string, 10), z.number().int().min(1).max(5, {
    message: 'Điểm đánh giá phải nằm trong khoảng từ 1 đến 5'
  })),
  review_text: z.string().min(1, { message: 'Nội dung phản hồi không được để trống' })
});

// Schema xác thực dữ liệu dán trực tiếp (Pasted Text Input)
export const PasteInputSchema = z.object({
  reviewText: z.string().min(5, { message: 'Nội dung phản hồi phải chứa ít nhất 5 ký tự' }),
  rating: z.number().int().min(1).max(5).default(3),
  channel: ChannelEnum.default('Customer service'),
  brand: BrandEnum.default('Guardian')
});
```

---

### 4. MẪU DỮ LIỆU JSON ĐẦU VÀO (EXAMPLE JSON PAYLOADS)

#### Dữ liệu sau khi nạp thành công (Normalized Feedback Instance)
```json
{
  "id": "voc-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "date": "2026-07-10",
  "brand": "Guardian",
  "channel": "Shopee",
  "rating": 2,
  "reviewText": "Giao hàng siêu chậm, đặt hàng từ đầu tuần mà cuối tuần mới nhận được. Hộp giấy bên ngoài bị móp méo hết cả làm đổ một ít sữa tắm ra ngoài. Rất thất vọng về khâu vận chuyển của shop.",
  "analysisStatus": "completed",
  "aiAnalysis": {
    "sentiment": "negative",
    "sentimentScore": -0.8,
    "theme": "Shipping & Delivery",
    "intent": "Complaint",
    "painPoints": [
      "giao hàng trễ",
      "bao bì bị móp méo",
      "sản phẩm bị đổ/rò rỉ"
    ],
    "hiddenNeeds": [
      "đơn vị vận chuyển nhanh hơn",
      "đóng gói chống sốc kỹ hơn cho sản phẩm chất lỏng"
    ]
  }
}
```
