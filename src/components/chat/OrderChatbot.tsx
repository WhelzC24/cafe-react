import { useEffect, useRef, useState } from 'react'
import { useOrderChatbot } from '../../hooks/useOrderChatbot'
import ChatMessage from './ChatMessage'
import QuickChatChips from './QuickChatChips'

export default function OrderChatbot() {
  const {
    messages, step, open, handleChipClick, handleUserInput, toggleOpen, setOpen,
  } = useOrderChatbot()

  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    handleUserInput(input)
    setInput('')
  }

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-espresso-900 text-cream shadow-lg hover:bg-espresso-700 transition-all flex items-center justify-center text-2xl"
        title="Track your order"
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-cream rounded-2xl shadow-2xl border border-espresso-100 flex flex-col animate-slide-up max-h-[600px] dark:bg-espresso-800 dark:border-espresso-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-espresso-100 bg-white rounded-t-2xl dark:bg-espresso-800 dark:border-espresso-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">☕</span>
              <div>
                <p className="text-sm font-semibold text-espresso-900 dark:text-cream">Cozy Corner Chat</p>
                <p className="text-[10px] text-espresso-500 dark:text-espresso-300">Order tracking & help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-espresso-400 hover:text-espresso-700 text-lg dark:text-espresso-300 dark:hover:text-cream">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1" style={{ maxHeight: 380 }}>
            {messages.map(m => (
              <div key={m.id}>
                <ChatMessage message={m} />
                {m.chips && (
                  <QuickChatChips chips={m.chips} onChipClick={handleChipClick} />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {step === 'tracking' && (
            <div className="p-3 border-t border-espresso-100 bg-white rounded-b-2xl dark:bg-espresso-800 dark:border-espresso-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                  placeholder="Paste your Order ID..."
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="btn-primary btn-sm disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
