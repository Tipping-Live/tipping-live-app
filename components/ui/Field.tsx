"use client";

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <div className="text-xs text-white/60">{label}</div>
      <input
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-violet-500/40"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
      />
    </label>
  );
}