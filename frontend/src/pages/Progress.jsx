import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

const Progress = () => {
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-primary-500" />
          Progress
        </h1>
        <p className="text-secondary-600 mt-2 mb-8">
          Track your fitness and nutrition progress over time
        </p>
        
        <div className="card p-8 text-center">
          <p className="text-secondary-500">
            Progress tracking interface coming soon...
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Progress
