import { CATEGORIES, CATEGORY_ICONS } from '../types'

export interface QuickChatDef {
  label: string
  icon: string
  botReply: string
  chips?: string[]
  action?: 'track_order' | 'view_menu' | 'none'
}

export const QUICK_CHATS: QuickChatDef[] = [
  {
    label: 'Track my order',
    icon: '🔍',
    botReply: "Sure! Please paste your **Order ID** (from your order receipt) and I'll look it up for you.",
    action: 'track_order',
  },
  {
    label: 'View menu',
    icon: '📋',
    botReply: 'Here are our menu categories — tap one to see items and prices!',
    chips: ['all', ...CATEGORIES],
    action: 'view_menu',
  },
  {
    label: 'Store hours',
    icon: '🕐',
    botReply: 'We are open daily!\n\n🕐 **Mon–Fri:** 7:00 AM – 8:00 PM\n🕐 **Sat–Sun:** 8:00 AM – 9:00 PM\n\n📍 Cuasi, Loon, Bohol',
  },
  {
    label: 'Our location',
    icon: '📍',
    botReply: 'You can find us at:\n\n**Cozy Corner Café**\nCuasi, Loon, Bohol, Philippines\n\n📍 [Open in Google Maps](https://maps.google.com/?q=Cuasi+Loon+Bohol+Philippines)',
  },
  {
    label: 'Contact us',
    icon: '📞',
    botReply: '📞 **Phone:** 09361679546\n✉️ **Email:** wlaniba330@gmail.com\n\nWe\'d love to hear from you!',
  },
]

export const CATEGORY_CHIPS = (products: { category: string }[]) =>
  ['all', ...CATEGORIES.filter(c => products.some(p => p.category === c))]

export function getCategoryReply(category: string, products: { name: string; price: number; description?: string; category: string }[]): string {
  if (category === 'all') {
    const lines = products.map(p => `• **${p.name}** — ₱${p.price.toFixed(2)}${p.description ? `\n  _${p.description}_` : ''}`)
    return `Here's our **full menu**:\n\n${lines.join('\n')}`
  }
  const filtered = products.filter(p => p.category === category)
  const icon = CATEGORY_ICONS[category] ?? ''
  const lines = filtered.map(p => `• **${p.name}** — ₱${p.price.toFixed(2)}${p.description ? `\n  _${p.description}_` : ''}`)
  return `${icon} **${category}** — ${filtered.length} item(s):\n\n${lines.join('\n')}`
}

export const GREETING = `☕ **Welcome to Cozy Corner Café!**

How can I help you today?`
