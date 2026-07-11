'use client';

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Link from 'next/link';
import { 
  Radar, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MessageSquareWarning,
  ShieldCheck,
  CheckCircle,
  Filter,
  X,
  Sparkles
} from 'lucide-react';

interface GroupedIssue {
  theme: string;
  negativeCount: number;
  avgRating: number;
  priorityScore: number;
  isRising: boolean;
  sampleComments: string[];
}

export default function IssueRadarPage() {
  const { feedbacks } = useData();
  const [selectedChannel, setSelectedChannel] = useState<'All' | string>('All');
  const [activeIssueDetail, setActiveIssueDetail] = useState<GroupedIssue | null>(null);
  
  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <Radar size={48} className="text-accent-color/80 animate-pulse" />
        <h3 className="text-xl font-bold text-primary-text">Chưa có dữ liệu phân tích</h3>
        <p className="text-sm text-secondary-text">
          Vui lòng nạp dữ liệu khách hàng hoặc tải dữ liệu giả lập (Demo Data) trước khi xem Radar Vấn đề.
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

  // Lọc theo kênh nếu được chọn
  const filteredFeedbacks = selectedChannel === 'All'
    ? feedbacks
    : feedbacks.filter(f => f.channel === selectedChannel);

  const analyzed = filteredFeedbacks.filter(f => f.analysisStatus === 'completed');
  const negativeFeedbacks = analyzed.filter(f => f.aiAnalysis?.sentiment === 'negative');

  // Gom nhóm các sự cố tiêu cực theo Theme
  const themesMap: Record<string, { ratings: number[]; texts: string[] }> = {};
  negativeFeedbacks.forEach(f => {
    if (f.aiAnalysis?.theme) {
      const t = f.aiAnalysis.theme;
      if (!themesMap[t]) {
        themesMap[t] = { ratings: [], texts: [] };
      }
      themesMap[t].ratings.push(f.rating);
      themesMap[t].texts.push(f.reviewText);
    }
  });

  const issues: GroupedIssue[] = Object.entries(themesMap).map(([theme, data]) => {
    const negativeCount = data.ratings.length;
    const avgRating = data.ratings.reduce((a, b) => a + b, 0) / negativeCount;
    
    // Công thức tính điểm ưu tiên: Số phản hồi tiêu cực * Mức độ nghiêm trọng (thang điểm đảo ngược của Rating: 6 - avgRating)
    const severityFactor = 6 - avgRating;
    const priorityScore = Math.round(negativeCount * severityFactor * 10);

    // Phát hiện xu hướng mới nổi (Rising): Ví dụ nếu có nhiều hơn 2 đánh giá tiêu cực và thuộc chủ đề vận chuyển/đóng gói
    const isRising = negativeCount >= 2 && (theme === 'Shipping & Delivery' || theme === 'Packaging');

    return {
      theme,
      negativeCount,
      avgRating,
      priorityScore,
      isRising,
      sampleComments: data.texts
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  const channelsList = Array.from(new Set(feedbacks.map(f => f.channel)));

  return (
    <div className="space-y-8 relative">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">Radar Vấn Đề (Issue Radar)</h2>
          <p className="text-xs text-secondary-text">
            Danh sách khiếu nại của khách hàng được phân loại theo chủ đề và tự động sắp xếp thứ tự ưu tiên xử lý.
          </p>
        </div>

        {/* Channel Filter */}
        <div className="flex items-center space-x-2 bg-solid-surface border border-border-color p-1.5 rounded-xl w-max overflow-x-auto max-w-full">
          <div className="text-secondary-text px-2 flex items-center space-x-1 shrink-0">
            <Filter size={13} />
            <span className="text-[11px] font-semibold">Kênh</span>
          </div>
          <button
            onClick={() => setSelectedChannel('All')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
              selectedChannel === 'All'
                ? 'bg-accent-color text-white shadow-sm'
                : 'text-secondary-text hover:text-primary-text'
            }`}
          >
            Tất cả
          </button>
          {channelsList.map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                selectedChannel === ch
                  ? 'bg-accent-color text-white shadow-sm'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: KPI Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Negative feedbacks */}
        <div className="apple-card p-6 rounded-2xl flex items-center justify-between border-t-2 border-rose-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Khiếu nại tiêu cực</span>
            <h3 className="text-3xl font-extrabold text-primary-text">{negativeFeedbacks.length}</h3>
            <p className="text-[11px] text-secondary-text">Nhận diện qua bộ phân loại AI</p>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500">
            <MessageSquareWarning size={20} />
          </div>
        </div>

        {/* KPI 2: Rising issues */}
        <div className="apple-card p-6 rounded-2xl flex items-center justify-between border-t-2 border-amber-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Sự cố mới nổi (Rising)</span>
            <h3 className="text-3xl font-extrabold text-primary-text">{issues.filter(i => i.isRising).length}</h3>
            <p className="text-[11px] text-secondary-text">Vấn đề tiêu cực tăng nhanh</p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* KPI 3: Control status */}
        <div className="apple-card p-6 rounded-2xl flex items-center justify-between border-t-2 border-emerald-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Khu vực kiểm soát tốt</span>
            <h3 className="text-3xl font-extrabold text-primary-text">
              {issues.length === 0 ? 'Hoàn hảo' : `${issues.filter(i => i.priorityScore < 120).length}/${issues.length}`}
            </h3>
            <p className="text-[11px] text-secondary-text">Chủ đề có điểm ưu tiên thấp</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Prioritization List Matrix */}
      <div className="apple-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border-color">
          <h3 className="font-bold text-sm text-primary-text">Bảng Xếp Hạng Ưu Tiên Giải Quyết Sự Cố</h3>
        </div>

        {issues.length === 0 ? (
          <div className="p-12 text-center text-secondary-text flex flex-col items-center justify-center space-y-3">
            <CheckCircle size={36} className="text-emerald-500" />
            <p className="text-xs font-semibold text-primary-text">Không có vấn đề tiêu cực nào</p>
            <p className="text-[11px] text-secondary-text">Mọi phản hồi nạp hiện tại đều mang sắc thái Tích cực hoặc Trung lập.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-color/60">
            {issues.map((issue, idx) => (
              <div 
                key={issue.theme} 
                className="p-5 hover:bg-page-bg/40 transition-apple flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer"
                onClick={() => setActiveIssueDetail(issue)}
              >
                
                {/* Details and labels */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-border-color text-secondary-text rounded uppercase tracking-wider">
                      HẠNG #{idx + 1}
                    </span>
                    <h4 className="font-bold text-sm text-primary-text hover:text-accent-color transition-apple">{issue.theme}</h4>
                    
                    {issue.isRising && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center space-x-1 animate-pulse">
                        <TrendingUp size={10} />
                        <span>Mới nổi (Rising)</span>
                      </span>
                    )}

                    {issue.priorityScore >= 120 ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center space-x-1">
                        <AlertTriangle size={10} />
                        <span>Nghiêm trọng</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-border-color text-secondary-text rounded-full">
                        Độ ưu tiên vừa
                      </span>
                    )}
                  </div>

                  {/* Sample metrics */}
                  <div className="flex items-center space-x-4 text-[11px] text-secondary-text">
                    <span>Lượng phàn nàn: <strong className="text-rose-500 font-bold">{issue.negativeCount}</strong></span>
                    <span>•</span>
                    <span>Điểm đánh giá: <strong className="text-amber-500 font-bold">{issue.avgRating.toFixed(1)} ★</strong></span>
                  </div>

                  {/* Customer quote snippet */}
                  <p className="text-xs text-secondary-text italic line-clamp-1 max-w-2xl">
                    "{issue.sampleComments[0]}"
                  </p>
                </div>

                {/* Score and Drill-down action */}
                <div className="flex items-center space-x-6 shrink-0 w-full md:w-auto justify-between md:justify-end" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <span className="text-[10px] text-secondary-text block uppercase font-bold tracking-wider">Điểm ưu tiên</span>
                    <span className={`text-2xl font-black ${
                      issue.priorityScore >= 120 ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      {issue.priorityScore}
                    </span>
                  </div>

                  <Link
                    href={`/root-cause?theme=${encodeURIComponent(issue.theme)}`}
                    className="bg-border-color hover:bg-accent-color hover:text-white border border-border-color hover:border-accent-color text-primary-text font-semibold px-4 py-2.5 rounded-xl text-xs transition-apple flex items-center space-x-1.5 shadow-sm active:scale-95"
                  >
                    <span>Phân tích RCA</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over details Panel (Apple inspired detail view) */}
      {activeIssueDetail && (
        <>
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveIssueDetail(null)}
          />
          
          {/* Slide-over Container */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] z-50 bg-solid-surface border-l border-border-color shadow-2xl p-6 flex flex-col justify-between animate-slideIn">
            <div className="space-y-6 overflow-y-auto pr-2 max-h-[85vh]">
              {/* Close and Title */}
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text flex items-center space-x-1.5">
                    <Sparkles size={11} className="text-accent-color animate-pulse" />
                    <span>Chi tiết sự cố VoC</span>
                  </span>
                  <h3 className="font-bold text-base text-primary-text">{activeIssueDetail.theme}</h3>
                </div>
                <button 
                  onClick={() => setActiveIssueDetail(null)}
                  className="p-1.5 rounded-lg hover:bg-page-bg text-secondary-text hover:text-primary-text transition-apple"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 bg-page-bg p-4 rounded-2xl border border-border-color">
                <div className="text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-secondary-text font-bold">Số lượng</span>
                  <p className="text-lg font-black text-rose-500">{activeIssueDetail.negativeCount}</p>
                </div>
                <div className="text-center space-y-1 border-x border-border-color">
                  <span className="text-[9px] uppercase tracking-wider text-secondary-text font-bold">CSAT mẫu</span>
                  <p className="text-lg font-black text-amber-500">{activeIssueDetail.avgRating.toFixed(1)}★</p>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-secondary-text font-bold">Độ ưu tiên</span>
                  <p className="text-lg font-black text-primary-text">{activeIssueDetail.priorityScore}</p>
                </div>
              </div>

              {/* List of customer comments */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text block">Minh chứng phản hồi ({activeIssueDetail.sampleComments.length})</span>
                <div className="space-y-3">
                  {activeIssueDetail.sampleComments.map((comment, index) => (
                    <div key={index} className="p-3 bg-page-bg/50 rounded-xl border border-border-color/80 text-xs text-secondary-text leading-relaxed italic">
                      "{comment}"
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-border-color pt-4 flex gap-3">
              <button
                onClick={() => setActiveIssueDetail(null)}
                className="flex-1 border border-border-color hover:bg-page-bg text-primary-text font-semibold py-3 rounded-xl text-xs transition-apple text-center"
              >
                Đóng
              </button>
              <Link
                href={`/root-cause?theme=${encodeURIComponent(activeIssueDetail.theme)}`}
                className="flex-1 bg-accent-color hover:bg-accent-hover text-white font-bold py-3 rounded-xl text-xs transition-apple text-center flex items-center justify-center space-x-1.5 shadow-md active:scale-95"
              >
                <span>Chạy 5 Whys RCA</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
