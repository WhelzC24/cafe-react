import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { ChatMessage, ChatStep, ChatOrderItem } from '../types'
import { QUICK_CHATS, getCategoryReply, GREETING } from '../data/chat-templates'

const CATEGORIES = ['Coffee', 'Cold Drinks', 'Hot Drinks', 'Pastries', 'Food', 'Other']

let msgId = 0

export function useOrderChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: String(++msgId), role: 'bot', text: GREETING, chips: QUICK_CHATS.map(c => c.label), timestamp: new Date() },
  ])
  const [step, setStep] = useState<ChatStep>('idle')
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<{ name: string; price: number; description?: string; category: string }[]>([])
  const productsLoaded = useRef(false)

  useEffect(() => {
    if (!productsLoaded.current) {
      productsLoaded.current = true
      supabase
        .from('products')
        .select('name,price,category,description')
        .eq('is_available', true)
        .then(({ data }) => {
          if (data) setProducts(data as any)
        })
    }
  }, [])

  const addMessage = useCallback((role: 'bot' | 'user', text: string, chips?: string[]) => {
    setMessages(prev => [...prev, { id: String(++msgId), role, text, chips, timestamp: new Date() }])
  }, [])

  const activeChips = useCallback(() => {
    return ['all', ...new Set(products.map(p => p.category))]
  }, [products])

  const handleChipClick = useCallback(async (label: string) => {
    const chat = QUICK_CHATS.find(c => c.label === label)
    if (chat) {
      addMessage('user', label)
      if (chat.action === 'track_order') {
        addMessage('bot', chat.botReply)
        setStep('tracking')
      } else if (chat.action === 'view_menu') {
        addMessage('bot', chat.botReply, activeChips())
      } else {
        addMessage('bot', chat.botReply)
      }
      return
    }

    if (CATEGORIES.includes(label) || label === 'all') {
      addMessage('user', label === 'all' ? 'Show all items' : `Show ${label}`)
      const reply = getCategoryReply(label, products)
      addMessage('bot', reply, activeChips())
      return
    }
  }, [addMessage, activeChips, products])

  const handleUserInput = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    addMessage('user', trimmed)

    if (step === 'tracking') {
      const orderId = trimmed

      const { data, error } = await supabase.rpc('get_order_status', {
        p_order_id: orderId,
      })

      if (error || !data) {
        addMessage('bot', "I couldn't find that order. Please double-check your Order ID and try again.", [
          ...QUICK_CHATS.map(c => c.label),
        ])
        setStep('idle')
        return
      }

      const order = data as {
        id: string
        customer_name: string
        status: string
        total_amount: number
        created_at: string
        notes: string | null
        items: ChatOrderItem[]
      }

      const statusEmoji: Record<string, string> = {
        pending: '⏳',
        preparing: '👨‍🍳',
        ready: '✅',
        completed: '✔️',
        cancelled: '❌',
      }

      const itemsList = order.items
        .map((i: ChatOrderItem) => `• ${i.quantity}× **${i.product_name}** — ₱${Number(i.line_total).toFixed(2)}`)
        .join('\n')

      addMessage(
        'bot',
        `📋 **Order #${order.id.slice(0, 8).toUpperCase()}**\n\n` +
          `${statusEmoji[order.status] ?? '📦'} **Status:** ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n\n` +
          `**Items:**\n${itemsList}\n\n` +
          `**Total:** ₱${Number(order.total_amount).toFixed(2)}\n` +
          `**Placed:** ${new Date(order.created_at).toLocaleString('en-PH')}`,
        [...QUICK_CHATS.map(c => c.label)],
      )
      setStep('result')
    } else {
      addMessage('bot', "I'm not sure how to help with that. Try one of these options:", [
        ...QUICK_CHATS.map(c => c.label),
      ])
    }
  }, [addMessage, step])

  const resetChat = useCallback(() => {
    setMessages([
      { id: String(++msgId), role: 'bot', text: GREETING, chips: QUICK_CHATS.map(c => c.label), timestamp: new Date() },
    ])
    setStep('idle')
  }, [])

  const toggleOpen = useCallback(() => setOpen(prev => !prev), [])

  return {
    messages,
    step,
    open,
    handleChipClick,
    handleUserInput,
    resetChat,
    toggleOpen,
    setOpen,
  }
}
