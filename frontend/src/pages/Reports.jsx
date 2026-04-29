import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api'
import { Avatar, Skeleton } from '../components/ui'
import { formatCurrency } from '../utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell, AreaChart, Area
} from 'recharts'

const COLORS = ['#c341f0', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']

const TooltipContent = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="rounded-xl px-3 py-2 text-sm shadow-xl"
      style={{ background: '#1e1a35', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}>
      <p className="font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name?.toLowerCase().includes('revenue') || p.name?.toLowerCase().includes('value')
            ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
  return null
}

function SectionCard({ title, children }) {
  return (
    <div className="card p-5">
      <p className="section-title mb-4">{title}</p>
      {children}
    </div>
  )
}

export default function Reports() {
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['reports', 'monthly-revenue'],
    queryFn: () => reportsApi.monthlyRevenue().then(r => r.data),
  })

  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['reports', 'funnel'],
    queryFn: () => reportsApi.pipelineFunnel().then(r => r.data),
  })

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ['reports', 'leaderboard'],
    queryFn: () => reportsApi.agentLeaderboard().then(r => r.data),
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Performance analytics & insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue */}
        <SectionCard title="Monthly Revenue">
          {revLoading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenue || []}>
                <defs>
                  <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c341f0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c341f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipContent />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#c341f0" fill="url(#revGrad2)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Pipeline Funnel */}
        <SectionCard title="Pipeline Funnel">
          {funnelLoading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnel || []} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<TooltipContent />} />
                <Bar dataKey="count" name="Deals" radius={4}>
                  {(funnel || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Agent Leaderboard */}
      <SectionCard title="Agent Leaderboard">
        {lbLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Rank', 'Agent', 'Deals Won', 'Deals Total', 'Revenue'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(leaderboard || []).map((agent, i) => (
                  <tr key={agent.id} className="table-row">
                    <td className="py-3 pr-4">
                      <span className="font-bold" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)', fontFamily: 'Syne' }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${agent.first_name} ${agent.last_name}`} size="sm" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {agent.first_name} {agent.last_name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{agent.won_deals ?? 0}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{agent.total_deals ?? 0}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-semibold" style={{ color: '#c341f0' }}>{formatCurrency(agent.total_value || 0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
