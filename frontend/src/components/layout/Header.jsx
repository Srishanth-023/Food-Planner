import { Menu, Bell, Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'
import { useState, useRef, useEffect } from 'react'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleLogout = async () => {
    await logout()
  }
  
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-secondary-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search */}
            <div className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search foods, recipes..."
                  className="w-64 pl-10 pr-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full"></span>
            </button>
            
            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.profile?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-secondary-800">
                    {user?.profile?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {user?.email}
                  </p>
                </div>
              </button>
              
              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
