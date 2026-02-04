import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useState } from 'react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
