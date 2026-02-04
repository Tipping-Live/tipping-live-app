"use client";

import {useState, useEffect, useCallback } from "react";

export type TokenOption = {
    symbol: string;
    address: `0x${string}`;
    decimals: number;
    enabled: boolean;
    badge?: string;
  };
  
export default function TokenSelector({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: TokenOption[];
    value: TokenOption;
    onChange: (v: TokenOption) => void;
  }) {
    const [open, setOpen] = useState(false);
  
    const close = useCallback(() => setOpen(false), []);
    useEffect(() => {
      if (!open) return;
  
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      const onClick = () => close();
  
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("click", onClick);
  
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("click", onClick);
      };
    }, [open, close]);
  
    return (
      <div className="relative">
        <div className="text-xs text-white/60">{label}</div>
  
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/40"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold">{value.symbol}</span>
            {value.badge ? (
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
                  value.enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-white/60"
                }`}
              >
                {value.badge}
              </span>
            ) : null}
          </div>
          <span className="text-white/60">▾</span>
        </button>
  
        {open ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0B1020]/95 shadow-panel backdrop-blur"
          >
            <div className="max-h-64 overflow-auto p-1">
              {options.map((opt) => {
                const active = opt.symbol === value.symbol;
                return (
                  <button
                    key={opt.symbol}
                    type="button"
                    disabled={!opt.enabled}
                    onClick={() => {
                      if (!opt.enabled) return;
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={[
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                      opt.enabled ? "hover:bg-white/5" : "cursor-not-allowed opacity-50",
                      active ? "bg-white/5" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white/90">{opt.symbol}</span>
                      {opt.badge ? (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            opt.enabled
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              : "border-white/10 bg-white/5 text-white/60"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      ) : null}
                    </div>
  
                    {active ? <span className="text-white/70">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }