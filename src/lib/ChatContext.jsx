import { createContext, useContext, useState, useEffect } from 'react'

const ChatContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hey! I'm Selora, your AI growth assistant. I can see your store's live data right now.\n\nAsk me anything — about your products, pricing, sales trends — or tell me to take action like repricing or optimizing listings!",
    },
  ])
  const [sessionId, setSessionId] = useState(() => {
    // Generate a unique session ID if not already existing
    let id = localStorage.getItem('selora_chat_session_id')
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
      localStorage.setItem('selora_chat_session_id', id)
    }
    return id
  })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [sessions, setSessions] = useState([])

  // Load chat history for the store when sessionId or storeId changes
  const loadHistory = async (storeId, sid = sessionId) => {
    if (!storeId || !sid) return
    try {
      const res = await fetch(`${API_URL}/api/chat/${storeId}/history?session_id=${sid}`)
      const data = await res.json()
      if (data.history && data.history.length > 0) {
        const mapped = data.history.map(msg => {
          let assistantContent = msg.content
          if (msg.actions && msg.actions.length > 0) {
            const actionSummary = msg.actions
              .map(a => {
                if (a.tool === 'reprice_product') return `💰 Repriced product to $${a.args.new_price}`
                if (a.tool === 'optimize_listing') return `✏️ Optimized listing`
                if (a.tool === 'restock_alert') return `⚠️ Restock alert sent`
                if (a.tool === 'generate_report') return `📊 Report generated`
                return `🔧 ${a.tool}`
              })
              .join('\n')
            assistantContent += `\n\n---\n**Actions taken:**\n${actionSummary}`
          }
          return {
            role: msg.role,
            content: assistantContent
          }
        })
        // Prepend the initial greeting
        setMessages([
          {
            role: 'assistant',
            content: "👋 Hey! I'm Selora, your AI growth assistant. I can see your store's live data right now.\n\nAsk me anything — about your products, pricing, sales trends — or tell me to take action like repricing or optimizing listings!",
          },
          ...mapped
        ])
      } else {
        // Reset to initial greeting
        setMessages([
          {
            role: 'assistant',
            content: "👋 Hey! I'm Selora, your AI growth assistant. I can see your store's live data right now.\n\nAsk me anything — about your products, pricing, sales trends — or tell me to take action like repricing or optimizing listings!",
          },
        ])
      }
    } catch (e) {
      console.error("Failed to load chat history:", e)
    }
  }

  // Load unique chat sessions for the store
  const loadSessions = async (storeId) => {
    if (!storeId) return
    try {
      const res = await fetch(`${API_URL}/api/chat/${storeId}/sessions`)
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (e) {
      console.error("Failed to load chat sessions:", e)
    }
  }

  // Switch/start a session
  const selectSession = (newSessionId, storeId) => {
    setSessionId(newSessionId)
    localStorage.setItem('selora_chat_session_id', newSessionId)
    if (storeId) {
      loadHistory(storeId, newSessionId)
    }
  }

  const startNewSession = (storeId) => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
    selectSession(newId, storeId)
  }

  const sendMessage = async (text, storeId) => {
    if (!text.trim() || loading || !storeId) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Build history (exclude the initial greeting)
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }))

      const res = await fetch(`${API_URL}/api/chat/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, history }),
      })

      const data = await res.json()
      let assistantContent = data.response || "I couldn't process that. Please try again."

      // If actions were taken, add a small summary
      if (data.actions?.length > 0) {
        const actionSummary = data.actions
          .map(a => {
            if (a.tool === 'reprice_product') return `💰 Repriced product to $${a.args.new_price}`
            if (a.tool === 'optimize_listing') return `✏️ Optimized listing`
            if (a.tool === 'restock_alert') return `⚠️ Restock alert sent`
            if (a.tool === 'generate_report') return `📊 Report generated`
            return `🔧 ${a.tool}`
          })
          .join('\n')
        assistantContent += `\n\n---\n**Actions taken:**\n${actionSummary}`
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
      if (!open) setHasNewMessage(true)

      // If actions were taken, trigger custom event to reload lists automatically
      if (data.actions?.length > 0) {
        window.dispatchEvent(new CustomEvent('selora-action-taken', { detail: { storeId } }))
      }
      
      // Refresh sessions list
      loadSessions(storeId)
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't connect to the server. Please check that the backend is running." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        loading,
        open,
        setOpen,
        hasNewMessage,
        setHasNewMessage,
        sessions,
        loadHistory,
        loadSessions,
        selectSession,
        startNewSession,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
