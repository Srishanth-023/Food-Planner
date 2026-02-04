import { create } from 'zustand'
import api from '@services/api'

export const usePlanStore = create((set, get) => ({
  // State
  mealPlan: null,
  workoutPlan: null,
  isGeneratingMeal: false,
  isGeneratingWorkout: false,
  
  // Actions
  setMealPlan: (plan) => set({ mealPlan: plan }),
  setWorkoutPlan: (plan) => set({ workoutPlan: plan }),
  
  // Generate meal plan
  generateMealPlan: async (options = {}) => {
    set({ isGeneratingMeal: true })
    try {
      const { days = 7, includeSnacks = true } = options
      
      const response = await api.post('/plan/meal', {
        days,
        includeSnacks
      })
      
      set({
        mealPlan: response.data.data,
        isGeneratingMeal: false
      })
      
      return response.data.data
    } catch (error) {
      set({ isGeneratingMeal: false })
      throw error
    }
  },
  
  // Generate workout plan
  generateWorkoutPlan: async (options = {}) => {
    set({ isGeneratingWorkout: true })
    try {
      const { days = 7, difficulty = 'intermediate', includeRestDays = true } = options
      
      const response = await api.post('/plan/workout', {
        days,
        difficulty,
        includeRestDays
      })
      
      set({
        workoutPlan: response.data.data,
        isGeneratingWorkout: false
      })
      
      return response.data.data
    } catch (error) {
      set({ isGeneratingWorkout: false })
      throw error
    }
  },
  
  // Save current meal plan
  saveMealPlan: async () => {
    const { mealPlan } = get()
    if (!mealPlan) return
    
    try {
      await api.post('/plan/meal/save', { plan: mealPlan })
      return true
    } catch (error) {
      throw error
    }
  },
  
  // Fetch saved meal plans
  fetchSavedMealPlans: async () => {
    try {
      const response = await api.get('/plan/meal/saved')
      return response.data.data
    } catch (error) {
      throw error
    }
  },
  
  // Clear plans
  clearPlans: () => set({ mealPlan: null, workoutPlan: null })
}))
