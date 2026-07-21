export interface ReelItem {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    isFollowing: boolean;
  };
  caption: string;
  videoUrl?: string;
  posterUrl: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  savesCount: number;
  isSaved: boolean;
  sharesCount: number;
  musicTrack: string;
  recipe: {
    title: string;
    ingredients: string[];
    instructions: string[];
  };
}

export const MOCK_REELS: ReelItem[] = [
  {
    id: 'reel-1',
    author: {
      id: 'chef-1',
      name: 'Chef Scott',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
    },
    caption: 'Bí quyết làm sốt Phô Mai tan chảy siêu béo ngậy cho món Pasta ngon ngất ngây! 🧀✨ #Cheesy #Pasta #FoodHack',
    posterUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281318?w=800&auto=format&fit=crop&q=80',
    likesCount: 1420,
    isLiked: false,
    commentsCount: 284,
    savesCount: 890,
    isSaved: false,
    sharesCount: 156,
    musicTrack: 'Scott Chill Beats - Sốt Phô Mai Thần Thánh',
    recipe: {
      title: 'Mì Ý Sốt Phô Mai Kem Tươi',
      ingredients: ['200g Mì Ý Penne', '100g Phô Mai Cheddar', '150ml Kem tươi', 'Tỏi băm, bơ lạt, muối, tiêu'],
      instructions: [
        'Luộc mì Ý trong nước sôi có chút muối khoảng 8-10 phút.',
        'Phi thơm tỏi băm với bơ lạt.',
        'Đổ kem tươi và phô mai bào vào khuấy đều ở lửa nhỏ tới khi sốt sánh mịn.',
        'Trộn mì Ý vào sốt và thưởng thức nóng!',
      ],
    },
  },
  {
    id: 'reel-2',
    author: {
      id: 'chef-2',
      name: 'Amber Eats',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isFollowing: true,
    },
    caption: 'Cách ướp Bít Tết mềm mọng giữ trọn vị ngọt tự nhiên chỉ trong 5 phút! 🥩🔥 #SteakLover #CookingTips',
    posterUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80',
    likesCount: 3890,
    isLiked: true,
    commentsCount: 512,
    savesCount: 1240,
    isSaved: true,
    sharesCount: 420,
    musicTrack: 'Amber Acoustic - Bít Tết Chuẩn Chuyên Gia',
    recipe: {
      title: 'Bít Tết Bò Áp Chảo Bơ Tỏi',
      ingredients: ['300g Thăn ngoại bò', '2 tép tỏi, bơ lạt, lá hương thảo', 'Muối biển, tiêu đen xay'],
      instructions: [
        'Thấm khô miếng thịt bò bằng giấy ăn.',
        'Rắc đều muối biển và tiêu đen lên 2 mặt thịt.',
        'Áp chảo chảo gang thật nóng 2 phút mỗi mặt, thêm bơ, tỏi và lá hương thảo rưới đều lên thịt.',
        'Để thịt nghỉ 5 phút trước khi thái.',
      ],
    },
  },
  {
    id: 'reel-3',
    author: {
      id: 'chef-3',
      name: 'Kristin Bake',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
    },
    caption: 'Bánh Souffle Socola tan chảy giòn vỏ ngoài mềm mọng bên trong ngọt ngào 🍓🍫 #BakingLove #DessertTime',
    posterUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    likesCount: 2150,
    isLiked: false,
    commentsCount: 189,
    savesCount: 960,
    isSaved: false,
    sharesCount: 310,
    musicTrack: 'Kristin Piano - Vũ Điệu Bánh Ngọt',
    recipe: {
      title: 'Bánh Souffle Socola Tan Chảy',
      ingredients: ['100g Socola đen 70%', '50g Bơ lạt', '2 Quả trứng gà', '30g Đường, 20g Bột mì'],
      instructions: [
        'Đun chảy socola đen và bơ lạt.',
        'Đánh bông lòng trắng trứng với đường.',
        'Trộn nhẹ nhàng hỗn hợp socola và lòng trắng trứng bông.',
        'Nướng ở 180°C trong 12 phút.',
      ],
    },
  },
];
