import { useCallback, useEffect, useState } from 'react';
import { CloudDownload, Eye, Film, Heart, MessageSquare, Play, Search, Trash2, X } from 'lucide-react';
import { adminApi, AdminReelItem, PaginationMeta } from '../lib/api';
import { useToast } from '../lib/toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';

const EMPTY_PAGE: PaginationMeta = { current_page: 1, limit: 12, total_items: 0, total_pages: 0 };

export function ReelsPage() {
  const toast = useToast();

  const [items, setItems] = useState<AdminReelItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGE);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [preview, setPreview] = useState<AdminReelItem | null>(null);
  const [deleting, setDeleting] = useState<AdminReelItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listReels({ page, limit: 12, search });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách video Reels');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleSyncPexels = async () => {
    setSyncing(true);
    try {
      const res = await adminApi.syncPexels();
      toast.success(res.data.note || res.message);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Đồng bộ Pexels thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteReel(deleting.id);
      toast.success(`Đã xóa Reel #${deleting.id}`);
      setDeleting(null);
      if (preview?.id === deleting.id) setPreview(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa Reel thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Video Reels</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Xem trước video trực tiếp, theo dõi lượt xem và kiểm duyệt nội dung video ngắn.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSyncPexels}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
        >
          <CloudDownload className={`h-4 w-4 ${syncing ? 'animate-bounce' : ''}`} />
          {syncing ? 'Đang đồng bộ Pexels...' : 'Đồng bộ Pexels'}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo mô tả (caption) video..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Đang tải danh sách video Reels...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">Chưa có video Reel nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
            {items.map((reel) => (
              <div
                key={reel.id}
                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => setPreview(reel)}
                  className="relative aspect-[9/12] bg-slate-900 cursor-pointer overflow-hidden"
                >
                  {reel.poster_url ? (
                    <img
                      src={reel.poster_url}
                      alt={reel.caption}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-500">
                      <Film className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                      #{reel.id}
                    </span>
                    {reel.is_pexels && (
                      <span className="rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Pexels
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/95 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {reel.view_count}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-rose-400" /> {reel.likes_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> {reel.comments_count}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {reel.author?.full_name || 'Ẩn danh'}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">
                      {reel.caption || 'Không có mô tả'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {reel.created_at ? new Date(reel.created_at).toLocaleDateString('vi-VN') : '—'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleting(reel)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Video Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 text-white">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  Reel #{preview.id} — {preview.author?.full_name || 'Ẩn danh'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[65vh]">
              <video
                src={preview.video_url}
                poster={preview.poster_url || undefined}
                controls
                autoPlay
                className="max-h-[65vh] w-full object-contain"
              />
            </div>
            <div className="p-4 text-sm text-slate-200 flex items-start justify-between gap-3">
              <p className="text-xs leading-relaxed text-slate-300 flex-1">
                {preview.caption || 'Không có mô tả'}
              </p>
              <button
                type="button"
                onClick={() => setDeleting(preview)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa Reel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title={`Xóa Video Reel #${deleting?.id}?`}
        description="Video cùng toàn bộ lượt thích và bình luận liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống."
        confirmLabel="Xóa Reel"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
