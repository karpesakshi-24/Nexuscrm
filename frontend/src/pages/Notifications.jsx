import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api'
import { EmptyState, Spinner } from '../components/ui'
import { timeAgo } from '../utils'
import toast from 'react-hot-toast'
import { Bell, CheckCheck, Circle } from 'lucide-react'

export default function Notifications() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications', 'unread']); toast.success('All marked as read') },
  })

  const markOneMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications', 'unread']) },
  })

  const notifications = Array.isArray(data) ? data : data?.results || []
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="page-title">Notifications</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(195,65,240,0.15)', color: '#c341f0' }}>
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}
            className="btn-ghost text-sm">
            {markAllMutation.isPending ? <Spinner size={14} /> : <CheckCheck size={15} />}
            Mark all read
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-4 table-row">
              <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : notifications.map((n) => (
          <div
            key={n.id}
            className="flex gap-3 px-5 py-4 table-row cursor-pointer"
            style={{ background: !n.is_read ? 'rgba(195,65,240,0.04)' : undefined }}
            onClick={() => !n.is_read && markOneMutation.mutate(n.id)}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: !n.is_read ? 'rgba(195,65,240,0.15)' : 'rgba(255,255,255,0.05)' }}>
              <Bell size={15} style={{ color: !n.is_read ? '#c341f0' : 'var(--text-muted)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
              {n.message && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>}
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.created_at)}</p>
            </div>
            {!n.is_read && (
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: '#c341f0' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
