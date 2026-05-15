export type Role = 'admin' | 'staff'

export interface Profile {
  id: string
  fullname: string
  username: string
  role: Role
  must_change_password: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  price: number
  image_url: string | null
  is_available: boolean
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  notes: string | null
  total_amount: number
  status: OrderStatus
  processed_by: string | null
  created_at: string
  // joined
  processed_by_name?: string | null
  items?: OrderItem[]
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface CartItem {
  product: Product
  qty: number
}

export type Cart = Record<string, CartItem>

export const CATEGORIES = ['Coffee', 'Cold Drinks', 'Hot Drinks', 'Pastries', 'Food', 'Other'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_ICONS: Record<string, string> = {
  Coffee: '☕',
  'Cold Drinks': '🧊',
  'Hot Drinks': '🍵',
  Pastries: '🥐',
  Food: '🥪',
  Other: '🍴',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   'Pending',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready:     'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

export interface Notification {
  id: string
  profile_id: string | null
  type: 'new_order' | 'order_ready' | 'staff_created'
  title: string
  message: string
  data: {
    order_id?: string
    customer_name?: string
    total_amount?: number
  }
  is_read: boolean
  created_at: string
}

export type ChatStep = 'idle' | 'tracking' | 'result'

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
  chips?: string[]
  items?: ChatOrderItem[]
  timestamp: Date
}

export interface ChatOrderItem {
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

export const fmt = (p: number | string) => '₱' + Number(p).toFixed(2)
