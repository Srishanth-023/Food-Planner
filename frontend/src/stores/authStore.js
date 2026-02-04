import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Login
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, tokens } = response.data.data
          
          set({
            user,
            token: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          // Set token in API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`
          
          // Store refresh token
          localStorage.setItem('refreshToken', tokens.refreshToken)
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Login failed'
          }
        }
      },
      
      // Register
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData)
          const { user, tokens } = response.data.data
          
          set({
            user,
            token: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`
          localStorage.setItem('refreshToken', tokens.refreshToken)
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Registration failed'
          }
        }
      },
      
      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
          
          delete api.defaults.headers.common['Authorization']
          localStorage.removeItem('refreshToken')
        }
      },
      
      // Refresh token
      refreshToken: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (!refreshToken) {
            throw new Error('No refresh token')
          }
          
          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          
          set({ token: accessToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          localStorage.setItem('refreshToken', newRefreshToken)
          
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },
      
      // Initialize auth (check existing session)
      initAuth: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isLoading: false })
          return
        }
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/me')
          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          // Try refresh token
          const refreshed = await get().refreshToken()
          if (refreshed) {
            try {
              const response = await api.get('/auth/me')
              set({
                user: response.data.data,
                isAuthenticated: true,
                isLoading: false
              })
            } catch (err) {
              get().logout()
            }
          }
        }
      },
      
      // Update user profile
      updateProfile: async (profileData) => {
        try {
          const response = await api.patch('/user/profile', profileData)
          set({ user: response.data.data })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Update failed'
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
