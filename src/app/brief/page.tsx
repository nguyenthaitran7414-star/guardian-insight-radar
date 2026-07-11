'use client';

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Link from 'next/link';
import { 
  FileText, 
  RefreshCw, 
  Copy, 
  Download, 
  CheckCircle,
  FileDown,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { ExecutiveBriefResult } from '../../types';

// Hàm đơn giản giúp parse Markdown thành HTML đẹp mắt mà không cần thư viện ngoài
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Xử lý xuống dòng
  html = html.replace(/\r\n/g, '\n');

  // Xử lý Headings
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-black text-[var(--primary-text)] mt-8 mb-4 border-b border-[var(--border-color)] pb-3 tracking-tight">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-sm font-bold text-[var(--accent-color)] mt-6 mb-3 uppercase tracking-wider">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xs font-semibold text-[var(--primary-text)] mt-4 mb-2">$1</h3>');

  // Xử lý định dạng chữ đậm
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--primary-text)]">$1</strong>');

  // Xử lý các dấu gạch ngang phân cách
  html = html.replace(/^---$/gm, '<hr class="my-6 border-[var(--border-color)]" />');

  // Xử lý Bullet Points (danh sách)
  html = html.replace(/^\* (.*?)$/gm, '<li class="text-xs text-[var(--secondary-text)] ml-4 list-disc py-1 leading-relaxed">$1</li>');
  html = html.replace(/^- (.*?)$/gm, '<li class="text-xs text-[var(--secondary-text)] ml-4 list-disc py-1 leading-relaxed">$1</li>');

  // Xử lý bảng biểu (Markdown Table)
  const lines = html.split('\n');
  let inTable = false;
  let tableHeaderParsed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        lines[i] = '<div class="overflow-x-auto my-4 rounded-xl border border-[var(--border-color)]"><table class="w-full text-left text-xs border-collapse"><thead class="bg-[var(--page-bg)]"><tr>' + 
          line.split('|').slice(1, -1).map(cell => `<th class="px-4 py-3 font-bold text-[var(--secondary-text)] border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider">${cell.trim()}</th>`).join('') + 
          '</tr></thead><tbody>';
        tableHeaderParsed = true;
      } else if (line.includes('---')) {
        lines[i] = '';
      } else {
        lines[i] = '<tr class="hover:bg-[var(--page-bg)]/40 transition-all">' + 
          line.split('|').slice(1, -1).map(cell => `<td class="px-4 py-3 text-[var(--secondary-text)] border-b border-[var(--border-color)]/60">${cell.trim()}</td>`).join('') + 
          '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHeaderParsed = false;
        lines[i] = '</tbody></table></div>' + lines[i];
      }
    }
  }
  html = lines.join('\n');

  return html;
}

export default function ExecutiveBriefPage() {
  const { feedbacks, generateExecutiveBrief } = useData();
  
  const [brief, setBrief] = useState<ExecutiveBriefResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <FileText size={48} className="text-accent-color/80 animate-pulse" />
        <h3 className="text-xl font-bold text-primary-text">Chưa có dữ liệu phân tích</h3>
        <p className="text-sm text-secondary-text">
          Vui lòng nạp dữ liệu khách hàng hoặc tải dữ liệu giả lập (Demo Data) trước khi biên soạn báo cáo điều hành.
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

  const handleGenerateBrief = async () => {
    setLoading(true);
    setError(null);
    setBrief(null);

    try {
      const data = await generateExecutiveBrief();
      setBrief(data);
    } catch (e) {
      console.error(e);
      setError('Lỗi kết nối AI. Không thể biên soạn báo cáo tóm tắt.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!brief) return;
    navigator.clipboard.writeText(brief.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    if (!brief) return;
    const element = document.createElement("a");
    const file = new Blob([brief.markdownContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Guardian_VoC_Executive_Brief_${brief.dateGenerated}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">Báo Cáo Điều Hành (Executive Brief)</h2>
          <p className="text-xs text-secondary-text">
            Biên soạn tóm tắt toàn cảnh, phân bổ đầu việc và hành động khắc phục cho ban lãnh đạo Guardian.
          </p>
        </div>

        {/* Generate Button */}
        {!brief && (
          <button
            onClick={handleGenerateBrief}
            disabled={loading}
            className="bg-accent-color hover:bg-accent-hover disabled:bg-border-color disabled:text-secondary-text font-bold px-6 py-3 rounded-xl text-xs text-white transition-apple flex items-center space-x-2 shadow-md active:scale-95 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>Đang tổng hợp báo cáo...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Biên soạn Báo cáo bằng AI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading state panel */}
      {loading && (
        <div className="apple-card p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-[60vh]">
          <RefreshCw size={40} className="text-accent-color animate-spin" />
          <h4 className="font-bold text-sm text-primary-text">Gemini đang rà soát dữ liệu...</h4>
          <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
            AI đang phân tích thị phần, lọc top khiếu nại và lập bảng phân bổ đầu việc cho các phòng ban.
          </p>
        </div>
      )}

      {/* Error state panel */}
      {error && (
        <div className="apple-card p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-[60vh]">
          <AlertCircle size={40} className="text-rose-500" />
          <h4 className="font-bold text-sm text-primary-text">Không thể hoàn thành báo cáo</h4>
          <p className="text-xs text-secondary-text">{error}</p>
          <button
            onClick={handleGenerateBrief}
            className="bg-accent-color hover:bg-accent-hover text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-apple shadow-sm"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main briefing container */}
      {brief && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Action Row Toolbar */}
          <div className="apple-glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[11px] text-secondary-text flex items-center space-x-1.5">
              <CheckCircle size={13} className="text-emerald-500" />
              <span>Báo cáo khởi tạo lúc <strong className="text-primary-text">{brief.dateGenerated}</strong></span>
            </span>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleCopyToClipboard}
                className="border border-border-color hover:bg-page-bg text-primary-text font-semibold px-4 py-2 rounded-xl text-xs transition-apple flex items-center space-x-1.5 active:scale-95"
              >
                {copied ? (
                  <>
                    <CheckCircle className="text-emerald-500" size={13} />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Sao chép</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadFile}
                className="bg-accent-color hover:bg-accent-hover text-white font-bold px-4 py-2 rounded-xl text-xs transition-apple flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <FileDown size={13} />
                <span>Tải xuống .md</span>
              </button>

              <button
                onClick={handleGenerateBrief}
                className="border border-border-color hover:bg-page-bg text-secondary-text hover:text-primary-text font-semibold px-4 py-2 rounded-xl text-xs transition-apple flex items-center space-x-1.5 active:scale-95"
              >
                <RefreshCw size={13} />
                <span>Tải lại</span>
              </button>
            </div>
          </div>

          {/* Rendered Briefing Body */}
          <div className="apple-card p-8 md:p-10 rounded-2xl shadow-lg relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute top-10 right-10 text-border-color/20 select-none pointer-events-none uppercase tracking-widest text-7xl font-black rotate-12 hidden md:block">
              Guardian
            </div>

            <article 
              className="prose prose-invert max-w-none text-secondary-text leading-relaxed text-sm space-y-4 relative z-10"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(brief.markdownContent) }}
            />
          </div>

        </div>
      )}

      {/* Call to action prompt */}
      {!brief && !loading && !error && (
        <div className="apple-card p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-[50vh]">
          <FileText size={48} className="text-secondary-text/40" />
          <h4 className="font-bold text-sm text-primary-text">Báo cáo tóm tắt chưa được lập</h4>
          <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
            Nhấn nút phía trên để quét toàn bộ dữ liệu phản hồi đã nạp và sử dụng AI biên dịch báo cáo cấp cao bằng tiếng Việt.
          </p>
          <button
            onClick={handleGenerateBrief}
            className="bg-accent-color hover:bg-accent-hover text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-apple flex items-center space-x-1.5 shadow-md active:scale-95"
          >
            <Sparkles size={14} />
            <span>Biên soạn Ngay</span>
          </button>
        </div>
      )}
    </div>
  );
}
