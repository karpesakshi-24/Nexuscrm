import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailsApi } from '../api'
import { Modal, Input, Textarea, EmptyState, Spinner } from '../components/ui'
import { timeAgo, extractError } from '../utils'
import toast from 'react-hot-toast'
import { Mail, Plus, Send, Inbox, User } from 'lucide-react'

function ComposeForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ to_email: '', subject: '', body: '' })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="flex flex-col gap-4">
      <Input label="To (Email) *" type="email" value={form.to_email} onChange={f('to_email')} required placeholder="contact@example.com" />
      <Input label="Subject *" value={form.subject} onChange={f('subject')} required />
      <div className="flex flex-col gap-1.5">
        <label className="label">Message *</label>
        <textarea
          className="input resize-none"
          rows={8}
          value={form.body}
          onChange={f('body')}
          required
          placeholder="Write your email here…"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Spinner size={14} /> : <Send size={14} />}
          {loading ? 'Sending…' : 'Send Email'}
        </button>
      </div>
    </form>
  )
}

function ThreadPanel({ thread }) {
  if (!thread) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(195,65,240,0.1)' }}>
          <Mail size={24} style={{ color: '#c341f0' }} />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a thread to view</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{thread.subject}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{thread.participant_email}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {(thread.emails || []).map((email) => (
          <div key={email.id} className={`flex flex-col gap-1.5 ${email.direction === 'outbound' ? 'items-end' : 'items-start'}`}>
            <div className="max-w-[80%] rounded-2xl px-4 py-3"
              style={{
                background: email.direction === 'outbound' ? 'rgba(195,65,240,0.15)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{email.body}</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(email.sent_at || email.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Emails() {
  const qc = useQueryClient()
  const [showCompose, setShowCompose] = useState(false)
  const [selectedThread, setSelectedThread] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['email-threads'],
    queryFn: () => emailsApi.threads().then(r => r.data),
  })

  const { data: threadDetail } = useQuery({
    queryKey: ['email-thread', selectedThread],
    queryFn: () => emailsApi.getThread(selectedThread).then(r => r.data),
    enabled: !!selectedThread,
  })

  const sendMutation = useMutation({
    mutationFn: emailsApi.send,
    onSuccess: () => {
      qc.invalidateQueries(['email-threads'])
      setShowCompose(false)
      toast.success('Email sent!')
    },
    onError: (err) => toast.error(extractError(err)),
  })

  const threads = Array.isArray(data) ? data : data?.results || []

  return (
    <div className="flex flex-col gap-0 h-full" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="page-title">Emails</h1>
        <button onClick={() => setShowCompose(true)} className="btn-primary">
          <Plus size={15} /> Compose
        </button>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden card">
        {/* Thread list */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto" style={{ borderRight: '1px solid var(--border)' }}>
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 table-row">
                <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="skeleton h-4 w-28 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
            ))
          ) : threads.length === 0 ? (
            <EmptyState icon={Inbox} title="No emails yet" description="Compose your first email" />
          ) : threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedThread(t.id)}
              className="flex gap-3 p-4 text-left table-row w-full transition-colors"
              style={{ background: selectedThread === t.id ? 'rgba(195,65,240,0.08)' : undefined }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(195,65,240,0.1)' }}>
                <User size={14} style={{ color: '#c341f0' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {t.subject || '(no subject)'}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t.participant_email || t.to_email}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Thread panel */}
        <ThreadPanel thread={threadDetail} />
      </div>

      <Modal open={showCompose} onClose={() => setShowCompose(false)} title="Compose Email" size="lg">
        <ComposeForm onSubmit={(d) => sendMutation.mutate(d)} loading={sendMutation.isPending} />
      </Modal>
    </div>
  )
}
