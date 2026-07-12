import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'gemini' | 'anthropic' | 'openai';

// Model mặc định cho từng nhà cung cấp
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/**
 * Tự nhận diện nhà cung cấp dựa trên tiền tố của API Key.
 * Key Anthropic bắt đầu bằng "sk-ant", key Gemini bắt đầu bằng "AIza".
 * Các key khác không xác định -> để null (người dùng tự chọn provider).
 */
export function detectProvider(apiKey: string): AIProvider | null {
  const k = apiKey.trim();
  if (k.startsWith('sk-ant')) return 'anthropic';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('sk-')) return 'openai';
  return null;
}

// Chuyển JSON Schema chuẩn sang định dạng Gemini (bổ sung format:'enum' cho các trường enum dạng chuỗi)
function toGeminiSchema(node: any): any {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node && typeof node === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = toGeminiSchema(v);
    }
    if (out.enum && (out.type === 'string' || out.type === undefined)) {
      out.format = 'enum';
    }
    return out;
  }
  return node;
}

// Gọi endpoint OpenAI-compatible (dùng cho provider tùy chỉnh)
export async function openaiChat(baseUrl: string, apiKey: string, body: any): Promise<any> {
  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

interface GenerateParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  prompt: string;
  schema: any; // JSON Schema chuẩn (dạng object)
  schemaName?: string; // Tên "tool" khi dùng Anthropic/OpenAI
  maxTokens?: number;
  baseUrl?: string; // Bắt buộc cho provider 'openai'
}

/**
 * Sinh dữ liệu JSON có cấu trúc từ prompt, hoạt động với Gemini, Anthropic Claude
 * và endpoint OpenAI-compatible.
 */
export async function generateStructured({
  provider,
  apiKey,
  model,
  prompt,
  schema,
  schemaName = 'ket_qua_phan_tich',
  maxTokens = 4096,
  baseUrl
}: GenerateParams): Promise<any> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      tools: [
        {
          name: schemaName,
          description: 'Trả về kết quả phân tích đúng theo cấu trúc dữ liệu quy định.',
          input_schema: schema
        }
      ],
      tool_choice: { type: 'tool', name: schemaName },
      messages: [{ role: 'user', content: prompt }]
    });

    const toolUse = response.content.find((block: any) => block.type === 'tool_use');
    if (!toolUse) {
      throw new Error('Claude không trả về khối tool_use hợp lệ.');
    }
    return (toolUse as any).input;
  }

  if (provider === 'openai') {
    if (!baseUrl) throw new Error('Thiếu Base URL cho endpoint tùy chỉnh (OpenAI-compatible).');
    const data = await openaiChat(baseUrl, apiKey, {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      tools: [
        {
          type: 'function',
          function: {
            name: schemaName,
            description: 'Trả về kết quả phân tích đúng theo cấu trúc dữ liệu quy định.',
            parameters: schema
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: schemaName } }
    });
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      // Một số endpoint không hỗ trợ ép tool -> thử đọc content dạng JSON
      const content = data.choices?.[0]?.message?.content;
      if (content) return JSON.parse(content);
      throw new Error('Endpoint không trả về tool_calls hợp lệ.');
    }
    return JSON.parse(toolCall.function.arguments);
  }

  // Mặc định: Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const gModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: toGeminiSchema(schema)
    }
  });
  const result = await gModel.generateContent(prompt);
  return JSON.parse(result.response.text());
}

/**
 * Gọi thử một prompt siêu ngắn để xác minh API Key + model hoạt động.
 * Trả về chuỗi mẫu nếu thành công, ném lỗi nếu thất bại.
 */
export async function pingModel(
  provider: AIProvider,
  apiKey: string,
  model: string,
  baseUrl?: string
): Promise<string> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Trả lời đúng một từ: OK' }]
    });
    const textBlock = response.content.find((b: any) => b.type === 'text') as any;
    return (textBlock?.text || 'OK').trim().slice(0, 20);
  }

  if (provider === 'openai') {
    if (!baseUrl) throw new Error('Thiếu Base URL cho endpoint tùy chỉnh (OpenAI-compatible).');
    const data = await openaiChat(baseUrl, apiKey, {
      model,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Trả lời đúng một từ: OK' }]
    });
    return (data.choices?.[0]?.message?.content || 'OK').trim().slice(0, 20);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const gModel = genAI.getGenerativeModel({ model });
  const result = await gModel.generateContent('Trả lời đúng một từ: OK');
  return result.response.text().trim().slice(0, 20);
}
