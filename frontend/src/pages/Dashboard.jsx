import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@stores/authStore'
import { useFoodStore } from '@stores/foodStore'
import {
  Flame,
  Target,
  TrendingUp,
  Camera,
  Utensils,
  Plus,
  ChevronRight,
  Activity
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Dashboard = () => {
  const { user } = useAuthStore()
  const { todayLog, fetchTodayLog } = useFoodStore()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadData = async () => {
      await fetchTodayLog()
      setIsLoading(false)
    }
    loadData()
  }, [])
  
  // Calculate metrics
  const metrics = user?.calculatedMetrics || {}
  const dailyCalorieTarget = metrics.dailyCalorieTarget || 2000
  const macroTargets = metrics.macroTargets || { protein: 150, carbs: 200, fat: 70 }
  
  // Today's totals
  const caloriesConsumed = todayLog?.totals?.calories || 0
  const proteinConsumed = todayLog?.totals?.protein || 0
  const carbsConsumed = todayLog?.totals?.carbs || 0
  const fatConsumed = todayLog?.totals?.fat || 0
  const glycemicLoad = todayLog?.totals?.glycemicLoad || 0
  
  // Progress percentages
  const calorieProgress = Math.min((caloriesConsumed / dailyCalorieTarget) * 100, 100)
  const proteinProgress = Math.min((proteinConsumed / macroTargets.protein) * 100, 100)
  const carbsProgress = Math.min((carbsConsumed / macroTargets.carbs) * 100, 100)
  const fatProgress = Math.min((fatConsumed / macroTargets.fat) * 100, 100)
  
  // Macro distribution chart data
  const macroChartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [
        proteinConsumed * 4, // calories from protein
        carbsConsumed * 4,   // calories from carbs
        fatConsumed * 9      // calories from fat
      ],
      backgroundColor: ['#3b82f6', '#f97316', '#22c55e'],
      borderWidth: 0
    }]
  }
  
  // Weekly trend data (mock)
  const weeklyTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Calories',
      data: [1850, 2100, 1920, 2200, 1780, caloriesConsumed, 0],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }
  
  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }
  
  return (
    <div className="page-container">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-display font-bold text-secondary-800">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.profile?.firstName || 'there'}! 👋
        </h1>
        <p className="text-secondary-600 mt-1">
          Here's your nutrition summary for today
        </p>
      </motion.div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Calories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
              {calorieProgress.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-secondary-500 mb-1">Calories</p>
          <p className="text-2xl font-bold text-secondary-800">
            {caloriesConsumed.toLocaleString()}
          </p>
          <p className="text-xs text-secondary-400">of {dailyCalorieTarget} kcal</p>
          <div className="mt-3 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${calorieProgress}%` }}
            ></div>
          </div>
        </motion.div>
        
        {/* Protein */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {proteinProgress.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-secondary-500 mb-1">Protein</p>
          <p className="text-2xl font-bold text-secondary-800">{proteinConsumed}g</p>
          <p className="text-xs text-secondary-400">of {macroTargets.protein}g</p>
          <div className="mt-3 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${proteinProgress}%` }}
            ></div>
          </div>
        </motion.div>
        
        {/* Carbs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent-600" />
            </div>
            <span className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded-full">
              {carbsProgress.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-secondary-500 mb-1">Carbs</p>
          <p className="text-2xl font-bold text-secondary-800">{carbsConsumed}g</p>
          <p className="text-xs text-secondary-400">of {macroTargets.carbs}g</p>
          <div className="mt-3 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${carbsProgress}%` }}
            ></div>
          </div>
        </motion.div>
        
        {/* Glycemic Load */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              glycemicLoad < 55 ? 'text-green-600 bg-green-50' :
              glycemicLoad < 70 ? 'text-yellow-600 bg-yellow-50' :
              'text-red-600 bg-red-50'
            }`}>
              {glycemicLoad < 55 ? 'Low' : glycemicLoad < 70 ? 'Medium' : 'High'}
            </span>
          </div>
          <p className="text-sm text-secondary-500 mb-1">Glycemic Load</p>
          <p className="text-2xl font-bold text-secondary-800">{glycemicLoad.toFixed(0)}</p>
          <p className="text-xs text-secondary-400">Daily total GL</p>
          <div className="mt-3 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                glycemicLoad < 55 ? 'bg-green-500' :
                glycemicLoad < 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((glycemicLoad / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </motion.div>
      </div>
      
      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Macro Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Macro Distribution</h3>
          <div className="h-48">
            <Doughnut
              data={macroChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </motion.div>
        
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Weekly Calorie Trend</h3>
          <div className="h-48">
            <Line
              data={weeklyTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    min: 1500,
                    max: 2500
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link
          to="/analyze"
          className="card p-5 hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-secondary-800 mb-1">Analyze Food</h3>
          <p className="text-sm text-secondary-500">Snap a photo to track your meal</p>
          <ChevronRight className="w-5 h-5 text-secondary-400 mt-2" />
        </Link>
        
        <Link
          to="/food-log"
          className="card p-5 hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-secondary-800 mb-1">Log Food</h3>
          <p className="text-sm text-secondary-500">Manually add food entries</p>
          <ChevronRight className="w-5 h-5 text-secondary-400 mt-2" />
        </Link>
        
        <Link
          to="/meal-plan"
          className="card p-5 hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Utensils className="w-6 h-6 text-accent-600" />
          </div>
          <h3 className="font-semibold text-secondary-800 mb-1">Meal Plan</h3>
          <p className="text-sm text-secondary-500">Generate AI meal plans</p>
          <ChevronRight className="w-5 h-5 text-secondary-400 mt-2" />
        </Link>
        
        <Link
          to="/progress"
          className="card p-5 hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-secondary-800 mb-1">View Progress</h3>
          <p className="text-sm text-secondary-500">Track your achievements</p>
          <ChevronRight className="w-5 h-5 text-secondary-400 mt-2" />
        </Link>
      </motion.div>
    </div>
  )
}

export default Dashboard
