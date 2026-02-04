import { create } from 'zustand'
import api from '@services/api'
import { format } from 'date-fns'

export const useFoodStore = create((set, get) => ({
  // State
  todayLog: null,
  weeklyLogs: [],
  isLoading: false,
  analysisResult: null,
  
  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  
  // Fetch today's food log
  fetchTodayLog: async () => {
    set({ isLoading: true })
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const response = await api.get(`/food/daily-summary/${today}`)
      set({ todayLog: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ isLoading: false })
      console.error('Error fetching today log:', error)
      return null
    }
  },
  
  // Fetch weekly logs
  fetchWeeklyLogs: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/food/weekly-summary')
      set({ weeklyLogs: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ isLoading: false })
      console.error('Error fetching weekly logs:', error)
      return []
    }
  },
  
  // Analyze food image
  analyzeImage: async (imageFile) => {
    set({ isLoading: true })
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const response = await api.post('/food/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      set({
        analysisResult: response.data.data,
        isLoading: false
      })
      
      return response.data.data
    } catch (error) {
      set({ isLoading: false })
      console.error('Error analyzing image:', error)
      throw error
    }
  },
  
  // Log food entry
  logFood: async (foodData) => {
    set({ isLoading: true })
    try {
      const response = await api.post('/food/log', foodData)
      set({ isLoading: false })
      
      // Refresh today's log
      get().fetchTodayLog()
      
      return response.data.data
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  // Update food entry
  updateFoodEntry: async (entryId, foodData) => {
    try {
      const response = await api.patch(`/food/entry/${entryId}`, foodData)
      
      // Refresh logs
      get().fetchTodayLog()
      
      return response.data.data
    } catch (error) {
      throw error
    }
  },
  
  // Delete food entry
  deleteFoodEntry: async (entryId) => {
    try {
      await api.delete(`/food/entry/${entryId}`)
      
      // Refresh logs
      get().fetchTodayLog()
    } catch (error) {
      throw error
    }
  },
  
  // Clear analysis result
  clearAnalysis: () => set({ analysisResult: null })
}))
