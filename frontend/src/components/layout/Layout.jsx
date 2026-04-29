import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar — hidden on mobile, visible on desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — visible on mobile only */}
      <div className="md:hidden">
        <Sidebar mobile />
      </div>
    </div>
  )
}