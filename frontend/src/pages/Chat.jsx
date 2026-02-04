import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '@stores/chatStore'
import { useAuthStore } from '@stores/authStore'
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Bot,
  User as UserIcon,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const Chat = () => {
  const { user } = useAuthStore()
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    fetchConversations,
    createConversation,
    fetchMessages,
    sendMessage,
    deleteConversation,
    clearCurrentChat
  } = useChatStore()
  
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  
  useEffect(() => {
    fetchConversations()
  }, [])
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isSending) return
    
    const message = input.trim()
    setInput('')
    
    try {
      await sendMessage(message)
    } catch (error) {
      toast.error('Failed to send message')
    }
  }
  
  const handleNewChat = async () => {
    try {
      await createConversation()
      toast.success('New conversation started')
    } catch (error) {
      toast.error('Failed to create conversation')
    }
  }
  
  const handleDeleteChat = async (conversationId) => {
    try {
      await deleteConversation(conversationId)
      toast.success('Conversation deleted')
    } catch (error) {
      toast.error('Failed to delete conversation')
    }
  }
  
  const quickPrompts = [
    "What's a healthy breakfast under 400 calories?",
    "How much protein should I eat daily?",
    "Suggest low GI foods for better energy",
    "What are good pre-workout snacks?"
  ]
  
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-12rem)]"
      >
        <div className="grid lg:grid-cols-4 gap-6 h-full">
          {/* Sidebar - Conversations */}
          <div className="lg:col-span-1 card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary-800">Conversations</h2>
              <button
                onClick={handleNewChat}
                className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => fetchMessages(conv._id)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors group
                    ${currentConversation?._id === conv._id
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-secondary-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {conv.title || 'New Conversation'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChat(conv._id)
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary-200"
                    >
                      <Trash2 className="w-3 h-3 text-secondary-500" />
                    </button>
                  </div>
                </div>
              ))}
              
              {conversations.length === 0 && (
                <p className="text-sm text-secondary-500 text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div className="lg:col-span-3 card flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-secondary-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-800">NutriVision AI</h3>
                  <p className="text-xs text-secondary-500">Your nutrition assistant</p>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-secondary-700 mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-secondary-500 mb-6 max-w-sm">
                    Ask me anything about nutrition, meal planning, or your fitness goals.
                  </p>
                  
                  {/* Quick Prompts */}
                  <div className="grid sm:grid-cols-2 gap-2 max-w-lg">
                    {quickPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(prompt)}
                        className="p-3 text-sm text-left rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary-600" />
                        </div>
                      )}
                      
                      <div
                        className={`
                          max-w-[70%] p-3 rounded-xl
                          ${msg.role === 'user'
                            ? 'bg-primary-500 text-white rounded-br-sm'
                            : 'bg-secondary-100 text-secondary-800 rounded-bl-sm'
                          }
                        `}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-secondary-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isSending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="bg-secondary-100 rounded-xl rounded-bl-sm p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                          <span className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-secondary-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about nutrition, meals, or fitness..."
                  className="flex-1 input-field"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Chat
