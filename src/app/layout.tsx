'use client';

import React, { useState, useEffect } from 'react';
import { DataProvider, useData, AI_KEY_STORAGE } from '../context/DataContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';
import ApiKeyModal from '../components/ApiKeyModal';
import {
  DatabaseBackup,
  BarChart3,
  Radar,
  SearchCode,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  Sun,
  Moon,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  KeyRound,
  Bot
} from 'lucide-react';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { feedbacks } = useData();

  const [isDark, setIsDark] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Đọc trạng thái đã cấu hình API Key hay chưa
  const refreshApiKeyStatus = () => {
    const key = localStorage.getItem(AI_KEY_STORAGE);
    setHasApiKey(!!(key && key.trim()));
  };

  // Khởi tạo theme từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('guardian_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Tự động thu gọn sidebar trên màn hình nhỏ hơn 1024px (Tablet)
    if (window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }

    refreshApiKeyStatus();
  }, []);

  // Chuyển đổi theme
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('guardian_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('guardian_theme', 'light');
    }
  };

  const menuItems = [
    { name: 'Nhập dữ liệu', path: '/import', icon: DatabaseBackup },
    { name: 'Trợ lý AI', path: '/agent', icon: Bot },
    { name: 'Tổng quan', path: '/dashboard', icon: BarChart3 },
    { name: 'Radar Vấn đề', path: '/radar', icon: Radar },
    { name: 'Phân tích Root Cause', path: '/root-cause', icon: SearchCode },
    { name: 'So sánh Đối thủ', path: '/benchmark', icon: ArrowLeftRight },
    { name: 'Báo cáo Điều hành', path: '/brief', icon: FileText },
  ];

  // Tính toán trạng thái dữ liệu hiện tại
  const totalCount = feedbacks.length;
  const isDemoMode = feedbacks.some(f => f.isSimulated);
  const pendingCount = feedbacks.filter(f => f.analysisStatus === 'pending' || f.analysisStatus === 'failed').length;

  return (
    <body className="bg-page-bg text-primary-text min-h-screen flex overflow-hidden selection:bg-accent-soft selection:text-accent-color transition-apple">
      {/* Sidebar cho Desktop / Tablet */}
      <aside 
        className={`hidden md:flex flex-col justify-between border-r border-border-color bg-solid-surface transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } shrink-0 z-20`}
      >
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className={`p-5 border-b border-border-color flex items-center justify-between`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="bg-accent-color p-2 rounded-xl text-white shadow-md shrink-0">
                <ShieldAlert size={18} />
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate animate-fadeIn">
                  <h1 className="font-bold text-xs tracking-wider uppercase text-primary-text leading-none">Guardian</h1>
                  <span className="text-[10px] text-accent-color font-semibold tracking-widest block mt-0.5">INSIGHT RADAR</span>
                </div>
              )}
            </div>

            {/* Collapse Sidebar Button */}
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-page-bg text-secondary-text hover:text-primary-text transition-apple shrink-0"
                title="Thu gọn menu"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (pathname === '/' && item.path === '/import');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-apple group relative ${
                    isActive
                      ? 'bg-accent-soft text-accent-color font-semibold'
                      : 'text-secondary-text hover:bg-page-bg hover:text-primary-text'
                  }`}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-accent-color' : 'text-secondary-text group-hover:text-primary-text'}`} />
                  
                  {!isSidebarCollapsed && (
                    <span className="text-xs tracking-wide animate-fadeIn">{item.name}</span>
                  )}

                  {/* Collapsed Indicator dot */}
                  {isSidebarCollapsed && isActive && (
                    <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-accent-color"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-color space-y-3">
          {isSidebarCollapsed ? (
            <div className="flex justify-center">
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 rounded-xl bg-page-bg hover:bg-accent-soft text-secondary-text hover:text-accent-color transition-apple"
                title="Mở rộng menu"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-page-bg p-3.5 rounded-2xl border border-border-color animate-fadeIn">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary-text block">Trạng thái dữ liệu</span>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-secondary-text">
                  <span>Tổng số nạp:</span>
                  <strong className="text-primary-text">{totalCount}</strong>
                </div>
                <div className="flex items-center justify-between text-secondary-text">
                  <span>Chế độ:</span>
                  {isDemoMode ? (
                    <span className="text-orange-500 font-semibold">Giả lập</span>
                  ) : (
                    <span className="text-emerald-500 font-semibold">Live VoC</span>
                  )}
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center space-x-1 text-amber-500 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>{pendingCount} chờ xử lý</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* transcluent Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border-color bg-main-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-bold tracking-tight text-primary-text capitalize">
              {menuItems.find(m => m.path === pathname)?.name || 'Insight Radar'}
            </h2>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 bg-border-color text-secondary-text rounded-full uppercase tracking-wider">
              Hackathon MVP
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* API Key Config Button */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center space-x-1.5 pl-2 pr-2.5 py-2 rounded-xl hover:bg-border-color text-secondary-text hover:text-primary-text transition-apple"
              title="Cấu hình AI API Key (Gemini / Claude)"
            >
              <span className="relative">
                <KeyRound size={16} />
                <span
                  className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-main-surface ${
                    hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">
                {hasApiKey ? 'AI Thật' : 'Dự phòng'}
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-border-color text-secondary-text hover:text-primary-text transition-apple"
              title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-xl hover:bg-border-color text-secondary-text hover:text-primary-text transition-apple"
              title="Hướng dẫn sử dụng"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative">
          <div className="max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation (Chỉ hiện thị trên Điện thoại) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-solid-surface/90 backdrop-blur-md border-t border-border-color z-40 flex items-center justify-around px-2 pb-safe">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (pathname === '/' && item.path === '/import');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] transition-apple ${
                  isActive
                    ? 'text-accent-color font-semibold'
                    : 'text-secondary-text'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-accent-color' : 'text-secondary-text'} />
                <span className="mt-1 scale-90 truncate max-w-[60px]">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* API Key Config Modal */}
      <ApiKeyModal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={refreshApiKeyStatus}
      />

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="apple-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-border-color text-secondary-text hover:text-primary-text transition-apple"
            >
              <X size={16} />
            </button>

            <div className="flex items-center space-x-3 text-accent-color">
              <Info size={22} />
              <h3 className="font-bold text-base text-primary-text">Guardian Insight Radar</h3>
            </div>

            <div className="text-xs text-secondary-text space-y-2.5 leading-relaxed">
              <p>
                <strong>Bản mẫu Hackathon MVP:</strong> Đây là công cụ thu thập ý kiến khách hàng (Voice of Customer), giúp ban quản trị Guardian tổng hợp và phân loại phản hồi đa kênh bằng AI.
              </p>
              <div className="border-t border-border-color my-3 pt-3 space-y-1.5">
                <p>• <strong>Nhập dữ liệu:</strong> Dán nhận xét đơn lẻ hoặc kéo thả tệp CSV phản hồi.</p>
                <p>• <strong>Tổng quan:</strong> Xem CSAT, tỷ lệ tiêu cực, cơ cấu kênh bán và chủ đề lỗi.</p>
                <p>• <strong>Radar sự cố:</strong> Tự động xếp hạng ưu tiên xử lý khiếu nại của khách hàng.</p>
                <p>• <strong>Phân tích Root Cause:</strong> Phân tích chuỗi 5 Whys và đề xuất hành động.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-accent-color hover:bg-accent-hover text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-apple"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </body>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <DataProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </DataProvider>
    </html>
  );
}
