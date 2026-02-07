"use client";

import Image from "next/image";
import { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname, useRouter } from "next/navigation";
import logo from "@/asset/logo.png";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  rightSlot?: ReactNode;
}

export default function PageHeader({ eyebrow, title, rightSlot }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const hideBack = pathname === "/" || pathname === "/browse";

  return (
    <header className="flex items-center justify-between rounded-2xl border border-border bg-panel shadow-panel backdrop-blur px-4 py-4">
      <div className="flex items-center gap-3">
        {!hideBack && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-panel2 text-text shadow-sm transition hover:border-border2 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <Image
          src={logo.src}
          alt="EveryAid"
          width={36}
          height={36}
          className="shrink-0"
          priority
        />

        <div className="grid gap-0.5">
          {eyebrow && <div className="text-xs tracking-widest text-muted">{eyebrow}</div>}
          <h1 className="text-lg font-extrabold text-text">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">{rightSlot ?? <ConnectButton />}</div>
    </header>
  );
}
