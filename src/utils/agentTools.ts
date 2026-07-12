// Bộ công cụ (tools) mà Agent AI có thể tự chủ gọi để điều tra dữ liệu VoC.
// Các tool là hàm thuần túy tính toán trên tập dữ liệu feedback (không gọi LLM).

interface Feedback {
  id: string;
  date: string;
  brand: string;
  channel: string;
  rating: number;
  reviewText: string;
  aiAnalysis?: {
    sentiment?: string;
    theme?: string;
    intent?: string;
    severity?: string;
    painPoints?: string[];
    hiddenNeeds?: string[];
  };
}

// Suy ra sắc thái: ưu tiên kết quả AI, nếu chưa có thì suy từ rating
function sentimentOf(f: Feedback): 'positive' | 'neutral' | 'negative' {
  const s = f.aiAnalysis?.sentiment;
  if (s === 'positive' || s === 'negative' || s === 'neutral') return s;
  if (f.rating >= 4) return 'positive';
  if (f.rating <= 2) return 'negative';
  return 'neutral';
}

function themeOf(f: Feedback): string {
  return f.aiAnalysis?.theme || 'Chưa phân loại';
}

function round(n: number, d = 2): number {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}

// ---- Định nghĩa schema các tool (JSON Schema chuẩn, dùng chung Gemini & Anthropic) ----
export const AGENT_TOOLS = [
  {
    name: 'get_overview_stats',
    description: 'Lấy thống kê tổng quan toàn bộ dữ liệu: tổng số phản hồi, phân bố theo thương hiệu, kênh, sắc thái (tích cực/trung lập/tiêu cực) và điểm đánh giá trung bình. Dùng đầu tiên để nắm bức tranh chung.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_theme_breakdown',
    description: 'Thống kê theo từng chủ đề (theme): số lượng phản hồi, số tiêu cực, tỉ lệ tiêu cực và điểm trung bình. Dùng để biết chủ đề nào đang bị phàn nàn nhiều.',
    input_schema: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Lọc theo thương hiệu (Guardian/Hasaki/Watsons). Bỏ trống = tất cả.' }
      },
      required: []
    }
  },
  {
    name: 'rank_priority_issues',
    description: 'Xếp hạng các chủ đề theo điểm ưu tiên xử lý (điểm = số phản hồi tiêu cực × mức nghiêm trọng). Trả về danh sách vấn đề cần giải quyết trước, kèm điểm số.',
    input_schema: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Lọc theo thương hiệu. Bỏ trống = Guardian.' }
      },
      required: []
    }
  },
  {
    name: 'detect_rising_issues',
    description: 'Phát hiện các chủ đề tiêu cực đang tăng đột biến gần đây (so sánh số phản hồi tiêu cực trong 3 ngày mới nhất với giai đoạn trước đó). Dùng để cảnh báo sớm vấn đề mới nổi.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'compare_brands',
    description: 'So sánh Guardian với đối thủ Hasaki và Watsons: điểm CSAT trung bình, tỉ lệ sắc thái, thị phần thảo luận (share of voice) và các chủ đề tiêu cực nổi bật của từng bên.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'query_feedback',
    description: 'Truy vấn các phản hồi cụ thể theo bộ lọc để lấy dẫn chứng nguyên văn (quotes). Luôn dùng tool này để trích dẫn bằng chứng thật trước khi kết luận.',
    input_schema: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Guardian/Hasaki/Watsons' },
        channel: { type: 'string', description: 'Kênh phân phối, ví dụ Shopee, Lazada...' },
        sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        theme: { type: 'string', description: 'Tên chủ đề, ví dụ "Shipping & Delivery"' },
        keyword: { type: 'string', description: 'Từ khóa xuất hiện trong nội dung phản hồi' },
        maxRating: { type: 'number', description: 'Chỉ lấy phản hồi có rating <= giá trị này' },
        limit: { type: 'number', description: 'Số lượng tối đa trả về (mặc định 6, tối đa 20)' }
      },
      required: []
    }
  }
];

// ---- Bộ thực thi tool ----
export function executeTool(name: string, input: any, feedbacks: Feedback[]): any {
  const args = input || {};
  switch (name) {
    case 'get_overview_stats': {
      const byBrand: Record<string, number> = {};
      const byChannel: Record<string, number> = {};
      const bySentiment = { positive: 0, neutral: 0, negative: 0 };
      let ratingSum = 0;
      for (const f of feedbacks) {
        byBrand[f.brand] = (byBrand[f.brand] || 0) + 1;
        byChannel[f.channel] = (byChannel[f.channel] || 0) + 1;
        bySentiment[sentimentOf(f)]++;
        ratingSum += f.rating;
      }
      const total = feedbacks.length;
      return {
        total,
        avgRating: total ? round(ratingSum / total) : 0,
        byBrand,
        byChannel,
        bySentiment,
        negativePercent: total ? round((bySentiment.negative / total) * 100, 1) : 0
      };
    }

    case 'get_theme_breakdown': {
      const brand = args.brand;
      const pool = brand ? feedbacks.filter(f => f.brand === brand) : feedbacks;
      const map: Record<string, { total: number; negative: number; ratingSum: number }> = {};
      for (const f of pool) {
        const t = themeOf(f);
        if (!map[t]) map[t] = { total: 0, negative: 0, ratingSum: 0 };
        map[t].total++;
        map[t].ratingSum += f.rating;
        if (sentimentOf(f) === 'negative') map[t].negative++;
      }
      const result = Object.entries(map).map(([theme, v]) => ({
        theme,
        total: v.total,
        negative: v.negative,
        negativeRatioPercent: round((v.negative / v.total) * 100, 1),
        avgRating: round(v.ratingSum / v.total)
      }));
      result.sort((a, b) => b.negative - a.negative);
      return { brandFilter: brand || 'Tất cả', themes: result };
    }

    case 'rank_priority_issues': {
      const brand = args.brand || 'Guardian';
      const pool = feedbacks.filter(f => f.brand === brand);
      const map: Record<string, { negatives: Feedback[]; ratingSum: number; total: number }> = {};
      for (const f of pool) {
        const t = themeOf(f);
        if (!map[t]) map[t] = { negatives: [], ratingSum: 0, total: 0 };
        map[t].total++;
        map[t].ratingSum += f.rating;
        if (sentimentOf(f) === 'negative') map[t].negatives.push(f);
      }
      const ranked = Object.entries(map)
        .map(([theme, v]) => {
          const negCount = v.negatives.length;
          const avgRating = round(v.ratingSum / v.total);
          // Mức nghiêm trọng: điểm càng thấp càng nặng (thang hệ số 1-3)
          const severityFactor = avgRating <= 1.8 ? 3 : avgRating <= 2.5 ? 2 : 1;
          const priorityScore = negCount * severityFactor * 10;
          return { theme, priorityScore, negativeCount: negCount, avgRating, severityFactor };
        })
        .filter(x => x.negativeCount > 0)
        .sort((a, b) => b.priorityScore - a.priorityScore);
      return { brand, ranked };
    }

    case 'detect_rising_issues': {
      const dated = feedbacks
        .filter(f => sentimentOf(f) === 'negative')
        .map(f => ({ theme: themeOf(f), date: f.date }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (dated.length === 0) return { rising: [], note: 'Không có phản hồi tiêu cực.' };
      const allDates = feedbacks.map(f => f.date).sort();
      const latest = allDates[allDates.length - 1];
      const latestTime = new Date(latest).getTime();
      const recentCutoff = latestTime - 3 * 24 * 3600 * 1000;
      const recent: Record<string, number> = {};
      const earlier: Record<string, number> = {};
      for (const d of dated) {
        const t = new Date(d.date).getTime();
        if (t >= recentCutoff) recent[d.theme] = (recent[d.theme] || 0) + 1;
        else earlier[d.theme] = (earlier[d.theme] || 0) + 1;
      }
      const themes = new Set([...Object.keys(recent), ...Object.keys(earlier)]);
      const rising = [...themes]
        .map(theme => ({
          theme,
          recentNegatives: recent[theme] || 0,
          earlierNegatives: earlier[theme] || 0,
          isRising: (recent[theme] || 0) > (earlier[theme] || 0)
        }))
        .sort((a, b) => b.recentNegatives - a.recentNegatives);
      return { windowDays: 3, latestDate: latest, rising };
    }

    case 'compare_brands': {
      const brands = ['Guardian', 'Hasaki', 'Watsons'];
      const total = feedbacks.length || 1;
      const result = brands.map(brand => {
        const pool = feedbacks.filter(f => f.brand === brand);
        const n = pool.length;
        const sent = { positive: 0, neutral: 0, negative: 0 };
        let ratingSum = 0;
        const negThemes: Record<string, number> = {};
        for (const f of pool) {
          sent[sentimentOf(f)]++;
          ratingSum += f.rating;
          if (sentimentOf(f) === 'negative') {
            const t = themeOf(f);
            negThemes[t] = (negThemes[t] || 0) + 1;
          }
        }
        const topNegThemes = Object.entries(negThemes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([t, c]) => `${t} (${c})`);
        return {
          brand,
          count: n,
          csat: n ? round(ratingSum / n) : 0,
          positivePercent: n ? round((sent.positive / n) * 100, 1) : 0,
          negativePercent: n ? round((sent.negative / n) * 100, 1) : 0,
          shareOfVoicePercent: round((n / total) * 100, 1),
          topNegativeThemes: topNegThemes
        };
      });
      return { brands: result };
    }

    case 'query_feedback': {
      let pool = feedbacks.slice();
      if (args.brand) pool = pool.filter(f => f.brand === args.brand);
      if (args.channel) pool = pool.filter(f => f.channel === args.channel);
      if (args.theme) pool = pool.filter(f => themeOf(f).toLowerCase().includes(String(args.theme).toLowerCase()));
      if (args.sentiment) pool = pool.filter(f => sentimentOf(f) === args.sentiment);
      if (typeof args.maxRating === 'number') pool = pool.filter(f => f.rating <= args.maxRating);
      if (args.keyword) {
        const kw = String(args.keyword).toLowerCase();
        pool = pool.filter(f => f.reviewText.toLowerCase().includes(kw));
      }
      const limit = Math.min(Math.max(Number(args.limit) || 6, 1), 20);
      const items = pool.slice(0, limit).map(f => ({
        id: f.id,
        brand: f.brand,
        channel: f.channel,
        date: f.date,
        rating: f.rating,
        sentiment: sentimentOf(f),
        theme: themeOf(f),
        text: f.reviewText
      }));
      return { matched: pool.length, returned: items.length, items };
    }

    default:
      return { error: `Tool không tồn tại: ${name}` };
  }
}
