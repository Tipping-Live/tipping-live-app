'use client'

import { useState, type ReactNode } from 'react'

interface Props {
  chatContent: ReactNode
  tipsContent: ReactNode
}

const tabs = ['Chat', 'Tips'] as const
type Tab = (typeof tabs)[number]

export default function ViewerSidePanel({ chatContent, tipsContent }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Chat')

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-panel shadow-panel backdrop-blur">
      <div className="flex border-b border-border bg-panel2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold transition focus:outline-none
                ${isActive ? 'text-text' : 'text-muted hover:text-text'}
              `}
            >
              <span className="relative inline-flex items-center justify-center">
                {tab}
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 w-full rounded-full bg-primary" />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className={activeTab === 'Chat' ? 'flex h-full flex-col' : 'hidden'}>
          {chatContent}
        </div>
        <div className={activeTab === 'Tips' ? 'h-full overflow-y-auto' : 'hidden'}>
          {tipsContent}
        </div>
      </div>
    </div>
  )
}
