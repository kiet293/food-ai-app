import { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { adminApi, AdminRecipeDetail, AdminRecipeItem, PaginationMeta } from '../lib/api';
import { useToast } from '../lib/toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';

const EMPTY_PAGE: PaginationMeta = { current_page: 1, limit: 15, total_items: 0, total_pages: 0 };

function formatIngredient(item: any): string {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    const name = item.name || item.ingredient || '';
    const amount = item.amount || item.quantity || '';
    const prob = item.probability !== undefined ? ` (${item.probability}%)` : '';
    return [name, amount].filter(Boolean).join(' — ') + prob;
  }
  return String(item);
}

export function RecipesPage() {
  const toast = useToast();

  const [items, setItems] = useState<AdminRecipeItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGE);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [aiFilter, setAiFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<AdminRecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editCookTime, setEditCookTime] = useState('');
  const [editServings, setEditServings] = useState('');
  const [editIsAi, setEditIsAi] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<AdminRecipeItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listRecipes({
        page,
        limit: 15,
        search,
        is_ai: aiFilter,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách công thức');
    } finally {
      setLoading(false);
    }
  }, [page, search, aiFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await adminApi.getRecipeDetail(id);
      setDetail(data);
      setEditName(data.recipe_name);
      setEditDesc(data.description || '');
      setEditDifficulty(data.difficulty || '');
      setEditCookTime(data.cook_time_minutes != null ? String(data.cook_time_minutes) : '');
      setEditServings(data.servings != null ? String(data.servings) : '');
      setEditIsAi(data.is_ai);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải chi tiết công thức');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateRecipe(detail.id, {
        recipe_name: editName.trim(),
        description: editDesc,
        difficulty: editDifficulty || undefined,
        cook_time_minutes: editCookTime ? Number(editCookTime) : null,
        servings: editServings ? Number(editServings) : null,
        is_ai: editIsAi,
      });
      setDetail(updated);
      toast.success('Đã lưu thay đổi công thức');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Cập nhật công thức thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteRecipe(deleting.id);
      toast.success(`Đã xóa công thức "${deleting.recipe_name}"`);
      setDeleting(null);
      if (detail?.id === deleting.id) setDetail(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa công thức thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Công thức</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Xem chi tiết nguyên liệu, chỉnh sửa thông tin và kiểm duyệt công thức cộng đồng / AI.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Tìm theo tên món ăn hoặc mô tả..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={aiFilter}
          onChange={(e) => {
            setPage(1);
            setAiFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Tất cả nguồn</option>
          <option value="false">Cộng đồng đăng</option>
          <option value="true">Do AI tạo (Sổ tay)</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Công thức</th>
                <th className="px-4 py-3.5">Nguồn</th>
                <th className="px-4 py-3.5">Tác giả</th>
                <th className="px-4 py-3.5">Tương tác</th>
                <th className="px-4 py-3.5 text-right">Trending</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách công thức...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Không có công thức nào phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 max-w-sm">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.recipe_name}
                            className="h-12 w-12 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{r.recipe_name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>#{r.id}</span>
                            {r.cook_time_minutes != null && (
                              <span className="inline-flex items-center gap-0.5">
                                <Clock className="h-3 w-3" /> {r.cook_time_minutes}p
                              </span>
                            )}
                            {r.difficulty && <span>· {r.difficulty}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_ai ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Cộng đồng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.author ? (
                        <div>
                          <div className="font-medium text-slate-900">{r.author.full_name}</div>
                          <div className="text-slate-400">@{r.author.username}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1" title="Đánh giá">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {r.ratings_avg} ({r.ratings_count})
                        </span>
                        <span className="inline-flex items-center gap-1" title="Yêu thích">
                          <Heart className="h-3.5 w-3.5 text-rose-500" />
                          {r.favorites_count}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Bình luận">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                          {r.comments_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {r.trending_score}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(r.id)}
                          title="Xem & chỉnh sửa"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(r)}
                          title="Xóa công thức"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Recipe Detail & Quick Edit Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {detailLoading ? 'Đang tải...' : `Chi tiết công thức #${detail?.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detail && !detailLoading && (
              <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    {detail.image_url ? (
                      <img
                        src={detail.image_url}
                        alt={detail.recipe_name}
                        className="w-full aspect-square rounded-xl object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        Không có ảnh
                      </div>
                    )}
                    {detail.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {detail.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tên công thức</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Độ khó</label>
                        <input
                          type="text"
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value)}
                          placeholder="Dễ / Trung bình"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Thời gian (phút)</label>
                        <input
                          type="number"
                          min={0}
                          value={editCookTime}
                          onChange={(e) => setEditCookTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Khẩu phần</label>
                        <input
                          type="number"
                          min={1}
                          value={editServings}
                          onChange={(e) => setEditServings(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 pt-1">
                      <input
                        type="checkbox"
                        checked={editIsAi}
                        onChange={(e) => setEditIsAi(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Đánh dấu là công thức AI tạo (ẩn khỏi feed cộng đồng)
                    </label>
                  </div>
                </div>

                {/* Ingredients & Instructions read-only preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/70">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Nguyên liệu ({detail.ingredients.length})
                    </h4>
                    {detail.ingredients.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 max-h-44 overflow-y-auto">
                        {detail.ingredients.map((ing, i) => (
                          <li key={i}>{formatIngredient(ing)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">Không có dữ liệu nguyên liệu.</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/70">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Các bước thực hiện ({detail.instructions.length})
                    </h4>
                    {detail.instructions.length > 0 ? (
                      <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-700 max-h-44 overflow-y-auto">
                        {detail.instructions.map((step, i) => (
                          <li key={i}>{typeof step === 'string' ? step : JSON.stringify(step)}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs text-slate-400">Không có dữ liệu hướng dẫn.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title={`Xóa công thức "${deleting?.recipe_name}"?`}
        description="Công thức cùng toàn bộ đánh giá, bình luận, lượt thích liên quan sẽ bị xóa và ảnh Cloudinary (nếu có) sẽ được tự động dọn dẹp."
        confirmLabel="Xóa công thức"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
