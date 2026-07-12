import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveAIConfig } from '../../../utils/apiKey';
import { generateStructured } from '../../../utils/aiClient';

// Định nghĩa regex ẩn thông tin nhạy cảm (PII)
function maskPII(text: string): string {
  if (!text) return '';
  // Ẩn Email
  let masked = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email đã ẩn]');
  // Ẩn Số điện thoại
  masked = masked.replace(/(?:\+84|0)\s*\d{2,4}(?:[-\s]?\d{3,4}){2}\b/g, '[SĐT đã ẩn]');
  masked = masked.replace(/\b0\d{9}\b/g, '[SĐT đã ẩn]');
  masked = masked.replace(/\+84\d{9}\b/g, '[SĐT đã ẩn]');
  return masked;
}

// Zod Schema xác thực đầu vào
const FeedbackItemSchema = z.object({
  id: z.string(),
  brand: z.string(),
  channel: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1),
  category: z.string().optional(),
  product: z.string().optional(),
  sourceType: z.enum(['review', 'comment', 'ticket', 'chat']),
  isSimulated: z.boolean().default(false)
});

const AnalyzeInputSchema = z.object({
  feedback: z.array(FeedbackItemSchema).min(1, { message: 'Feedback array cannot be empty' })
});

// JSON Schema chuẩn cho kết quả trả về (dùng chung cho Gemini & Anthropic)
const responseSchema = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
          theme: { type: 'string' },
          intent: { type: 'string', enum: ['Complaint', 'Inquiry', 'Praise', 'Suggestion'] },
          journeyStage: { type: 'string', enum: ['pre-purchase', 'purchase', 'post-purchase', 'delivery'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          painPoint: { type: 'string' },
          hiddenNeed: { type: 'string' },
          possibleRootCause: { type: 'string' },
          confidence: { type: 'number' },
          responsibleDepartment: { type: 'string' }
        },
        required: [
          'id',
          'sentiment',
          'theme',
          'intent',
          'journeyStage',
          'severity',
          'painPoint',
          'hiddenNeed',
          'possibleRootCause',
          'confidence',
          'responsibleDepartment'
        ]
      }
    }
  },
  required: ['results']
};

export async function POST(req: NextRequest) {
  try {
    // 1. Xác định cấu hình AI (ưu tiên key người dùng nhập, sau đó tới .env.local)
    const { provider, apiKey, model, baseUrl } = resolveAIConfig(req);
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình API Key. Vui lòng nhập API Key trong phần Cấu hình 🔑, hoặc thêm vào .env.local' }, { status: 500 });
    }

    // 2. Parse và validate request body
    const body = await req.json().catch(() => ({}));

    // Kiểm tra rỗng
    if (!body || !body.feedback) {
      return NextResponse.json({ error: 'Missing feedback list in request body' }, { status: 400 });
    }

    // Kiểm tra giới hạn 300 bản ghi
    if (Array.isArray(body.feedback) && body.feedback.length > 300) {
      return NextResponse.json({ error: 'Feedback list exceeds the limit of 300 records' }, { status: 400 });
    }

    const validatedInput = AnalyzeInputSchema.safeParse(body);
    if (!validatedInput.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validatedInput.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      }, { status: 400 });
    }

    const feedbacks = validatedInput.data.feedback;

    // 3. Chia nhỏ danh sách thành các Batch (chọn 25 làm chuẩn)
    const BATCH_SIZE = 25;
    const finalResults: any[] = [];

    // Hàm xử lý từng Batch kèm cơ chế thử lại tối đa 1 lần nếu lỗi
    async function processBatchWithRetry(batch: any[], attempt: number = 1): Promise<any[]> {
      try {
        // Ẩn PII trước khi gửi đến AI
        const sanitizedBatch = batch.map(item => ({
          id: item.id,
          brand: item.brand,
          channel: item.channel,
          rating: item.rating,
          content: maskPII(item.content),
          category: item.category || '',
          product: item.product || '',
          sourceType: item.sourceType
        }));

        const promptText = `
Bạn là chuyên gia phân tích dữ liệu Voice of Customer (VoC) cho chuỗi mỹ phẩm tại Việt Nam.
Hãy phân tích danh sách phản hồi của khách hàng dưới đây và trả về cấu trúc JSON đúng định dạng Schema quy định.

Quy tắc bắt buộc:
1. Giữ nguyên chính xác mã định danh 'id' của mỗi phản hồi.
2. Tuyệt đối không tự bịa đặt trích dẫn hay nội dung đánh giá của khách hàng.
3. Không tự bịa đặt thông tin thực tế chưa được đề cập về Guardian, Hasaki hay Watsons.
4. Mọi suy đoán nguyên nhân gốc rễ (possibleRootCause) phải được dán nhãn rõ ràng là khả thi hoặc suy đoán (ví dụ sử dụng cụm từ: "Có khả năng do...", "Có thể do...", "Suy đoán từ...").
5. Nội dung phân tích (painPoint, hiddenNeed, possibleRootCause, theme, responsibleDepartment) phải trả về bằng Tiếng Việt tự nhiên.

Dữ liệu phản hồi cần phân tích:
${JSON.stringify(sanitizedBatch)}
`;

        const parsed = await generateStructured({
          provider,
          apiKey: apiKey!,
          model,
          baseUrl,
          prompt: promptText,
          schema: responseSchema,
          schemaName: 'phan_tich_phan_hoi',
          maxTokens: 8192
        });

        if (!parsed || !Array.isArray(parsed.results)) {
          throw new Error('Invalid response format from AI');
        }

        return parsed.results;
      } catch (error) {
        if (attempt < 2) {
          console.warn(`Batch processing failed on attempt ${attempt}. Retrying once...`, error);
          return processBatchWithRetry(batch, attempt + 1);
        } else {
          console.error(`Batch processing failed after 2 attempts. Applying fallback results for this batch.`, error);
          // Fallback cho từng item trong batch nếu lỗi hoàn toàn, tránh làm hỏng toàn bộ request
          return batch.map(item => ({
            id: item.id,
            sentiment: item.rating >= 4 ? 'positive' : item.rating <= 2 ? 'negative' : 'neutral',
            theme: 'Chưa phân loại',
            intent: item.rating <= 2 ? 'Complaint' : 'Inquiry',
            journeyStage: 'purchase',
            severity: item.rating <= 2 ? 'high' : 'low',
            painPoint: item.rating <= 2 ? 'Sự cố trải nghiệm dịch vụ' : 'Trải nghiệm bình thường',
            hiddenNeed: 'Mong muốn cải thiện chất lượng phục vụ khách hàng',
            possibleRootCause: 'Suy đoán: Chưa có đủ dữ liệu để phân tích AI',
            confidence: 0.5,
            responsibleDepartment: 'Customer Service'
          }));
        }
      }
    }

    // Chạy vòng lặp xử lý từng batch
    for (let i = 0; i < feedbacks.length; i += BATCH_SIZE) {
      const batch = feedbacks.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatchWithRetry(batch);
      finalResults.push(...batchResults);
    }

    // 4. Trả về kết quả tổng hợp
    return NextResponse.json({ results: finalResults });
  } catch (error: any) {
    console.error('Global API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
