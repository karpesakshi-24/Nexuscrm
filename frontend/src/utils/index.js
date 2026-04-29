import { clsx } from 'clsx'
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'

export const cn = (...args) => clsx(args)

export const formatDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d, yyyy')
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy · h:mm a')
}

export const timeAgo = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const isOverdue = (date) => {
  if (!date) return false
  return isPast(new Date(date))
}

export const formatCurrency = (value, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export const statusColors = {
  lead: 'status-lead',
  prospect: 'status-prospect',
  customer: 'status-customer',
  churned: 'status-churned',
}

export const priorityColors = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  urgent: 'priority-urgent',
}

export const dealColors = {
  open: 'deal-open',
  won: 'deal-won',
  lost: 'deal-lost',
}

export const extractError = (err) => {
  const data = err?.response?.data
  if (!data) return err?.message || 'An error occurred'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const first = Object.values(data)[0]
  if (Array.isArray(first)) return first[0]
  return 'An error occurred'
}
