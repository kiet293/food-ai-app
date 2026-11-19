import { useCallback, useEffect, useState } from 'react';
import { Pencil, Search, Shield, ShieldOff, Trash2, X } from 'lucide-react';
import { adminApi, AdminUserItem, PaginationMeta } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { Avatar } from '../components/Avatar';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';

const EMPTY_PAGE: PaginationMeta = { current_page: 1, limit: 15, total_items: 0, total_pages: 0 };

export function UsersPage() {
  const { admin } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGE);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<AdminUserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<AdminUserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        page,
        limit: 15,
        search,
        is_admin: roleFilter,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openEdit = (user: AdminUserItem) => {
    setEditing(user);
    setEditFullName(user.full_name || '');
    setEditBio(user.bio || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.updateUser(editing.id, {
        full_name: editFullName,
        bio: editBio,
      });
      toast.success(`Đã cập nhật tài khoản @${editing.username}`);
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async (user: AdminUserItem) => {
    try {
      await adminApi.updateUser(user.id, { is_admin: !user.is_admin });
      toast.success(
        !user.is_admin
          ? `Đã cấp quyền quản trị cho @${user.username}`
          : `Đã thu hồi quyền quản trị của @${user.username}`
      );
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thay đổi quyền');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteUser(deleting.id);
      toast.success(`Đã xóa người dùng @${deleting.username}`);
      setDeleting(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa người dùng thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tra cứu tài khoản, phân quyền quản trị viên và quản lý người dùng vi phạm.
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
            placeholder="Tìm theo username hoặc tên hiển thị..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Tất cả vai trò</option>
          <option value="true">Quản trị viên (Admin)</option>
          <option value="false">Người dùng thường</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Người dùng</th>
                <th className="px-4 py-3.5">Vai trò</th>
                <th className="px-4 py-3.5 text-center">Công thức</th>
                <th className="px-4 py-3.5 text-center">Reels</th>
                <th className="px-4 py-3.5 text-center">Followers</th>
                <th className="px-4 py-3.5">Ngày tham gia</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((u) => {
                  const isSelf = u.id === admin?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatar} name={u.full_name || u.username} size="md" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate">{u.full_name || u.username}</span>
                              {isSelf && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">@{u.username} · ID #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Thành viên
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{u.recipes_count}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{u.reels_count}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{u.follower_count}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            title="Sửa thông tin"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleToggleAdmin(u)}
                            title={u.is_admin ? 'Thu hồi quyền Admin' : 'Cấp quyền Admin'}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleting(u)}
                            title="Xóa người dùng"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Sửa thông tin @{editing.username}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên hiển thị</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tiểu sử (Bio)</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title={`Xóa người dùng @${deleting?.username}?`}
        description="Thao tác này sẽ xóa vĩnh viễn tài khoản cùng toàn bộ công thức, video Reels, bộ sưu tập và bình luận liên quan (kèm dọn ảnh Cloudinary). Không thể hoàn tác."
        confirmLabel="Xóa vĩnh viễn"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
