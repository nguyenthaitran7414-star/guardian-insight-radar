import { NextRequest, NextResponse } from 'next/server';
import { resolveAIConfig } from '../../../utils/apiKey';
import { pingModel } from '../../../utils/aiClient';

/**
 * Kiểm tra nhanh xem API Key (Gemini hoặc Anthropic) có hợp lệ và gọi được hay không.
 * Client gọi endpoint này khi người dùng bấm "Kiểm tra kết nối".
 */
export async function POST(req: NextRequest) {
  const { provider, apiKey, model, baseUrl } = resolveAIConfig(req);

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Chưa có API Key. Vui lòng nhập key rồi thử lại.' },
      { status: 400 }
    );
  }

  try {
    const sample = await pingModel(provider, apiKey, model, baseUrl);
    const providerLabel =
      provider === 'anthropic' ? 'Anthropic Claude' : provider === 'openai' ? 'Endpoint tùy chỉnh' : 'Google Gemini';
    return NextResponse.json({ ok: true, provider, providerLabel, model, sample });
  } catch (error: any) {
    const message: string = error?.message || String(error);
    // Diễn giải một số lỗi thường gặp sang tiếng Việt dễ hiểu
    let friendly = 'Không kết nối được tới dịch vụ AI. Kiểm tra lại API Key.';
    if (/API key not valid|API_KEY_INVALID|invalid x-api-key|authentication_error|401|invalid/i.test(message)) {
      friendly = 'API Key không hợp lệ. Vui lòng kiểm tra lại key đã sao chép.';
    } else if (/quota|rate|RESOURCE_EXHAUSTED|429|credit balance|billing/i.test(message)) {
      friendly = 'Key hợp lệ nhưng đã hết hạn ngạch (quota/credit) hoặc bị giới hạn tần suất.';
    } else if (/not found|NOT_FOUND|404|model/i.test(message)) {
      const suggestion = provider === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gemini-2.0-flash';
      friendly = `Model "${model}" không khả dụng với key này. Thử đổi sang model khác (ví dụ ${suggestion}).`;
    }
    return NextResponse.json({ ok: false, error: friendly, detail: message }, { status: 200 });
  }
}
