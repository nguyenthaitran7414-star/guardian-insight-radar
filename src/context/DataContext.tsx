'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerFeedback, FeedbackAIAnalysis } from '../types';
import { demoFeedbacks } from '../data/demoData';
import { CSVRowSchema } from '../utils/schemas';
import Papa from 'papaparse';

interface DataContextType {
  feedbacks: CustomerFeedback[];
  isLoading: boolean;
  isAnalyzing: boolean;
  analysisStep: string;
  analysisError: string | null;
  loadDemoData: () => void;
  importCSV: (csvString: string) => { successCount: number; errorMessages: string[] };
  pasteReview: (reviewText: string, rating: number, channel: any, brand: any) => Promise<CustomerFeedback>;
  clearData: () => void;
  runBatchAIAnalysis: () => Promise<void>;
  runSingleRCA: (issueName: string, selectedFeedbacks: CustomerFeedback[]) => Promise<any>;
  generateExecutiveBrief: () => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Khôi phục từ LocalStorage khi khởi tạo
  useEffect(() => {
    const saved = localStorage.getItem('guardian_voc_data');
    if (saved) {
      try {
        setFeedbacks(JSON.parse(saved));
      } catch (e) {
        console.error('Lỗi load LocalStorage:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Lưu vào LocalStorage khi feedbacks thay đổi
  const saveToStorage = (data: CustomerFeedback[]) => {
    setFeedbacks(data);
    localStorage.setItem('guardian_voc_data', JSON.stringify(data));
  };

  // Nạp dữ liệu giả lập
  const loadDemoData = () => {
    const simulated = demoFeedbacks.map(f => ({ ...f, isSimulated: true }));
    saveToStorage(simulated);
  };

  // Xóa toàn bộ dữ liệu
  const clearData = () => {
    saveToStorage([]);
    localStorage.removeItem('guardian_voc_data');
  };

  // Nhập dữ liệu từ CSV
  const importCSV = (csvString: string) => {
    const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    const successCount: number[] = [];
    const errorMessages: string[] = [];

    const newFeedbacks: CustomerFeedback[] = [];

    parsed.data.forEach((row: any, index: number) => {
      const lineNum = index + 2; // +1 cho header, +1 vì index 0-based
      const validated = CSVRowSchema.safeParse(row);

      if (validated.success) {
        const data = validated.data;
        // Chuyển date từ DD/MM/YYYY sang YYYY-MM-DD nếu cần
        let dateVal = data.date;
        if (dateVal.includes('/')) {
          const parts = dateVal.split('/');
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          dateVal = `${year}-${month}-${day}`;
        }

        newFeedbacks.push({
          id: `voc-csv-${Math.random().toString(36).substring(2, 11)}`,
          date: dateVal,
          brand: data.brand,
          channel: data.channel,
          rating: data.rating,
          reviewText: data.review_text,
          analysisStatus: 'pending'
        });
      } else {
        const errorMsg = validated.error.issues.map(e => e.message).join(', ');
        errorMessages.push(`Dòng ${lineNum}: ${errorMsg}`);
      }
    });

    if (newFeedbacks.length > 0) {
      saveToStorage([...feedbacks, ...newFeedbacks]);
    }

    return {
      successCount: newFeedbacks.length,
      errorMessages
    };
  };

  // Dán đánh giá trực tiếp
  const pasteReview = async (
    reviewText: string,
    rating: number,
    channel: any,
    brand: any
  ): Promise<CustomerFeedback> => {
    const newFeedback: CustomerFeedback = {
      id: `voc-paste-${Math.random().toString(36).substring(2, 11)}`,
      date: new Date().toISOString().split('T')[0],
      brand,
      channel,
      rating,
      reviewText,
      analysisStatus: 'pending'
    };

    const updatedFeedbacks = [newFeedback, ...feedbacks];
    saveToStorage(updatedFeedbacks);

    // Tự động phân tích phản hồi vừa dán qua Gemini API
    try {
      const res = await fetch('/api/analyze/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbacks: [newFeedback] })
      });

      if (!res.ok) throw new Error('API analyze error');
      const data = await res.json();
      const analysis: FeedbackAIAnalysis = data.analyses?.[0];

      if (analysis) {
        const finalizedFeedbacks = updatedFeedbacks.map(f => 
          f.id === newFeedback.id 
            ? { ...f, analysisStatus: 'completed' as const, aiAnalysis: analysis }
            : f
        );
        saveToStorage(finalizedFeedbacks);
        return finalizedFeedbacks.find(f => f.id === newFeedback.id)!;
      }
    } catch (e) {
      console.error('Lỗi phân tích AI đánh giá vừa dán:', e);
      const failedFeedbacks = updatedFeedbacks.map(f => 
        f.id === newFeedback.id 
          ? { ...f, analysisStatus: 'failed' as const }
          : f
      );
      saveToStorage(failedFeedbacks);
    }

    return newFeedback;
  };

  // Chạy phân tích AI hàng loạt cho các đánh giá chưa thành công
  const runBatchAIAnalysis = async () => {
    if (isAnalyzing) return;

    const itemsToAnalyze = feedbacks.filter(f => f.analysisStatus === 'pending' || f.analysisStatus === 'failed');
    if (itemsToAnalyze.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStep('Đang kiểm tra dữ liệu');

    // Cài đặt chuyển đổi loading message sau mỗi 2 giây
    const loadingSteps = [
      'Đang kiểm tra dữ liệu',
      'Đang phân tích cảm xúc',
      'Đang phân loại chủ đề và ý định',
      'Đang tổng hợp kết quả'
    ];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % loadingSteps.length;
      setAnalysisStep(loadingSteps[stepIdx]);
    }, 2000);

    // Đánh dấu sang trạng thái processing
    const processingFeedbacks = feedbacks.map(f => 
      (f.analysisStatus === 'pending' || f.analysisStatus === 'failed') ? { ...f, analysisStatus: 'processing' as const } : f
    );
    setFeedbacks(processingFeedbacks);

    try {
      // Chuẩn hóa cấu trúc dữ liệu gửi lên API POST /api/analyze
      const normalizedPayload = {
        feedback: itemsToAnalyze.map(f => ({
          id: f.id,
          brand: f.brand,
          channel: f.channel,
          date: f.date,
          rating: f.rating,
          content: f.reviewText,
          category: f.aiAnalysis?.theme || '',
          product: '',
          sourceType: f.channel === 'Customer service' ? 'chat' as const : (f.channel === 'Social media' ? 'comment' as const : 'review' as const),
          isSimulated: false
        }))
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedPayload)
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const results = data.results || [];

      // Cập nhật feedbacks state với kết quả phân tích nhận được từ API
      const updatedList = feedbacks.map(item => {
        const itemResult = results.find((r: any) => r.id === item.id);
        if (itemResult) {
          const score = itemResult.sentiment === 'positive' 
            ? itemResult.confidence 
            : itemResult.sentiment === 'negative' 
            ? -itemResult.confidence 
            : 0;

          return {
            ...item,
            analysisStatus: 'completed' as const,
            aiAnalysis: {
              sentiment: itemResult.sentiment,
              sentimentScore: score,
              theme: itemResult.theme,
              intent: itemResult.intent,
              painPoints: [itemResult.painPoint],
              hiddenNeeds: [itemResult.hiddenNeed],
              journeyStage: itemResult.journeyStage,
              severity: itemResult.severity,
              possibleRootCause: itemResult.possibleRootCause,
              confidence: itemResult.confidence,
              responsibleDepartment: itemResult.responsibleDepartment
            }
          };
        }
        
        if (item.analysisStatus === 'pending' || item.analysisStatus === 'processing' || item.analysisStatus === 'failed') {
          return { ...item, analysisStatus: 'failed' as const };
        }
        return item;
      });

      // Lưu kết quả vào Application State và LocalStorage
      saveToStorage(updatedList);
      setAnalysisStep('');
    } catch (e: any) {
      clearInterval(stepInterval);
      console.error('Lỗi chạy phân tích hàng loạt:', e);
      
      // Khôi phục các item đang xử lý sang trạng thái failed để giữ nguyên input và cho phép thử lại
      const rolledBack = feedbacks.map(f => 
        (f.analysisStatus === 'processing' || f.analysisStatus === 'pending') ? { ...f, analysisStatus: 'failed' as const } : f
      );
      setFeedbacks(rolledBack);

      setAnalysisError(e.message || 'Không thể kết nối đến máy chủ phân tích hoặc API Key chưa được cấu hình.');
      setAnalysisStep('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Gửi yêu cầu phân tích nguyên nhân gốc rễ (RCA) lên Server
  const runSingleRCA = async (issueName: string, selectedFeedbacks: CustomerFeedback[]) => {
    try {
      const res = await fetch('/api/analyze/root-cause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueName,
          feedbacks: selectedFeedbacks.map(f => ({ reviewText: f.reviewText }))
        })
      });

      if (!res.ok) throw new Error('Lỗi gọi RCA API');
      return await res.json();
    } catch (e) {
      console.error('Lỗi RCA:', e);
      throw e;
    }
  };

  // Gửi yêu cầu tạo Báo cáo điều hành cấp cao
  const generateExecutiveBrief = async () => {
    // Thu thập một số metrics cơ bản để gửi lên làm ngữ cảnh cho AI
    const totalCount = feedbacks.length;
    const analyzed = feedbacks.filter(f => f.analysisStatus === 'completed');
    const positive = analyzed.filter(f => f.aiAnalysis?.sentiment === 'positive').length;
    const negative = analyzed.filter(f => f.aiAnalysis?.sentiment === 'negative').length;
    const neutral = analyzed.filter(f => f.aiAnalysis?.sentiment === 'neutral').length;

    // Phân tích đối thủ benchmark cơ bản
    const guardianAvg = feedbacks.filter(f => f.brand === 'Guardian').reduce((acc, f) => acc + f.rating, 0) / (feedbacks.filter(f => f.brand === 'Guardian').length || 1);
    const hasakiAvg = feedbacks.filter(f => f.brand === 'Hasaki').reduce((acc, f) => acc + f.rating, 0) / (feedbacks.filter(f => f.brand === 'Hasaki').length || 1);
    const watsonsAvg = feedbacks.filter(f => f.brand === 'Watsons').reduce((acc, f) => acc + f.rating, 0) / (feedbacks.filter(f => f.brand === 'Watsons').length || 1);

    const payload = {
      aggregatedMetrics: {
        totalFeedbacks: totalCount,
        positivePercentage: Math.round((positive / (analyzed.length || 1)) * 100),
        negativePercentage: Math.round((negative / (analyzed.length || 1)) * 100),
        neutralPercentage: Math.round((neutral / (analyzed.length || 1)) * 100),
        topIssues: Array.from(new Set(analyzed.filter(f => f.aiAnalysis?.sentiment === 'negative' && f.aiAnalysis.theme).map(f => f.aiAnalysis!.theme))).slice(0, 3)
      },
      competitorComparison: `Điểm CSAT trung bình: Guardian là ${guardianAvg.toFixed(1)}/5, Hasaki là ${hasakiAvg.toFixed(1)}/5, Watsons là ${watsonsAvg.toFixed(1)}/5.`
    };

    try {
      const res = await fetch('/api/analyze/executive-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Lỗi gọi Executive Brief API');
      return await res.json();
    } catch (e) {
      console.error('Lỗi sinh báo cáo:', e);
      throw e;
    }
  };

  return (
    <DataContext.Provider value={{
      feedbacks,
      isLoading,
      isAnalyzing,
      analysisStep,
      analysisError,
      loadDemoData,
      importCSV,
      pasteReview,
      clearData,
      runBatchAIAnalysis,
      runSingleRCA,
      generateExecutiveBrief
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
