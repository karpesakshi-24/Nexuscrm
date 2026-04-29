import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { contactsApi } from '../api'
import { Avatar, Badge, Modal, Input, Select, Textarea, EmptyState, ConfirmDialog, Spinner } from '../components/ui'
import { statusColors, extractError, formatDate } from '../utils'
import toast from 'react-hot-toast'
import { Search, Plus, Users, Download, Filter, Trash2, ExternalLink } from 'lucide-react'

const STATUS_OPTIONS = ['lead', 'prospect', 'customer', 'churned']
const SOURCE_OPTIONS = ['website', 'referral', 'cold_call', 'email', 'social', 'other']

function ContactForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || {
    first_name: '', last_name: '', email: '', phone: '',
    company: '', job_title: '', status: 'lead', source: 'other', notes: ''
  })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name *" value={form.first_name} onChange={f('first_name')} required />
        <Input label="Last Name" value={form.last_name} onChange={f('last_name')} />
      </div>
      <Input label="Email *" type="email" value={form.email} onChange={f('email')} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phone" value={form.phone} onChange={f('phone')} />
        <Input label="Company" value={form.company} onChange={f('company')} />
      </div>
      <Input label="Job Title" value={form.job_title} onChange={f('job_title')} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={form.status} onChange={f('status')}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select label="Source" value={form.source} onChange={f('source')}>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
      </div>
      <Textarea label="Notes" value={form.notes} onChange={f('notes')} />
      <div className="flex gap-2 justify-end pt-1">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Spinner size={14} />}
          {initial ? 'Save Changes' : 'Create Contact'}
        </button>
      </div>
    </form>
  )
}

export default function Contacts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search, statusFilter, page],
    queryFn: () => contactsApi.list({ search, status: statusFilter || undefined, page }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMutation = useMutation({
    mutationFn: (d) => contactsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries(['contacts'])
      setShowCreate(false)
      toast.success('Contact created!')
    },
    onError: (err) => toast.error(extractError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => contactsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['contacts'])
      setDeleteId(null)
      toast.success('Contact deleted')
    },
    onError: (err) => toast.error(extractError(err)),
  })

  const handleExport = async () => {
    try {
      const { data: blob } = await contactsApi.exportCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'contacts.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const contacts = data?.results || []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data?.count !== undefined ? `${data.count} contacts` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-ghost">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={15} /> New Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.04)' }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Contact', 'Company', 'Status', 'Source', 'Created', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" style={{ width: j === 0 ? 160 : j === 5 ? 60 : 80 }} /></td>
                    ))}
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Users} title="No contacts found"
                      description={search ? 'Try a different search term' : 'Create your first contact to get started'}
                      action={!search && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} />New Contact</button>} />
                  </td>
                </tr>
              ) : contacts.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link to={`/contacts/${c.id}`} className="flex items-center gap-3 group">
                      <Avatar name={`${c.first_name} ${c.last_name}`} src={c.avatar} size="sm" />
                      <div>
                        <p className="text-sm font-medium group-hover:text-purple-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {c.company || '—'}
                    {c.job_title && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.job_title}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColors[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {c.source?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/contacts/${c.id}`} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={14} />
                      </Link>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Page {page} of {Math.ceil(data.count / 20)}
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost py-1.5 px-3 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn-ghost py-1.5 px-3 text-xs" disabled={!data.next} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Contact" size="lg">
        <ContactForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Contact"
        message="This contact and all their data will be permanently deleted. This cannot be undone."
        danger
      />
    </div>
  )
}
