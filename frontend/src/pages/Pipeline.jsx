import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, closestCenter,
  useDraggable, useDroppable, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import { pipelineApi } from '../api'
import { Badge, Modal, Input, Select, Textarea, EmptyState, Spinner } from '../components/ui'
import { dealColors, formatCurrency, extractError } from '../utils'
import toast from 'react-hot-toast'
import { GitBranch, Plus, ChevronDown, IndianRupee } from 'lucide-react'

function DealCard({ deal, isDragging }) {
  return (
    <div
      className={`card-hover p-3 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 rotate-1' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{deal.title}</p>
        <Badge variant={dealColors[deal.status]} className="flex-shrink-0">{deal.status}</Badge>
      </div>
      {deal.contact && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{deal.contact_name || 'Contact'}</p>
      )}
      <div className="flex items-center gap-1 mt-2">
        <IndianRupee size={11} style={{ color: '#10b981' }} />
        <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{formatCurrency(deal.value)}</span>
      </div>
      {deal.priority && (
        <div className="mt-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
            style={{
              background: deal.priority === 'high' ? 'rgba(251,146,60,0.12)' : deal.priority === 'urgent' ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.06)',
              color: deal.priority === 'high' ? '#fb923c' : deal.priority === 'urgent' ? '#f43f5e' : 'var(--text-muted)'
            }}>
            {deal.priority}
          </span>
        </div>
      )}
    </div>
  )
}

function DroppableStage({ stage, deals, onAddDeal }) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` })

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 flex flex-col rounded-2xl"
      style={{
        width: 280,
        background: isOver ? 'rgba(195,65,240,0.06)' : 'var(--bg-surface)',
        border: `1px solid ${isOver ? 'rgba(195,65,240,0.3)' : 'var(--border)'}`,
        transition: 'all 0.15s',
      }}
    >
      {/* Stage header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: stage.color || '#c341f0' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stage.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            {deals.length}
          </span>
          <button onClick={() => onAddDeal(stage)} className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}>
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Deals */}
      <div className="flex-1 flex flex-col gap-2 p-3 min-h-[120px]">
        {deals.map((deal) => (
          <DraggableDeal key={deal.id} deal={deal} />
        ))}
      </div>

      {/* Stage total */}
      <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {formatCurrency(deals.reduce((s, d) => s + Number(d.value || 0), 0))}
        </p>
      </div>
    </div>
  )
}

function DraggableDeal({ deal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `deal-${deal.id}` })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  )
}

function DealForm({ stages, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '', value: '', priority: 'medium', status: 'open',
    stage: stages[0]?.id || '', description: ''
  })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, stage: Number(form.stage), value: Number(form.value) }) }}
      className="flex flex-col gap-4">
      <Input label="Deal Title *" value={form.title} onChange={f('title')} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Value (₹) *" type="number" min="0" value={form.value} onChange={f('value')} required />
        <Select label="Stage" value={form.stage} onChange={f('stage')}>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={form.priority} onChange={f('priority')}>
          {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={f('status')}>
          {['open', 'won', 'lost'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <Textarea label="Description" value={form.description} onChange={f('description')} />
      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Spinner size={14} />} Create Deal
        </button>
      </div>
    </form>
  )
}

export default function Pipeline() {
  const qc = useQueryClient()
  const [activePipeline, setActivePipeline] = useState(null)
  const [addDealStage, setAddDealStage] = useState(null)
  const [activeDrag, setActiveDrag] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelineApi.pipelines().then(r => r.data?.results || r.data),
    onSuccess: (d) => { if (d?.length && !activePipeline) setActivePipeline(d[0].id) },
  })

  const { data: kanban, isLoading } = useQuery({
    queryKey: ['kanban', activePipeline],
    queryFn: () => pipelineApi.kanban(activePipeline).then(r => r.data),
    enabled: !!activePipeline,
  })

  const createDealMutation = useMutation({
    mutationFn: (d) => pipelineApi.createDeal({ ...d, pipeline: activePipeline }),
    onSuccess: () => { qc.invalidateQueries(['kanban']); setAddDealStage(null); toast.success('Deal created!') },
    onError: (err) => toast.error(extractError(err)),
  })

  const moveMutation = useMutation({
    mutationFn: ({ dealId, stageId }) => pipelineApi.moveDeal(dealId, { stage: stageId }),
    onSuccess: () => qc.invalidateQueries(['kanban']),
    onError: (err) => toast.error(extractError(err)),
  })

  const handleDragStart = (event) => {
    const dealId = Number(event.active.id.toString().replace('deal-', ''))
    const allDeals = kanban?.stages?.flatMap(s => s.deals || []) || []
    setActiveDrag(allDeals.find(d => d.id === dealId))
  }

  const handleDragEnd = (event) => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const dealId = Number(active.id.toString().replace('deal-', ''))
    const stageId = Number(over.id.toString().replace('stage-', ''))

    if (!dealId || !stageId) return

    const currentStage = kanban?.stages?.find(s => s.deals?.some(d => d.id === dealId))
    if (currentStage?.id === stageId) return

    moveMutation.mutate({ dealId, stageId })
  }

  const stages = kanban?.stages || []

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Pipeline</h1>
        {/* Pipeline selector */}
        {pipelines?.length > 0 && (
          <select
            className="input w-auto"
            value={activePipeline || ''}
            onChange={(e) => setActivePipeline(Number(e.target.value))}
            style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.04)' }}
          >
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] rounded-2xl h-72 skeleton" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <EmptyState icon={GitBranch} title="No pipeline stages" description="Configure your pipeline stages from the admin panel" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map(stage => (
              <DroppableStage
                key={stage.id}
                stage={stage}
                deals={stage.deals || []}
                onAddDeal={setAddDealStage}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDrag ? <div style={{ transform: 'rotate(2deg)', width: 280 }}><DealCard deal={activeDrag} /></div> : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={!!addDealStage} onClose={() => setAddDealStage(null)} title={`New Deal — ${addDealStage?.name || ''}`} size="lg">
        <DealForm
          stages={stages}
          onSubmit={(d) => createDealMutation.mutate({ ...d, stage: addDealStage?.id })}
          loading={createDealMutation.isPending}
        />
      </Modal>
    </div>
  )
}
