import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Eye,
  Film,
  Flame,
  MessageSquare,
  RefreshCw,
  ScanLine,
  Star,
  Tags,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { adminApi, DashboardData } from '../lib/api';
import { useToast } from '../lib/toast';
import { StatCard } from '../components/StatCard';

export function DashboardPage() {
  const toast = useToast();
  const [days, setDays] = useState(14);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard(days);
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi số liệu người dùng, công thức, video Reels và lượt quét AI theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value={7}>7 ngày gần nhất</option>
            <option value={14}>14 ngày gần nhất</option>
            <option value={30}>30 ngày gần nhất</option>
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Tổng người dùng"
          value={summary?.total_users ?? 0}
          subtitle={`${summary?.total_admins ?? 0} tài khoản quản trị`}
          icon={<Users className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          title="Tổng công thức"
          value={summary?.total_recipes ?? 0}
          subtitle={`${summary?.community_recipes ?? 0} cộng đồng · ${summary?.ai_recipes ?? 0} AI`}
          icon={<UtensilsCrossed className="h-5 w-5" />}
          accent="sky"
        />
        <StatCard
          title="Video Reels"
          value={summary?.total_reels ?? 0}
          subtitle={`${(summary?.total_reel_views ?? 0).toLocaleString('vi-VN')} tổng lượt xem`}
          icon={<Film className="h-5 w-5" />}
          accent="violet"
        />
        <StatCard
          title="Lượt quét món AI"
          value={summary?.total_ai_scans ?? 0}
          subtitle={`${(summary?.total_ai_saves ?? 0).toLocaleString('vi-VN')} lượt lưu sổ tay`}
          icon={<ScanLine className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Secondary metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200/80 px-4 py-3">
          <MessageSquare className="h-4.5 w-4.5 text-slate-400" />
          <div>
            <div className="text-xs text-slate-500">Tổng bình luận</div>
            <div className="text-sm font-bold text-slate-900">
              {(summary?.total_comments ?? 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200/80 px-4 py-3">
          <Star className="h-4.5 w-4.5 text-amber-500" />
          <div>
            <div className="text-xs text-slate-500">Lượt đánh giá sao</div>
            <div className="text-sm font-bold text-slate-900">
              {(summary?.total_ratings ?? 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200/80 px-4 py-3">
          <Tags className="h-4.5 w-4.5 text-emerald-600" />
          <div>
            <div className="text-xs text-slate-500">Danh mục / Thẻ Tag</div>
            <div className="text-sm font-bold text-slate-900">
              {summary?.total_categories ?? 0} / {summary?.total_tags ?? 0}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200/80 px-4 py-3">
          <Eye className="h-4.5 w-4.5 text-violet-500" />
          <div>
            <div className="text-xs text-slate-500">Lượt xem Reels</div>
            <div className="text-sm font-bold text-slate-900">
              {(summary?.total_reel_views ?? 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Biểu đồ tăng trưởng ({days} ngày qua)</h2>
          <p className="text-xs text-slate-500">Số lượng người dùng, công thức và video Reels mới theo từng ngày.</p>
        </div>
        <div className="h-72 w-full">
          {data && data.growth_series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growth_series} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecipes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Người dùng mới"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#colorUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="recipes"
                  name="Công thức mới"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="url(#colorRecipes)"
                />
                <Area
                  type="monotone"
                  dataKey="reels"
                  name="Reels mới"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#colorReels)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              {loading ? 'Đang tải biểu đồ...' : 'Chưa có dữ liệu tăng trưởng.'}
            </div>
          )}
        </div>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Trending */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900">Top 5 Công thức Thịnh hành</h2>
          </div>
          {data?.top_trending.length ? (
            <div className="divide-y divide-slate-100">
              {data.top_trending.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">#{index + 1}</span>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.recipe_name}
                      className="h-11 w-11 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.recipe_name}</p>
                    <p className="truncate text-xs text-slate-500">Tác giả: {item.author_name}</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    {item.trending_score} điểm
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">Chưa có công thức cộng đồng nào.</p>
          )}
        </div>

        {/* Top AI Scanned */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <ScanLine className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Top 5 Món được Quét AI nhiều nhất</h2>
          </div>
          {data?.top_ai_dishes.length ? (
            <div className="divide-y divide-slate-100">
              {data.top_ai_dishes.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">#{index + 1}</span>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.recipe_name}
                      className="h-11 w-11 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <ScanLine className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.recipe_name}</p>
                    <p className="text-xs text-slate-500">{item.save_count} lượt lưu vào sổ tay</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {item.scan_count} lượt quét
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">Chưa có thống kê quét AI nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
