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
    <div className="panel flex h-[520px] flex-col overflow-hidden">
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab
                ? 'border-b-2 border-violet-500 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
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
