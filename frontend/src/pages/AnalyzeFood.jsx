import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { useFoodStore } from '@stores/foodStore'
import {
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Plus,
  Edit2
} from 'lucide-react'
import toast from 'react-hot-toast'

const AnalyzeFood = () => {
  const { analyzeImage, logFood, analysisResult, isLoading, clearAnalysis } = useFoodStore()
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [editingFood, setEditingFood] = useState(null)
  const [mealType, setMealType] = useState('lunch')
  
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      clearAnalysis()
    }
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })
  
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }
    
    try {
      await analyzeImage(selectedFile)
      toast.success('Food analyzed successfully!')
    } catch (error) {
      toast.error('Failed to analyze image')
    }
  }
  
  const handleLogFood = async (food) => {
    try {
      await logFood({
        mealType,
        foods: [{
          name: food.name,
          servingSize: food.portion || 100,
          servingUnit: 'g',
          quantity: 1,
          nutrition: {
            calories: food.calories || 0,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fat: food.fat || 0
          }
        }]
      })
      toast.success(`${food.name} added to your food log!`)
    } catch (error) {
      toast.error('Failed to log food')
    }
  }
  
  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    clearAnalysis()
  }
  
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title flex items-center gap-3">
            <Camera className="w-7 h-7 text-primary-500" />
            Analyze Food
          </h1>
          <p className="text-secondary-600 mt-2">
            Take a photo of your meal and let AI detect foods and estimate nutrition
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                dropzone relative cursor-pointer
                ${isDragActive ? 'active border-primary-500 bg-primary-50' : ''}
                ${previewUrl ? 'p-0 border-0' : 'p-8'}
              `}
            >
              <input {...getInputProps()} />
              
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Food preview"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearImage()
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    {isDragActive ? (
                      <Upload className="w-8 h-8 text-primary-600" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-primary-600" />
                    )}
                  </div>
                  <p className="text-lg font-medium text-secondary-700 mb-2">
                    {isDragActive ? 'Drop image here' : 'Drag & drop your food image'}
                  </p>
                  <p className="text-sm text-secondary-500">
                    or click to browse • JPEG, PNG, WebP • Max 10MB
                  </p>
                </div>
              )}
            </div>
            
            {/* Meal Type Selection */}
            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <label className="label mb-2">Meal Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={`
                        py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors
                        ${mealType === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Analyze Button */}
            {previewUrl && !analysisResult && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Analyze Food
                  </>
                )}
              </motion.button>
            )}
          </div>
          
          {/* Results Section */}
          <div>
            <AnimatePresence mode="wait">
              {analysisResult ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-secondary-800">
                      Detected Foods
                    </h2>
                    <span className="text-sm text-secondary-500">
                      {analysisResult.detected_foods?.length || 0} items found
                    </span>
                  </div>
                  
                  {analysisResult.detected_foods?.length > 0 ? (
                    <div className="space-y-3">
                      {analysisResult.detected_foods.map((food, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-secondary-800 capitalize">
                                {food.name}
                              </h3>
                              <p className="text-sm text-secondary-500">
                                Confidence: {(food.confidence * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingFood(food)}
                                className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-500"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleLogFood(food)}
                                className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Estimated Nutrition */}
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-secondary-50 rounded-lg p-2">
                              <p className="text-xs text-secondary-500">Portion</p>
                              <p className="font-medium text-secondary-800">
                                {analysisResult.portion_estimates?.[food.name] || 100}g
                              </p>
                            </div>
                            <div className="bg-secondary-50 rounded-lg p-2">
                              <p className="text-xs text-secondary-500">Calories</p>
                              <p className="font-medium text-secondary-800">~{food.calories || '--'}</p>
                            </div>
                            <div className="bg-secondary-50 rounded-lg p-2">
                              <p className="text-xs text-secondary-500">Protein</p>
                              <p className="font-medium text-secondary-800">{food.protein || '--'}g</p>
                            </div>
                            <div className="bg-secondary-50 rounded-lg p-2">
                              <p className="text-xs text-secondary-500">Carbs</p>
                              <p className="font-medium text-secondary-800">{food.carbs || '--'}g</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                      <p className="text-secondary-600">
                        No foods detected in this image.
                      </p>
                      <p className="text-sm text-secondary-500 mt-1">
                        Try a clearer photo with food items visible.
                      </p>
                    </div>
                  )}
                  
                  {/* Log All Button */}
                  {analysisResult.detected_foods?.length > 0 && (
                    <button
                      onClick={() => {
                        analysisResult.detected_foods.forEach(handleLogFood)
                      }}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Log All Foods to {mealType}
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-secondary-700 mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-secondary-500 max-w-xs">
                    Upload an image and click "Analyze Food" to detect foods and get nutrition estimates
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyzeFood
