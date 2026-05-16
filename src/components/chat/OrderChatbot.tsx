import { useEffect, useRef, useState } from 'react'
import { useOrderChatbot } from '../../hooks/useOrderChatbot'
import ChatMessage from './ChatMessage'
import QuickChatChips from './QuickChatChips'

export default function OrderChatbot() {
  const {
    messages, botTyping, unreadCount, step, open,
    handleChipClick, handleUserInput, resetChat, toggleOpen, setOpen,
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

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
        title="Cozy Corner Chat"
      >
        {open ? '×' : '💬'}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-cream text-[10px] rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
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
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="text-espresso-400 hover:text-espresso-700 text-xs px-2 py-1 rounded-lg hover:bg-espresso-100 transition-colors dark:text-espresso-300 dark:hover:text-cream dark:hover:bg-espresso-700"
                title="New conversation"
              >
                ↺
              </button>
              <button onClick={() => setOpen(false)} className="text-espresso-400 hover:text-espresso-700 text-lg dark:text-espresso-300 dark:hover:text-cream">×</button>
            </div>
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
            {botTyping && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-espresso-100 rounded-2xl rounded-bl-sm px-4 py-3 dark:bg-espresso-700 dark:border-espresso-600">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-espresso-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-espresso-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-espresso-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-espresso-100 bg-white rounded-b-2xl dark:bg-espresso-800 dark:border-espresso-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder={step === 'tracking' ? 'Paste your Order ID...' : 'Type a message...'}
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="btn-primary btn-sm disabled:opacity-50 px-2.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
