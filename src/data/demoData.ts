import { CustomerFeedback } from '../types';

export const demoFeedbacks: CustomerFeedback[] = [
  // Guardian - Shipping & Delivery Issues (Megasale)
  {
    id: "g-ship-1",
    date: "2026-07-08",
    brand: "Guardian",
    channel: "Shopee",
    rating: 2,
    reviewText: "Giao hàng siêu chậm luôn. Mình đặt từ ngày Megasale 7/7 mà mãi tới tận hôm nay mới nhận được hàng. Đóng gói thì móp méo hết cả hộp giấy bên ngoài. May mà chai sữa tắm bên trong không bị bể.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.7,
      theme: "Shipping & Delivery",
      intent: "Complaint",
      painPoints: ["Giao hàng chậm trễ", "Hộp bên ngoài bị móp méo"],
      hiddenNeeds: ["Cần giao hàng nhanh hơn trong đợt sale", "Cần đóng gói chống sốc tốt hơn"]
    }
  },
  {
    id: "g-ship-2",
    date: "2026-07-09",
    brand: "Guardian",
    channel: "Shopee",
    rating: 1,
    reviewText: "Đơn hàng hiển thị giao thành công mà mình chưa nhận được gì cả. Gọi hotline shipper thì thuê bao, nhắn tin cho shop trên Shopee thì chỉ nhận được tin nhắn tự động. Làm ăn quá tắc trách!",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.9,
      theme: "Shipping & Delivery",
      intent: "Complaint",
      painPoints: ["Mất đơn hàng", "Không thể liên hệ shipper", "Phản hồi tự động vô ích"],
      hiddenNeeds: ["Hỗ trợ CSKH trực tuyến kịp thời", "Tra cứu đơn hàng minh bạch"]
    }
  },
  {
    id: "g-ship-3",
    date: "2026-07-10",
    brand: "Guardian",
    channel: "Lazada",
    rating: 2,
    reviewText: "Hàng giao trễ 4 ngày so với dự kiến. Mình cần gấp để đi du lịch mà giao chậm làm mình phải ra cửa hàng mua chai khác. Sẽ cân nhắc khi mua online lần sau.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.6,
      theme: "Shipping & Delivery",
      intent: "Complaint",
      painPoints: ["Giao hàng trễ hẹn", "Gây bất tiện cho kế hoạch cá nhân"],
      hiddenNeeds: ["Thời gian giao hàng chính xác", "Lựa chọn giao hàng hỏa tốc"]
    }
  },

  // Guardian - Packaging Issues
  {
    id: "g-pack-1",
    date: "2026-07-07",
    brand: "Guardian",
    channel: "TikTok Shop",
    rating: 2,
    reviewText: "Đóng gói sơ sài quá shop ơi. Chai nước tẩy trang Bioderma chỉ quấn đúng một lớp chống sốc mỏng, lúc nhận hàng nắp bị nứt làm chảy hết 1/3 chai ra hộp. Đề nghị shop bọc kỹ hơn lần sau.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.8,
      theme: "Packaging",
      intent: "Complaint",
      painPoints: ["Đóng gói sơ sài", "Chai nước tẩy trang bị nứt nắp", "Rò rỉ sản phẩm"],
      hiddenNeeds: ["Bọc chống sốc dày hơn", "Gia cố băng keo ở nắp sản phẩm lỏng"]
    }
  },
  {
    id: "g-pack-2",
    date: "2026-07-06",
    brand: "Guardian",
    channel: "Shopee",
    rating: 3,
    reviewText: "Sản phẩm tốt, chính hãng nhưng hộp giấy bị nát hết. Mua làm quà tặng mà nhìn cái hộp chán không buồn nói. Góp ý shop nên đổi đơn vị vận chuyển hoặc đóng hộp carton cứng cáp hơn.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "neutral",
      sentimentScore: -0.2,
      theme: "Packaging",
      intent: "Suggestion",
      painPoints: ["Hộp ngoài bị rách nát", "Không phù hợp làm quà tặng"],
      hiddenNeeds: ["Hộp carton bảo vệ cứng cáp", "Tùy chọn đóng gói quà tặng"]
    }
  },

  // Guardian - Customer Service Issues
  {
    id: "g-cs-1",
    date: "2026-07-09",
    brand: "Guardian",
    channel: "Customer service",
    rating: 1,
    reviewText: "Thái độ của nhân viên tại cửa hàng Guardian Nguyễn Trãi rất tệ. Mình vào hỏi tìm kem chống nắng mà nhân viên đứng nói chuyện riêng, lúc mình hỏi thì chỉ tay qua loa rồi thái độ khó chịu như mình đi xin vậy. Sẽ không quay lại chi nhánh này.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.95,
      theme: "Customer Service",
      intent: "Complaint",
      painPoints: ["Nhân viên thờ ơ nói chuyện riêng", "Thái độ phục vụ thiếu tôn trọng"],
      hiddenNeeds: ["Đào tạo thái độ phục vụ khách hàng", "Nhân viên hỗ trợ tìm kiếm sản phẩm tận tình"]
    }
  },
  {
    id: "g-cs-2",
    date: "2026-07-10",
    brand: "Guardian",
    channel: "Social media",
    rating: 2,
    reviewText: "Nhắn tin trên Fanpage hỏi về chương trình khuyến mãi mua 1 tặng 1 mà admin rep siêu chậm. Chờ nửa ngày mới trả lời thì chương trình đã hết hạn áp dụng online. Quá thất vọng.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.7,
      theme: "Customer Service",
      intent: "Complaint",
      painPoints: ["Phản hồi tin nhắn mạng xã hội chậm", "Lỡ mất khuyến mãi"],
      hiddenNeeds: ["Đội ngũ trực page phản hồi nhanh", "Thông báo rõ thời hạn khuyến mãi"]
    }
  },

  // Guardian - Pricing & Promotion Issues
  {
    id: "g-price-1",
    date: "2026-07-05",
    brand: "Guardian",
    channel: "Guardian online store",
    rating: 3,
    reviewText: "Giá trên web cao hơn ngoài cửa hàng một chút, phí ship lại đắt đỏ nếu không đủ đơn tối thiểu. Voucher giảm giá 50k nhập vào cứ báo lỗi hệ thống không áp dụng được mặc dù đơn mình đã trên 500k.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "neutral",
      sentimentScore: -0.1,
      theme: "Pricing & Promotion",
      intent: "Complaint",
      painPoints: ["Giá web cao hơn cửa hàng", "Phí ship cao", "Lỗi voucher khuyến mãi"],
      hiddenNeeds: ["Đồng bộ giá bán online/offline", "Khắc phục lỗi hệ thống voucher"]
    }
  },
  {
    id: "g-price-2",
    date: "2026-07-08",
    brand: "Guardian",
    channel: "Shopee",
    rating: 3,
    reviewText: "So với bên Hasaki thì giá Guardian đợt này hơi cao nha. Cùng một chai sữa rửa mặt Cerave mà bên Hasaki rẻ hơn 30k lại còn được tặng kèm sample. Guardian nên xem xét lại chính sách giá.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "neutral",
      sentimentScore: -0.3,
      theme: "Pricing & Promotion",
      intent: "Suggestion",
      painPoints: ["Giá đắt hơn Hasaki", "Ít quà tặng kèm (sample)"],
      hiddenNeeds: ["Chương trình quà tặng đi kèm hấp dẫn", "Định giá cạnh tranh hơn"]
    }
  },

  // Guardian - Product Assortment / Out of Stock
  {
    id: "g-stock-1",
    date: "2026-07-04",
    brand: "Guardian",
    channel: "GrabMart",
    rating: 2,
    reviewText: "Đặt mua 5 món trên GrabMart của Guardian mà lát sau nhân viên gọi điện báo hết tận 3 món, bắt mình hủy đơn hoặc đổi sang sản phẩm khác đắt tiền hơn. App cập nhật tồn kho quá kém.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.8,
      theme: "Product Assortment",
      intent: "Complaint",
      painPoints: ["Hết hàng thực tế nhưng vẫn hiển thị trên GrabMart", "Bắt khách hàng tự hủy đơn"],
      hiddenNeeds: ["Đồng bộ tồn kho thời gian thực với các app giao hàng nhanh"]
    }
  },

  // Guardian - Positive Reviews (Praise/Inquiry)
  {
    id: "g-pos-1",
    date: "2026-07-11",
    brand: "Guardian",
    channel: "Guardian online store",
    rating: 5,
    reviewText: "Giao hàng nhanh, đóng gói rất cẩn thận bọc chống sốc nhiều lớp. Mua đợt sale được giá tốt và nhiều quà tặng đi kèm. Rất thích mua mỹ phẩm ở Guardian vì hoàn toàn yên tâm hàng chính hãng.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.95,
      theme: "Product Quality",
      intent: "Praise",
      painPoints: [],
      hiddenNeeds: []
    }
  },
  {
    id: "g-pos-2",
    date: "2026-07-10",
    brand: "Guardian",
    channel: "TikTok Shop",
    rating: 5,
    reviewText: "Sản phẩm xài cực thích luôn, dịu nhẹ cho da mụn nhạy cảm. Nhân viên tư vấn trên livestream rất dễ thương và nhiệt tình giải đáp thắc mắc. Sẽ tiếp tục ủng hộ shop.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.9,
      theme: "Customer Service",
      intent: "Praise",
      painPoints: [],
      hiddenNeeds: []
    }
  },
  {
    id: "g-pos-3",
    date: "2026-07-11",
    brand: "Guardian",
    channel: "Shopee",
    rating: 4,
    reviewText: "Hàng giao nhanh, đầy đủ hóa đơn. Đóng gói chuyên nghiệp. Mình muốn hỏi sản phẩm này dùng chung với Serum Vitamin C được không shop nhỉ?",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.5,
      theme: "Customer Service",
      intent: "Inquiry",
      painPoints: [],
      hiddenNeeds: ["Cần tư vấn chuyên môn về kết hợp mỹ phẩm"]
    }
  },

  // HASAKI - Competitor Data (Mostly positive on shipping/price, complaints about customer service/consultancy)
  {
    id: "h-pos-1",
    date: "2026-07-10",
    brand: "Hasaki",
    channel: "Shopee",
    rating: 5,
    reviewText: "Hasaki giao hàng siêu tốc luôn nha mọi người, đóng gói kỹ lắm bọc bong bóng xốp ngập tràn. Giá cả thì lúc nào cũng rẻ nhất thị trường rồi, mua ở đây yên tâm vì chuỗi lớn.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.95,
      theme: "Shipping & Delivery",
      intent: "Praise",
      painPoints: [],
      hiddenNeeds: []
    }
  },
  {
    id: "h-pos-2",
    date: "2026-07-09",
    brand: "Hasaki",
    channel: "Lazada",
    rating: 5,
    reviewText: "Giá cực kỳ tốt, rẻ hơn các hệ thống khác rất nhiều. Mua đợt sale áp được thêm voucher tích lũy nên siêu hời. Sẽ luôn ủng hộ Hasaki.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.9,
      theme: "Pricing & Promotion",
      intent: "Praise",
      painPoints: [],
      hiddenNeeds: []
    }
  },
  {
    id: "h-neg-1",
    date: "2026-07-08",
    brand: "Hasaki",
    channel: "Customer service",
    rating: 2,
    reviewText: "Bảo vệ giữ xe ở chi nhánh Hasaki CMT8 thái độ rất khó chịu, dắt xe hộ khách mà càu nhàu mặt nặng mày nhẹ. Vào trong cửa hàng thì nhân viên đứng túm tụm lại bấm điện thoại, không ai hướng dẫn khách.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.85,
      theme: "Customer Service",
      intent: "Complaint",
      painPoints: ["Thái độ bảo vệ kém", "Nhân viên bấm điện thoại thờ ơ"],
      hiddenNeeds: ["Quản lý thái độ nhân viên giữ xe", "Tăng cường đào tạo phục vụ tại cửa hàng"]
    }
  },
  {
    id: "h-neg-2",
    date: "2026-07-07",
    brand: "Hasaki",
    channel: "Social media",
    rating: 2,
    reviewText: "Nhân viên tư vấn da ở Hasaki không có chuyên môn gì hết. Da mình đang bị mụn viêm đỏ mà tư vấn cho mình tẩy tế bào chết hóa học nồng độ cao làm về xài mặt bị kích ứng nổi mụn nhiều hơn. Rất bực mình.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.9,
      theme: "Customer Service",
      intent: "Complaint",
      painPoints: ["Tư vấn sai chuyên môn", "Kích ứng da sau khi dùng sản phẩm"],
      hiddenNeeds: ["Đào tạo chuyên môn da liễu cho nhân viên tư vấn"]
    }
  },

  // WATSONS - Competitor Data (Mostly positive on premium store layout/assortment, complaints about high price and slow app/web experience)
  {
    id: "w-pos-1",
    date: "2026-07-11",
    brand: "Watsons",
    channel: "Guardian online store", // using the common schema categories
    rating: 5,
    reviewText: "Cửa hàng Watsons trong trung tâm thương mại trang trí rất sang xịn mịn, nhiều brand mỹ phẩm độc quyền lạ mắt mà mấy bên khác không có. Mua sắm trải nghiệm thoải mái.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.9,
      theme: "Product Assortment",
      intent: "Praise",
      painPoints: [],
      hiddenNeeds: []
    }
  },
  {
    id: "w-neg-1",
    date: "2026-07-09",
    brand: "Watsons",
    channel: "Guardian online store", // representing online web channel
    rating: 2,
    reviewText: "App Watsons lag kinh khủng, load mãi không thanh toán được bằng ví Momo. Voucher sinh nhật gửi vào tài khoản mà thanh toán cứ báo không hợp lệ. Mong dev tối ưu lại app chứ dùng ức chế quá.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "negative",
      sentimentScore: -0.8,
      theme: "App & Web Experience",
      intent: "Complaint",
      painPoints: ["App giật lag", "Lỗi thanh toán Momo", "Lỗi voucher sinh nhật"],
      hiddenNeeds: ["Cải thiện hiệu năng app", "Sửa lỗi tích hợp thanh toán và voucher"]
    }
  },
  {
    id: "w-neg-2",
    date: "2026-07-08",
    brand: "Watsons",
    channel: "Social media",
    rating: 3,
    reviewText: "Sản phẩm chất lượng nhưng Watsons định giá cao quá, ít khi có chương trình sale mạnh tay như Hasaki hay Guardian. Nếu không có mã giảm sâu chắc mình ít khi mua ở đây.",
    analysisStatus: "completed",
    aiAnalysis: {
      sentiment: "neutral",
      sentimentScore: -0.2,
      theme: "Pricing & Promotion",
      intent: "Complaint",
      painPoints: ["Giá bán cao", "Ít chương trình khuyến mãi lớn"],
      hiddenNeeds: ["Chương trình giảm giá sâu thường xuyên hơn"]
    }
  }
];
