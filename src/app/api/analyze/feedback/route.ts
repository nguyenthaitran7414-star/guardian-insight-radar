import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Khởi tạo GenAI nếu có API Key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Hàm phân tích dự phòng (Rule-based Fallback) khi không có API Key hoặc gọi API lỗi
function runFallbackAnalysis(reviewText: string): any {
  const text = reviewText.toLowerCase();
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  let sentimentScore = 0.0;
  let theme: string = 'Customer Service';
  let intent: string = 'Inquiry';
  const painPoints: string[] = [];
  const hiddenNeeds: string[] = [];

  // Xác định sentiment & score đơn giản
  if (
    text.includes('chậm') || text.includes('tệ') || text.includes('dở') || 
    text.includes('hỏng') || text.includes('móp') || text.includes('vỡ') || 
    text.includes('đắt') || text.includes('chán') || text.includes('thất vọng') || 
    text.includes('không thích') || text.includes('bực') || text.includes('lag')
  ) {
    sentiment = 'negative';
    sentimentScore = -0.7;
    intent = 'Complaint';
  } else if (
    text.includes('tốt') || text.includes('ok') || text.includes('nhanh') || 
    text.includes('thích') || text.includes('đẹp') || text.includes('tuyệt') || 
    text.includes('hài lòng') || text.includes('yên tâm') || text.includes('rẻ')
  ) {
    sentiment = 'positive';
    sentimentScore = 0.8;
    intent = 'Praise';
  }

  // Phân tích theme
  if (text.includes('giao') || text.includes('ship') || text.includes('chậm') || text.includes('đợi')) {
    theme = 'Shipping & Delivery';
    if (sentiment === 'negative') {
      painPoints.push('Giao hàng chậm trễ');
      hiddenNeeds.push('Thời gian vận chuyển nhanh hơn');
    }
  } else if (text.includes('đóng gói') || text.includes('hộp') || text.includes('bọc') || text.includes('móp')) {
    theme = 'Packaging';
    if (sentiment === 'negative') {
      painPoints.push('Đóng gói lỏng lẻo hoặc hộp ngoài bị hư hại');
      hiddenNeeds.push('Gia cố thêm xốp nổ và túi khí bọc hàng');
    }
  } else if (text.includes('nhân viên') || text.includes('thái độ') || text.includes('phục vụ') || text.includes('tư vấn')) {
    theme = 'Customer Service';
    if (sentiment === 'negative') {
      painPoints.push('Thái độ nhân viên chưa nhiệt tình');
      hiddenNeeds.push('Đào tạo kỹ năng giao tiếp cho nhân sự');
    }
  } else if (text.includes('giá') || text.includes('đắt') || text.includes('rẻ') || text.includes('voucher') || text.includes('khuyến mãi')) {
    theme = 'Pricing & Promotion';
    if (sentiment === 'negative') {
      painPoints.push('Mức giá cao hơn mong đợi hoặc lỗi nhập mã voucher');
      hiddenNeeds.push('Tăng cường các chương trình tích điểm và giảm giá sâu');
    }
  } else if (text.includes('app') || text.includes('web') || text.includes('lag') || text.includes('thanh toán')) {
    theme = 'App & Web Experience';
    if (sentiment === 'negative') {
      painPoints.push('Giao diện giật lag hoặc lỗi cổng thanh toán');
      hiddenNeeds.push('Tối ưu hóa mã nguồn app di động');
    }
  } else if (text.includes('hết hàng') || text.includes('không có') || text.includes('thiếu')) {
    theme = 'Product Assortment';
    if (sentiment === 'negative') {
      painPoints.push('Sản phẩm mong muốn hết hàng hoặc không hiển thị');
      hiddenNeeds.push('Tự động bổ sung tồn kho');
    }
  } else {
    theme = 'Product Quality';
  }

  return {
    sentiment,
    sentimentScore,
    theme,
    intent,
    painPoints: painPoints.length > 0 ? painPoints : ['Sự cố vận hành chung'],
    hiddenNeeds: hiddenNeeds.length > 0 ? hiddenNeeds : ['Mong muốn cải tiến chất lượng dịch vụ']
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedbacks } = body;

    if (!feedbacks || !Array.isArray(feedbacks)) {
      return NextResponse.json({ error: 'Dữ liệu feedbacks không hợp lệ' }, { status: 400 });
    }

    // Nếu không có API Key, sử dụng phân tích Heuristics dự phòng
    if (!genAI) {
      console.warn('GEMINI_API_KEY chưa được cấu hình. Sử dụng Phân tích Dự phòng (Rule-based Heuristics).');
      const analyses = feedbacks.map(item => ({
        id: item.id,
        ...runFallbackAnalysis(item.reviewText)
      }));
      return NextResponse.json({ analyses });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            analyses: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  sentiment: { type: SchemaType.STRING, format: 'enum', enum: ['positive', 'neutral', 'negative'] },
                  sentimentScore: { type: SchemaType.NUMBER },
                  theme: { type: SchemaType.STRING, format: 'enum', enum: ['Product Quality', 'Shipping & Delivery', 'Customer Service', 'Pricing & Promotion', 'Packaging', 'App & Web Experience', 'Product Assortment'] },
                  intent: { type: SchemaType.STRING, format: 'enum', enum: ['Complaint', 'Inquiry', 'Praise', 'Suggestion'] },
                  painPoints: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  },
                  hiddenNeeds: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  }
                },
                required: ['id', 'sentiment', 'sentimentScore', 'theme', 'intent', 'painPoints', 'hiddenNeeds']
              }
            }
          },
          required: ['analyses']
        }
      }
    });

    const promptText = `
Hãy đóng vai trò là một chuyên gia phân tích phản hồi khách hàng (Voice of Customer). 
Phân tích danh sách các đánh giá của khách hàng sau đây và phân loại chúng thành các thuộc tính cảm xúc (sentiment), điểm số cảm xúc (sentimentScore từ -1.0 đến 1.0), chủ đề (theme), ý định (intent), các điểm đau (painPoints) và nhu cầu ẩn giấu (hiddenNeeds).
Mọi kết quả phải dịch/viết bằng tiếng Việt tự nhiên cho các mô tả (trừ mã enum tiếng Anh).

Dữ liệu đầu vào:
${JSON.stringify(feedbacks.map(f => ({ id: f.id, reviewText: f.reviewText })))}
`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    
    // Nếu API gọi lỗi giữa chừng, sử dụng fallback để đảm bảo ứng dụng không sập
    try {
      const body = await req.json().catch(() => ({ feedbacks: [] }));
      const feedbacks = body.feedbacks || [];
      const analyses = feedbacks.map((item: any) => ({
        id: item.id,
        ...runFallbackAnalysis(item.reviewText)
      }));
      return NextResponse.json({ analyses, warning: 'Lỗi API. Kết quả được mô phỏng.' });
    } catch (e) {
      return NextResponse.json({ error: 'Lỗi phân tích hệ thống', details: String(error) }, { status: 500 });
    }
  }
}
