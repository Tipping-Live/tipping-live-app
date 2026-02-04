"use client";

export default function Badge({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-white/80";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${toneClass}`}
    >
      <span className="text-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}