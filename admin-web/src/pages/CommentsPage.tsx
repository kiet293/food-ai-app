import { useCallback, useEffect, useState } from 'react';
import { Film, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import { adminApi, AdminCommentItem, PaginationMeta } from '../lib/api';
import { useToast } from '../lib/toast';
import { Avatar } from '../components/Avatar';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';

const EMPTY_PAGE: PaginationMeta = { current_page: 1, limit: 20, total_items: 0, total_pages: 0 };

export function CommentsPage() {
  const toast = useToast();
  const [kind, setKind] = useState<'recipe' | 'reel'>('recipe');
  const [items, setItems] = useState<AdminCommentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGE);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState<AdminCommentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listComments({ kind, page, limit: 20, search });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  }, [kind, page, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteComment(deleting.kind, deleting.id);
      toast.success(`Đã xóa bình luận #${deleting.id}`);
      setDeleting(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa bình luận thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kiểm duyệt Bình luận</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tra cứu theo từ khóa và gỡ bỏ các bình luận spam hoặc vi phạm quy định cộng đồng.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/70 p-1 self-start">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setKind('recipe');
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              kind === 'recipe' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Bình luận Công thức
          </button>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setKind('reel');
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              kind === 'reel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film className="h-4 w-4" />
            Bình luận Reels
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Lọc theo nội dung bình luận..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Người bình luận</th>
                <th className="px-4 py-3.5">Nội dung</th>
                <th className="px-4 py-3.5">{kind === 'recipe' ? 'Công thức' : 'Video Reel'}</th>
                <th className="px-4 py-3.5">Thời gian</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách bình luận...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Không có bình luận nào.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={`${c.kind}-${c.id}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={c.author?.avatar}
                          name={c.author?.full_name || c.author?.username || '?'}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                            {c.author?.full_name || 'Ẩn danh'}
                          </div>
                          <div className="text-xs text-slate-400">@{c.author?.username || 'unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-slate-800 whitespace-pre-wrap break-words text-sm">{c.content}</p>
                      {c.parent_comment_id && (
                        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          Trả lời bình luận #{c.parent_comment_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-xs font-medium text-slate-700 line-clamp-2">
                        {c.target_title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        title="Xóa bình luận"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <ConfirmModal
        open={Boolean(deleting)}
        title={`Xóa bình luận #${deleting?.id}?`}
        description="Bình luận này (cùng các phản hồi con nếu có) sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa bình luận"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
