"use client";

export default function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60";

  const styles =
    variant === "primary"
      ? "text-white bg-violet-600 hover:bg-violet-700 border border-white/10"
      : variant === "danger"
      ? "text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
      : "text-white/90 bg-white/5 hover:bg-white/10 border border-white/10";

  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}