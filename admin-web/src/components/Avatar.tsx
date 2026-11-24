interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ src, name = '?', size = 'md' }: AvatarProps) {
  const isUrl = Boolean(src && /^https?:\/\//i.test(src));
  const sizeClass = SIZE_CLASSES[size];

  if (isUrl && src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-emerald-100 shrink-0`}
      />
    );
  }

  const label = src && src.trim().length <= 4 ? src.trim() : (name.trim()[0] || '?').toUpperCase();
  return (
    <div
      className={`${sizeClass} rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center justify-center shrink-0 ring-2 ring-emerald-50`}
    >
      {label}
    </div>
  );
}
