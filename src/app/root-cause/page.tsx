'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useData } from '../../context/DataContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  DatabaseBackup, 
  SearchCode, 
  HelpCircle, 
  AlertTriangle,
  Lightbulb,
  Building,
  RefreshCw,
  Quote,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { RootCauseAnalysisResult } from '../../types';

// Hàm bóc tách chuỗi 5 Whys từ trường explanation của API
function parseWhys(explanation: string): string[] {
  if (!explanation) return [];
  
  // Loại bỏ các tiền tố giới thiệu chung để tập trung vào các câu hỏi Tại sao
  let cleaned = explanation;
  const prefixMatch = cleaned.match(/^(?:Dựa trên việc kiểm tra chuỗi Whys:|Chuỗi Whys phát hiện:|Chuỗi Whys tìm thấy:)\s*/i);
  if (prefixMatch) {
    cleaned = cleaned.substring(prefixMatch[0].length);
  }

  // Tách câu dựa trên số thứ tự (ví dụ: 1), 2), 3) hoặc Tại sao 1:, Tại sao 2:...)
  const regex = /(?:\d+[\)\.]|Tại sao \d+:|Why \d+:?)/gi;
  const parts = cleaned.split(regex).map(p => p.trim()).filter(Boolean);
  
  if (parts.length >= 3) {
    return parts;
  }
  
  // Fallback: Tách theo dấu câu kết thúc nếu không tìm thấy số thứ tự phân chia
  const sentences = cleaned.split(/[.!?]\s+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length >= 2) {
    return sentences;
  }
  
  return [explanation];
}

function RootCauseContent() {
  const { feedbacks, runSingleRCA } = useData();
  const searchParams = useSearchParams();
  const themeParam = searchParams.get('theme');

  // Thu thập các chủ đề bị phản hồi tiêu cực
  const analyzed = feedbacks.filter(f => f.analysisStatus === 'completed');
  const negativeFeedbacks = analyzed.filter(f => f.aiAnalysis?.sentiment === 'negative');
  const availableThemes = Array.from(new Set(negativeFeedbacks.map(f => f.aiAnalysis!.theme)));

  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [rcaResult, setRcaResult] = useState<RootCauseAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache kết quả để tránh gọi lại API liên tục
  const [rcaCache, setRcaCache] = useState<Record<string, RootCauseAnalysisResult>>({});

  useEffect(() => {
    if (themeParam && availableThemes.includes(themeParam as any)) {
      setSelectedTheme(themeParam);
    } else if (availableThemes.length > 0) {
      setSelectedTheme(availableThemes[0]);
    }
  }, [themeParam, feedbacks]);

  useEffect(() => {
    if (!selectedTheme) return;

    if (rcaCache[selectedTheme]) {
      setRcaResult(rcaCache[selectedTheme]);
      setError(null);
      return;
    }

    triggerRCAAnalysis(selectedTheme);
  }, [selectedTheme]);

  const triggerRCAAnalysis = async (theme: string) => {
    setLoading(true);
    setError(null);
    setRcaResult(null);

    const themeFeedbacks = negativeFeedbacks.filter(f => f.aiAnalysis?.theme === theme);

    try {
      const data = await runSingleRCA(theme, themeFeedbacks);
      setRcaResult(data);
      setRcaCache(prev => ({ ...prev, [theme]: data }));
    } catch (e) {
      console.error(e);
      setError('Không thể kết nối đến AI. Vui lòng kiểm tra lại cấu hình API Key.');
    } finally {
      setLoading(false);
    }
  };

  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <SearchCode size={48} className="text-accent-color/80 animate-pulse" />
        <h3 className="text-xl font-bold text-primary-text">Chưa có dữ liệu phân tích</h3>
        <p className="text-sm text-secondary-text">
          Vui lòng nạp dữ liệu khách hàng hoặc tải dữ liệu giả lập (Demo Data) trước khi xem Phân tích Nguyên nhân.
        </p>
        <Link 
          href="/import"
          className="bg-accent-color hover:bg-accent-hover text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
        >
          Đi tới Nhập Dữ Liệu
        </Link>
      </div>
    );
  }

  const selectedThemeFeedbacks = negativeFeedbacks.filter(f => f.aiAnalysis?.theme === selectedTheme);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">Phân Tích Nguyên Nhân Gốc Rễ (RCA)</h2>
          <p className="text-xs text-secondary-text">
            Sử dụng AI Gemini phân tích chuỗi nguyên nhân (5 Whys), liên kết minh chứng thực tế và lập hành động khắc phục.
          </p>
        </div>

        {/* Theme Selector */}
        {availableThemes.length > 0 && (
          <div className="flex items-center space-x-2 bg-solid-surface border border-border-color p-2 rounded-xl">
            <span className="text-[11px] text-secondary-text font-bold px-1 shrink-0">Chọn vấn đề:</span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="bg-page-bg border border-border-color rounded-lg px-3 py-1.5 text-xs text-primary-text focus:outline-none focus:border-accent-color font-semibold"
            >
              {availableThemes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {availableThemes.length === 0 ? (
        <div className="apple-card p-12 text-center text-secondary-text max-w-lg mx-auto rounded-2xl flex flex-col items-center justify-center space-y-3">
          <HelpCircle size={36} className="text-secondary-text/60" />
          <h4 className="font-bold text-sm text-primary-text">Chưa ghi nhận sự cố tiêu cực</h4>
          <p className="text-[11px] text-secondary-text leading-relaxed">
            Hệ thống không phát hiện phản hồi tiêu cực nào. Phân tích nguyên nhân gốc rễ chỉ kích hoạt khi có đánh giá dưới 3 sao hoặc phàn nàn từ khách hàng.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Selected feedbacks list */}
          <div className="apple-card p-5 rounded-2xl flex flex-col justify-between h-[650px] space-y-4">
            <div className="space-y-4 overflow-hidden flex flex-col flex-1">
              <div className="flex items-center justify-between border-b border-border-color pb-3 shrink-0">
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-text">Danh sách phản hồi</h3>
                <span className="text-[10px] px-2.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full font-bold">
                  {selectedThemeFeedbacks.length} Feedback
                </span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {selectedThemeFeedbacks.map((f) => (
                  <div key={f.id} className="bg-page-bg/40 p-3.5 rounded-xl border border-border-color/80 space-y-2 hover:bg-page-bg/80 transition-apple">
                    <div className="flex items-center justify-between text-[10px] text-secondary-text">
                      <span className="font-semibold">{f.brand} • {f.channel}</span>
                      <span>{f.date}</span>
                    </div>
                    <p className="text-[11px] text-secondary-text leading-relaxed italic">
                      "{f.reviewText}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-amber-500 text-xs font-bold">{f.rating} ★</span>
                      {f.aiAnalysis?.painPoints && f.aiAnalysis.painPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {f.aiAnalysis.painPoints.slice(0, 1).map((p, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 bg-border-color text-secondary-text rounded border border-border-color">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => triggerRCAAnalysis(selectedTheme)}
              disabled={loading}
              className="w-full border border-border-color hover:bg-page-bg disabled:opacity-50 text-primary-text font-bold py-3 rounded-xl text-xs transition-apple flex items-center justify-center space-x-2 shrink-0 active:scale-95 shadow-sm"
            >
              <RefreshCw className={loading ? 'animate-spin text-accent-color' : 'text-secondary-text'} size={13} />
              <span>Yêu cầu AI Phân tích lại</span>
            </button>
          </div>

          {/* Right Panel: RCA AI Outputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Loading Status */}
            {loading && (
              <div className="apple-card p-8 rounded-2xl h-[650px] flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw size={36} className="text-accent-color animate-spin" />
                <h4 className="font-bold text-sm text-primary-text">Đang thực hiện phân tích 5 Whys...</h4>
                <p className="text-xs text-secondary-text">Mô hình AI đang bóc tách chuỗi nguyên nhân và lập phương án xử lý.</p>
              </div>
            )}

            {/* Error Status */}
            {error && (
              <div className="apple-card p-8 rounded-2xl h-[650px] flex flex-col items-center justify-center text-center space-y-3">
                <AlertTriangle size={36} className="text-rose-500" />
                <h4 className="font-bold text-sm text-primary-text">Không thể hoàn thành phân tích</h4>
                <p className="text-xs text-secondary-text">{error}</p>
                <button
                  onClick={() => triggerRCAAnalysis(selectedTheme)}
                  className="bg-accent-color hover:bg-accent-hover text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-apple"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Success RCA Result */}
            {rcaResult && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* 1. Root Cause Header Banner */}
                <div className="apple-glass p-6 rounded-2xl border-l-4 border-accent-color space-y-3">
                  <div className="flex items-center space-x-2 text-accent-color">
                    <Sparkles size={16} className="animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Nguyên nhân cốt lõi xác định</span>
                  </div>
                  <h3 className="text-lg font-black text-primary-text">{rcaResult.detectedRootCause}</h3>
                </div>

                {/* 2. Structured 5 Whys Chain (Vertical node line graph) */}
                <div className="apple-card p-6 rounded-2xl space-y-5">
                  <div className="flex items-center space-x-2 text-secondary-text">
                    <SearchCode size={18} />
                    <h3 className="font-bold text-sm text-primary-text">Chuỗi lập luận nguyên nhân gốc rễ (5 Whys Path)</h3>
                  </div>

                  {/* Vertical chain */}
                  <div className="relative border-l border-border-color pl-6 ml-4 space-y-6 my-4">
                    {parseWhys(rcaResult.explanation).map((why, index) => (
                      <div key={index} className="relative animate-fadeIn" style={{ animationDelay: `${index * 80}ms` }}>
                        {/* Connecting Node */}
                        <span className="absolute -left-[32px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent-soft border border-accent-color text-accent-color text-[8px] font-black shadow-sm">
                          Y{index + 1}
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-secondary-text">Tại sao thứ {index + 1}</span>
                          <p className="text-xs text-primary-text leading-relaxed font-medium">{why}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Evidence Quotes */}
                <div className="apple-card p-6 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 text-secondary-text">
                    <Quote size={18} />
                    <h3 className="font-bold text-sm text-primary-text">Minh chứng đối chứng từ Khách hàng</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rcaResult.evidenceQuotes.map((quote, idx) => (
                      <div key={idx} className="bg-page-bg/40 border border-border-color p-4 rounded-xl relative hover:bg-page-bg/80 transition-apple">
                        <Quote className="absolute top-3 right-3 text-border-color/40" size={14} />
                        <p className="text-xs text-secondary-text leading-relaxed italic pr-4">
                          "{quote}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Action Recommendations */}
                <div className="apple-card p-6 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 text-accent-color">
                    <Lightbulb size={18} />
                    <h3 className="font-bold text-sm text-primary-text">Hành động khắc phục và Phân bổ trách nhiệm</h3>
                  </div>
                  <div className="space-y-3">
                    {rcaResult.recommendedActions.map((rec, idx) => (
                      <div key={idx} className="bg-page-bg/40 border border-border-color p-4.5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-secondary-text">Biện pháp xử lý</span>
                          <p className="text-xs font-semibold text-primary-text leading-relaxed">{rec.action}</p>
                        </div>
                        <div className="flex items-center space-x-1.5 bg-accent-soft/80 border border-accent-color/20 px-3 py-1.5 rounded-lg shrink-0 w-max">
                          <Building size={12} className="text-accent-color" />
                          <span className="text-[9px] font-bold text-accent-color uppercase tracking-wider">{rec.department}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default function RootCauseAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw size={24} className="text-accent-color animate-spin" />
      </div>
    }>
      <RootCauseContent />
    </Suspense>
  );
}
