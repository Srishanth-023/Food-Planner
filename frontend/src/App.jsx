import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

// Layout
import Layout from '@components/layout/Layout'

// Pages
import Home from '@pages/Home'
import Login from '@pages/auth/Login'
import Register from '@pages/auth/Register'
import Dashboard from '@pages/Dashboard'
import FoodLog from '@pages/FoodLog'
import AnalyzeFood from '@pages/AnalyzeFood'
import MealPlan from '@pages/MealPlan'
import WorkoutPlan from '@pages/WorkoutPlan'
import Progress from '@pages/Progress'
import Chat from '@pages/Chat'
import Profile from '@pages/Profile'
import NotFound from '@pages/NotFound'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      
      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/food-log" element={<FoodLog />} />
        <Route path="/analyze" element={<AnalyzeFood />} />
        <Route path="/meal-plan" element={<MealPlan />} />
        <Route path="/workout-plan" element={<WorkoutPlan />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
