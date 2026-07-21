export interface CollectionItem {
  id: string;
  title: string;
  recipeCount: number;
  image: string;
  badge?: string;
}

export interface ChefItem {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
  recipesCount: number;
  verified?: boolean;
}

export interface TrendingRecipeItem {
  id: string;
  title: string;
  author: string;
  image: string;
  badge?: string;
  cookTime: string;
  saved: boolean;
  savesCount: number;
}

export interface PostItem {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  timeAgo: string;
  title: string;
  description?: string;
  images: string[];
  savesCount: number;
  isSaved: boolean;
  cookedCount: number;
  isCooked: boolean;
  commentsCount: number;
  sharesCount: number;
  tags?: string[];
}

export const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: 'c1',
    title: '15 PHÚT MỖI NGÀY',
    recipeCount: 12,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    badge: 'Nhanh & Gọn',
  },
  {
    id: 'c2',
    title: 'MEAL PREP TIỆN LỢI',
    recipeCount: 18,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    badge: 'Healthy',
  },
  {
    id: 'c3',
    title: 'MÓN CHAY THANH TỊNH',
    recipeCount: 15,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'c4',
    title: 'BÁNH NGỌT & DESSERT',
    recipeCount: 20,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
  },
];

export const MOCK_CHEFS: ChefItem[] = [
  {
    id: 'u1',
    name: 'Chef Cara',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isFollowing: true,
    recipesCount: 45,
    verified: true,
  },
  {
    id: 'u2',
    name: 'Chef Scott',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isFollowing: false,
    recipesCount: 32,
  },
  {
    id: 'u3',
    name: 'Amber Eats',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isFollowing: true,
    recipesCount: 89,
    verified: true,
  },
  {
    id: 'u4',
    name: 'Chris Kitchen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isFollowing: false,
    recipesCount: 21,
  },
  {
    id: 'u5',
    name: 'Snappy Foodie',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    isFollowing: false,
    recipesCount: 64,
  },
  {
    id: 'u6',
    name: 'Kristin Bake',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isFollowing: true,
    recipesCount: 19,
  },
];

export const MOCK_TRENDING_RECIPES: TrendingRecipeItem[] = [
  {
    id: 't1',
    title: 'Gà Sốt Tỏi Tương & Mì Ý',
    author: 'Chef Scott',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281318?w=600&auto=format&fit=crop&q=80',
    badge: 'CỰC NGON!',
    cookTime: '25 phút',
    saved: false,
    savesCount: 142,
  },
  {
    id: 't2',
    title: 'Pizza Phô Mai 30 Phút',
    author: 'Kristin Bake',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    badge: 'HOT',
    cookTime: '30 phút',
    saved: true,
    savesCount: 389,
  },
  {
    id: 't3',
    title: 'Salad Bơ Trái Cây Thanh Nhiệt',
    author: 'Chef Cara',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    cookTime: '10 phút',
    saved: false,
    savesCount: 95,
  },
];

export const MOCK_HOT_TAGS: string[] = [
  'Tất Cả',
  'Ngày Bánh Ngọt',
  'Món Ăn Ấm Áp',
  'Homemade',
  'Ăn Sáng',
  'Nấu Nhanh 15m',
  'Ăn Chay Healthy',
  'Bún & Phở',
];

export const MOCK_EXPLORE_GRID = [
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a597c7f356?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=500&auto=format&fit=crop&q=80',
];

export const MOCK_POSTS: PostItem[] = [
  {
    id: 'post-1',
    author: {
      id: 'u1',
      name: 'Chef Pepper',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verified: true,
    },
    timeAgo: '11 giờ trước',
    title: "SAVORY S'MORES SÁNG TẠO",
    description: 'Một sự kết hợp ngọt ngào và mặn mòi đầy bùng nổ hương vị từ phô mai nướng nóng và bánh cracker giòn rụm!',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    ],
    savesCount: 14,
    isSaved: false,
    cookedCount: 8,
    isCooked: true,
    commentsCount: 3,
    sharesCount: 5,
    tags: ['ComfortFood', 'Snack', 'Creative'],
  },
  {
    id: 'post-2',
    author: {
      id: 'u3',
      name: 'Amber Eats',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      verified: true,
    },
    timeAgo: '1 ngày trước',
    title: 'MÌ Ý SỐT KEM BƠ SẮC MÀU',
    description: 'Bữa trưa giản dị nhưng đầy màu sắc & năng lượng cho cả gia đình vào ngày cuối tuần.',
    images: [
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281318?w=800&auto=format&fit=crop&q=80',
    ],
    savesCount: 42,
    isSaved: true,
    cookedCount: 19,
    isCooked: false,
    commentsCount: 12,
    sharesCount: 9,
    tags: ['Pasta', 'Italian', 'QuickMeal'],
  },
  {
    id: 'post-3',
    author: {
      id: 'u2',
      name: 'Chef Scott',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    timeAgo: '2 ngày trước',
    title: 'BÁNH TART TRÁI CÂY TƯƠI',
    description: 'Được làm hoàn toàn thủ công với các loại dâu tươi mọng nước mát lạnh.',
    images: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80',
    ],
    savesCount: 95,
    isSaved: false,
    cookedCount: 34,
    isCooked: false,
    commentsCount: 7,
    sharesCount: 15,
    tags: ['BánhNgọt', 'Dessert', 'Homemade'],
  },
];
