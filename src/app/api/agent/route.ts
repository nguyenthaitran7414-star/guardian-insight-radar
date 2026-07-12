import { NextRequest, NextResponse } from 'next/server';
import { resolveAIConfig } from '../../../utils/apiKey';
import { runAgent, AgentMessage } from '../../../utils/agent';

/**
 * Endpoint của Agent AI hội thoại.
 * Nhận: { messages: [{role, content}], feedbacks: [...] }
 * Chạy vòng lặp agent (tự lập kế hoạch + gọi tool) rồi trả về { answer, trace, steps }.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages: AgentMessage[] = body?.messages;
  const feedbacks: any[] = body?.feedbacks || [];

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Thiếu danh sách messages' }, { status: 400 });
  }

  if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
    return NextResponse.json(
      { error: 'Chưa có dữ liệu phản hồi. Vui lòng nạp dữ liệu (Demo hoặc CSV) trước khi hỏi Agent.' },
      { status: 400 }
    );
  }

  const { provider, apiKey, model, baseUrl } = resolveAIConfig(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Agent AI cần API Key thật để hoạt động. Vui lòng bấm nút 🔑 trên thanh tiêu đề để cấu hình API Key.',
        needKey: true
      },
      { status: 400 }
    );
  }

  try {
    const result = await runAgent(provider, apiKey, model, messages, feedbacks, baseUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Lỗi Agent:', error);
    const message: string = error?.message || String(error);
    let friendly = 'Agent gặp lỗi khi xử lý. Vui lòng thử lại.';
    if (/API key not valid|API_KEY_INVALID|authentication_error|401|invalid/i.test(message)) {
      friendly = 'API Key không hợp lệ. Vui lòng kiểm tra lại trong phần cấu hình 🔑.';
    } else if (/quota|rate|RESOURCE_EXHAUSTED|429|credit|billing/i.test(message)) {
      friendly = 'Đã hết hạn ngạch (quota/credit) hoặc bị giới hạn tần suất gọi API.';
    } else if (/not found|NOT_FOUND|404|model/i.test(message)) {
      friendly = `Model "${model}" không khả dụng với key này. Thử đổi model khác trong phần cấu hình 🔑.`;
    }
    return NextResponse.json({ error: friendly, detail: message }, { status: 200 });
  }
}
