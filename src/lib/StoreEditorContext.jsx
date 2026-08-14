import { createContext, useContext, useState, useCallback } from 'react'

const StoreEditorContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Section keys supported for AI editing
export const EDITABLE_SECTIONS = ['hero', 'trustBar', 'categories', 'brandStory', 'newsletter']

// Human-readable labels for each section key
export const SECTION_LABELS = {
  hero:        'Hero Section',
  trustBar:    'Trust Bar',
  categories:  'Categories',
  brandStory:  'Brand Story',
  newsletter:  'Newsletter',
}

// Suggestion chips shown in the agent panel per section
export const SECTION_CHIPS = {
  hero: [
    'Write a bolder headline',
    'Update the subtitle copy',
    'Change hero layout to minimal',
    'Suggest a CTA button text',
  ],
  trustBar: [
    'Add a new trust item',
    'Rewrite the shipping message',
    'Change trust bar icons',
  ],
  categories: [
    'Rename a category',
    'Reorder the category cards',
    'Update the eyebrow label',
  ],
  brandStory: [
    'Rewrite the brand story',
    'Update the CTA link text',
    'Change the section eyebrow',
  ],
  newsletter: [
    'Rewrite the newsletter headline',
    'Change the subscribe button text',
    'Update the email placeholder',
  ],
}

export function StoreEditorProvider({ children }) {
  // Which section the seller has clicked to edit. null = no selection.
  const [selectedSection, setSelectedSectionState] = useState(null)

  // The live template_data of the store being edited, kept in sync by StoreBuilder.
  // Used so the backend always receives the current state to diff against.
  const [currentTemplateData, setCurrentTemplateData] = useState(null)

  // Seller-managed categories live in the top-level selora_stores.categories
  // column, not in template_data — the storefront renders that column whenever
  // it is set (Storefront.jsx isCustom branch), so the categories section edits it.
  const [currentCategories, setCurrentCategories] = useState(null)

  // Most recent pending proposal from the agent. Not yet saved to the backend.
  // Shape: { section, target: 'template_data'|'store', patch, description } | null
  const [pendingProposal, setPendingProposal] = useState(null)

  // The preview-mode template_data with the proposal patch applied.
  // When non-null, Storefront preview renders this instead of currentTemplateData.
  const [proposalPreviewData, setProposalPreviewData] = useState(null)

  // Preview overrides for top-level store columns (currently just `categories`),
  // used when the pending proposal targets the store record rather than template_data.
  const [proposalPreviewStore, setProposalPreviewStore] = useState(null)

  // Local ephemeral message thread for the section-edit conversation.
  // NOT stored in ChatContext — discarded when section is deselected.
  const [sectionMessages, setSectionMessages] = useState([])

  // True while the backend is processing a section-edit message.
  const [proposalLoading, setProposalLoading] = useState(false)

  // Any error from the last proposal request.
  const [proposalError, setProposalError] = useState(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function deepMerge(target, source) {
    if (!source) return target
    const result = { ...target }
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

  const quote = (v) => `"${v}"`

  /**
   * Builds the Apply confirmation line from what was ACTUALLY saved — the patch
   * that went to the server and the state it replaced. Never phrased by the LLM,
   * so it cannot claim a value that wasn't persisted.
   */
  function describeSavedChange(proposal, categoriesBefore) {
    const label = SECTION_LABELS[proposal.section] || proposal.section

    if (proposal.target === 'store' && Array.isArray(proposal.patch?.categories)) {
      const before = (categoriesBefore || []).map(c => c?.name).filter(Boolean)
      const after = proposal.patch.categories.map(c => c?.name).filter(Boolean)
      const added = after.filter(n => !before.includes(n))
      const removed = before.filter(n => !after.includes(n))

      if (added.length && !removed.length) {
        return `Done — ${added.map(quote).join(', ')} added to your categories.`
      }
      if (removed.length && !added.length) {
        return `Done — ${removed.map(quote).join(', ')} removed from your categories.`
      }
      if (added.length && removed.length) {
        return `Done — ${added.map(quote).join(', ')} added, ${removed.map(quote).join(', ')} removed.`
      }
      return `Done — your categories are now: ${after.join(', ')}.`
    }

    // template_data patches: report every scalar leaf that was written.
    const lines = []
    const walk = (node) => {
      if (!node || typeof node !== 'object') return
      for (const [key, value] of Object.entries(node)) {
        if (Array.isArray(value)) {
          lines.push(`${key}: ${value.length} item${value.length === 1 ? '' : 's'} updated`)
        } else if (value && typeof value === 'object') {
          walk(value)
        } else {
          lines.push(`${key}: ${quote(value)}`)
        }
      }
    }
    walk(proposal.patch)

    if (!lines.length) return `Done — ${label} saved.`
    if (lines.length === 1) return `Done — ${label} saved. ${lines[0]}`
    return `Done — ${label} saved.\n${lines.join('\n')}`
  }

  // ── Public Actions ────────────────────────────────────────────────────────────

  /**
   * Called by StoreBuilder when the seller clicks a section in the preview.
   * Clears any in-flight proposal from a previous section selection.
   */
  const setSelectedSection = useCallback((key) => {
    if (!EDITABLE_SECTIONS.includes(key)) return
    setSelectedSectionState(key)
    setSectionMessages([])
    setPendingProposal(null)
    setProposalPreviewData(null)
    setProposalPreviewStore(null)
    setProposalError(null)
  }, [])

  /**
   * Called when the seller clicks [×] or selects a different section.
   * Discards any unconfirmed proposal and clears selection.
   */
  const clearSelectedSection = useCallback(() => {
    setSelectedSectionState(null)
    setSectionMessages([])
    setPendingProposal(null)
    setProposalPreviewData(null)
    setProposalPreviewStore(null)
    setProposalError(null)
  }, [])

  /**
   * Called by StoreBuilder's useEffect whenever `form` changes.
   * Keeps currentTemplateData fresh so the backend always diffs against current state.
   */
  const syncTemplateData = useCallback((templateData) => {
    setCurrentTemplateData(templateData)
  }, [])

  /**
   * Keeps the seller's live category list fresh, for the same reason as
   * syncTemplateData — the categories section diffs against the store column.
   */
  const syncCategories = useCallback((categories) => {
    setCurrentCategories(categories)
  }, [])

  /**
   * Routes a message through the section-edit backend path.
   * Called by SidebarLayout's handleSend when selectedSection is non-null.
   *
   * @param {string} text - The user's message
   * @param {string} storeId - The active store's ID
   * @param {string} accessToken - Supabase access token for auth header
   */
  const sendSectionMessage = useCallback(async (text, storeId, accessToken) => {
    if (!text.trim() || proposalLoading || !storeId || !selectedSection) return

    // Append user message to local ephemeral thread
    setSectionMessages(prev => [...prev, { role: 'user', content: text }])
    setProposalLoading(true)
    setProposalError(null)

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const body = {
        message: text,
        session_id: `section-edit-${selectedSection}`,
        // 'notice' messages are UI-only — the API accepts user/assistant roles.
        history: sectionMessages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content })),
        is_guest: false,
        editing_context: {
          section: selectedSection,
          current_template_data: currentTemplateData || {},
          current_categories: currentCategories ?? null,
        },
      }

      const res = await fetch(`${API_URL}/api/chat/${storeId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('API_ERROR')

      const data = await res.json()

      // Append agent response to local ephemeral thread
      const agentContent = data.response || "I wasn't able to generate an edit. Please try rephrasing."
      setSectionMessages(prev => [...prev, { role: 'assistant', content: agentContent }])

      // Handle proposal — distinct from actions[], never auto-executes
      const hasPatch = data.proposal && data.proposal.patch &&
        Object.keys(data.proposal.patch).length > 0

      if (hasPatch) {
        const proposal = {
          section: data.proposal.section || selectedSection,
          target: data.proposal.target || 'template_data',
          patch: data.proposal.patch,
          description: agentContent,
        }
        setPendingProposal(proposal)

        if (proposal.target === 'store') {
          // Top-level store columns are replaced wholesale, not deep-merged —
          // the model returns the complete updated array.
          setProposalPreviewStore(proposal.patch)
          setProposalPreviewData(null)
        } else if (currentTemplateData) {
          // Apply patch to currentTemplateData for live preview (without saving)
          setProposalPreviewData(deepMerge(currentTemplateData, proposal.patch))
          setProposalPreviewStore(null)
        }
      } else {
        // The agent replied but produced nothing applicable. Say so explicitly —
        // otherwise the seller is left with prose and a dead panel.
        setPendingProposal(null)
        setProposalPreviewData(null)
        setProposalPreviewStore(null)
        setSectionMessages(prev => [...prev, {
          role: 'notice',
          content: "I wasn't able to generate a specific change from that — could you try rephrasing?",
        }])
      }
    } catch (e) {
      console.error('[StoreEditor] sendSectionMessage error:', e)
      const errMsg = 'Something went wrong — please try again.'
      setSectionMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
      setProposalError(errMsg)
    } finally {
      setProposalLoading(false)
    }
  }, [selectedSection, currentTemplateData, sectionMessages, proposalLoading])

  /**
   * Confirms and persists the pending proposal.
   * Merges the patch into the form state in StoreBuilder, then calls PUT /selora-stores/{id}.
   *
   * @param {string} storeId
   * @param {object} currentForm - The current StoreBuilder form state
   * @param {function} setForm - StoreBuilder's setForm setter
   * @param {function} apiCall - The authenticated api() helper from StoreBuilder
   * @returns {Promise<boolean>} true if the save was persisted, false otherwise.
   *   On false the proposal is left intact so the seller can retry Apply without
   *   redoing the conversation.
   */
  const confirmProposal = useCallback(async (storeId, currentForm, setForm, apiCall) => {
    if (!pendingProposal) return false

    // Clear any error from a previous failed attempt so a retry starts clean.
    setProposalError(null)

    // The seller's click is part of the conversation, so it goes in the thread.
    setSectionMessages(prev => [...prev, { role: 'user', content: 'Apply & Save' }])

    const fail = () => {
      setProposalError("Couldn't save your changes. Please try again.")
      setSectionMessages(prev => [...prev, {
        role: 'assistant',
        content: "Couldn't save — please try again.",
      }])
      return false
    }

    if (!storeId) return fail()

    // Where the patch lands depends on the target the backend declared.
    const toStore = pendingProposal.target === 'store'
    const categoriesBefore = currentForm?.categories

    const mergedTemplateData = toStore
      ? null
      : deepMerge(currentForm?.template_data || {}, pendingProposal.patch)

    // The model returns id:"" for categories it invented. Assign real ids here —
    // StoreBuilder's remove/update handlers key off id, so blank ones would make
    // two new categories indistinguishable. Matches StoreBuilder's id format.
    const savedCategories = toStore
      ? pendingProposal.patch.categories.map(c => c?.id ? c : {
          ...c,
          id: `cat_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        })
      : null

    // Top-level columns are replaced wholesale — the model returns the complete
    // updated array, so merging would duplicate rather than replace.
    const body = toStore
      ? { categories: savedCategories }
      : { template_data: mergedTemplateData }

    try {
      // Persist BEFORE touching local state. If the PUT fails, the form is left
      // untouched and the proposal survives — otherwise a failed save would still
      // mutate the builder form and silently desync it from the database.
      await apiCall(`PUT`, `/selora-stores/${storeId}`, body)
    } catch (e) {
      console.error('[StoreEditor] confirmProposal error:', e)
      return fail()
    }

    setForm(toStore
      ? { ...currentForm, categories: savedCategories }
      : { ...currentForm, template_data: mergedTemplateData })

    // Built from the patch that was actually persisted — never from the LLM.
    setSectionMessages(prev => [...prev, {
      role: 'assistant',
      content: describeSavedChange(pendingProposal, categoriesBefore),
    }])

    setPendingProposal(null)
    setProposalPreviewData(null)
    setProposalPreviewStore(null)
    return true
  }, [pendingProposal])

  /**
   * Discards the pending proposal without saving.
   * Reverts the preview to the unpatched currentTemplateData.
   */
  const discardProposal = useCallback(() => {
    setPendingProposal(null)
    setProposalPreviewData(null)
    setProposalPreviewStore(null)
  }, [])

  // ── Context value ─────────────────────────────────────────────────────────────

  const value = {
    // State
    selectedSection,
    currentTemplateData,
    currentCategories,
    pendingProposal,
    proposalPreviewData,
    proposalPreviewStore,
    sectionMessages,
    proposalLoading,
    proposalError,

    // Actions
    setSelectedSection,
    clearSelectedSection,
    syncTemplateData,
    syncCategories,
    sendSectionMessage,
    confirmProposal,
    discardProposal,
  }

  return (
    <StoreEditorContext.Provider value={value}>
      {children}
    </StoreEditorContext.Provider>
  )
}

export function useStoreEditor() {
  const context = useContext(StoreEditorContext)
  if (!context) {
    throw new Error('useStoreEditor must be used within a StoreEditorProvider')
  }
  return context
}
