import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStoreEditor, SECTION_LABELS, SECTION_CHIPS } from '../lib/StoreEditorContext'

/**
 * Section-edit panel, docked on the right inside StoreBuilder's live preview modal.
 *
 * Deliberately self-contained: it reads the ephemeral `sectionMessages` thread from
 * StoreEditorContext and calls sendSectionMessage() directly. It has no connection to
 * ChatContext or SidebarLayout — the section conversation is discarded when the seller
 * deselects, and must not mix with the persistent store-agent thread.
 */
export default function SectionEditPanel({
  storeId,
  form,
  setForm,
  api,
  collapsed = false,
  onToggleCollapse,
}) {
  const {
    selectedSection,
    sectionMessages,
    proposalLoading,
    proposalError,
    pendingProposal,
    clearSelectedSection,
    sendSectionMessage,
    confirmProposal,
    discardProposal,
  } = useStoreEditor()

  const [inputText, setInputText] = useState('')
  const [applying, setApplying] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const messagesEndRef = useRef(null)
  const savedTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(savedTimerRef.current), [])

  const label = SECTION_LABELS[selectedSection] || selectedSection
  const chips = SECTION_CHIPS[selectedSection] || []

  // Scroll to the newest message as the thread grows.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [sectionMessages, proposalLoading])

  // StoreBuilder keys this component on selectedSection, so switching sections
  // remounts it — the draft input and applying flag reset without an effect.
  if (!selectedSection) return null

  const send = async (text) => {
    const trimmed = (text ?? '').trim()
    if (!trimmed || proposalLoading || !storeId) return
    setInputText('')
    setSavedNotice(false)
    const { data: { session } } = await supabase.auth.getSession()
    sendSectionMessage(trimmed, storeId, session?.access_token || '')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    send(inputText)
  }

  const handleApply = async () => {
    setApplying(true)
    setSavedNotice(false)
    try {
      // false means the PUT failed — proposalError is set and the proposal is
      // still pending, so the banner stays put and Apply can be retried.
      const saved = await confirmProposal(storeId, form, setForm, api)
      if (saved) {
        setSavedNotice(true)
        clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => setSavedNotice(false), 4000)
      }
    } finally {
      setApplying(false)
    }
  }

  // ── Collapsed rail ──────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div
        style={{
          width: 44,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0.75rem 0',
          gap: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand editor panel"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '1rem',
            padding: 4,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <span
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          Editing: {label}
        </span>
        {pendingProposal && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--g, #5A8A67)',
              flexShrink: 0,
            }}
            title="Proposal awaiting review"
          />
        )}
      </div>
    )
  }

  // ── Expanded panel ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: 360,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.7rem 0.85rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Editing
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse panel"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '4px 6px', lineHeight: 1 }}
          >
            ›
          </button>
          <button
            type="button"
            onClick={clearSelectedSection}
            title="Close editor (deselect section)"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '4px 6px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message thread */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
        className="no-scrollbar"
      >
        {sectionMessages.length === 0 && !proposalLoading && (
          <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            Describe the change you want for the {label.toLowerCase()}. The agent will propose an
            edit you can preview before saving.
          </p>
        )}

        {sectionMessages.map((m, idx) => m.role === 'notice' ? (
          // UI-generated, not the agent speaking — styled apart so it reads that way.
          <div
            key={idx}
            style={{
              alignSelf: 'stretch',
              padding: '0.5rem 0.7rem',
              borderRadius: 10,
              border: '1px dashed var(--border)',
              background: 'transparent',
              fontSize: '0.78rem',
              lineHeight: 1.45,
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            {m.content}
          </div>
        ) : (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '0.55rem 0.8rem',
              borderRadius: 12,
              fontSize: '0.82rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? 'var(--g, #5A8A67)' : 'var(--bg-0)',
              color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
            }}
          >
            {m.content}
          </div>
        ))}

        {proposalLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '0.55rem 0.8rem',
              borderRadius: 12,
              background: 'var(--bg-0)',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            Thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Proposal banner — consolidated here, not duplicated over the preview canvas */}
      {pendingProposal && (
        <div
          style={{
            margin: '0 0.85rem 0.6rem',
            padding: '0.7rem 0.8rem',
            background: 'var(--bg-0)',
            border: '1px solid var(--g, #5A8A67)',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              Proposal ready — {SECTION_LABELS[pendingProposal.section] || pendingProposal.section}
            </p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-muted)' }}>
              Previewing on the left. Apply to save it to your store.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: 8,
                border: 'none',
                background: 'var(--g, #5A8A67)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: applying ? 'default' : 'pointer',
                opacity: applying ? 0.65 : 1,
              }}
            >
              {applying ? 'Saving…' : 'Apply & Save'}
            </button>
            <button
              type="button"
              onClick={discardProposal}
              disabled={applying}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-1)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: applying ? 'default' : 'pointer',
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Save confirmation — auto-dismisses after 4s */}
      {savedNotice && (
        <div
          style={{
            margin: '0 0.85rem 0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(90, 138, 103, 0.12)',
            border: '1px solid var(--g, #5A8A67)',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--g, #5A8A67)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexShrink: 0,
          }}
        >
          <span aria-hidden="true">✓</span> Saved to your store
        </div>
      )}

      {/* Error */}
      {proposalError && (
        <div
          style={{
            margin: '0 0.85rem 0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            fontSize: '0.76rem',
            color: '#EF4444',
            flexShrink: 0,
          }}
        >
          {proposalError}
        </div>
      )}

      {/* Suggestion chips — only while the thread is empty */}
      {sectionMessages.length === 0 && chips.length > 0 && (
        <div
          style={{
            padding: '0 0.85rem 0.6rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            flexShrink: 0,
          }}
        >
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => send(chip)}
              disabled={proposalLoading}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--bg-0)',
                color: 'var(--text-primary)',
                fontSize: '0.72rem',
                fontWeight: 500,
                cursor: proposalLoading ? 'default' : 'pointer',
                textAlign: 'left',
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '0.7rem 0.85rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.45rem',
          alignItems: 'flex-end',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(inputText)
            }
          }}
          rows={1}
          placeholder={`Edit the ${label.toLowerCase()}…`}
          disabled={proposalLoading}
          style={{
            flex: 1,
            resize: 'none',
            padding: '0.5rem 0.7rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-0)',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            lineHeight: 1.45,
            outline: 'none',
            maxHeight: 110,
          }}
        />
        <button
          type="submit"
          disabled={proposalLoading || !inputText.trim()}
          style={{
            padding: '0.5rem 0.85rem',
            borderRadius: 8,
            border: 'none',
            background: 'var(--g, #5A8A67)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: proposalLoading || !inputText.trim() ? 'default' : 'pointer',
            opacity: proposalLoading || !inputText.trim() ? 0.55 : 1,
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
