import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Camera,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  User,
  X,
  Salad,
  Leaf
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Food Log', href: '/food-log', icon: UtensilsCrossed },
  { name: 'Analyze Food', href: '/analyze', icon: Camera },
  { name: 'Meal Plan', href: '/meal-plan', icon: Salad },
  { name: 'Workout Plan', href: '/workout-plan', icon: Dumbbell },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare },
  { name: 'Profile', href: '/profile', icon: User },
]

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation()
  
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-white">NutriVision</h1>
          <p className="text-xs text-secondary-400">AI Nutrition Planner</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-secondary-400 hover:text-white hover:bg-secondary-700'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                />
              )}
            </NavLink>
          )
        })}
      </nav>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-secondary-700">
        <p className="text-xs text-secondary-500">
          © 2024 NutriVision AI
        </p>
      </div>
    </>
  )
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-secondary-800 shadow-xl">
          <SidebarContent />
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-secondary-800 shadow-xl lg:hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-secondary-400 hover:text-white hover:bg-secondary-700"
              >
                <X className="w-5 h-5" />
              </button>
              
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
