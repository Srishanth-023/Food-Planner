import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Leaf, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    setIsLoading(true)
    
    const result = await register({
      email: formData.email,
      password: formData.password,
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName
      }
    })
    
    if (result.success) {
      toast.success('Welcome to NutriVision!')
      navigate('/profile') // Go to profile to complete setup
    } else {
      toast.error(result.error)
    }
    
    setIsLoading(false)
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-500 to-primary-600 p-12 items-center justify-center">
        <div className="max-w-lg text-white">
          <h2 className="text-3xl font-display font-bold mb-4">
            Start your health journey today
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Create your account and get access to AI-powered nutrition tracking, personalized meal plans, and more.
          </p>
          <ul className="space-y-4">
            {[
              'AI-powered food recognition',
              'Personalized meal plans',
              'GI/GL tracking',
              'Progress analytics'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Right Panel - Form */}
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
              Create your account
            </h1>
            <p className="text-secondary-600 mb-8">
              Start tracking your nutrition in minutes
            </p>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="label">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="input-field pl-10"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
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
                    minLength={8}
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
                <p className="mt-1 text-xs text-secondary-500">
                  Must be at least 8 characters
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-sm text-secondary-600">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            
            {/* Footer */}
            <p className="mt-8 text-center text-secondary-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Register
