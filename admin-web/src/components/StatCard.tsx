import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'emerald' | 'sky' | 'amber' | 'violet';
}

const ACCENT_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
};

export function StatCard({ title, value, subtitle, icon, accent = 'emerald' }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${ACCENT_STYLES[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}
