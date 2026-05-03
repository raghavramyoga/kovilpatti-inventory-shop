import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { Drawer, IconButton } from '@mui/material'
import Sidebar from './Sidebar'
import { useApp } from '../context/AppContext'
import './Layout.css'

export default function Layout() {
  const { currentUser } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!currentUser) return <Navigate to="/admin/login" replace />

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      <Drawer
        className="layout-drawer"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="layout-header px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 sticky top-0 z-10">
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { lg: 'none' }, color: '#1F1F1F' }}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </IconButton>

          <div className="ml-auto flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              className="relative p-2 rounded-lg flex-shrink-0 transition hover:bg-[#FCD835]/30"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#1F1F1F]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C62828] rounded-full" />
            </button>
            <div className="text-sm text-[#1F1F1F]/65 hidden xl:block truncate font-medium">
              <span className="font-bold text-[#1F1F1F] uppercase tracking-wide">Kovilpatti Murukku &amp; Snacks</span> — Chennai
            </div>
            <div className="text-sm text-[#1F1F1F]/65 hidden md:block xl:hidden truncate font-medium">
              <span className="font-bold text-[#1F1F1F] uppercase tracking-wide">Chennai</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
