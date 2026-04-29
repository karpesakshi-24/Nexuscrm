import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api'
import { Skeleton, Avatar } from '../components/ui'
import { formatCurrency, timeAgo } from '../utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Users, CheckSquare, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const COLORS = ['#c341f0', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-sm shadow-xl"
        style={{ background: '#1e1a35', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}>
        <p className="font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
              ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function StatCard({ title, value, icon: Icon, change, color, loading }) {
  const positive = change >= 0
  return (
    <div className="stat-card animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      {loading
        ? <Skeleton className="h-8 w-28 mt-1" />
        : <p className="text-3xl font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>{value}</p>
      }
      {change !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          {positive
            ? <ArrowUpRight size={13} style={{ color: '#10b981' }} />
            : <ArrowDownRight size={13} style={{ color: '#f43f5e' }} />}
          <span style={{ color: positive ? '#10b981' : '#f43f5e' }}>
            {Math.abs(change)}% vs last month
          </span>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.dashboard().then(r => r.data),
  })

  const { data: revenue } = useQuery({
    queryKey: ['reports', 'monthly-revenue'],
    queryFn: () => reportsApi.monthlyRevenue().then(r => r.data),
  })

  const { data: funnel } = useQuery({
    queryKey: ['reports', 'funnel'],
    queryFn: () => reportsApi.pipelineFunnel().then(r => r.data),
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['reports', 'leaderboard'],
    queryFn: () => reportsApi.agentLeaderboard().then(r => r.data),
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Welcome back — here's what's happening</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={dash?.total_contacts ?? '—'} icon={Users} color="#c341f0" loading={isLoading} />
        <StatCard title="Open Deals" value={dash?.open_deals ?? '—'} icon={TrendingUp} color="#10b981" loading={isLoading} />
        <StatCard title="Tasks Due Today" value={dash?.tasks_due_today ?? '—'} icon={CheckSquare} color="#f59e0b" loading={isLoading} />
        <StatCard title="Won This Month" value={dash?.won_this_month !== undefined ? formatCurrency(dash.won_this_month) : '—'} icon={DollarSign} color="#38bdf8" loading={isLoading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Monthly Revenue</p>
          {revenue?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c341f0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c341f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#c341f0" fill="url(#revGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Pipeline funnel */}
        <div className="card p-5">
          <p className="section-title mb-4">Pipeline Funnel</p>
          {funnel?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Deals" radius={4}>
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-5">
        <p className="section-title mb-4">Agent Leaderboard</p>
        {leaderboard?.length ? (
          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 5).map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-3 py-2 px-2 rounded-xl transition-colors hover:bg-white/[0.03]">
                <span className="w-6 text-center text-sm font-bold" style={{ color: i === 0 ? '#f59e0b' : 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>
                  {i + 1}
                </span>
                <Avatar name={`${agent.first_name} ${agent.last_name}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {agent.first_name} {agent.last_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.won_deals} deals won</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#10b981' }}>{formatCurrency(agent.total_value || 0)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
