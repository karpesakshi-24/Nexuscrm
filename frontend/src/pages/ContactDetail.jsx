import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi } from '../api'
import { Avatar, Badge, Modal, Input, Select, Textarea, Spinner } from '../components/ui'
import { statusColors, formatDateTime, timeAgo, extractError } from '../utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Phone, Mail, Building2, Globe, MapPin, MessageSquare, PhoneCall, Video, Clock, Edit2, Trash2 } from 'lucide-react'

const ACTIVITY_ICONS = {
  note: MessageSquare,
  call: PhoneCall,
  meeting: Video,
  email: Mail,
  status_change: Clock,
}

const ACTIVITY_COLORS = {
  note: '#c341f0',
  call: '#10b981',
  meeting: '#38bdf8',
  email: '#f59e0b',
  status_change: '#94a3b8',
}

function ActivityForm({ contactId, onSuccess }) {
  const [form, setForm] = useState({ activity_type: 'note', title: '', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await contactsApi.addActivity(contactId, form)
      toast.success('Activity logged')
      setForm({ activity_type: 'note', title: '', description: '' })
      onSuccess()
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Type" value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value })}>
          {['note', 'call', 'meeting', 'email', 'status_change'].map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </Select>
        <Input label="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      </div>
      <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <button type="submit" disabled={loading} className="btn-primary self-end">
        {loading && <Spinner size={14} />} Log Activity
      </button>
    </form>
  )
}

export default function ContactDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.get(id).then(r => r.data),
    onSuccess: (d) => setEditForm(d),
  })

  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['contact-activities', id],
    queryFn: () => contactsApi.activities(id).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (d) => contactsApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries(['contact', id])
      qc.invalidateQueries(['contacts'])
      setEditOpen(false)
      toast.success('Contact updated')
    },
    onError: (err) => toast.error(extractError(err)),
  })

  const handleSaveEdit = (e) => {
    e.preventDefault()
    updateMutation.mutate(editForm)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )

  if (!contact) return <div style={{ color: 'var(--text-muted)' }}>Contact not found</div>

  const activityList = Array.isArray(activities) ? activities : activities?.results || []

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title">{contact.first_name} {contact.last_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: info */}
        <div className="flex flex-col gap-4">
          {/* Profile card */}
          <div className="card p-5 flex flex-col items-center text-center gap-3">
            <Avatar name={`${contact.first_name} ${contact.last_name}`} src={contact.avatar} size="xl" />
            <div>
              <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {contact.first_name} {contact.last_name}
              </p>
              {contact.job_title && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{contact.job_title}</p>}
              {contact.company && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{contact.company}</p>}
            </div>
            <Badge variant={statusColors[contact.status]}>{contact.status}</Badge>
            <button onClick={() => { setEditForm(contact); setEditOpen(true) }} className="btn-ghost w-full text-sm py-1.5">
              <Edit2 size={13} /> Edit Contact
            </button>
          </div>

          {/* Details */}
          <div className="card p-5 flex flex-col gap-3">
            <p className="section-title">Details</p>
            {[
              { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
              { icon: Phone, label: contact.phone || '—' },
              { icon: Building2, label: contact.company || '—' },
              { icon: Globe, label: contact.website, href: contact.website },
              { icon: MapPin, label: [contact.city, contact.state, contact.country].filter(Boolean).join(', ') || '—' },
            ].map(({ icon: Icon, label, href }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                {href
                  ? <a href={href} target="_blank" rel="noreferrer" className="text-sm truncate hover:text-purple-400 transition-colors" style={{ color: 'var(--text-secondary)' }}>{label}</a>
                  : <span className="text-sm truncate" style={{ color: label === '—' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{label}</span>
                }
              </div>
            ))}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="card p-5">
              <p className="section-title mb-2">Notes</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Right: activity */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Log activity */}
          <div className="card p-5">
            <p className="section-title mb-4">Log Activity</p>
            <ActivityForm contactId={id} onSuccess={() => { qc.invalidateQueries(['contact-activities', id]) }} />
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <p className="section-title mb-4">Activity Timeline</p>
            {activityList.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No activities yet</p>
            ) : (
              <div className="flex flex-col gap-4">
                {activityList.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.activity_type] || MessageSquare
                  const color = ACTIVITY_COLORS[a.activity_type] || '#94a3b8'
                  return (
                    <div key={a.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}20` }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(a.created_at)}</span>
                        </div>
                        {a.description && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
                        )}
                        {a.user && (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            by {a.user.first_name || a.user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Contact" size="lg">
        {editForm && (
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={editForm.first_name || ''} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
              <Input label="Last Name" value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
            </div>
            <Input label="Email" type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              <Input label="Company" value={editForm.company || ''} onChange={e => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <Input label="Job Title" value={editForm.job_title || ''} onChange={e => setEditForm({ ...editForm, job_title: e.target.value })} />
            <Select label="Status" value={editForm.status || 'lead'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              {['lead','prospect','customer','churned'].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Textarea label="Notes" value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending && <Spinner size={14} />} Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
