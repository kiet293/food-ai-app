const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const TOKEN_KEY = 'food_ai_admin_token';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Không thể kết nối tới Backend API. Hãy kiểm tra server đã chạy chưa.', 0);
  }

  const text = await response.text();
  let parsed: any;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(
      response.ok ? 'Dữ liệu phản hồi không hợp lệ' : `Lỗi máy chủ (${response.status})`,
      response.status
    );
  }

  if (!response.ok) {
    let message = parsed?.message;
    if (!message) {
      if (typeof parsed?.detail === 'string') {
        message = parsed.detail;
      } else if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
        message = parsed.detail.map((e: any) => e?.msg || JSON.stringify(e)).join('; ');
      }
    }
    throw new ApiError(message || `Lỗi máy chủ (${response.status})`, response.status, parsed?.code);
  }

  return parsed as T;
}

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
export interface PaginationMeta {
  current_page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

export interface AdminProfile {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  is_admin: boolean;
}

export interface DashboardData {
  summary: {
    total_users: number;
    total_admins: number;
    total_recipes: number;
    community_recipes: number;
    ai_recipes: number;
    total_reels: number;
    total_reel_views: number;
    total_comments: number;
    total_ratings: number;
    total_categories: number;
    total_tags: number;
    total_ai_scans: number;
    total_ai_saves: number;
  };
  growth_series: {
    date: string;
    users: number;
    recipes: number;
    reels: number;
  }[];
  top_trending: {
    id: number;
    recipe_name: string;
    image_url: string | null;
    trending_score: number;
    author_name: string;
  }[];
  top_ai_dishes: {
    id: number;
    recipe_name: string;
    scan_count: number;
    save_count: number;
    image_url: string | null;
  }[];
}

export interface AdminUserItem {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  bio: string;
  is_admin: boolean;
  follower_count: number;
  recipes_count: number;
  reels_count: number;
  created_at: string | null;
}

export interface AuthorBrief {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
}

export interface AdminRecipeItem {
  id: number;
  recipe_name: string;
  description: string;
  image_url: string | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: string;
  trending_score: number;
  is_ai: boolean;
  author: AuthorBrief | null;
  favorites_count: number;
  comments_count: number;
  ratings_avg: number;
  ratings_count: number;
  created_at: string | null;
}

export interface AdminRecipeDetail {
  id: number;
  recipe_name: string;
  description: string;
  ingredients: any[];
  instructions: any[];
  image_url: string | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: string;
  trending_score: number;
  is_ai: boolean;
  categories: string[];
  tags: string[];
  author: AuthorBrief | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminReelItem {
  id: number;
  video_url: string;
  poster_url: string | null;
  caption: string;
  recipe_id: number | null;
  view_count: number;
  likes_count: number;
  comments_count: number;
  is_pexels: boolean;
  author: AuthorBrief | null;
  created_at: string | null;
}

export interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  recipes_count: number;
  created_at: string | null;
}

export interface AdminTagItem {
  id: number;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string | null;
}

export interface AdminCommentItem {
  id: number;
  kind: 'recipe' | 'reel';
  content: string;
  parent_comment_id: number | null;
  target_id: number | null;
  target_title: string;
  author: AuthorBrief | null;
  created_at: string | null;
}

// ------------------------------------------------------------------
// API CALLS
// ------------------------------------------------------------------
export const adminApi = {
  login: async (username: string, password: string): Promise<{ access_token: string }> => {
    const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    return request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  },

  getMe: async (): Promise<AdminProfile> => {
    const res = await request<ApiEnvelope<AdminProfile>>('/admin/me');
    return res.data;
  },

  getDashboard: async (days = 14): Promise<DashboardData> => {
    const res = await request<ApiEnvelope<DashboardData>>(`/admin/dashboard?days=${days}`);
    return res.data;
  },

  // Users
  listUsers: async (params: { page?: number; limit?: number; search?: string; is_admin?: string }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.is_admin === 'true' || params.is_admin === 'false') qs.set('is_admin', params.is_admin);
    const res = await request<ApiEnvelope<Paginated<AdminUserItem>>>(`/admin/users?${qs.toString()}`);
    return res.data;
  },

  updateUser: async (id: number, payload: { full_name?: string; bio?: string; is_admin?: boolean }) => {
    const res = await request<ApiEnvelope<AdminUserItem>>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteUser: async (id: number) => {
    const res = await request<ApiEnvelope<{ deleted_user_id: number }>>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Recipes
  listRecipes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    is_ai?: string;
    difficulty?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.is_ai === 'true' || params.is_ai === 'false') qs.set('is_ai', params.is_ai);
    if (params.difficulty) qs.set('difficulty', params.difficulty);
    const res = await request<ApiEnvelope<Paginated<AdminRecipeItem>>>(`/admin/recipes?${qs.toString()}`);
    return res.data;
  },

  getRecipeDetail: async (id: number) => {
    const res = await request<ApiEnvelope<AdminRecipeDetail>>(`/admin/recipes/${id}`);
    return res.data;
  },

  updateRecipe: async (
    id: number,
    payload: {
      recipe_name?: string;
      description?: string;
      difficulty?: string;
      cook_time_minutes?: number | null;
      servings?: number | null;
      is_ai?: boolean;
    }
  ) => {
    const res = await request<ApiEnvelope<AdminRecipeDetail>>(`/admin/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteRecipe: async (id: number) => {
    const res = await request<ApiEnvelope<{ deleted_recipe_id: number }>>(`/admin/recipes/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Reels
  listReels: async (params: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    const res = await request<ApiEnvelope<Paginated<AdminReelItem>>>(`/admin/reels?${qs.toString()}`);
    return res.data;
  },

  deleteReel: async (id: number) => {
    const res = await request<ApiEnvelope<{ deleted_reel_id: number }>>(`/admin/reels/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Categories
  listCategories: async () => {
    const res = await request<ApiEnvelope<AdminCategoryItem[]>>('/admin/categories');
    return res.data;
  },

  createCategory: async (payload: { name: string; slug?: string }) => {
    const res = await request<ApiEnvelope<AdminCategoryItem>>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateCategory: async (id: number, payload: { name?: string; slug?: string }) => {
    const res = await request<ApiEnvelope<AdminCategoryItem>>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteCategory: async (id: number) => {
    const res = await request<ApiEnvelope<{ deleted_category_id: number }>>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Tags
  listTags: async (params: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    const res = await request<ApiEnvelope<Paginated<AdminTagItem>>>(`/admin/tags?${qs.toString()}`);
    return res.data;
  },

  updateTag: async (id: number, payload: { name?: string; slug?: string }) => {
    const res = await request<ApiEnvelope<AdminTagItem>>(`/admin/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteTag: async (id: number) => {
    const res = await request<ApiEnvelope<{ deleted_tag_id: number }>>(`/admin/tags/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Comments
  listComments: async (params: { kind: 'recipe' | 'reel'; page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    qs.set('kind', params.kind);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    const res = await request<ApiEnvelope<Paginated<AdminCommentItem>>>(`/admin/comments?${qs.toString()}`);
    return res.data;
  },

  deleteComment: async (kind: 'recipe' | 'reel', id: number) => {
    const res = await request<ApiEnvelope<{ deleted_comment_id: number; kind: string }>>(
      `/admin/comments/${kind}/${id}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  // Jobs
  recalculateTrending: async () => {
    const res = await request<ApiEnvelope<{ job: string; executed_at: string }>>(
      '/admin/jobs/recalculate-trending',
      { method: 'POST' }
    );
    return res;
  },

  syncPexels: async () => {
    const res = await request<
      ApiEnvelope<{ job: string; before_count: number; after_count: number; added_count: number; note: string }>
    >('/admin/jobs/sync-pexels', { method: 'POST' });
    return res;
  },
};
