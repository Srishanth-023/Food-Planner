import { create } from 'zustand'
import api from '@services/api'

export const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  
  // Actions
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  
  // Fetch conversations
  fetchConversations: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/chat/conversations')
      set({
        conversations: response.data.data,
        isLoading: false
      })
      return response.data.data
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  // Create new conversation
  createConversation: async () => {
    try {
      const response = await api.post('/chat/conversation')
      const newConversation = response.data.data
      
      set((state) => ({
        conversations: [newConversation, ...state.conversations],
        currentConversation: newConversation,
        messages: []
      }))
      
      return newConversation
    } catch (error) {
      throw error
    }
  },
  
  // Fetch messages for a conversation
  fetchMessages: async (conversationId) => {
    set({ isLoading: true })
    try {
      const response = await api.get(`/chat/conversation/${conversationId}`)
      
      set({
        currentConversation: response.data.data,
        messages: response.data.data.messages || [],
        isLoading: false
      })
      
      return response.data.data.messages
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  // Send message
  sendMessage: async (message) => {
    const { currentConversation, messages } = get()
    
    if (!currentConversation) {
      // Create new conversation first
      await get().createConversation()
    }
    
    set({ isSending: true })
    
    // Optimistically add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    
    set((state) => ({
      messages: [...state.messages, userMessage]
    }))
    
    try {
      const response = await api.post(`/chat/conversation/${get().currentConversation._id}/message`, {
        message
      })
      
      const assistantMessage = {
        role: 'assistant',
        content: response.data.data.response,
        timestamp: new Date().toISOString()
      }
      
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isSending: false
      }))
      
      return assistantMessage
    } catch (error) {
      set({ isSending: false })
      throw error
    }
  },
  
  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/conversation/${conversationId}`)
      
      set((state) => ({
        conversations: state.conversations.filter(c => c._id !== conversationId),
        currentConversation: state.currentConversation?._id === conversationId
          ? null
          : state.currentConversation,
        messages: state.currentConversation?._id === conversationId
          ? []
          : state.messages
      }))
    } catch (error) {
      throw error
    }
  },
  
  // Clear current chat
  clearCurrentChat: () => set({
    currentConversation: null,
    messages: []
  })
}))
