import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../lib/ChatContext'
import { useAppContext } from '../lib/AppContext'

const c = {
  green: 'var(--g)', green2: 'var(--g2)', greenPale: 'var(--gpale)',
  dark: 'var(--text-primary)', text: 'var(--text-secondary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', card: 'var(--bg-1)',
}

const SUGGESTIONS = [
  "Which products are selling the best?",
  "Any products I should reprice?",
  "Optimize my weakest listing",
  "Give me a quick store health check",
]

export default function ChatWidget({ storeId, isGuest = false }) {
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
    retryLastMessage,
    pendingDelete,
    setPendingDelete,
  } = useChat()

  const [input, setInput] = useState('')
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false)
  const [bottomOffset] = useState(28)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const widgetRef = useRef(null)
  const navigate = useNavigate()
  const { stores, activeStore, setActiveStore } = useAppContext()

  useEffect(() => {
    if (isGuest && !open && window.location.pathname === '/') {
      const timer = setTimeout(() => {
        setShowWelcomeBubble(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isGuest, open])

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

    // Cross-store detection: if user mentions a different store by name, switch to it first
    if (!isGuest && stores?.length > 1) {
      const lowerText = text.toLowerCase()
      const mentionedStore = stores.find(st => {
        const name = (st.shop_name || '').toLowerCase().trim()
        return name && name !== (activeStore?.shop_name || '').toLowerCase().trim() && lowerText.includes(name)
      })
      if (mentionedStore) {
        setInput('')
        // Switch the active store first so UI reflects the change
        setActiveStore(mentionedStore)
        navigate('/dashboard')
        // Send message to the MENTIONED store's ID, not the old storeId
        await sendGlobalMessage(text, mentionedStore.id, isGuest)
        return
      }
    }

    setInput('')
    await sendGlobalMessage(text, storeId, isGuest)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text) => {
    setInput(text)
    setTimeout(async () => {
      if (!text.trim() || loading || !storeId) return

      // Cross-store detection for suggestions
      if (!isGuest && stores?.length > 1) {
        const lowerText = text.toLowerCase()
        const mentionedStore = stores.find(st => {
          const name = (st.shop_name || '').toLowerCase().trim()
          return name && name !== (activeStore?.shop_name || '').toLowerCase().trim() && lowerText.includes(name)
        })
        if (mentionedStore) {
          setInput('')
          setActiveStore(mentionedStore)
          navigate('/dashboard')
          await sendGlobalMessage(text, mentionedStore.id, isGuest)
          return
        }
      }

      setInput('')
      sendGlobalMessage(text, storeId, isGuest)
    }, 50)
  }

  if (!storeId) return null

  return (
    <>
      {/* Welcome Bubble for guests */}
      {!open && showWelcomeBubble && (
        <div 
          className="cn-chat-widget landing-scoped"
          style={{
            position: 'fixed', bottom: bottomOffset + 70, right: 28, zIndex: 1000,
            background: c.card, border: `1px solid ${c.border}`,
            borderRadius: 16, padding: '12px 18px', width: 260,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
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
          Welcome! Ask me anything about Selora or explore demo store insights. 🌸
          <button 
            onClick={(e) => { e.stopPropagation(); setShowWelcomeBubble(false); }}
            style={{
              position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '.75rem', color: c.muted, padding: 2
            }}
          >
            ✕
          </button>
          <div style={{
            position: 'absolute', bottom: -6, right: 24, width: 12, height: 12,
            background: c.card, borderRight: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`,
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setHasNewMessage(false); setShowWelcomeBubble(false); }}
          style={{
            position: 'fixed', bottom: bottomOffset, right: 28, zIndex: 1000,
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
        <div ref={widgetRef} className={`cn-chat-widget${isGuest ? ' landing-scoped' : ''}`} style={{
          position: 'fixed', bottom: bottomOffset - 4, right: 24, zIndex: 1001,
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
            background: 'linear-gradient(135deg, #5A8A67 0%, #78A885 100%)',
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
                  {isGuest ? 'Online — Demo Mode' : 'Online — connected to your store'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              {!isGuest && (
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
              )}
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
              if (i === 0 && isGuest && msg.role === 'assistant') {
                content = "Welcome to Selora! I'm your AI fashion growth agent.\n\nI automatically optimize pricing, list products, manage inventory, and grow sales. I've loaded a demo store context for you so you can see what I can do!\n\nTry asking me:\n• 'Which products are selling the best?'\n• 'How can I improve my store's pricing?'\n• 'What features does Selora offer?'"
              }

              const isErrorMessage = !isUser && content === "Sorry, something went wrong on my end — please try again in a moment."

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
                    {isErrorMessage && (
                      <div style={{ marginTop: '0.6rem', borderTop: `1px solid ${c.border}`, paddingTop: '0.6rem' }}>
                        <button
                          onClick={() => retryLastMessage(storeId, isGuest)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '.45rem .8rem',
                            borderRadius: 8,
                            background: `linear-gradient(135deg, ${c.green} 0%, ${c.green2} 100%)`,
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '.76rem',
                            fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 2px 6px rgba(90, 138, 103, 0.15)',
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    )}
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
                <button key={i} onClick={() => handleSuggestion(s)}
                  style={{
                    padding: '.35rem .7rem',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-2)',
                    color: 'var(--text-secondary)',
                    fontSize: '.7rem',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--gpale)'; e.currentTarget.style.borderColor = 'var(--g)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Delete Confirmation Banner */}
          {pendingDelete && (
            <div style={{
              margin: '0 1rem 0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#EF4444' }}>
                Confirm deletion
              </div>
              <div style={{ fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Are you sure you want to permanently delete this product? This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                  onClick={() => { setPendingDelete(null); setInput('yes, delete it'); setTimeout(() => handleSend(), 50) }}
                  style={{ flex: 1, padding: '.45rem', borderRadius: 7, border: 'none', background: '#EF4444', color: '#fff', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Yes, Delete It
                </button>
                <button
                  onClick={() => { setPendingDelete(null); sendGlobalMessage('cancel', storeId, isGuest) }}
                  style={{ flex: 1, padding: '.45rem', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text-primary)', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
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
