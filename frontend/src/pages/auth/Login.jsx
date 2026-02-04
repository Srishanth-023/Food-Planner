import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Leaf, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
    
    setIsLoading(false)
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-secondary-800">NutriVision</span>
            </Link>
            
            {/* Header */}
            <h1 className="text-3xl font-display font-bold text-secondary-800 mb-2">
              Welcome back
            </h1>
            <p className="text-secondary-600 mb-8">
              Sign in to continue your nutrition journey
            </p>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-secondary-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </a>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            
            {/* Footer */}
            <p className="mt-8 text-center text-secondary-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-500 to-primary-600 p-12 items-center justify-center">
        <div className="max-w-lg text-white">
          <h2 className="text-3xl font-display font-bold mb-4">
            Track your nutrition with AI
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of users who have transformed their health with personalized meal plans and smart food tracking.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold">50K+</p>
              <p className="text-primary-200">Active Users</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold">10M+</p>
              <p className="text-primary-200">Meals Logged</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
