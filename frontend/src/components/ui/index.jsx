import { getInitials, cn } from '../../utils'
import { Loader2, X } from 'lucide-react'
import { useEffect } from 'react'

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ name, src, size = 'md', className }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  if (src) return (
    <img src={src} alt={name} className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)} />
  )
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold flex-shrink-0', sizes[size], className)}
      style={{ background: 'linear-gradient(135deg, #c341f0 0%, #7c3aed 100%)', color: 'white' }}>
      {getInitials(name)}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, className, variant }) {
  return (
    <span className={cn('badge', variant, className)}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 16, className }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} style={{ color: '#c341f0' }} />
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div
        className={cn('relative w-full rounded-2xl animate-fade-up', sizes[size])}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
          style={{ background: 'rgba(195,65,240,0.1)' }}>
          <Icon size={24} style={{ color: '#c341f0' }} />
        </div>
      )}
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label">{label}</label>}
      <input className={cn('input', className)} {...props} />
      {error && <p className="text-xs" style={{ color: '#f43f5e' }}>{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────
export function Select({ label, error, className, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label">{label}</label>}
      <select
        className={cn('input', className)}
        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs" style={{ color: '#f43f5e' }}>{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label">{label}</label>}
      <textarea className={cn('input resize-none', className)} rows={3} {...props} />
      {error && <p className="text-xs" style={{ color: '#f43f5e' }}>{error}</p>}
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <div className="flex gap-2 justify-end">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white transition-all"
          style={{ background: danger ? '#f43f5e' : '#c341f0' }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}
