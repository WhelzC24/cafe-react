import { marked } from 'marked'
import { ChatMessage as ChatMessageType } from '../../types'

interface ChatMessageProps {
  message: ChatMessageType
}

export default function ChatMessage({ message: m }: ChatMessageProps) {
  const isBot = m.role === 'bot'

  const html = isBot
    ? marked.parse(m.text, { async: false, breaks: true }) as string
    : m.text

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isBot
            ? 'bg-white border border-espresso-100 text-espresso-900 rounded-bl-sm prose prose-sm max-w-none dark:bg-espresso-700 dark:border-espresso-600 dark:text-cream dark:prose-invert'
            : 'bg-espresso-900 text-cream rounded-br-sm'
        }`}
      >
        {isBot ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="whitespace-pre-wrap">{html}</p>
        )}
      </div>
    </div>
  )
}
