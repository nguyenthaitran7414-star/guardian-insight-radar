'use client';

import React from 'react';
import { useData } from '../../context/DataContext';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  ArrowLeftRight,
  TrendingUp,
  Frown,
  Smile,
  Zap,
  Building,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function CompetitorBenchmarkPage() {
  const { feedbacks } = useData();

  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <ArrowLeftRight size={48} className="text-accent-color/80 animate-pulse" />
        <h3 className="text-xl font-bold text-primary-text">Chưa có dữ liệu phân tích</h3>
        <p className="text-sm text-secondary-text">
          Vui lòng nạp dữ liệu khách hàng hoặc tải dữ liệu giả lập (Demo Data) trước khi xem So sánh Đối thủ.
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

  // Lọc dữ liệu theo từng thương hiệu
  const guardianFeedbacks = feedbacks.filter(f => f.brand === 'Guardian');
  const hasakiFeedbacks = feedbacks.filter(f => f.brand === 'Hasaki');
  const watsonsFeedbacks = feedbacks.filter(f => f.brand === 'Watsons');

  // Tính điểm đánh giá trung bình (CSAT)
  const getAvgRating = (list: typeof feedbacks) => {
    return list.length === 0 ? 0 : list.reduce((a, b) => a + b.rating, 0) / list.length;
  };
  const guardianAvg = getAvgRating(guardianFeedbacks);
  const hasakiAvg = getAvgRating(hasakiFeedbacks);
  const watsonsAvg = getAvgRating(watsonsFeedbacks);

  // Tính tỉ lệ cảm xúc
  const getSentimentStats = (list: typeof feedbacks) => {
    const completed = list.filter(f => f.analysisStatus === 'completed');
    if (completed.length === 0) return { positive: 0, neutral: 0, negative: 0 };
    const pos = completed.filter(f => f.aiAnalysis?.sentiment === 'positive').length;
    const neg = completed.filter(f => f.aiAnalysis?.sentiment === 'negative').length;
    const neu = completed.filter(f => f.aiAnalysis?.sentiment === 'neutral').length;
    return {
      positive: Math.round((pos / completed.length) * 100),
      neutral: Math.round((neu / completed.length) * 100),
      negative: Math.round((neg / completed.length) * 100)
    };
  };

  const gSentiment = getSentimentStats(guardianFeedbacks);
  const hSentiment = getSentimentStats(hasakiFeedbacks);
  const wSentiment = getSentimentStats(watsonsFeedbacks);

  // Biểu đồ so sánh cảm xúc (Grouped Bar Chart)
  const sentimentComparisonData = [
    {
      brand: 'Guardian',
      'Tích cực': gSentiment.positive,
      'Trung lập': gSentiment.neutral,
      'Tiêu cực': gSentiment.negative
    },
    {
      brand: 'Hasaki',
      'Tích cực': hSentiment.positive,
      'Trung lập': hSentiment.neutral,
      'Tiêu cực': hSentiment.negative
    },
    {
      brand: 'Watsons',
      'Tích cực': wSentiment.positive,
      'Trung lập': wSentiment.neutral,
      'Tiêu cực': wSentiment.negative
    }
  ];

  // Biểu đồ thị phần thảo luận (Share of Voice)
  const shareOfVoiceData = [
    { name: 'Guardian', value: guardianFeedbacks.length, color: '#f26f21' },
    { name: 'Hasaki', value: hasakiFeedbacks.length, color: '#0f766e' },
    { name: 'Watsons', value: watsonsFeedbacks.length, color: '#0891b2' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-primary-text">So Sánh Đối Thủ Cạnh Tranh</h2>
        <p className="text-xs text-secondary-text">
          Đo lường thị phần thảo luận (Share of Voice), tỉ lệ cảm xúc và các điểm mạnh/yếu rút ra từ dữ liệu VoC của cả 3 hệ thống.
        </p>
      </div>

      {/* Grid: 3 Competitors CSAT cards (Apple style cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guardian card */}
        <div className="apple-card p-5 rounded-2xl border-t-4 border-[#f26f21] space-y-4">
          <div className="flex items-center justify-between text-[#f26f21]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary-text">Guardian Vietnam</h4>
            <span className="text-[9px] bg-[#f26f21]/10 text-[#f26f21] px-2 py-0.5 rounded border border-[#f26f21]/20 font-bold uppercase">
              Kênh chính
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-primary-text">{guardianAvg.toFixed(1)}</span>
            <span className="text-[10px] text-secondary-text">/ 5 ★ CSAT</span>
          </div>
          <div className="text-[11px] text-secondary-text space-y-1 border-t border-border-color/60 pt-3">
            <div className="flex justify-between">
              <span>Tổng phản hồi:</span>
              <strong className="text-primary-text">{guardianFeedbacks.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ hài lòng:</span>
              <strong className="text-emerald-500">{gSentiment.positive}%</strong>
            </div>
          </div>
        </div>

        {/* Hasaki card */}
        <div className="apple-card p-5 rounded-2xl border-t-4 border-[#0f766e] space-y-4">
          <div className="flex items-center justify-between text-[#0f766e]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary-text">Hasaki Beauty</h4>
            <span className="text-[9px] bg-[#0f766e]/10 text-[#0f766e] px-2 py-0.5 rounded border border-[#0f766e]/20 font-bold uppercase">
              Đối thủ
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-primary-text">{hasakiAvg.toFixed(1)}</span>
            <span className="text-[10px] text-secondary-text">/ 5 ★ CSAT</span>
          </div>
          <div className="text-[11px] text-secondary-text space-y-1 border-t border-border-color/60 pt-3">
            <div className="flex justify-between">
              <span>Tổng phản hồi:</span>
              <strong className="text-primary-text">{hasakiFeedbacks.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ hài lòng:</span>
              <strong className="text-emerald-500">{hSentiment.positive}%</strong>
            </div>
          </div>
        </div>

        {/* Watsons card */}
        <div className="apple-card p-5 rounded-2xl border-t-4 border-[#0891b2] space-y-4">
          <div className="flex items-center justify-between text-[#0891b2]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary-text">Watsons Vietnam</h4>
            <span className="text-[9px] bg-[#0891b2]/10 text-[#0891b2] px-2 py-0.5 rounded border border-[#0891b2]/20 font-bold uppercase">
              Đối thủ
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-primary-text">{watsonsAvg.toFixed(1)}</span>
            <span className="text-[10px] text-secondary-text">/ 5 ★ CSAT</span>
          </div>
          <div className="text-[11px] text-secondary-text space-y-1 border-t border-border-color/60 pt-3">
            <div className="flex justify-between">
              <span>Tổng phản hồi:</span>
              <strong className="text-primary-text">{watsonsFeedbacks.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ hài lòng:</span>
              <strong className="text-emerald-500">{wSentiment.positive}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Comparison Bar Chart */}
        <div className="apple-card p-6 rounded-2xl lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-primary-text">So Sánh Tỉ Lệ Sắc Thái Cảm Xúc (%)</h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="brand" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--solid-surface)', borderColor: 'var(--border-color)', color: 'var(--primary-text)' }} />
                <Legend />
                <Bar dataKey="Tích cực" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Trung lập" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tiêu cực" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share of Voice */}
        <div className="apple-card p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="font-bold text-sm text-primary-text">Thị Phần Thảo Luận (Share of Voice)</h3>
          <div className="flex-1 h-60 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shareOfVoiceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {shareOfVoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--solid-surface)', borderColor: 'var(--border-color)', color: 'var(--primary-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* SWOT Comparison Matrix */}
      <div className="apple-card p-6 rounded-2xl space-y-6">
        <h3 className="font-bold text-sm text-primary-text border-b border-border-color pb-3.5 flex items-center space-x-2">
          <ArrowLeftRight className="text-accent-color" size={18} />
          <span>Ma Trận So Sánh Điểm Mạnh & Điểm Yếu Khách Hàng (VoC SWOT)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Guardian Column */}
          <div className="space-y-4 bg-page-bg/40 p-4.5 rounded-2xl border border-border-color">
            <h4 className="font-bold text-xs text-[#f26f21] border-b border-border-color/60 pb-2">GUARDIAN VIETNAM</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle size={11} />
                  <span>Điểm Mạnh (Strengths)</span>
                </span>
                <ul className="text-[11px] text-secondary-text space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Nguồn hàng chính hãng, tạo độ tin cậy tuyệt đối.</li>
                  <li>Mặt hàng mỹ phẩm và chăm sóc cá nhân vô cùng phong phú.</li>
                  <li>Dịch vụ hỗ trợ trực tiếp tại cửa hàng lịch sự, dễ chịu.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider flex items-center space-x-1">
                  <AlertTriangle size={11} />
                  <span>Điểm Yếu (Weaknesses)</span>
                </span>
                <ul className="text-[11px] text-secondary-text space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Vận hành kho chuẩn bị hàng chậm trong các đợt Megasale.</li>
                  <li>Mức giá bán lẻ và quà tặng đi kèm ít hấp dẫn hơn Hasaki.</li>
                  <li>Bao bì đóng gói chống sốc hộp mỏng dễ chảy đổ chất lỏng.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Hasaki Column */}
          <div className="space-y-4 bg-page-bg/40 p-4.5 rounded-2xl border border-border-color">
            <h4 className="font-bold text-xs text-teal-600 dark:text-teal-400 border-b border-border-color/60 pb-2">HASAKI BEAUTY</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle size={11} />
                  <span>Điểm Mạnh (Strengths)</span>
                </span>
                <ul className="text-[11px] text-secondary-text space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Dịch vụ giao hàng siêu tốc 2H tạo lợi thế cạnh tranh lớn.</li>
                  <li>Quy chuẩn bọc bong bóng xốp dày chống bể vỡ rất tốt.</li>
                  <li>Chiến lược định giá rẻ và quà tặng mẫu thử (sample) dồi dào.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider flex items-center space-x-1">
                  <AlertTriangle size={11} />
                  <span>Điểm Yếu (Weaknesses)</span>
                </span>
                <ul className="text-[11px] text-secondary-text space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Nhân viên tư vấn sản phẩm trực tiếp thiếu kiến thức da liễu.</li>
                  <li>Nhiều phản hồi tiêu cực về thái độ của bảo vệ dắt xe.</li>
                  <li>Hệ thống thường xuyên hết quà tặng kèm trước thời hạn sale.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Watsons Column */}
          <div className="space-y-4 bg-page-bg/40 p-4.5 rounded-2xl border border-border-color">
            <h4 className="font-bold text-xs text-cyan-600 dark:text-cyan-400 border-b border-border-color/60 pb-2">WATSONS VIETNAM</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle size={11} />
                  <span>Điểm Mạnh (Strengths)</span>
                </span>
                <ul className="text-[11px] text-secondary-text space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Bố trí không gian cửa hàng cao cấp, tạo cảm giác sang trọng.</li>
                  <li>Phân phối độc quyền nhiều nhãn hiệu mỹ phẩm quốc tế nổi tiếng.</li>
                  <li>Website trực quan, hệ thống tích lũy điểm thưởng chuyên nghiệp.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider flex items-center space-x-1">
                  <AlertTriangle size={11} />
                  <span>Điểm Yếu (Weaknesses)</span>
                </span>
                <ul className="text-[11px] text-secondary-text space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Hiệu năng ứng dụng di động lag lúc áp voucher thanh toán.</li>
                  <li>Mặt bằng giá cao nhất trong các chuỗi, ít khuyến mãi hời.</li>
                  <li>Mạng lưới chi nhánh trực tiếp phủ sóng còn hạn chế.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
