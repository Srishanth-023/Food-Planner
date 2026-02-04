import { motion } from 'framer-motion'
import { UtensilsCrossed } from 'lucide-react'

const FoodLog = () => {
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title flex items-center gap-3">
          <UtensilsCrossed className="w-7 h-7 text-primary-500" />
          Food Log
        </h1>
        <p className="text-secondary-600 mt-2 mb-8">
          Track your daily food intake and nutrition
        </p>
        
        {/* Placeholder for full implementation */}
        <div className="card p-8 text-center">
          <p className="text-secondary-500">
            Food logging interface coming soon...
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default FoodLog
