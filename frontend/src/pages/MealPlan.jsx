import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePlanStore } from '@stores/planStore'
import { Salad, RefreshCw, Download, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const MealPlan = () => {
  const { mealPlan, isGeneratingMeal, generateMealPlan } = usePlanStore()
  const [days, setDays] = useState(7)
  const [expandedDay, setExpandedDay] = useState(null)
  
  const handleGenerate = async () => {
    try {
      await generateMealPlan({ days, includeSnacks: true })
      toast.success('Meal plan generated!')
    } catch (error) {
      toast.error('Failed to generate meal plan')
    }
  }
  
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title flex items-center gap-3">
              <Salad className="w-7 h-7 text-primary-500" />
              Meal Plan
            </h1>
            <p className="text-secondary-600 mt-2">
              Generate AI-powered personalized meal plans
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input-field w-auto"
            >
              {[1, 3, 5, 7].map((d) => (
                <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={isGeneratingMeal}
              className="btn-primary flex items-center gap-2"
            >
              {isGeneratingMeal ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
        
        {mealPlan ? (
          <div className="space-y-4">
            {mealPlan.meal_plan?.days?.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <button
                  onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="font-semibold text-primary-600">{day.day}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-secondary-800">{day.dayName}</h3>
                      <p className="text-sm text-secondary-500">
                        {day.dailyTotals?.calories || 0} kcal
                      </p>
                    </div>
                  </div>
                  {expandedDay === index ? (
                    <ChevronUp className="w-5 h-5 text-secondary-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-secondary-400" />
                  )}
                </button>
                
                {expandedDay === index && (
                  <div className="px-4 pb-4 space-y-4">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const meal = day.meals?.[mealType]
                      if (!meal) return null
                      
                      return (
                        <div key={mealType} className="bg-secondary-50 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs font-medium text-primary-600 uppercase">
                                {mealType}
                              </span>
                              <h4 className="font-medium text-secondary-800">{meal.name}</h4>
                            </div>
                            <span className="text-sm font-medium text-secondary-600">
                              {meal.nutrition?.calories || 0} kcal
                            </span>
                          </div>
                          <p className="text-sm text-secondary-600 mb-2">{meal.description}</p>
                          <div className="flex gap-4 text-xs text-secondary-500">
                            <span>P: {meal.nutrition?.protein || 0}g</span>
                            <span>C: {meal.nutrition?.carbs || 0}g</span>
                            <span>F: {meal.nutrition?.fat || 0}g</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Salad className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-700 mb-2">
              No Meal Plan Yet
            </h3>
            <p className="text-secondary-500 mb-6">
              Click "Generate Plan" to create a personalized meal plan based on your goals.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MealPlan
