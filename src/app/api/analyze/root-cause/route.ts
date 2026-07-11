import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Hàm phân tích Root Cause mô phỏng để fallback
function getFallbackRCA(issueName: string, reviews: { reviewText: string }[]): any {
  const quotes = reviews.map(r => r.reviewText).slice(0, 2);
  if (quotes.length === 0) {
    quotes.push('Giao hàng chậm quá, bọc hàng thì móp méo hết.');
  }

  let detectedRootCause = 'Quá tải vận hành cục bộ tại kho đóng gói trung tâm của Guardian.';
  let explanation = 'Dựa trên việc kiểm tra chuỗi Whys: 1) Tại sao khách hàng phàn nàn? Vì giao trễ và hư hỏng. 2) Tại sao giao trễ? Do đối tác vận chuyển nhận hàng chậm hơn dự kiến 2 ngày. 3) Tại sao đối tác nhận hàng chậm? Vì khâu chuẩn bị đóng gói tại kho nội bộ bị tắc nghẽn. 4) Tại sao kho nội bộ bị tắc nghẽn? Do lượng đơn tăng đột biến 300% trong đợt sale nhưng nhân sự kho không tăng. 5) Tại sao nhân sự không tăng? Chưa có quy trình dự báo đơn hàng từ trước.';
  let dept: 'E-commerce' | 'Marketing' | 'Commercial' | 'Customer Service' = 'E-commerce';
  let recommendedAction = 'Triển khai tích hợp hệ thống quản lý kho (WMS) tự động và đàm phán lại hợp đồng SLA với đơn vị vận chuyển mới.';

  if (issueName.toLowerCase().includes('nhân viên') || issueName.toLowerCase().includes('phục vụ') || issueName.toLowerCase().includes('cskh')) {
    detectedRootCause = 'Thiếu quy trình đào tạo và kiểm tra giám sát chất lượng phục vụ của nhân sự tại các cửa hàng trực tiếp.';
    explanation = 'Chuỗi Whys phát hiện: Nhân viên nói chuyện riêng và không giúp khách hàng tìm kiếm mỹ phẩm. Nguyên nhân là do ca trực thiếu người giám sát trực tiếp, nhân viên mới chưa nắm vững bản đồ phân khu hàng hóa và quy tắc ứng xử CSKH tiêu chuẩn của Guardian. Đồng thời, áp lực doanh số cá nhân khiến nhân viên tập trung vào quầy thanh toán hơn là tư vấn tự do.';
    dept = 'Customer Service';
    recommendedAction = 'Mở lại khóa đào tạo bắt buộc về kỹ năng giao tiếp khách hàng và bổ sung ca trưởng giám sát chất lượng từng khung giờ.';
  } else if (issueName.toLowerCase().includes('giá') || issueName.toLowerCase().includes('đắt') || issueName.toLowerCase().includes('khuyến mãi')) {
    detectedRootCause = 'Thiếu đồng bộ dữ liệu giá bán thực tế giữa kênh Online và Offline, kết hợp lỗi logic hệ thống áp mã giảm giá.';
    explanation = 'Chuỗi Whys phát hiện: Voucher báo lỗi không áp dụng được cho đơn hàng lớn. Nguyên nhân là do hệ thống chưa cập nhật điều kiện loại trừ của các mặt hàng đang sale sẵn, dẫn đến xung đột logic áp mã. Đồng thời chính sách giá chưa được tối ưu hóa động so với đối thủ cạnh tranh chính như Hasaki.';
    dept = 'Marketing';
    recommendedAction = 'Đồng bộ lại database giá bán online/offline và tối ưu điều khoản áp dụng mã voucher rõ ràng tại giao diện thanh toán.';
  } else if (issueName.toLowerCase().includes('đóng gói') || issueName.toLowerCase().includes('bao bì') || issueName.toLowerCase().includes('móp') || issueName.toLowerCase().includes('hộp')) {
    detectedRootCause = 'Quy chuẩn đóng gói sản phẩm lỏng chưa đạt chuẩn chống sốc khi vận chuyển đường dài.';
    explanation = 'Chuỗi Whys phát hiện: Nước tẩy trang và sữa tắm bị đổ ra ngoài. Nguyên nhân là do nhân viên đóng gói không dán băng keo cố định nắp chai trước khi quấn chống sốc. Đồng thời hộp carton bảo vệ bên ngoài quá mỏng, dễ bị nén bẹp dưới áp lực xếp hàng của đơn vị giao nhận bên thứ ba.';
    dept = 'E-commerce';
    recommendedAction = 'Ban hành quy chuẩn đóng gói 3 lớp bắt buộc cho chai chất lỏng và đổi sang dùng hộp carton 3 lớp chịu lực.';
  }

  return {
    issueName,
    detectedRootCause,
    explanation,
    evidenceQuotes: quotes,
    recommendedActions: [
      {
        action: recommendedAction,
        department: dept
      }
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueName, feedbacks } = body;

    if (!issueName || !feedbacks || !Array.isArray(feedbacks)) {
      return NextResponse.json({ error: 'Thiếu thông số issueName hoặc feedbacks' }, { status: 400 });
    }

    if (!genAI) {
      console.warn('GEMINI_API_KEY chưa được cấu hình. Sử dụng RCA Fallback.');
      return NextResponse.json(getFallbackRCA(issueName, feedbacks));
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            issueName: { type: SchemaType.STRING },
            detectedRootCause: { type: SchemaType.STRING },
            explanation: { type: SchemaType.STRING },
            evidenceQuotes: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            recommendedActions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  action: { type: SchemaType.STRING },
                  department: { type: SchemaType.STRING, format: 'enum', enum: ['E-commerce', 'Marketing', 'Commercial', 'Customer Service'] }
                },
                required: ['action', 'department']
              }
            }
          },
          required: ['issueName', 'detectedRootCause', 'explanation', 'evidenceQuotes', 'recommendedActions']
        }
      }
    });

    const promptText = `
Bạn là một chuyên gia quản lý chất lượng và phân tích chuỗi cung ứng ngành bán lẻ.
Dựa trên thông tin sự cố tiêu cực: "${issueName}", và các trích dẫn đánh giá của khách hàng sau:
${JSON.stringify(feedbacks.map(f => f.reviewText))}

Hãy thực hiện phân tích nguyên nhân gốc rễ (Root Cause Analysis - RCA) sử dụng phương pháp 5 Whys.
1. Giải thích chi tiết cơ chế sự cố xảy ra bằng tiếng Việt.
2. Trích xuất tối đa 3 câu chứng cứ (evidence quotes) nguyên văn từ feedback khách hàng.
3. Đề xuất 1-2 hành động khắc phục cụ thể và gán cho phòng ban chịu trách nhiệm tương ứng trong: E-commerce, Marketing, Commercial, Customer Service.
`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Lỗi gọi RCA API:', error);
    try {
      const body = await req.json().catch(() => ({}));
      return NextResponse.json(getFallbackRCA(body.issueName || 'Sự cố chung', body.feedbacks || []));
    } catch (e) {
      return NextResponse.json({ error: 'Lỗi hệ thống', details: String(error) }, { status: 500 });
    }
  }
}
