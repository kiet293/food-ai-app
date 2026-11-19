import { useState } from 'react';
import { CheckCircle2, CloudDownload, Flame, Play, Terminal } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useToast } from '../lib/toast';

interface JobLog {
  id: number;
  job: string;
  time: string;
  message: string;
}

export function SystemPage() {
  const toast = useToast();
  const [runningTrending, setRunningTrending] = useState(false);
  const [runningPexels, setRunningPexels] = useState(false);
  const [logs, setLogs] = useState<JobLog[]>([]);

  const pushLog = (job: string, message: string) => {
    setLogs((prev) => [
      { id: Date.now(), job, time: new Date().toLocaleTimeString('vi-VN'), message },
      ...prev.slice(0, 19),
    ]);
  };

  const handleRecalculateTrending = async () => {
    setRunningTrending(true);
    try {
      const res = await adminApi.recalculateTrending();
      toast.success(res.message);
      pushLog('Recalculate Trending', res.message);
    } catch (err: any) {
      const msg = err?.message || 'Cập nhật điểm trending thất bại';
      toast.error(msg);
      pushLog('Recalculate Trending (Lỗi)', msg);
    } finally {
      setRunningTrending(false);
    }
  };

  const handleSyncPexels = async () => {
    setRunningPexels(true);
    try {
      const res = await adminApi.syncPexels();
      const summary = `${res.data.note} (Trước: ${res.data.before_count}, Sau: ${res.data.after_count})`;
      toast.success(res.data.note || res.message);
      pushLog('Sync Pexels', summary);
    } catch (err: any) {
      const msg = err?.message || 'Đồng bộ Pexels thất bại';
      toast.error(msg);
      pushLog('Sync Pexels (Lỗi)', msg);
    } finally {
      setRunningPexels(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Công cụ Hệ thống</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Chủ động kích hoạt các tác vụ nền (Workers) mà không cần chờ lịch định kỳ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Trending job */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600 ring-1 ring-orange-100 shrink-0">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tính lại điểm Trending</h2>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Tính toán lại <code className="text-slate-700">trending_score</code> cho toàn bộ công thức dựa trên
                điểm đánh giá, lượt yêu thích, lượt lưu bộ sưu tập và độ mới (sử dụng advisory lock của PostgreSQL).
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRecalculateTrending}
              disabled={runningTrending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {runningTrending ? 'Đang tính toán...' : 'Chạy ngay'}
            </button>
          </div>
        </div>

        {/* Sync Pexels job */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600 ring-1 ring-violet-100 shrink-0">
              <CloudDownload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Đồng bộ video từ Pexels</h2>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Gọi Pexels API để nhập thêm video nấu ăn dọc vào bảng <code className="text-slate-700">reels</code>{' '}
                khi cơ sở dữ liệu có ít hơn 15 video.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSyncPexels}
              disabled={runningPexels}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CloudDownload className="h-4 w-4" />
              {runningPexels ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* Execution logs */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="h-4.5 w-4.5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Nhật ký chạy tác vụ phiên này</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Chưa có tác vụ nào được kích hoạt trong phiên làm việc này.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-mono text-slate-400 shrink-0">{entry.time}</span>
                <span className="font-semibold text-slate-800 shrink-0">{entry.job}:</span>
                <span className="text-slate-600">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
