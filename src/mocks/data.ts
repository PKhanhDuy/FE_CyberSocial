import type { Post } from "./types"

export const MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    author: {
      id: "u_1",
      username: "Nexus Prime",
      handle: "@nexus_prime",
      avatar: "https://i.pravatar.cc/150?u=nexus_prime",
      isVerified: true,
      trustScore: 98.5,
      bio: "Nhà phân tích dữ liệu quỹ đạo & kiến trúc sư không gian mạng. Khám phá ranh giới của sự lan truyền mạng lưới cấu trúc và ý thức phi tập trung.",
      hometown: "Khu vực 7, Trạm quỹ đạo",
      maritalStatus: "Độc thân",
      gender: "Nam",
      birthday: "15/04/2045",
      language: "Tiếng Việt, Tiếng Anh",
      nationality: "Liên minh Trái Đất",
      school: "Học viện Khoa học Không gian Mạng",
      job: "Kiến trúc sư hệ thống",
      educationLevel: "Tiến sĩ",
      hobbies: ["Phân tích dữ liệu", "Mã hóa", "Trí tuệ nhân tạo"],
      links: ["nexus-prime.network"],
      isOnline: true
    },
    content: "Vừa chứng kiến sự căn chỉnh trạm quỹ đạo khổng lồ. Bầu trời đang phát sáng với những dấu hiệu năng lượng bất ngờ. Khoan đã, đó có phải là một loại động cơ nhiệt hạch mới không? 🚀✨ #OrbitalLife #SpaceTech",
    timestamp: "2 phút trước",
    likes: 1240,
    comments: 89,
    shares: 340,
    aiState: "verified",
    aiAnalysis: {
      riskLevel: "THẤP",
      fakeProbability: 0.02,
      reasons: ["Đã kiểm tra chéo với cơ sở dữ liệu thiên văn công cộng", "Chữ ký phương tiện truyền thông xác thực"],
      propagationVelocity: 1.2
    }
  },
  {
    id: "post_2",
    author: {
      id: "u_2",
      username: "Glitch_Walker",
      handle: "@glitch_walker",
      avatar: "https://i.pravatar.cc/150?u=glitch_walker",
      isVerified: false,
      trustScore: 42.1
    },
    content: "TIN KHẨN: Lõi lượng tử trung tâm đã bị vi phạm. Họ đang tắt lưới điện ở Khu vực 4 ngay lúc này. Tôi có video bằng chứng mà họ không muốn bạn xem!!! ⚠️⚠️⚠️",
    media: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    timestamp: "15 phút trước",
    likes: 8900,
    comments: 1200,
    shares: 5400,
    aiState: "suspicious",
    aiAnalysis: {
      riskLevel: "NGHIÊM TRỌNG",
      fakeProbability: 0.94,
      reasons: [
        "Vận tốc lan truyền bất thường (+400% so với đường cơ sở)",
        "Phát hiện dấu vết Deepfake trong phương tiện truyền thông",
        "Xác định các cụm tương tác bot có phối hợp"
      ],
      propagationVelocity: 45.8
    }
  },
  {
    id: "post_3",
    author: {
      id: "u_3",
      username: "Cipher_Null",
      handle: "@cipher_00",
      avatar: "https://i.pravatar.cc/150?u=cipher_00",
      isVerified: false,
      trustScore: 75.0
    },
    content: "Đang tải lên các chương trình con mới vào mạng lưới thần kinh phi tập trung. Độ trễ gần như bằng không trong hôm nay. Có ai cảm nhận được sự khác biệt không?",
    timestamp: "1 giờ trước",
    likes: 45,
    comments: 12,
    shares: 3,
    aiState: "monitoring",
    aiAnalysis: {
      riskLevel: "THẤP",
      fakeProbability: 0.15,
      reasons: ["Đang quét các tương tác của node..."],
      propagationVelocity: 0.5
    }
  }
]
