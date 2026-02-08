"use client";

export default function Badge({
  label,
  value,
  tone = "neutral",
}: {
  label?: string;
  value: string;
  tone?: "neutral" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/25 bg-danger/10 text-danger"
      : tone === "success"
      ? "border-success/25 bg-success/10 text-success"
      : "border-border bg-white/60 text-text";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs shadow-sm backdrop-blur ${toneClass}`}
    >
      {!!label && <span className="text-muted">{label}</span>}
      <span className="font-semibold tracking-wide">{value}</span>
    </span>
  );
}
