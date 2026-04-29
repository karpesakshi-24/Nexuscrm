import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api'
import { Badge, Modal, Input, Select, Textarea, EmptyState, ConfirmDialog, Spinner } from '../components/ui'
import { priorityColors, formatDate, isOverdue, extractError } from '../utils'
import toast from 'react-hot-toast'
import { Plus, CheckSquare, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
]

function TaskForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo', due_date: ''
  })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="flex flex-col gap-4">
      <Input label="Title *" value={form.title} onChange={f('title')} required />
      <Textarea label="Description" value={form.description} onChange={f('description')} />
      <div className="grid grid-cols-3 gap-3">
        <Select label="Priority" value={form.priority} onChange={f('priority')}>
          {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={f('status')}>
          {['todo', 'in_progress', 'done', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Input label="Due Date" type="datetime-local" value={form.due_date} onChange={f('due_date')} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Spinner size={14} />} Create Task
        </button>
      </div>
    </form>
  )
}

function TaskRow({ task, onToggle, onDelete }) {
  const done = task.status === 'done'
  const overdue = isOverdue(task.due_date) && !done

  return (
    <div className="flex items-start gap-3 px-4 py-3 table-row group">
      <button onClick={() => onToggle(task)} className="mt-0.5 flex-shrink-0 transition-colors"
        style={{ color: done ? '#10b981' : 'var(--text-muted)' }}>
        {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', done && 'line-through')}
          style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant={priorityColors[task.priority]} className="text-xs">{task.priority}</Badge>
          {task.due_date && (
            <span className="flex items-center gap-1 text-xs"
              style={{ color: overdue ? '#f43f5e' : 'var(--text-muted)' }}>
              {overdue && <AlertCircle size={11} />}
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(task.id)}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
        style={{ color: 'var(--text-muted)' }}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function Tasks() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const queryFns = {
    all: () => tasksApi.list({ page_size: 50 }).then(r => r.data),
    today: () => tasksApi.today().then(r => r.data),
    overdue: () => tasksApi.overdue().then(r => r.data),
    upcoming: () => tasksApi.upcoming().then(r => r.data),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', tab],
    queryFn: queryFns[tab],
  })

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => { qc.invalidateQueries(['tasks']); setShowCreate(false); toast.success('Task created!') },
    onError: (err) => toast.error(extractError(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task updated') },
    onError: (err) => toast.error(extractError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => { qc.invalidateQueries(['tasks']); setDeleteId(null); toast.success('Task deleted') },
    onError: (err) => toast.error(extractError(err)),
  })

  const handleToggle = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    updateMutation.mutate({ id: task.id, data: { status: newStatus } })
  }

  const tasks = Array.isArray(data) ? data : data?.results || []

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Tasks</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.key ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="card overflow-hidden">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 table-row">
              <div className="skeleton w-5 h-5 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks here"
            description={tab === 'overdue' ? "You're all caught up!" : "Create a task to stay organized"}
            action={tab === 'all' && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} />New Task</button>} />
        ) : (
          tasks.map(task => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={setDeleteId} />
          ))
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="lg">
        <TaskForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Task"
        message="This task will be permanently deleted."
        danger
      />
    </div>
  )
}
