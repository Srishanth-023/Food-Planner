import { motion } from 'framer-motion'
import { User } from 'lucide-react'

const Profile = () => {
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title flex items-center gap-3">
          <User className="w-7 h-7 text-primary-500" />
          Profile
        </h1>
        <p className="text-secondary-600 mt-2 mb-8">
          Manage your account and preferences
        </p>
        
        <div className="card p-8 text-center">
          <p className="text-secondary-500">
            Profile management interface coming soon...
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Profile
