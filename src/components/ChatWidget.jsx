import { useState, useRef, useEffect } from 'react'
import { useChat } from '../lib/ChatContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const c = {
  green: '#5A8A67', green2: '#78A885', greenPale: '#EDF3EE',
  dark: '#1A271C', text: '#2E3D30', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', card: '#fff',
}

const SUGGESTIONS = [
  "Which products are selling the best?",
  "Any products I should reprice?",
  "Optimize my weakest listing",
  "Give me a quick store health check",
]

export default function ChatWidget({ storeId, isLandingPage = false }) {
  const {
    messages,
    loading,
    open,
    setOpen,
    hasNewMessage,
    setHasNewMessage,
    loadHistory,
    loadSessions,
    startNewSession,
    sendMessage: sendGlobalMessage,
  } = useChat()

  const [input, setInput] = useState('')
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    if (isLandingPage && !open) {
      const timer = setTimeout(() => {
        setShowWelcomeBubble(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isLandingPage, open])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load chat history when the widget mounts or when storeId changes
  useEffect(() => {
    if (storeId) {
      loadHistory(storeId)
      loadSessions(storeId)
    }
  }, [storeId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && widgetRef.current && !widgetRef.current.contains(e.target)) {
        if (!e.target.closest('#chat-fab')) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !storeId) return
    setInput('')
    await sendGlobalMessage(text, storeId, isLandingPage)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text) => {
    setInput(text)
    setTimeout(() => {
      // Direct call to send message logic
      if (!text.trim() || loading || !storeId) return
      setInput('')
      sendGlobalMessage(text, storeId, isLandingPage)
    }, 50)
  }


  if (!storeId) return null

  return (
    <>
      {/* Welcome Bubble */}
      {!open && showWelcomeBubble && (
        <div style={{
          position: 'fixed', bottom: 98, right: 28, zIndex: 1000,
          background: '#fff', border: `1px solid ${c.border}`,
          borderRadius: 16, padding: '12px 18px', width: 260,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          fontFamily: 'Inter, sans-serif', fontSize: '.84rem',
          lineHeight: 1.4, color: c.dark,
          animation: 'chatBubbleFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
          cursor: 'pointer',
        }}
        onClick={() => { setOpen(true); setShowWelcomeBubble(false); }}
        >
          <div style={{ fontWeight: 600, color: c.green, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Selora Agent</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86EFAC', display: 'inline-block' }} />
          </div>
          Welcome to Selora! 🌸 Chat with me to see how I grow your fashion store.
          {/* Close button for bubble */}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowWelcomeBubble(false); }}
            style={{
              position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '.75rem', color: c.muted, padding: 2
            }}
          >
            ✕
          </button>
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -6, right: 24, width: 12, height: 12,
            background: '#fff', borderRight: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`,
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setHasNewMessage(false); setShowWelcomeBubble(false); }}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
            width: 58, height: 58, borderRadius: '50%',
            background: `linear-gradient(135deg, ${c.green} 0%, ${c.green2} 100%)`,
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 28px rgba(90,138,103,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(90,138,103,.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(90,138,103,.35)' }}
          id="chat-fab"
        >
          🤖
          {hasNewMessage && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#EF4444', border: '2px solid #fff',
            }} />
          )}
        </button>
      )}

      {open && (
        <div ref={widgetRef} style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1001,
          width: 400, maxWidth: 'calc(100vw - 32px)', height: 560, maxHeight: 'calc(100vh - 100px)',
          background: c.card, borderRadius: 20,
          border: `1px solid ${c.border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,.12), 0 4px 20px rgba(0,0,0,.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, sans-serif',
          animation: 'chatSlideUp .3s ease-out',
        }}>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${c.green} 0%, ${c.green2} 100%)`,
            padding: '1rem 1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#fff' }}>Selora Agent</div>
                <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86EFAC', display: 'inline-block' }} />
                  {isLandingPage ? 'Online — Demo Mode' : 'Online — connected to your store'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <button
                onClick={() => startNewSession(storeId)}
                style={{
                  background: 'rgba(255,255,255,.15)',
                  border: '1px solid rgba(255,255,255,.2)',
                  color: '#fff', cursor: 'pointer',
                  padding: '.35rem .6rem', borderRadius: 8,
                  fontSize: '.72rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                }}
              >
                + New
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,.15)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontFamily: 'Inter, sans-serif',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '.8rem',
            background: c.bg,
          }}>
            {messages.map((msg, i) => {
              const isUser = msg.role?.toLowerCase().trim() === 'user'
              let content = msg.content
              if (i === 0 && isLandingPage && msg.role === 'assistant') {
                content = "👋 Welcome to Selora! I'm your AI fashion growth agent.\n\nI automatically optimize pricing, list products, manage inventory, and grow sales. I've loaded a demo store context for you so you can see what I can do!\n\nTry asking me:\n• 'Which products are selling the best?'\n• 'How can I improve my store's pricing?'\n• 'Rewrite a listing for a dress'"
              }
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '82%',
                    padding: '.7rem 1rem',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    backgroundColor: isUser ? c.green : c.card,
                    backgroundImage: isUser
                      ? `linear-gradient(135deg, ${c.green} 0%, ${c.green2} 100%)`
                      : 'none',
                    color: isUser ? '#fff' : c.dark,
                    border: isUser ? 'none' : `1px solid ${c.border}`,
                    fontSize: '.82rem',
                    lineHeight: 1.65,
                    fontWeight: 300,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: isUser
                      ? '0 2px 8px rgba(90,138,103,.2)'
                      : '0 1px 4px rgba(0,0,0,.04)',
                  }}>
                    {content}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '.7rem 1rem',
                  borderRadius: '14px 14px 14px 4px',
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  display: 'flex', gap: '.3rem', alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: c.muted, display: 'inline-block',
                      animation: `chatDot 1.4s infinite ${i * .2}s`,
                      opacity: .4,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions — only show when there's just the greeting */}
          {messages.length <= 1 && !loading && (
            <div style={{
              padding: '.5rem 1rem .2rem',
              display: 'flex', flexWrap: 'wrap', gap: '.4rem',
              background: c.bg,
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); }}
                  style={{
                    padding: '.35rem .7rem',
                    borderRadius: 8,
                    border: `1px solid ${c.border}`,
                    background: c.card,
                    color: c.green,
                    fontSize: '.7rem',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.greenPale; e.currentTarget.style.borderColor = c.green }}
                  onMouseLeave={e => { e.currentTarget.style.background = c.card; e.currentTarget.style.borderColor = c.border }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '.75rem 1rem',
            borderTop: `1px solid ${c.border}`,
            display: 'flex', gap: '.6rem', alignItems: 'flex-end',
            background: c.card,
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Selora anything..."
              rows={1}
              style={{
                flex: 1,
                padding: '.6rem .8rem',
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                fontSize: '.84rem',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                resize: 'none',
                background: c.bg,
                color: c.dark,
                lineHeight: 1.5,
                maxHeight: 80,
                overflowY: 'auto',
              }}
              onFocus={e => e.currentTarget.style.borderColor = c.green}
              onBlur={e => e.currentTarget.style.borderColor = c.border}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: input.trim() && !loading ? c.green : '#D1D5DB',
                color: '#fff', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0,
                transition: 'background .2s',
              }}
            >
              ↑
            </button>
          </div>

        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatDot {
          0%, 80%, 100% { opacity: .4; transform: scale(.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes chatBubbleFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
