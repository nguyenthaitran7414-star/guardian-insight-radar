export interface FeedbackAIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;   // Điểm số cảm xúc từ -1.0 (tiêu cực) đến 1.0 (tích cực)
  theme: string;            // Chủ đề phân tích (chuỗi tự do từ API)
  intent: 'Complaint' | 'Inquiry' | 'Praise' | 'Suggestion';
  painPoints: string[];     // Các điểm đau trích xuất được
  hiddenNeeds: string[];    // Nhu cầu ẩn giấu của khách hàng
  journeyStage?: string;    // Giai đoạn trải nghiệm của khách hàng
  severity?: string;        // Mức độ nghiêm trọng
  possibleRootCause?: string; // Nguyên nhân gốc rễ suy đoán
  confidence?: number;      // Độ tin cậy của AI
  responsibleDepartment?: string; // Phòng ban chịu trách nhiệm
}

export interface CustomerFeedback {
  id: string;               // ID định danh duy nhất
  date: string;             // Định dạng ngày ISO YYYY-MM-DD
  brand: 'Guardian' | 'Hasaki' | 'Watsons';
  channel: 'Shopee' | 'Lazada' | 'TikTok Shop' | 'GrabMart' | 'Customer service' | 'Social media' | 'Guardian online store';
  rating: number;           // Điểm số 1-5
  reviewText: string;       // Văn bản phản hồi tiếng Việt gốc
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysis?: FeedbackAIAnalysis;
  isSimulated?: boolean;
}

export interface RootCauseAnalysisResult {
  issueName: string;
  detectedRootCause: string;
  explanation: string;
  evidenceQuotes: string[];
  recommendedActions: {
    action: string;
    department: 'E-commerce' | 'Marketing' | 'Commercial' | 'Customer Service';
  }[];
}

export interface ExecutiveBriefResult {
  title: string;
  dateGenerated: string;
  markdownContent: string;
}
