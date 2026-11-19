import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../lib/api';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { current_page, total_pages, total_items, limit } = pagination;
  if (total_items === 0) return null;

  const from = (current_page - 1) * limit + 1;
  const to = Math.min(current_page * limit, total_items);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-sm text-slate-600">
      <div>
        Hiển thị <span className="font-semibold text-slate-900">{from}</span> –{' '}
        <span className="font-semibold text-slate-900">{to}</span> trong tổng số{' '}
        <span className="font-semibold text-slate-900">{total_items}</span> bản ghi
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>
        <span className="px-3 py-1.5 text-xs font-medium text-slate-500">
          Trang {current_page} / {Math.max(1, total_pages)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= total_pages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
