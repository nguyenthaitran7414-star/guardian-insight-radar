'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Upload, 
  Clipboard, 
  Trash2, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';

export default function ImportPage() {
  const { 
    feedbacks, 
    isLoading, 
    isAnalyzing, 
    analysisStep,
    analysisError,
    loadDemoData, 
    importCSV, 
    pasteReview, 
    clearData,
    runBatchAIAnalysis 
  } = useData();

  // Tab State
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');

  // Manual Entry States
  const [pastedText, setPastedText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<'Guardian' | 'Hasaki' | 'Watsons'>('Guardian');
  const [selectedChannel, setSelectedChannel] = useState<'Shopee' | 'Lazada' | 'TikTok Shop' | 'GrabMart' | 'Customer service' | 'Social media' | 'Guardian online store'>('Customer service');
  const [selectedRating, setSelectedRating] = useState<number>(3);
  
  // CSV States
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvSuccess, setCsvSuccess] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Entry Action States
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  // Scroll Indicators States
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Lắng nghe cuộn để cập nhật các nút cuộn và thanh tiến trình
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (!mainElement) return;

      const scrollTop = mainElement.scrollTop;
      const scrollHeight = mainElement.scrollHeight;
      const clientHeight = mainElement.clientHeight;

      // Tính phần trăm tiến trình cuộn
      const progress = scrollHeight > clientHeight 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 
        : 0;
      setScrollProgress(progress);

      // Hiển thị/Ẩn nút dựa trên vị trí cuộn
      setShowScrollTop(scrollTop > 150);
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 150);
    };

    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      // Gọi kiểm tra ban đầu
      handleScroll();
    }
    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [feedbacks]);

  const scrollToTop = () => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: mainElement.scrollHeight, behavior: 'smooth' });
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setIsPasting(true);
    try {
      await pasteReview(pastedText, selectedRating, selectedChannel, selectedBrand);
      setPastedText('');
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPasting(false);
    }
  };

  // Kéo thả tệp CSV
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processCsvFile(file);
    } else {
      setCsvErrors(['Định dạng tệp không hợp lệ. Vui lòng tải lên tệp tin dạng .csv']);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCsvFile(file);
  };

  const processCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = importCSV(text);
      setCsvErrors(result.errorMessages);
      setCsvSuccess(result.successCount);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setCsvSuccess(null), 4000);
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,date,brand,channel,rating,review_text\n2026-07-11,Guardian,Shopee,2,Giao hang cham tre qua bop meo het hop giay\n2026-07-10,Hasaki,Lazada,5,Gia re dong goi rat dep ship nhanh\n2026-07-09,Watsons,Customer service,1,Nhan vien ho tro cham chap khong tra loi";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_feedback.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = feedbacks.filter(f => f.analysisStatus === 'pending' || f.analysisStatus === 'failed').length;
  const isDemoMode = feedbacks.some(f => f.isSimulated);

  // Xác định lý do nút phân tích bị khóa
  const getDisabledReason = () => {
    if (isAnalyzing) return 'Đang trong tiến trình phân tích dữ liệu AI...';
    if (pendingCount === 0) return 'Không có dữ liệu phản hồi mới cần phân tích.';
    return '';
  };

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Scroll Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-[2px] bg-border-color z-30">
        <div 
          className="h-full bg-accent-color transition-apple" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">Nhập Dữ Liệu Khách Hàng</h2>
          <p className="text-xs text-secondary-text">
            Nạp các đánh giá, khiếu nại của người dùng từ nhiều nguồn để tiến hành phân tích sắc thái cảm xúc và nguyên nhân gốc rễ.
          </p>
        </div>
      </div>

      {/* Segmented Tabs (Apple style) */}
      <div className="flex p-1 bg-border-color/30 rounded-xl w-full sm:w-max">
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex-1 sm:flex-initial px-6 py-2 rounded-lg text-xs font-semibold transition-apple flex items-center justify-center space-x-2 ${
            activeTab === 'csv'
              ? 'bg-solid-surface text-primary-text shadow-sm'
              : 'text-secondary-text hover:text-primary-text'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>Tải file CSV</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 sm:flex-initial px-6 py-2 rounded-lg text-xs font-semibold transition-apple flex items-center justify-center space-x-2 ${
            activeTab === 'manual'
              ? 'bg-solid-surface text-primary-text shadow-sm'
              : 'text-secondary-text hover:text-primary-text'
          }`}
        >
          <Clipboard size={14} />
          <span>Dán phản hồi trực tiếp</span>
        </button>
      </div>

      {/* Tab Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'csv' ? (
            /* CSV Tab Workspace */
            <div className="apple-card rounded-2xl p-6 space-y-5">
              <div className="flex items-center space-x-3 text-accent-color">
                <FileSpreadsheet size={20} />
                <h3 className="font-bold text-sm text-primary-text">Nhập dữ liệu qua file CSV</h3>
              </div>
              <p className="text-xs text-secondary-text leading-relaxed">
                Tải lên bảng dữ liệu chứa danh sách đánh giá của khách hàng. Định dạng tệp tin yêu cầu phải chứa các cột tiêu đề tiêu chuẩn.
              </p>
              
              <button 
                onClick={downloadSampleCSV}
                className="text-xs text-accent-color hover:text-accent-hover font-semibold underline block transition-apple"
              >
                Tải xuống tệp CSV mẫu (.csv)
              </button>

              {/* Drag and Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-apple ${
                  isDragOver
                    ? 'border-accent-color bg-accent-soft'
                    : 'border-border-color hover:border-accent-color/50 hover:bg-solid-surface'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleCsvUpload} 
                  accept=".csv" 
                  className="hidden" 
                />
                <Upload className="text-secondary-text mb-3" size={28} />
                <span className="text-xs font-semibold text-primary-text text-center">Kéo thả tệp CSV vào đây hoặc click để chọn</span>
                <span className="text-[10px] text-secondary-text mt-1">Chấp nhận tệp .csv định dạng UTF-8</span>
              </div>

              {/* Validation Messages for CSV */}
              <div className="space-y-3">
                {csvSuccess !== null && csvSuccess > 0 && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center space-x-2.5 text-xs animate-fadeIn">
                    <CheckCircle size={15} />
                    <span>Đã nạp thành công **{csvSuccess}** phản hồi hợp lệ vào hàng chờ!</span>
                  </div>
                )}
                {csvErrors.length > 0 && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl space-y-1.5 text-xs max-h-36 overflow-y-auto animate-fadeIn">
                    <div className="flex items-center space-x-1.5 font-bold text-rose-500">
                      <AlertCircle size={15} />
                      <span>Phát hiện {csvErrors.length} lỗi định dạng:</span>
                    </div>
                    {csvErrors.slice(0, 3).map((err, i) => (
                      <p key={i} className="text-secondary-text">• {err}</p>
                    ))}
                    {csvErrors.length > 3 && <p className="text-[10px] text-secondary-text pl-4">... và {csvErrors.length - 3} dòng lỗi khác.</p>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Manual Entry Workspace */
            <div className="apple-card rounded-2xl p-6">
              <form onSubmit={handlePasteSubmit} className="space-y-5">
                <div className="flex items-center justify-between text-accent-color">
                  <div className="flex items-center space-x-3">
                    <Clipboard size={20} />
                    <h3 className="font-bold text-sm text-primary-text">Dán đánh giá thủ công</h3>
                  </div>
                  {pasteSuccess && (
                    <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center space-x-1.5 animate-pulse font-semibold">
                      <CheckCircle size={10} />
                      <span>Đã nạp xong!</span>
                    </span>
                  )}
                </div>

                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung ý kiến của khách hàng tại đây..."
                  className="w-full h-28 bg-page-bg border border-border-color rounded-2xl p-3.5 text-xs text-primary-text placeholder-secondary-text focus:outline-none focus:border-accent-color focus:ring-1 focus:ring-accent-color transition-apple resize-none leading-relaxed"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Brand Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-1.5">Thương hiệu</label>
                    <select
                      value={selectedBrand}
                      onChange={(e: any) => setSelectedBrand(e.target.value)}
                      className="w-full bg-page-bg border border-border-color rounded-xl px-3 py-2.5 text-xs text-primary-text focus:outline-none focus:border-accent-color"
                    >
                      <option value="Guardian">Guardian</option>
                      <option value="Hasaki">Hasaki</option>
                      <option value="Watsons">Watsons</option>
                    </select>
                  </div>

                  {/* Channel Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-1.5">Kênh phân phối</label>
                    <select
                      value={selectedChannel}
                      onChange={(e: any) => setSelectedChannel(e.target.value)}
                      className="w-full bg-page-bg border border-border-color rounded-xl px-3 py-2.5 text-xs text-primary-text focus:outline-none focus:border-accent-color"
                    >
                      <option value="Shopee">Shopee</option>
                      <option value="Lazada">Lazada</option>
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="GrabMart">GrabMart</option>
                      <option value="Customer service">Chăm sóc khách hàng</option>
                      <option value="Social media">Mạng xã hội</option>
                      <option value="Guardian online store">Cửa hàng trực tuyến</option>
                    </select>
                  </div>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-1.5">Đánh giá (Sao)</label>
                    <select
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(Number(e.target.value))}
                      className="w-full bg-page-bg border border-border-color rounded-xl px-3 py-2.5 text-xs text-primary-text focus:outline-none focus:border-accent-color"
                    >
                      <option value="5">5 Sao (Rất tốt)</option>
                      <option value="4">4 Sao (Tốt)</option>
                      <option value="3">3 Sao (Bình thường)</option>
                      <option value="2">2 Sao (Kém)</option>
                      <option value="1">1 Sao (Tệ)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isPasting || !pastedText.trim()}
                    className="bg-accent-color hover:bg-accent-hover disabled:bg-border-color disabled:text-secondary-text font-bold px-6 py-2.5 rounded-xl text-white text-xs transition-apple flex items-center space-x-2 shadow-sm"
                  >
                    {isPasting ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Thêm vào phiên phân tích</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Demo Data secondary panel (Apple style sidebar card) */}
        <div className="apple-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-primary-text font-bold text-sm">
            <Info size={16} className="text-accent-color" />
            <span>Chế độ trình diễn</span>
          </div>
          <p className="text-[11px] text-secondary-text leading-relaxed">
            Sử dụng tệp dữ liệu giả lập mẫu chứa các trường hợp khách hàng phản hồi đa chiều để kiểm thử nhanh toàn bộ giao diện điều hành.
          </p>

          <div className="text-xs uppercase font-bold tracking-wider text-secondary-text pb-1 block border-b border-border-color">
            Dữ liệu mô phỏng phục vụ trình diễn
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={loadDemoData}
              className="w-full border border-border-color bg-solid-surface text-primary-text hover:bg-page-bg font-bold px-4 py-2.5 rounded-xl text-xs transition-apple text-center"
            >
              Nạp dữ liệu giả lập (Demo)
            </button>
            {feedbacks.length > 0 && (
              <button
                onClick={clearData}
                className="w-full border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 font-bold px-4 py-2.5 rounded-xl text-xs transition-apple text-center flex items-center justify-center space-x-1.5"
              >
                <Trash2 size={13} />
                <span>Xóa sạch dữ liệu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback List Table (Minimalist style) */}
      <div className="apple-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border-color flex items-center justify-between">
          <h3 className="font-bold text-sm text-primary-text">
            Dữ liệu đã nạp <span className="text-xs font-medium text-secondary-text">({feedbacks.length} phản hồi)</span>
          </h3>
          {isLoading && <span className="text-[10px] text-secondary-text animate-pulse">Đang tải danh sách...</span>}
        </div>

        {feedbacks.length === 0 ? (
          <div className="p-12 text-center text-secondary-text flex flex-col items-center justify-center space-y-3">
            <Upload size={32} className="text-secondary-text/60" />
            <p className="text-xs font-medium">Hàng chờ phản hồi trống</p>
            <p className="text-[11px] text-secondary-text">Hãy chọn nạp dữ liệu giả lập hoặc kéo tệp CSV vào để hiển thị danh sách.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-primary-text">
              <thead className="text-[10px] uppercase font-bold tracking-wider text-secondary-text bg-page-bg/60 border-b border-border-color">
                <tr>
                  <th className="px-6 py-3.5">Thương hiệu</th>
                  <th className="px-6 py-3.5">Kênh</th>
                  <th className="px-6 py-3.5">Ngày</th>
                  <th className="px-6 py-3.5">Đánh giá</th>
                  <th className="px-6 py-3.5">Nội dung phản hồi</th>
                  <th className="px-6 py-3.5">AI Sentiment</th>
                  <th className="px-6 py-3.5">AI Topic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/60">
                {feedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-page-bg/40 transition-apple">
                    <td className="px-6 py-4 font-bold text-primary-text">{item.brand}</td>
                    <td className="px-6 py-4 text-secondary-text">{item.channel}</td>
                    <td className="px-6 py-4 text-secondary-text">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className="text-amber-500 font-bold">{item.rating} ★</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-secondary-text" title={item.reviewText}>
                      {item.reviewText}
                    </td>
                    <td className="px-6 py-4">
                      {item.analysisStatus === 'pending' && (
                        <span className="inline-block text-[10px] px-2 py-0.5 bg-page-bg text-secondary-text rounded-md border border-border-color font-semibold">
                          Chờ xử lý
                        </span>
                      )}
                      {item.analysisStatus === 'processing' && (
                        <span className="inline-block text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md border border-amber-500/20 font-semibold animate-pulse">
                          Đang chạy AI
                        </span>
                      )}
                      {item.analysisStatus === 'failed' && (
                        <span className="inline-block text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md border border-rose-500/20 font-semibold">
                          Thất bại
                        </span>
                      )}
                      {item.analysisStatus === 'completed' && item.aiAnalysis && (
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                          item.aiAnalysis.sentiment === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : item.aiAnalysis.sentiment === 'negative'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-page-bg text-primary-text border-border-color'
                        }`}>
                          {item.aiAnalysis.sentiment === 'positive' ? 'Tích cực' : item.aiAnalysis.sentiment === 'negative' ? 'Tiêu cực' : 'Trung lập'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-secondary-text">
                      {item.aiAnalysis?.theme || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Sticky Floating Action Bar (Apple style capsule) */}
      {pendingCount > 0 && (
        <div className="fixed bottom-[76px] md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-30 apple-glass rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl animate-slideUp border border-accent-color/20">
          <div className="flex items-center space-x-3 text-left">
            <div className="bg-accent-color/10 p-2 rounded-xl text-accent-color shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary-text flex items-center space-x-2">
                <span>Dữ liệu mới chưa phân tích</span>
                {isDemoMode && <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md border border-orange-500/20 font-semibold">Mô phỏng</span>}
              </h4>
              <p className="text-[11px] text-secondary-text mt-0.5">
                Phát hiện **{pendingCount} đánh giá** trong hàng chờ cần chạy mô hình AI để gán thông số.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={clearData}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-initial border border-border-color hover:bg-page-bg disabled:opacity-50 text-primary-text font-semibold px-4 py-2.5 rounded-xl text-xs transition-apple text-center"
            >
              Hủy bỏ
            </button>
            <button
              onClick={runBatchAIAnalysis}
              disabled={isAnalyzing}
              title={getDisabledReason() || undefined}
              className="flex-1 sm:flex-initial bg-accent-color hover:bg-accent-hover disabled:bg-border-color disabled:text-secondary-text font-bold px-6 py-2.5 rounded-xl text-white text-xs transition-apple flex items-center justify-center space-x-2 shadow-md relative group active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span className="truncate max-w-[120px]">{analysisStep || 'Đang xử lý...'}</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Bắt đầu phân tích ({pendingCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Floating Scroll Controls */}
      <div className="fixed right-4 md:right-8 bottom-20 md:bottom-8 z-30 flex flex-col space-y-2">
        <button
          onClick={scrollToTop}
          disabled={!showScrollTop}
          className={`apple-glass p-3 rounded-full text-secondary-text hover:text-primary-text hover:bg-solid-surface transition-apple focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg ${
            showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Cuộn lên đầu trang"
          aria-label="Cuộn lên đầu trang"
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={scrollToBottom}
          disabled={!showScrollBottom}
          className={`apple-glass p-3 rounded-full text-secondary-text hover:text-primary-text hover:bg-solid-surface transition-apple focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg ${
            showScrollBottom ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Cuộn xuống cuối trang"
          aria-label="Cuộn xuống cuối trang"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Error message alert panel */}
      {analysisError && (
        <div className="fixed top-20 right-4 max-w-md w-full p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-start space-x-3 text-xs shadow-xl animate-slideIn z-40">
          <AlertCircle className="shrink-0 mt-0.5 text-rose-500" size={16} />
          <div className="space-y-1">
            <span className="font-bold text-rose-500">Lỗi kết nối AI:</span>
            <p className="text-secondary-text">{analysisError}</p>
            <p className="text-secondary-text/80 mt-1">Vui lòng kiểm tra lại cấu hình API Key và thử lại.</p>
          </div>
        </div>
      )}
    </div>
  );
}
