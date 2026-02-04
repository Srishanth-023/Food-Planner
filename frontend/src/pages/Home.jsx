import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera,
  BarChart3,
  Salad,
  Dumbbell,
  MessageSquare,
  ArrowRight,
  Check,
  Leaf
} from 'lucide-react'

const features = [
  {
    icon: Camera,
    title: 'AI Food Recognition',
    description: 'Snap a photo of your meal and let our AI detect foods, estimate portions, and calculate calories automatically.'
  },
  {
    icon: BarChart3,
    title: 'GI/GL Tracking',
    description: 'Track Glycemic Index and Glycemic Load to manage blood sugar levels and optimize your energy throughout the day.'
  },
  {
    icon: Salad,
    title: 'Personalized Meal Plans',
    description: 'Get AI-generated meal plans tailored to your goals, preferences, and dietary restrictions.'
  },
  {
    icon: Dumbbell,
    title: 'Workout Plans',
    description: 'Receive customized workout routines based on your fitness level and goals.'
  },
  {
    icon: MessageSquare,
    title: 'AI Nutrition Assistant',
    description: 'Chat with our AI assistant for instant answers to your nutrition and fitness questions.'
  }
]

const benefits = [
  'Track calories and macros effortlessly',
  'Manage blood sugar with GI/GL data',
  'Get personalized recommendations',
  'See your progress with beautiful charts',
  'Access thousands of foods in our database'
]

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-secondary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-secondary-800">NutriVision</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-secondary-600 hover:text-secondary-800 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                AI-Powered Nutrition Planning
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-secondary-800 mb-6">
                Your Personal
                <span className="gradient-text"> AI Nutritionist</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-secondary-600 mb-8">
                Snap photos of your meals, track calories and macros, get personalized meal plans,
                and achieve your fitness goals with our AI-powered nutrition planner.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="btn-primary text-lg px-8 py-3 flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn-outline text-lg px-8 py-3"
                >
                  View Demo
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-1 shadow-2xl">
              <div className="rounded-xl bg-white p-4 sm:p-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Stats Preview */}
                  <div className="col-span-3 sm:col-span-1 bg-secondary-50 rounded-xl p-4">
                    <p className="text-xs text-secondary-500 mb-1">Today's Calories</p>
                    <p className="text-2xl font-bold text-secondary-800">1,847</p>
                    <p className="text-xs text-primary-600">of 2,200 kcal</p>
                    <div className="mt-2 h-2 bg-secondary-200 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-primary-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-1 bg-secondary-50 rounded-xl p-4">
                    <p className="text-xs text-secondary-500 mb-1">Protein</p>
                    <p className="text-2xl font-bold text-secondary-800">127g</p>
                    <p className="text-xs text-blue-600">of 150g target</p>
                    <div className="mt-2 h-2 bg-secondary-200 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-1 bg-secondary-50 rounded-xl p-4">
                    <p className="text-xs text-secondary-500 mb-1">Glycemic Load</p>
                    <p className="text-2xl font-bold text-secondary-800">42</p>
                    <p className="text-xs text-accent-600">Low-Medium</p>
                    <div className="mt-2 h-2 bg-secondary-200 rounded-full overflow-hidden">
                      <div className="h-full w-2/5 bg-accent-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-secondary-800 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Everything you need to track nutrition, reach your goals, and live healthier.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 px-4 bg-secondary-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-secondary-800 mb-6">
                Why Choose NutriVision?
              </h2>
              <p className="text-lg text-secondary-600 mb-8">
                Join thousands of users who have transformed their health with our AI-powered platform.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-secondary-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
              
              <Link
                to="/register"
                className="btn-primary mt-8 inline-flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-secondary-500">Daily Progress</p>
                    <p className="text-3xl font-bold text-primary-600">84%</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-secondary-600">Calories</span>
                        <span className="font-medium">1,847 / 2,200</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className="h-full w-[84%] bg-primary-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-secondary-600">Protein</span>
                        <span className="font-medium">127g / 150g</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-secondary-600">Carbs</span>
                        <span className="font-medium">189g / 250g</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className="h-full w-[76%] bg-accent-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-secondary-800 mb-6">
            Ready to Transform Your Health?
          </h2>
          <p className="text-lg text-secondary-600 mb-8">
            Start your journey to better nutrition today. No credit card required.
          </p>
          <Link
            to="/register"
            className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-secondary-800 text-secondary-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">NutriVision AI</span>
            </div>
            <p className="text-sm">
              © 2024 NutriVision AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
