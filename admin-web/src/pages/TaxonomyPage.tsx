import { useCallback, useEffect, useState } from 'react';
import { FolderTree, Hash, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { adminApi, AdminCategoryItem, AdminTagItem, PaginationMeta } from '../lib/api';
import { useToast } from '../lib/toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';

const EMPTY_PAGE: PaginationMeta = { current_page: 1, limit: 25, total_items: 0, total_pages: 0 };

export function TaxonomyPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'categories' | 'tags'>('categories');

  // Categories state
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<AdminCategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [deletingCat, setDeletingCat] = useState<AdminCategoryItem | null>(null);

  // Tags state
  const [tags, setTags] = useState<AdminTagItem[]>([]);
  const [tagPagination, setTagPagination] = useState<PaginationMeta>(EMPTY_PAGE);
  const [tagPage, setTagPage] = useState(1);
  const [tagSearch, setTagSearch] = useState('');
  const [tagLoading, setTagLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<AdminTagItem | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagSaving, setTagSaving] = useState(false);
  const [deletingTag, setDeletingTag] = useState<AdminTagItem | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const data = await adminApi.listCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh mục');
    } finally {
      setCatLoading(false);
    }
  }, [toast]);

  const loadTags = useCallback(async () => {
    setTagLoading(true);
    try {
      const res = await adminApi.listTags({ page: tagPage, limit: 25, search: tagSearch });
      setTags(res.items);
      setTagPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách tag');
    } finally {
      setTagLoading(false);
    }
  }, [tagPage, tagSearch, toast]);

  useEffect(() => {
    if (tab === 'categories') {
      loadCategories();
    }
  }, [tab, loadCategories]);

  useEffect(() => {
    if (tab !== 'tags') return;
    const timer = window.setTimeout(loadTags, 200);
    return () => window.clearTimeout(timer);
  }, [tab, loadTags]);

  const openCreateCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatSlug('');
    setCatModalOpen(true);
  };

  const openEditCat = (cat: AdminCategoryItem) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      if (editingCat) {
        await adminApi.updateCategory(editingCat.id, {
          name: catName.trim(),
          slug: catSlug.trim() || undefined,
        });
        toast.success('Đã cập nhật danh mục');
      } else {
        await adminApi.createCategory({
          name: catName.trim(),
          slug: catSlug.trim() || undefined,
        });
        toast.success('Đã thêm danh mục mới');
      }
      setCatModalOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Lưu danh mục thất bại');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCat) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteCategory(deletingCat.id);
      toast.success(`Đã xóa danh mục "${deletingCat.name}"`);
      setDeletingCat(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa danh mục thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditTag = (tag: AdminTagItem) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagSlug(tag.slug);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    setTagSaving(true);
    try {
      await adminApi.updateTag(editingTag.id, {
        name: tagName.trim(),
        slug: tagSlug.trim() || undefined,
      });
      toast.success('Đã cập nhật tag');
      setEditingTag(null);
      loadTags();
    } catch (err: any) {
      toast.error(err?.message || 'Cập nhật tag thất bại');
    } finally {
      setTagSaving(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteTag(deletingTag.id);
      toast.success(`Đã xóa tag #${deletingTag.name}`);
      setDeletingTag(null);
      loadTags();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa tag thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh mục & Thẻ Tag</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý phân loại món ăn và dọn dẹp các thẻ tag trên toàn hệ thống.
          </p>
        </div>
        {tab === 'categories' && (
          <button
            type="button"
            onClick={openCreateCat}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Danh mục ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('tags')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'tags' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hash className="h-4 w-4" />
          Thẻ Tag
        </button>
      </div>

      {tab === 'categories' ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Tên danh mục</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5 text-center">Số công thức</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {catLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Đang tải danh mục...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Chưa có danh mục nào. Hãy bấm &ldquo;Thêm danh mục&rdquo; để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">{cat.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {cat.recipes_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCat(cat)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCat(cat)}
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
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => {
                setTagPage(1);
                setTagSearch(e.target.value);
              }}
              placeholder="Tìm tag theo tên hoặc slug..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3.5">Tên Tag</th>
                    <th className="px-4 py-3.5">Slug</th>
                    <th className="px-4 py-3.5 text-center">Lượt sử dụng</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {tagLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                        Đang tải thẻ tag...
                      </td>
                    </tr>
                  ) : tags.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                        Không có tag nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    tags.map((tag) => (
                      <tr key={tag.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-900">#{tag.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{tag.slug}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {tag.usage_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditTag(tag)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTag(tag)}
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
            <Pagination pagination={tagPagination} onPageChange={setTagPage} />
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCat ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ví dụ: Món Nướng, Ăn Sáng..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Slug <span className="font-normal text-slate-400">(để trống sẽ tự sinh)</span>
                </label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="mon-nuong"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {catSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Sửa Tag #{editingTag.name}</h3>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTag} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên Tag</label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Slug</label>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={tagSaving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {tagSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deletingCat)}
        title={`Xóa danh mục "${deletingCat?.name}"?`}
        description="Danh mục sẽ bị gỡ khỏi các công thức đang liên kết (không xóa công thức)."
        confirmLabel="Xóa danh mục"
        loading={deleteLoading}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCat(null)}
      />

      <ConfirmModal
        open={Boolean(deletingTag)}
        title={`Xóa Tag "#${deletingTag?.name}"?`}
        description="Tag sẽ bị gỡ khỏi tất cả công thức đang gắn thẻ này."
        confirmLabel="Xóa Tag"
        loading={deleteLoading}
        onConfirm={handleDeleteTag}
        onCancel={() => setDeletingTag(null)}
      />
    </div>
  );
}
