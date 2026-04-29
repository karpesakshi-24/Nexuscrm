import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { Avatar, Input, Modal, Select, Spinner } from '../components/ui'
import { extractError } from '../utils'
import toast from 'react-hot-toast'
import { User, Lock, Users, Shield, Plus } from 'lucide-react'

function ProfileSection({ user }) {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const mutation = useMutation({
    mutationFn: (d) => authApi.updateUser(user.id, d),
    onSuccess: ({ data }) => {
      setUser(data)
      qc.invalidateQueries(['me'])
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(extractError(err)),
  })

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <User size={16} style={{ color: '#c341f0' }} />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h3>
      </div>
      <div className="flex items-center gap-4 mb-5">
        <Avatar name={`${user?.first_name} ${user?.last_name}`} src={user?.avatar} size="lg" />
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.first_name} {user?.last_name}</p>
          <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role} · @{user?.username}</p>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={form.first_name} onChange={f('first_name')} />
          <Input label="Last Name" value={form.last_name} onChange={f('last_name')} />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={f('email')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" value={form.phone} onChange={f('phone')} />
          <Input label="Department" value={form.department} onChange={f('department')} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending && <Spinner size={14} />} Save Profile
          </button>
        </div>
      </form>
    </div>
  )
}

function PasswordSection({ userId }) {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authApi.changePassword({ old_password: form.old_password, new_password: form.new_password })
      toast.success('Password changed!')
      setForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={16} style={{ color: '#c341f0' }} />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Current Password" type="password" value={form.old_password} onChange={f('old_password')} required />
        <Input label="New Password" type="password" value={form.new_password} onChange={f('new_password')} required />
        <Input label="Confirm New Password" type="password" value={form.confirm} onChange={f('confirm')} required />
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Spinner size={14} />} Change Password
          </button>
        </div>
      </form>
    </div>
  )
}

function UsersSection() {
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', role: 'agent' })
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.users().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: authApi.createUser,
    onSuccess: () => { qc.invalidateQueries(['users']); setShowCreate(false); toast.success('User created!') },
    onError: (err) => toast.error(extractError(err)),
  })

  const users = Array.isArray(data) ? data : data?.results || []

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: '#c341f0' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Team Members</h3>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-1.5">
          <Plus size={13} /> Invite User
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
            <Avatar name={`${u.first_name} ${u.last_name}`} src={u.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {u.first_name} {u.last_name || ''} <span style={{ color: 'var(--text-muted)' }}>@{u.username}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
              style={{ background: u.role === 'admin' ? 'rgba(195,65,240,0.12)' : u.role === 'manager' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.06)', color: u.role === 'admin' ? '#c341f0' : u.role === 'manager' ? '#38bdf8' : 'var(--text-muted)' }}>
              {u.role}
            </span>
            <div className="w-2 h-2 rounded-full" style={{ background: u.is_active ? '#10b981' : '#f43f5e' }} title={u.is_active ? 'Active' : 'Inactive'} />
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Invite Team Member">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm) }} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={createForm.first_name} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} />
            <Input label="Last Name" value={createForm.last_name} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} />
          </div>
          <Input label="Username *" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} required />
          <Input label="Email" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
          <Input label="Password *" type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required />
          <Select label="Role" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
            <option value="agent">Agent</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending && <Spinner size={14} />} Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const isManager = useAuthStore((s) => s.isManager())

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <h1 className="page-title">Settings</h1>
      <ProfileSection user={user} />
      <PasswordSection userId={user?.id} />
      {isManager && <UsersSection />}
    </div>
  )
}
