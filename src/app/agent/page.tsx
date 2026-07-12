'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useData } from '../../context/DataContext';
import {
  Bot,
  Send,
  User,
  Loader2,
  Wrench,
  Sparkles,
  ChevronDown,
  ChevronRight,
  DatabaseBackup,
  AlertCircle,
  BrainCircuit
} from 'lucide-react';

interface AgentStep {
  type: 'thought' | 'tool';
  text?: string;
  name?: string;
  input?: any;
  output?: any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  trace?: AgentStep[];
  steps?: number;
  isError?: boolean;
}

// Nhãn tiếng Việt cho từng công cụ
const TOOL_LABELS: Record<string, string> = {
  get_overview_stats: 'Xem thống kê tổng quan',
  get_theme_breakdown: 'Phân tích theo chủ đề',
  rank_priority_issues: 'Xếp hạng ưu tiên xử lý',
  detect_rising_issues: 'Phát hiện vấn đề mới nổi',
  compare_brands: 'So sánh đối thủ cạnh tranh',
  query_feedback: 'Truy vấn dẫn chứng thực tế'
};

const SUGGESTED = [
  'Vấn đề nào của Guardian đang nghiêm trọng nhất và tôi nên xử lý trước? Vì sao?',
  'Có chủ đề tiêu cực nào đang tăng đột biến gần đây không?',
  'So sánh trải nghiệm khách hàng của Guardian với Hasaki và Watsons.',
  'Tổng hợp tình hình và đề xuất 3 hành động ưu tiên cho tuần này.'
];

// Định dạng nhẹ: **đậm**, xuống dòng, gạch đầu dòng
function renderRich(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={j} className="text-primary-text font-semibold">{seg.slice(2, -2)}</strong>;
      }
      return <span key={j}>{seg}</span>;
    });
    return <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-1.5'}>{parts}</p>;
  });
}

function ToolStep({ step }: { step: AgentStep }) {
  const [open, setOpen] = useState(false);
  if (step.type === 'thought') {
    return (
      <div className="flex items-start space-x-2 text-secondary-text text-xs pl-1 py-1">
        <BrainCircuit size={14} className="shrink-0 mt-0.5 text-accent-color/70" />
        <span className="italic leading-relaxed">{step.text}</span>
      </div>
    );
  }
  const label = TOOL_LABELS[step.name || ''] || step.name;
  const hasInput = step.input && Object.keys(step.input).length > 0;
  return (
    <div className="border border-border-color rounded-xl overflow-hidden bg-page-bg/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center space-x-2 px-3 py-2 text-xs hover:bg-border-color/40 transition-apple text-left"
      >
        {open ? <ChevronDown size={13} className="shrink-0 text-secondary-text" /> : <ChevronRight size={13} className="shrink-0 text-secondary-text" />}
        <Wrench size={13} className="shrink-0 text-accent-color" />
        <span className="font-semibold text-primary-text">{label}</span>
        {hasInput && (
          <span className="text-secondary-text font-mono truncate">
            ({Object.entries(step.input).map(([k, v]) => `${k}: ${v}`).join(', ')})
          </span>
        )}
      </button>
      {open && (
        <pre className="text-[10px] leading-relaxed text-secondary-text bg-black/20 px-3 py-2 overflow-x-auto max-h-56 overflow-y-auto border-t border-border-color">
          {JSON.stringify(step.output, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AgentPage() {
  const { feedbacks, askAgent } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const payload = [...history, { role: 'user' as const, content: q }];
      const res = await askAgent(payload);
      if (res?.error) {
        setMessages(m => [...m, { role: 'assistant', content: res.error, isError: true }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: res.answer, trace: res.trace, steps: res.steps }]);
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: 'Lỗi kết nối tới Agent. Vui lòng thử lại.', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  // Trạng thái chưa có dữ liệu
  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <DatabaseBackup size={48} className="text-accent-color/80 animate-pulse" />
        <h3 className="text-xl font-bold text-primary-text">Trợ lý AI cần dữ liệu để phân tích</h3>
        <p className="text-sm text-secondary-text">
          Vui lòng nạp dữ liệu khách hàng hoặc tải dữ liệu giả lập (Demo) trước khi trò chuyện với Agent.
        </p>
        <Link
          href="/import"
          className="bg-accent-color hover:bg-accent-hover text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-apple"
        >
          Đi tới Nhập Dữ Liệu
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-border-color mb-4">
        <div className="bg-accent-color p-2.5 rounded-2xl text-white shadow-md">
          <Bot size={20} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-primary-text">Guardian Insight Agent</h1>
          <p className="text-xs text-secondary-text">Tác nhân AI tự chủ điều tra {feedbacks.length} phản hồi bằng công cụ để trả lời câu hỏi của bạn.</p>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.length === 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2 text-secondary-text text-sm">
              <Sparkles size={16} className="text-accent-color" />
              <span>Gợi ý câu hỏi để bắt đầu:</span>
            </div>
            <div className="grid gap-2.5">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-left text-sm bg-solid-surface border border-border-color hover:border-accent-color/60 hover:bg-page-bg rounded-2xl px-4 py-3 text-primary-text transition-apple"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="bg-accent-color text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {m.content}
                </div>
                <div className="bg-border-color p-1.5 rounded-lg shrink-0 mt-0.5">
                  <User size={14} className="text-secondary-text" />
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2.5 max-w-[92%] w-full">
                <div className="bg-accent-soft p-1.5 rounded-lg shrink-0 mt-0.5">
                  <Bot size={14} className="text-accent-color" />
                </div>
                <div className="flex-1 space-y-3">
                  {/* Trace: các bước agent tự thực hiện */}
                  {m.trace && m.trace.length > 0 && (
                    <div className="space-y-1.5 bg-solid-surface border border-border-color rounded-2xl p-3">
                      <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold tracking-wider text-secondary-text mb-1">
                        <BrainCircuit size={12} className="text-accent-color" />
                        <span>Agent đã tự thực hiện {m.trace.filter(s => s.type === 'tool').length} bước gọi công cụ</span>
                      </div>
                      {m.trace.map((step, j) => <ToolStep key={j} step={step} />)}
                    </div>
                  )}
                  {/* Câu trả lời cuối */}
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed ${
                    m.isError
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 flex items-start space-x-2'
                      : 'bg-solid-surface border border-border-color text-secondary-text'
                  }`}>
                    {m.isError && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                    <div>{renderRich(m.content)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-2.5">
            <div className="bg-accent-soft p-1.5 rounded-lg shrink-0">
              <Bot size={14} className="text-accent-color" />
            </div>
            <div className="flex items-center space-x-2 bg-solid-surface border border-border-color rounded-2xl px-4 py-3 text-sm text-secondary-text">
              <Loader2 size={15} className="animate-spin text-accent-color" />
              <span>Agent đang lập kế hoạch và gọi công cụ phân tích...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="pt-4 mt-2 border-t border-border-color">
        <div className="flex items-end space-x-2 bg-solid-surface border border-border-color rounded-2xl p-2 focus-within:ring-2 focus-within:ring-accent-color/40 transition-apple">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Hỏi Agent về dữ liệu phản hồi khách hàng..."
            className="flex-1 bg-transparent resize-none outline-none text-sm text-primary-text placeholder:text-secondary-text/60 px-2 py-2 max-h-32"
            disabled={loading}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="bg-accent-color hover:bg-accent-hover disabled:opacity-40 text-white p-2.5 rounded-xl transition-apple shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-secondary-text text-center mt-2">
          Agent tự chủ gọi các công cụ (thống kê, xếp hạng, truy vấn dẫn chứng...) — cần API Key thật để hoạt động.
        </p>
      </div>
    </div>
  );
}
