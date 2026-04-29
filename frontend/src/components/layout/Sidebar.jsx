import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import { Avatar } from '../ui'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, CheckSquare, GitBranch,
  Mail, Bell, BarChart3, Settings, LogOut, Zap
} from 'lucide-react'
import { useState } from 'react'
import { notificationsApi } from '../../api'
import { useQuery } from '@tanstack/react-query'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/emails', icon: Mail, label: 'Emails' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.unreadCount().then(r => r.data),
    refetchInterval: 30000,
  })
  const unread = unreadData?.count || 0

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await authApi.logout(refreshToken)
    } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <aside
      className="flex flex-col w-60 min-h-screen flex-shrink-0"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #c341f0, #7c3aed)' }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        <span className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
          NexusCRM
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && unread > 0 && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: '#c341f0', color: 'white', fontSize: '10px' }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Avatar name={user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username} src={user?.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.first_name || user?.username}
            </p>
            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
