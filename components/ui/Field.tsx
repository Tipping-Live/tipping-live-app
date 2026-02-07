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
      <div className="text-xs text-muted">{label}</div>
      <input
        className="w-full rounded-xl border border-border bg-panel2 px-3 py-2 text-sm text-text outline-none
                   placeholder:text-subtle shadow-sm
                   focus:border-border2 focus:ring-2 focus:ring-ring
                   read-only:bg-white/70 read-only:text-muted"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
      />
    </label>
  );
}
