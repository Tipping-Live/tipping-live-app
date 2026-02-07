"use client";

export default function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit" | "reset";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg";

  const styles =
    variant === "primary"
      ? "bg-primary text-white shadow-glow hover:opacity-90 border border-transparent"
      : variant === "danger"
      ? "bg-danger text-white shadow-sm hover:opacity-90 border border-transparent"
      : "bg-panel2 text-text border border-border shadow-sm hover:border-border2";

  return (
    <button
      type={type}
      className={`${base} ${styles}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
