'use client';

import React, { useState } from 'react';
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  DatabaseBackup, 
  Activity, 
  Smile, 
  Frown, 
  TrendingUp,
  Filter,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const { feedbacks } = useData();
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<'All' | 'Guardian' | 'Hasaki' | 'Watsons'>('All');

  // 1. Kiểm tra dữ liệu rỗng (Không có phản hồi nào được nạp)
  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <DatabaseBackup size={48} className="text-accent-color/80 animate-pulse" />
        <h3 className="text-xl font-bold text-primary-text">Chưa có dữ liệu phản hồi</h3>
        <p className="text-sm text-secondary-text">
          Vui lòng nạp dữ liệu khách hàng hoặc tải dữ liệu giả lập (Demo Data) trước khi xem Bảng điều khiển.
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

  // Áp dụng bộ lọc thương hiệu
  const filteredFeedbacks = selectedBrandFilter === 'All'
    ? feedbacks
    : feedbacks.filter(f => f.brand === selectedBrandFilter);

  // Lấy danh sách phản hồi đã được chạy phân tích AI
  const analyzedFeedbacks = filteredFeedbacks.filter(f => f.analysisStatus === 'completed');

  // Kiểm tra chế độ Dữ liệu mô phỏng (Demo Mode)
  const isDemoActive = filteredFeedbacks.some(f => f.isSimulated);

  // 4. Hiển thị Trạng thái Rỗng khi chưa chạy phân tích AI
  if (analyzedFeedbacks.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold tracking-tight text-primary-text">Bảng Điều Khiển Tổng Quan</h2>
              {isDemoActive && (
                <span className="bg-accent-soft text-accent-color border border-accent-color/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Dữ liệu mô phỏng
                </span>
              )}
            </div>
            <p className="text-xs text-secondary-text">
              Tổng hợp dữ liệu phản hồi, hiệu quả hoạt động chăm sóc khách hàng và các chỉ số ước tính.
            </p>
          </div>
          
          {/* Brand Filter */}
          <div className="flex items-center space-x-2 bg-solid-surface border border-border-color p-1.5 rounded-xl w-max">
            <div className="text-secondary-text px-2 flex items-center space-x-1">
              <Filter size={13} />
              <span className="text-[11px] font-semibold">Lọc</span>
            </div>
            {(['All', 'Guardian', 'Hasaki', 'Watsons'] as const).map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrandFilter(brand)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-apple ${
                  selectedBrandFilter === brand
                    ? 'bg-accent-color text-white shadow-sm'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                {brand === 'All' ? 'Tất cả' : brand}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state panel */}
        <div className="apple-card p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[45vh]">
          <DatabaseBackup size={48} className="text-accent-color/80 animate-pulse" />
          <h3 className="text-lg font-bold text-primary-text">Chưa có kết quả phân tích AI</h3>
          <p className="text-xs text-secondary-text max-w-md leading-relaxed">
            Bạn đã nạp thành công {filteredFeedbacks.length} phản hồi cho thương hiệu này, nhưng chúng chưa được chạy qua mô hình AI để gán sắc thái cảm xúc và chủ đề.
          </p>
          <div className="text-[11px] text-secondary-text">
            Tổng cỡ mẫu: {filteredFeedbacks.length} phản hồi
          </div>
          <Link 
            href="/import"
            className="bg-accent-color hover:bg-accent-hover text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-apple shadow-md"
          >
            Đi tới Nhập Dữ Liệu & Phân Tích
          </Link>
        </div>
      </div>
    );
  }

  // 2. Tính toán các chỉ số dựa trên dữ liệu thật đã phân tích hoàn tất
  const totalCount = filteredFeedbacks.length;
  const totalAnalyzed = analyzedFeedbacks.length;

  const positiveCount = analyzedFeedbacks.filter(f => f.aiAnalysis?.sentiment === 'positive').length;
  const neutralCount = analyzedFeedbacks.filter(f => f.aiAnalysis?.sentiment === 'neutral').length;
  const negativeCount = analyzedFeedbacks.filter(f => f.aiAnalysis?.sentiment === 'negative').length;

  // Tính toán tỷ lệ phần trăm bảo đảm tổng bằng 100%
  let posPercent = 0;
  let neuPercent = 0;
  let negPercent = 0;

  if (totalAnalyzed > 0) {
    posPercent = Math.round((positiveCount / totalAnalyzed) * 100);
    neuPercent = Math.round((neutralCount / totalAnalyzed) * 100);
    negPercent = 100 - posPercent - neuPercent;
    
    // Đảm bảo không có giá trị âm do sai lệch làm tròn
    if (negPercent < 0) {
      negPercent = 0;
      posPercent = 100 - neuPercent;
    }
  }

  // Tính toán điểm CSAT trung bình dựa trên rating gốc của mẫu
  const avgRating = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0) / (totalCount || 1);
  const csatScore = Math.round((avgRating / 5) * 100);

  // Số lượng phản hồi khẩn cấp / nghiêm trọng cao (High & Critical severity)
  const highPriorityCount = analyzedFeedbacks.filter(
    f => f.aiAnalysis?.severity === 'high' || f.aiAnalysis?.severity === 'critical'
  ).length;

  // 1. Phân bố Sắc thái cảm xúc (Pie Chart)
  const sentimentData = [
    { name: 'Tích cực', value: positiveCount, color: '#10b981', percent: posPercent },
    { name: 'Trung lập', value: neutralCount, color: '#64748b', percent: neuPercent },
    { name: 'Tiêu cực', value: negativeCount, color: '#f43f5e', percent: negPercent }
  ].filter(d => d.value > 0);

  // 2. Phân phối phản hồi theo Kênh (Pie Chart)
  const channelCounts: Record<string, number> = {};
  filteredFeedbacks.forEach(f => {
    channelCounts[f.channel] = (channelCounts[f.channel] || 0) + 1;
  });
  const channelData = Object.entries(channelCounts).map(([name, value]) => ({ name, value }));
  const CHANNEL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f26f21'];

  // 3. Phân phối phản hồi theo Thương hiệu (Pie Chart)
  const brandCounts: Record<string, number> = {};
  filteredFeedbacks.forEach(f => {
    brandCounts[f.brand] = (brandCounts[f.brand] || 0) + 1;
  });
  const brandData = Object.entries(brandCounts).map(([name, value]) => ({ name, value }));
  const BRAND_COLORS = ['#f26f21', '#0f766e', '#0891b2'];

  // 4. Phân phối Phản hồi theo Chủ đề (Horizontal Bar Chart)
  const themeCounts: Record<string, number> = {};
  analyzedFeedbacks.forEach(f => {
    if (f.aiAnalysis?.theme) {
      themeCounts[f.aiAnalysis.theme] = (themeCounts[f.aiAnalysis.theme] || 0) + 1;
    }
  });
  const themeData = Object.entries(themeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 5. Xu hướng Cảm xúc theo Thời gian (Area Chart)
  const dates = Array.from(new Set(filteredFeedbacks.map(f => f.date))).sort();
  const trendData = dates.map(date => {
    const dayFeedbacks = filteredFeedbacks.filter(f => f.date === date);
    const dayAnalyzed = dayFeedbacks.filter(f => f.analysisStatus === 'completed');
    
    const pos = dayAnalyzed.filter(f => f.aiAnalysis?.sentiment === 'positive').length;
    const neg = dayAnalyzed.filter(f => f.aiAnalysis?.sentiment === 'negative').length;
    const total = dayFeedbacks.length;

    return {
      date: date.substring(5), // Rút gọn định dạng ngày MM-DD
      'Tích cực': pos,
      'Tiêu cực': neg,
      'Tổng số': total
    };
  });

  // Tooltip style matching theme
  const tooltipStyle = { 
    backgroundColor: 'var(--solid-surface)', 
    borderColor: 'var(--border-color)', 
    color: 'var(--primary-text)',
    borderRadius: '12px',
    fontSize: '11px'
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold tracking-tight text-primary-text">Bảng Điều Khiển Tổng Quan</h2>
            {isDemoActive && (
              <span className="bg-accent-soft text-accent-color border border-accent-color/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                Dữ liệu mô phỏng
              </span>
            )}
          </div>
          <p className="text-xs text-secondary-text">
            Cỡ mẫu: {totalCount} phản hồi &middot; Đã phân tích AI: {totalAnalyzed}
          </p>
        </div>
        
        {/* Brand Filter */}
        <div className="flex items-center space-x-2 bg-solid-surface border border-border-color p-1.5 rounded-xl w-max">
          <div className="text-secondary-text px-2 flex items-center space-x-1 shrink-0">
            <Filter size={13} />
            <span className="text-[11px] font-semibold">Lọc</span>
          </div>
          {(['All', 'Guardian', 'Hasaki', 'Watsons'] as const).map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrandFilter(brand)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-apple shrink-0 ${
                selectedBrandFilter === brand
                  ? 'bg-accent-color text-white shadow-sm'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              {brand === 'All' ? 'Tất cả' : brand}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total Feedback */}
        <div className="apple-card p-5 rounded-2xl flex items-center justify-between border-t-2 border-blue-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Tổng số phản hồi</span>
            <h3 className="text-3xl font-black text-primary-text">{totalCount}</h3>
            <p className="text-[11px] text-secondary-text">Đã phân tích: {totalAnalyzed}</p>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
            <Activity size={20} />
          </div>
        </div>

        {/* KPI 2: CSAT */}
        <div className="apple-card p-5 rounded-2xl flex items-center justify-between border-t-2 border-emerald-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Độ hài lòng (CSAT)</span>
            <h3 className="text-3xl font-black text-primary-text">{csatScore}%</h3>
            <p className="text-[11px] text-secondary-text">TB: {avgRating.toFixed(1)} / 5 ★</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
            <Smile size={20} />
          </div>
        </div>

        {/* KPI 3: Negative Rate */}
        <div className="apple-card p-5 rounded-2xl flex items-center justify-between border-t-2 border-rose-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Tỷ lệ phàn nàn</span>
            <h3 className="text-3xl font-black text-rose-500">{negPercent}%</h3>
            <p className="text-[11px] text-secondary-text">Tổng: {negativeCount} tiêu cực</p>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500">
            <Frown size={20} />
          </div>
        </div>

        {/* KPI 4: High Priority Count */}
        <div className="apple-card p-5 rounded-2xl flex items-center justify-between border-t-2 border-amber-500">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Vấn đề khẩn cấp</span>
            <h3 className="text-3xl font-black text-amber-500">{highPriorityCount}</h3>
            <p className="text-[11px] text-secondary-text">High / Critical severity</p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Grid: Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="apple-card p-6 rounded-2xl lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-primary-text">Xu Hướng Cảm Xúc Theo Ngày</h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--secondary-text)" />
                <YAxis stroke="var(--secondary-text)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="Tích cực" stroke="#10b981" fillOpacity={1} fill="url(#colorPos)" />
                <Area type="monotone" dataKey="Tiêu cực" stroke="#f43f5e" fillOpacity={1} fill="url(#colorNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Donut */}
        <div className="apple-card p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="font-bold text-sm text-primary-text">Cơ cấu Sắc thái Cảm xúc</h3>
          <div className="flex-1 h-60 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend Overlay */}
            <div className="absolute text-center">
              <span className="text-[10px] text-secondary-text block">Cỡ mẫu</span>
              <span className="text-2xl font-black text-primary-text">{totalAnalyzed}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2 text-xs text-secondary-text pt-2">
            {sentimentData.map((d, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-color/60 pb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span>{d.name}</span>
                </div>
                <span className="font-bold text-primary-text">{d.value} ({d.percent}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Themes Distribution */}
        <div className="apple-card p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-primary-text">Phân Phối Phản Hồi Theo Chủ Đề</h3>
          {themeData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-secondary-text text-xs text-center">
              <span>Không có dữ liệu phân loại chủ đề từ AI.</span>
            </div>
          ) : (
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={themeData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--secondary-text)" />
                  <YAxis dataKey="name" type="category" stroke="var(--secondary-text)" width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#f26f21" radius={[0, 4, 4, 0]}>
                    {themeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Shipping & Delivery' || entry.name === 'Packaging' ? '#f43f5e' : '#f26f21'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Channel Breakdown */}
        <div className="apple-card p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="font-bold text-sm text-primary-text">Cơ cấu Kênh Phân Phối</h3>
          <div className="flex-1 h-64 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Breakdown */}
        <div className="apple-card p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="font-bold text-sm text-primary-text">Cơ cấu Thương Hiệu</h3>
          <div className="flex-1 h-64 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
