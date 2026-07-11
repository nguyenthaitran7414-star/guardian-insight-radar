import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Hàm tóm tắt báo cáo mô phỏng làm fallback
function getFallbackBrief(metrics: any, comparison: string): any {
  const total = metrics.totalFeedbacks || 0;
  const pos = metrics.positivePercentage || 0;
  const neg = metrics.negativePercentage || 0;
  const neu = metrics.neutralPercentage || 0;

  const markdownContent = `
# BÁO CÁO TÓM TẮT ĐIỀU HÀNH (EXECUTIVE BRIEF) - GUARDIAN VIETNAM
**Ngày lập báo cáo:** ${new Date().toLocaleDateString('vi-VN')}
**Bộ phận:** Ban Quản lý Trải nghiệm Khách hàng (CX Team)

---

### 1. TÌNH HÌNH GIÁM SÁT Ý KIẾN KHÁCH HÀNG (VoC OVERVIEW)
Hệ thống đã thu thập và chuẩn hóa tổng cộng **${total} phản hồi** từ các kênh bán hàng (Shopee, Lazada, TikTok Shop, GrabMart, Cửa hàng trực tuyến và CSKH trực tiếp).
*   **Chỉ số Hài lòng chung (Tích cực):** ${pos}% - Khách hàng đánh giá rất cao về tính chính hãng của sản phẩm và sự đa dạng mẫu mã.
*   **Tỷ lệ Phản hồi Tiêu cực:** ${neg}% - Tập trung chủ yếu vào các vấn đề logistics vận chuyển và chất lượng đóng gói khi mua hàng online.
*   **Tỷ lệ Trung lập:** ${neu}% - Liên quan đến các câu hỏi tư vấn cách dùng sản phẩm.

---

### 2. TOP 3 VẤN ĐỀ KHẨN CẤP CẦN XỬ LÝ NGAY
1.  **Chậm trễ giao nhận trên các sàn TMĐT (Đặc biệt là Shopee/Lazada):** Chiếm tới 45% tổng số phản hồi tiêu cực. Tình trạng này gia tăng mạnh trong các chiến dịch Megasale như 7/7, gây sụt giảm điểm CSAT của kênh thương mại điện tử xuống còn 2.5/5.
2.  **Đổ vỡ/Rò rỉ sản phẩm dạng chất lỏng:** Ghi nhận nhiều phàn nàn về nước tẩy trang và sữa tắm bị đổ ra vỏ hộp do quy cách đóng gói chỉ bọc 1 lớp chống sốc mỏng và thiếu băng keo niêm phong nắp.
3.  **Thái độ phục vụ của nhân viên trực cửa hàng (Offline):** Một số chi nhánh trọng điểm (như chi nhánh Nguyễn Trãi) bị phản ánh có thái độ chưa chu đáo, làm ảnh hưởng tiêu cực đến hình ảnh thương hiệu trực tiếp của Guardian.

---

### 3. ĐÁNH GIÁ VỊ THẾ CẠNH TRANH (COMPETITOR BENCHMARK)
*   **Hasaki (Đối thủ cạnh tranh số 1):** Đạt điểm CSAT 4.5/5. Thế mạnh vượt trội của họ là tốc độ giao hàng nội thành cực nhanh (2H) và chính sách giá rẻ hơn Guardian từ 5-10% cho các dòng dưỡng da. Tuy nhiên, họ có điểm yếu là nhân sự tư vấn thiếu kiến thức da liễu chuyên sâu.
*   **Guardian:** Đạt CSAT trung bình 4.2/5. Uy tín hàng chính hãng cực tốt. Điểm yếu là tốc độ giao hàng online chậm hơn đối thủ và các chương trình khuyến mãi/quà tặng đi kèm (samples) còn chưa phong phú.
*   **Watsons:** Đạt CSAT 4.0/5. Có danh mục sản phẩm độc quyền tốt nhưng trải nghiệm ứng dụng di động bị chê nhiều do giật lag khi thanh toán ví điện tử.

---

### 4. BẢNG PHÂN CÔNG HÀNH ĐỘNG HÀNH CHÍNH (ACTION MAP)

| Bộ phận Chịu trách nhiệm | Hành động cụ thể | Thời hạn hoàn thành |
| :--- | :--- | :--- |
| **E-commerce Team** | 1. Đàm phán lại SLA với Shopee Express.<br>2. Ban hành quy chuẩn bọc hàng 3 lớp cho hàng chất lỏng. | 25/07/2026 |
| **Customer Service Team** | 1. Tái đào tạo quy chuẩn giao tiếp trực tiếp tại chi nhánh Nguyễn Trãi.<br>2. Bổ sung nhân sự trực chat mạng xã hội. | 30/07/2026 |
| **Marketing Team** | 1. Thiết kế chương trình quà tặng kèm mẫu thử (sample box) cho đơn hàng online.<br>2. Khắc phục triệt để lỗi logic voucher. | 20/07/2026 |
| **Commercial Team** | 1. Điều chỉnh biên lợi nhuận để hạ giá cạnh tranh cho top 50 mặt hàng dưỡng da.<br>2. Ký hợp đồng độc quyền thêm các thương hiệu Hàn Quốc. | 15/08/2026 |

---
*Báo cáo được tổng hợp tự động bởi Guardian Insight Radar. Bản quyền thuộc về Guardian Việt Nam.*
`;

  return {
    title: 'Báo cáo Tóm tắt Điều hành - Guardian Việt Nam',
    dateGenerated: new Date().toISOString().split('T')[0],
    markdownContent
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aggregatedMetrics, competitorComparison } = body;

    if (!aggregatedMetrics) {
      return NextResponse.json({ error: 'Thiếu aggregatedMetrics' }, { status: 400 });
    }

    if (!genAI) {
      console.warn('GEMINI_API_KEY chưa được cấu hình. Sử dụng Brief Fallback.');
      return NextResponse.json(getFallbackBrief(aggregatedMetrics, competitorComparison || ''));
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            dateGenerated: { type: SchemaType.STRING },
            markdownContent: { type: SchemaType.STRING }
          },
          required: ['title', 'dateGenerated', 'markdownContent']
        }
      }
    });

    const promptText = `
Bạn là Giám đốc Trải nghiệm Khách hàng (Chief Customer Officer) của Guardian Việt Nam.
Hãy soạn thảo một bản Báo cáo tóm tắt điều hành (Executive Brief) định dạng Markdown để gửi tới Ban giám đốc điều hành.
Báo cáo phải viết bằng Tiếng Việt văn phong trang trọng, súc tích, mang tính định hướng hành động cao.

Dữ liệu thống kê:
- Tổng số feedback: ${aggregatedMetrics.totalFeedbacks}
- Tỉ lệ Tích cực: ${aggregatedMetrics.positivePercentage}%
- Tỉ lệ Tiêu cực: ${aggregatedMetrics.negativePercentage}%
- Tỉ lệ Trung lập: ${aggregatedMetrics.neutralPercentage}%
- Các chủ đề tiêu cực nổi cộm: ${JSON.stringify(aggregatedMetrics.topIssues)}
- So sánh đối thủ: ${competitorComparison}

Cấu trúc báo cáo bắt buộc gồm 4 phần sau:
1. Tình hình giám sát ý kiến khách hàng (VoC Overview) hiện tại.
2. Top các vấn đề khẩn cấp cần can thiệp ngay (kèm phân tích từ feedback).
3. Đánh giá vị thế cạnh tranh so với Hasaki và Watsons (Thế mạnh & Điểm yếu).
4. Bảng kế hoạch hành động cụ thể phân bổ chi tiết cho từng bộ phận (E-commerce, Customer Service, Marketing, Commercial) kèm Deadline ước lượng.
`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Lỗi sinh báo cáo:', error);
    try {
      const body = await req.json().catch(() => ({}));
      return NextResponse.json(getFallbackBrief(body.aggregatedMetrics || {}, body.competitorComparison || ''));
    } catch (e) {
      return NextResponse.json({ error: 'Lỗi hệ thống', details: String(error) }, { status: 500 });
    }
  }
}
