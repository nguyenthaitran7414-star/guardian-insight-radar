import { z } from 'zod';

export const BrandEnum = z.enum(['Guardian', 'Hasaki', 'Watsons']);

export const ChannelEnum = z.enum([
  'Shopee',
  'Lazada',
  'TikTok Shop',
  'GrabMart',
  'Customer service',
  'Social media',
  'Guardian online store'
]);

// Schema xác thực dòng CSV thô
export const CSVRowSchema = z.object({
  date: z.string().refine((val) => {
    // Kiểm tra định dạng ngày YYYY-MM-DD hoặc DD/MM/YYYY
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/;
    return dateRegex.test(val.trim());
  }, { message: 'Định dạng ngày phải là YYYY-MM-DD hoặc DD/MM/YYYY' }),
  brand: BrandEnum,
  channel: ChannelEnum,
  rating: z.preprocess((val) => {
    const num = parseInt(String(val).trim(), 10);
    return isNaN(num) ? undefined : num;
  }, z.number().int().min(1).max(5, {
    message: 'Điểm đánh giá phải nằm trong khoảng từ 1 đến 5'
  })),
  review_text: z.string().min(1, { message: 'Nội dung phản hồi không được để trống' })
});

// Schema xác thực dữ liệu dán trực tiếp
export const PasteInputSchema = z.object({
  reviewText: z.string().min(5, { message: 'Nội dung phản hồi phải chứa ít nhất 5 ký tự' }),
  rating: z.number().int().min(1).max(5).default(3),
  channel: ChannelEnum.default('Customer service'),
  brand: BrandEnum.default('Guardian')
});
