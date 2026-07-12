import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, openaiChat } from './aiClient';
import { AGENT_TOOLS, executeTool } from './agentTools';

const MAX_STEPS = 8;

const SYSTEM_PROMPT = `Bạn là "Guardian Insight Agent" — một tác nhân AI phân tích Tiếng nói Khách hàng (Voice of Customer) cho chuỗi bán lẻ mỹ phẩm Guardian Việt Nam.

Nhiệm vụ: Với mỗi câu hỏi hoặc mục tiêu của người dùng, bạn TỰ LẬP KẾ HOẠCH và CHỦ ĐỘNG GỌI CÁC CÔNG CỤ để điều tra dữ liệu phản hồi thực tế, sau đó đưa ra câu trả lời có căn cứ.

Quy tắc bắt buộc:
1. Luôn dựa trên dữ liệu thật lấy từ các công cụ — TUYỆT ĐỐI KHÔNG bịa số liệu hay trích dẫn.
2. Thường bắt đầu bằng get_overview_stats hoặc get_theme_breakdown để nắm bức tranh, rồi đi sâu bằng rank_priority_issues / detect_rising_issues / compare_brands tùy mục tiêu.
3. Trước khi kết luận về một vấn đề, hãy gọi query_feedback để lấy dẫn chứng nguyên văn (quotes) từ khách hàng.
4. Có thể gọi nhiều công cụ liên tiếp qua nhiều bước. Chỉ trả lời cuối cùng khi đã đủ dữ kiện.
5. Câu trả lời cuối: viết bằng Tiếng Việt, súc tích, có cấu trúc rõ ràng, nêu vấn đề ưu tiên + nguyên nhân + hành động đề xuất + phòng ban chịu trách nhiệm (E-commerce, Marketing, Commercial, Customer Service), và trích 1-2 dẫn chứng thật.
6. Mọi suy đoán nguyên nhân phải gắn nhãn "Có thể do..." / "Suy đoán:".`;

export interface AgentStep {
  type: 'thought' | 'tool';
  text?: string;
  name?: string;
  input?: any;
  output?: any;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResult {
  answer: string;
  trace: AgentStep[];
  steps: number;
  provider: AIProvider;
}

// Chuyển JSON Schema chuẩn sang định dạng Gemini (bổ sung format:'enum')
function toGeminiSchema(node: any): any {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node && typeof node === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) out[k] = toGeminiSchema(v);
    if (out.enum && (out.type === 'string' || out.type === undefined)) out.format = 'enum';
    return out;
  }
  return node;
}

// ---- Vòng lặp Agent cho Anthropic Claude ----
async function runAnthropicAgent(
  apiKey: string,
  model: string,
  messages: AgentMessage[],
  feedbacks: any[]
): Promise<AgentResult> {
  const client = new Anthropic({ apiKey });
  const trace: AgentStep[] = [];

  const anthropicMessages: any[] = messages.map(m => ({ role: m.role, content: m.content }));
  const tools = AGENT_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as any
  }));

  let steps = 0;
  for (let i = 0; i < MAX_STEPS; i++) {
    steps++;
    const resp = await client.messages.create({
      model,
      max_tokens: 3072,
      system: SYSTEM_PROMPT,
      tools,
      messages: anthropicMessages
    });

    const assistantText = resp.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();
    const toolUses = resp.content.filter((b: any) => b.type === 'tool_use');

    if (assistantText) trace.push({ type: 'thought', text: assistantText });

    anthropicMessages.push({ role: 'assistant', content: resp.content });

    if (resp.stop_reason === 'tool_use' && toolUses.length > 0) {
      const toolResults = toolUses.map((tu: any) => {
        const output = executeTool(tu.name, tu.input, feedbacks);
        trace.push({ type: 'tool', name: tu.name, input: tu.input, output });
        return {
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(output)
        };
      });
      anthropicMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    return { answer: assistantText || 'Không có nội dung trả lời.', trace, steps, provider: 'anthropic' };
  }

  return {
    answer: 'Agent đã đạt giới hạn số bước. Vui lòng thử thu hẹp câu hỏi.',
    trace,
    steps,
    provider: 'anthropic'
  };
}

// ---- Vòng lặp Agent cho Google Gemini ----
async function runGeminiAgent(
  apiKey: string,
  model: string,
  messages: AgentMessage[],
  feedbacks: any[]
): Promise<AgentResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const trace: AgentStep[] = [];

  const gModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
    tools: [
      {
        functionDeclarations: AGENT_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          parameters: toGeminiSchema(t.input_schema) as any
        }))
      }
    ]
  });

  // Lịch sử hội thoại (trừ tin nhắn cuối của user)
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const chat = gModel.startChat({ history });

  let nextParts: any = [{ text: messages[messages.length - 1].content }];
  let steps = 0;

  for (let i = 0; i < MAX_STEPS; i++) {
    steps++;
    const result = await chat.sendMessage(nextParts);
    const response = result.response;
    const calls = response.functionCalls?.() || [];

    if (calls.length > 0) {
      const responses = calls.map((c: any) => {
        const output = executeTool(c.name, c.args, feedbacks);
        trace.push({ type: 'tool', name: c.name, input: c.args, output });
        return { functionResponse: { name: c.name, response: output } };
      });
      nextParts = responses;
      continue;
    }

    let text = '';
    try {
      text = response.text();
    } catch {
      text = '';
    }
    if (text) trace.push({ type: 'thought', text });
    return { answer: text || 'Không có nội dung trả lời.', trace, steps, provider: 'gemini' };
  }

  return {
    answer: 'Agent đã đạt giới hạn số bước. Vui lòng thử thu hẹp câu hỏi.',
    trace,
    steps,
    provider: 'gemini'
  };
}

// ---- Vòng lặp Agent cho endpoint OpenAI-compatible ----
async function runOpenAIAgent(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AgentMessage[],
  feedbacks: any[]
): Promise<AgentResult> {
  const trace: AgentStep[] = [];
  const oaMessages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];
  const tools = AGENT_TOOLS.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.input_schema }
  }));

  let steps = 0;
  for (let i = 0; i < MAX_STEPS; i++) {
    steps++;
    const data = await openaiChat(baseUrl, apiKey, {
      model,
      max_tokens: 3072,
      messages: oaMessages,
      tools,
      tool_choice: 'auto'
    });

    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('Endpoint không trả về message hợp lệ.');
    oaMessages.push(msg);
    if (msg.content) trace.push({ type: 'thought', text: msg.content });

    const calls = msg.tool_calls || [];
    if (calls.length > 0) {
      for (const c of calls) {
        let args: any = {};
        try {
          args = JSON.parse(c.function?.arguments || '{}');
        } catch {
          args = {};
        }
        const output = executeTool(c.function?.name, args, feedbacks);
        trace.push({ type: 'tool', name: c.function?.name, input: args, output });
        oaMessages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(output) });
      }
      continue;
    }

    return { answer: msg.content || 'Không có nội dung trả lời.', trace, steps, provider: 'openai' };
  }

  return {
    answer: 'Agent đã đạt giới hạn số bước. Vui lòng thử thu hẹp câu hỏi.',
    trace,
    steps,
    provider: 'openai'
  };
}

export async function runAgent(
  provider: AIProvider,
  apiKey: string,
  model: string,
  messages: AgentMessage[],
  feedbacks: any[],
  baseUrl?: string
): Promise<AgentResult> {
  if (provider === 'anthropic') {
    return runAnthropicAgent(apiKey, model, messages, feedbacks);
  }
  if (provider === 'openai') {
    if (!baseUrl) throw new Error('Thiếu Base URL cho endpoint tùy chỉnh (OpenAI-compatible).');
    return runOpenAIAgent(baseUrl, apiKey, model, messages, feedbacks);
  }
  return runGeminiAgent(apiKey, model, messages, feedbacks);
}
