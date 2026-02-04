import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePlanStore } from '@stores/planStore'
import { Dumbbell, RefreshCw, ChevronDown, ChevronUp, Clock, Flame } from 'lucide-react'
import toast from 'react-hot-toast'

const WorkoutPlan = () => {
  const { workoutPlan, isGeneratingWorkout, generateWorkoutPlan } = usePlanStore()
  const [days, setDays] = useState(7)
  const [difficulty, setDifficulty] = useState('intermediate')
  const [expandedDay, setExpandedDay] = useState(null)
  
  const handleGenerate = async () => {
    try {
      await generateWorkoutPlan({ days, difficulty, includeRestDays: true })
      toast.success('Workout plan generated!')
    } catch (error) {
      toast.error('Failed to generate workout plan')
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
              <Dumbbell className="w-7 h-7 text-primary-500" />
              Workout Plan
            </h1>
            <p className="text-secondary-600 mt-2">
              AI-powered personalized workout routines
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="input-field w-auto"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={isGeneratingWorkout}
              className="btn-primary flex items-center gap-2"
            >
              {isGeneratingWorkout ? (
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
        
        {workoutPlan ? (
          <div className="space-y-4">
            {workoutPlan.workout_plan?.days?.map((day, index) => (
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
                    <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                      <span className="font-semibold text-accent-600">{day.day}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-secondary-800">{day.dayName}</h3>
                      <p className="text-sm text-secondary-500">{day.focus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-sm text-secondary-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {day.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        {day.estimatedCaloriesBurn} kcal
                      </span>
                    </div>
                    {expandedDay === index ? (
                      <ChevronUp className="w-5 h-5 text-secondary-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-secondary-400" />
                    )}
                  </div>
                </button>
                
                {expandedDay === index && (
                  <div className="px-4 pb-4 space-y-3">
                    {day.exercises?.map((exercise, i) => (
                      <div key={i} className="bg-secondary-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-secondary-800">{exercise.name}</h4>
                          <span className="text-sm text-secondary-500">
                            {exercise.sets} x {exercise.reps}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-600 mb-2">{exercise.instructions}</p>
                        <div className="flex gap-2 flex-wrap">
                          {exercise.muscleGroups?.map((muscle, j) => (
                            <span
                              key={j}
                              className="text-xs bg-secondary-200 text-secondary-600 px-2 py-1 rounded-full"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Dumbbell className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-700 mb-2">
              No Workout Plan Yet
            </h3>
            <p className="text-secondary-500 mb-6">
              Click "Generate Plan" to create a personalized workout routine.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default WorkoutPlan
