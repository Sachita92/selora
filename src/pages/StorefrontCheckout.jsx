import { Mark } from '../components/Logo'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const cartKey = (handle) => `selora-checkout-cart:${handle}`
const orderKey = (reference) => `selora-checkout-order:${reference}`
const pendingKey = (handle) => `selora-checkout-pending:${handle}`

const readJSON = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') } catch { return null }
}
const writeJSON = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

function deepMerge(target, source) {
  if (!source) return target
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

// Same defaults as Storefront.jsx so an uncustomized store renders identically.
const DEFAULT_PALETTE = {
  background: '#F6F1E8',
  surface: '#EFE6D6',
  accent: '#B08968',
  text: '#3D362B',
  secondaryText: '#8A8072',
  border: '#E4DCD0',
}

const POLL_MS = 2500
const MAX_ATTEMPTS = 24
const SLOW_POLL_MS = 10000
const SLOW_MAX_ATTEMPTS = 60

// ── Wallet pre-flight copy ────────────────────────────────────────────────────
const insufficientSolCopy = (solBalance) =>
  `Insufficient Devnet SOL for network fees. You have ${solBalance.toFixed(4)} SOL, but at least 0.005 SOL is required. Please airdrop Devnet SOL to your wallet.`
const insufficientUsdcCopy = (neededUsdc, usdcBalance) =>
  `You need ${Number(neededUsdc).toFixed(2)} USDC but your wallet has ${usdcBalance.toFixed(2)} USDC. Get Devnet USDC from faucet.circle.com.`

const simulationFailureCopy = (err, neededUsdc, solBalance, usdcBalance) => {
  let detail = ''
  try { detail = JSON.stringify(err) ?? String(err) } catch { detail = String(err) }
  if (/InsufficientFundsForFee|InsufficientFundsForRent|AccountNotFound/.test(detail)) {
    return insufficientSolCopy(solBalance)
  }
  if (/"Custom":1\b|InsufficientFunds/.test(detail)) {
    return insufficientUsdcCopy(neededUsdc, usdcBalance)
  }
  return 'The network reported that this payment would fail, so your wallet was not opened and nothing was sent. Please try again — or scan the QR code below to pay from a wallet on your phone.'
}

export default function StorefrontCheckout() {
  const { handle, reference } = useParams()
  const navigate = useNavigate()

  const [store, setStore] = useState(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [storeError, setStoreError] = useState('')

  // Bag page state (read-only snapshot handed over by the drawer; quantity
  // edits stay in the drawer)
  const [cart] = useState(() => readJSON(cartKey(handle)) || [])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Payment page state
  const [phase, setPhase] = useState('awaiting')
  const [attempts, setAttempts] = useState(0)
  const [txSignature, setTxSignature] = useState('')
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [orderCtx] = useState(() => (reference ? readJSON(orderKey(reference)) : null))
  const [confirmedOrderId, setConfirmedOrderId] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [submittedSig, setSubmittedSig] = useState('')
  const [slowExhausted, setSlowExhausted] = useState(false)

  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState('idle')
  const [emailError, setEmailError] = useState('')

  const pollRef = useRef(null)
  const phaseRef = useRef(phase)
  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Store config (palette, name, currency) — same public read the storefront uses
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/selora-stores/public/${handle}`)
        if (!res.ok) { const j = await res.json(); throw new Error(j.detail || 'Store not found') }
        const data = await res.json()
        setStore(data.store)
      } catch (e) { setStoreError(e.message) }
      finally { setLoadingStore(false) }
    }
    load()
  }, [handle])

  // ── Polling verify — the reference URL is the source of truth. On mount with a
  // reference, resume polling regardless of how payment was initiated (this is
  // what makes the QR path verifiable and makes refresh harmless).
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  // One verify round-trip, shared by the fast cycle and the stalled slow watch.
  // Applies any phase change and returns true when a TERMINAL phase was reached
  // (confirmed / failed / expired) so the caller stops its interval.
  const applyVerify = useCallback(async (ref) => {
    const res = await fetch(`${API}/api/checkout/solana/verify/${ref}`)
    if (res.status === 404) {
      setPhase('expired')
      return true
    }
    if (!res.ok) throw new Error('verify failed')
    const data = await res.json()
    if (data.status === 'confirmed') {
      setTxSignature(data.signature || '')
      setConfirmedOrderId(data.order_id || '')
      setReceipt({
        items: Array.isArray(data.items) ? data.items : [],
        total_usd: data.total_usd,
        created_at: data.created_at,
        has_email: !!data.has_email,
      })
      setPhase('confirmed')
      try {
        sessionStorage.removeItem(cartKey(handle))
        sessionStorage.removeItem(pendingKey(handle))
      } catch { /* ignore */ }
      return true
    }
    if (data.status === 'failed') {
      setPhase('failed')
      return true
    }
    // The order sat unpaid past its TTL and the server expired it. Terminal:
    // the bag survives, so "Back to your bag" starts a fresh order.
    if (data.status === 'expired') {
      try { sessionStorage.removeItem(pendingKey(handle)) } catch { /* ignore */ }
      setPhase('expired')
      return true
    }
    // Distinguish "no transaction yet" from "transaction seen, settling".
    if (data.message && !data.message.includes('No transaction found')) {
      setPhase((p) => (p === 'awaiting' ? 'confirming' : p))
    }
    return false
  }, [handle])

  // NOTE: does not reset the attempts display itself (so it can be invoked from
  // the mount effect without a synchronous setState); event-handler call sites
  // that restart a cycle reset attempts first.
  const startPolling = useCallback((ref) => {
    stopPolling()
    let n = 0
    pollRef.current = setInterval(async () => {
      n += 1
      setAttempts(n)
      try {
        const done = await applyVerify(ref)
        if (done) { stopPolling(); return }
        if (n >= MAX_ATTEMPTS) {
          stopPolling()
          // Not terminal: the slow-watch effect below takes over.
          setPhase('stalled')
        }
      } catch { /* transient network error — keep polling */ }
    }, POLL_MS)
  }, [applyVerify, stopPolling])

  useEffect(() => {
    if (reference) startPolling(reference)
    return stopPolling
  }, [reference, startPolling, stopPolling])

  // STALLED must not stop watching: while the stalled UI is up, keep checking
  // at a slower cadence for up to ~10 minutes. A late confirmation flips the
  // page to the receipt regardless of what the buyer is doing here. "Check
  // again" (fast cycle) unmounts this via the phase change; so does any
  // terminal phase.
  useEffect(() => {
    if (phase !== 'stalled' || !reference) return
    let n = 0
    const slow = setInterval(async () => {
      n += 1
      try {
        const done = await applyVerify(reference)
        if (done) { clearInterval(slow); return }
      } catch { /* transient network error — keep watching */ }
      if (n >= SLOW_MAX_ATTEMPTS) {
        clearInterval(slow)
        setSlowExhausted(true)
      }
    }, SLOW_POLL_MS)
    return () => clearInterval(slow)
  }, [phase, reference, applyVerify])

  // ── Courtesy leave-warning while a payment is in flight. Not load-bearing:
  // the /checkout/{reference} URL survives and resumes polling on return.
  // Stalled counts as in-flight when a wallet transaction was submitted this
  // session — that payment may still land, and paying again doubles the charge.
  useEffect(() => {
    const pending = reference && (
      phase === 'awaiting' || phase === 'confirming' || paying ||
      (phase === 'stalled' && !!submittedSig)
    )
    if (!pending) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [reference, phase, paying, submittedSig])

  // ── In-page leaving guard ───────────────────────────────────────────────────
  // The same don't-pay-again warning the stalled state's "Back to bag" uses,
  // shared by every in-page way off the payment page (brand link, back link).
  // Guarded while a payment may be in flight: awaiting/confirming, a wallet
  // prompt open, or a wallet transaction submitted this session. Terminal
  // phases (confirmed/expired/failed) — and the bag page, which has no
  // reference — leave freely.
  const terminalPhase = phase === 'confirmed' || phase === 'expired' || phase === 'failed'
  const paymentMayBeInFlight = !!reference && !terminalPhase &&
    (phase === 'awaiting' || phase === 'confirming' || paying || !!submittedSig)
  const confirmLeave = () =>
    !paymentMayBeInFlight ||
    window.confirm('Your payment may still be processing. Paying again could charge you twice.\n\nLeave this page anyway?')

  // ── Create the order (relocated from Storefront's handleCheckoutInitiate) ──
  const createOrder = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const activeWallet = window.solana?.publicKey?.toString() || null
      const cartPayload = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }))
      // If this session already created a still-open order, present its
      // reference so the server resumes it instead of inserting a duplicate.
      const priorReference = readJSON(pendingKey(handle))
      const response = await fetch(`${API}/api/checkout/solana/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: store.id, buyer_wallet: activeWallet, cart: cartPayload, prior_reference: priorReference || null }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to initiate checkout')
      }
      const data = await response.json()
      writeJSON(pendingKey(handle), data.reference)
      writeJSON(orderKey(data.reference), {
        order_id: data.order_id,
        reference: data.reference,
        recipient: data.recipient,
        amount_usdc: data.amount_usdc,
        spl_token_mint: data.spl_token_mint,
        memo: data.memo,
        items: cart.map(i => ({ title: i.product.title, price: i.product.price, quantity: i.quantity })),
        store_name: store.name,
        created_at: Date.now(),
      })
      navigate(`/store/${handle}/checkout/${data.reference}`)
    } catch (err) {
      setCreateError(err.message || 'Could not connect to payment gateway')
    } finally {
      setCreating(false)
    }
  }

  // ── Phantom payment (relocated from Storefront's handleWalletPayment; reads
  // the persisted order context instead of component state) ──────────────────
  const payWithPhantom = async () => {
    if (!orderCtx) return
    setPaying(true)
    setPayError('')
    try {
      const phantom = window.solana
      if (!phantom || !phantom.isPhantom) {
        throw new Error('Phantom wallet not found. Please install the Phantom browser extension.')
      }
      if (!phantom.isConnected) await phantom.connect()
      const buyerPubkey = phantom.publicKey
      if (!buyerPubkey) throw new Error('Could not read Phantom public key. Make sure Phantom is unlocked.')

      const [
        { Connection, PublicKey, TransactionMessage, VersionedTransaction },
        { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction,
          createTransferCheckedInstruction, TOKEN_PROGRAM_ID, getMint },
      ] = await Promise.all([
        import('@solana/web3.js'),
        import('@solana/spl-token'),
      ])

      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL ||
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/rpc/solana`
      const wsUrl = rpcUrl.includes('127.0.0.1') || rpcUrl.includes('localhost')
        ? 'wss://api.devnet.solana.com/'
        : undefined
      const conn      = new Connection(rpcUrl, { commitment: 'confirmed', wsEndpoint: wsUrl })
      const mintPk    = new PublicKey(orderCtx.spl_token_mint)
      const recipient = new PublicKey(orderCtx.recipient)
      const refPk     = new PublicKey(orderCtx.reference)

      let decimals = 6
      try {
        const mintInfo = await getMint(conn, mintPk)
        decimals = mintInfo.decimals
      } catch { /* default 6 */ }

      const sourceAta = getAssociatedTokenAddressSync(mintPk, buyerPubkey, false, TOKEN_PROGRAM_ID)
      const destAta   = getAssociatedTokenAddressSync(mintPk, recipient,   false, TOKEN_PROGRAM_ID)

      const [solBalanceLamports, usdcBalanceRes] = await Promise.all([
        conn.getBalance(buyerPubkey).catch(() => 0),
        conn.getTokenAccountBalance(sourceAta).catch(() => null),
      ])
      const solBalance = solBalanceLamports / 1e9
      if (solBalance < 0.005) {
        throw new Error(insufficientSolCopy(solBalance))
      }
      let usdcBalance = 0
      if (usdcBalanceRes && usdcBalanceRes.value) {
        usdcBalance = usdcBalanceRes.value.uiAmount ?? (Number(usdcBalanceRes.value.amount) / Math.pow(10, decimals))
      }
      if (usdcBalance < orderCtx.amount_usdc) {
        throw new Error(insufficientUsdcCopy(orderCtx.amount_usdc, usdcBalance))
      }

      const amountRaw = BigInt(Math.round(orderCtx.amount_usdc * Math.pow(10, decimals)))
      const createSourceAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        buyerPubkey, sourceAta, buyerPubkey, mintPk, TOKEN_PROGRAM_ID
      )
      const createDestAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        buyerPubkey, destAta, recipient, mintPk, TOKEN_PROGRAM_ID
      )
      const transferIx = createTransferCheckedInstruction(
        sourceAta, mintPk, destAta, buyerPubkey, amountRaw, decimals, [], TOKEN_PROGRAM_ID
      )
      transferIx.keys.push({ pubkey: refPk, isSigner: false, isWritable: false })

      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed')
      const txMsg = new TransactionMessage({
        payerKey: buyerPubkey,
        recentBlockhash: blockhash,
        instructions: [createSourceAtaIx, createDestAtaIx, transferIx],
      }).compileToV0Message()
      const versionedTx = new VersionedTransaction(txMsg)

      // Blocking pre-flight simulation — the middle of three layers: the cheap
      // explicit balance checks above run first, Phantom's own simulation
      // stands third behind this one. An error HERE means the network says
      // this exact transaction would fail, so the wallet prompt never opens;
      // setting payError while staying in 'awaiting' keeps the QR path
      // rendered and correct — an extension-wallet problem must not block
      // paying from a phone. If the simulation CALL itself throws, proceed to
      // Phantom as before: an unavailable simulation is not a failed
      // simulation, and Phantom's gate still stands behind it.
      let simulationErr = null
      try {
        const simResult = await conn.simulateTransaction(versionedTx)
        simulationErr = simResult.value.err
      } catch { /* simulation unavailable — not a failed simulation */ }
      if (simulationErr) {
        console.warn('[Checkout] simulation failed, blocking wallet prompt', simulationErr)
        setPayError(simulationFailureCopy(simulationErr, orderCtx.amount_usdc, solBalance, usdcBalance))
        return
      }

      const { signature } = await phantom.signAndSendTransaction(versionedTx)
      setSubmittedSig(signature || 'submitted')
      setPhase('confirming')
      await conn.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed').catch(() => {})

      // A fresh poll cycle after the wallet reports the transaction landed.
      if (phaseRef.current !== 'confirmed') { setAttempts(0); startPolling(orderCtx.reference) }
    } catch (err) {
      let msg = err.message || 'Transaction could not be completed.'
      if (msg.includes('User rejected') || msg.includes('rejected') || msg.includes('cancelled')) {
        msg = 'Transaction was cancelled in Phantom.'
      } else if (msg.includes('Simulation failed') || msg.includes('simulation')) {
        msg = 'Transaction simulation failed in Phantom. Check that your wallet has Devnet SOL for fees and Devnet USDC from faucet.circle.com.'
      } else if (msg.includes('TokenAccountNotFound') || msg.includes('Account does not exist')) {
        msg = 'Devnet USDC token account not found. Please claim Devnet USDC from faucet.circle.com.'
      }
      setPayError(msg)
    } finally {
      setPaying(false)
    }
  }

  // Attaches the address to the paid order and sends the receipt. A failed
  // send is reported inline and never disturbs the receipt above it.
  const submitEmail = async (e) => {
    e.preventDefault()
    const address = email.trim()
    if (!address || emailState === 'sending') return
    setEmailState('sending')
    setEmailError('')
    try {
      const res = await fetch(`${API}/api/checkout/${reference}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'We could not send your receipt.')
      // success:true with sent:false means the address was saved but the mail
      // did not go out — say so rather than promising an email that never lands.
      if (!data.sent) throw new Error('We saved your email, but the receipt could not be sent right now.')
      setEmailState('sent')
    } catch (err) {
      setEmailError(err.message || 'We could not send your receipt.')
      setEmailState('error')
    }
  }

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  // ── Theme (identical derivation to Storefront.jsx) ──────────────────────────
  const palette = deepMerge({ ...DEFAULT_PALETTE }, store?.template_data?.palette)
  const currency = store?.currency || 'USD'

  if (loadingStore) {
    return (
      <div style={{ minHeight: '100vh', background: DEFAULT_PALETTE.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 28, height: 28, border: `2px solid ${DEFAULT_PALETTE.border}`, borderTop: `2px solid ${DEFAULT_PALETTE.accent}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    )
  }

  if (storeError || !store) {
    return (
      <div style={{ minHeight: '100vh', background: DEFAULT_PALETTE.background, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: DEFAULT_PALETTE.text, margin: 0 }}>Store not found</h1>
        <p style={{ color: DEFAULT_PALETTE.secondaryText, fontSize: '.95rem' }}>{storeError}</p>
        <Link to="/" style={{ color: DEFAULT_PALETTE.accent, fontWeight: 600, textDecoration: 'none', fontSize: '.9rem' }}>&larr; Back to Selora</Link>
      </div>
    )
  }

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  // Session context is the fast path; the confirmed verify's receipt payload
  // fills in for email-link visits where sessionStorage is empty.
  const ctxTotal = orderCtx?.amount_usdc ?? (receipt?.total_usd != null ? Number(receipt.total_usd) : null)
  const receiptItems = orderCtx?.items?.length > 0 ? orderCtx.items : (receipt?.items || [])
  const receiptDate = orderCtx || !receipt?.created_at ? new Date() : new Date(receipt.created_at)
  const qrUri = orderCtx
    ? `solana:${orderCtx.recipient}?amount=${orderCtx.amount_usdc}&spl-token=${orderCtx.spl_token_mint}&reference=${orderCtx.reference}&label=Selora%20Store&message=${encodeURIComponent(orderCtx.memo || '')}`
    : null

  // Shared bits of the storefront's card language
  const card = { background: '#fff', border: `1px solid ${palette.border}`, borderRadius: 16 }
  const primaryBtn = {
    width: '100%', padding: '1rem', background: palette.accent, color: '#fff', border: 'none',
    borderRadius: 10, fontSize: '.95rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
    minHeight: 48,
  }
  const quietBtn = {
    ...primaryBtn, background: 'transparent', color: palette.text, border: `1.5px solid ${palette.border}`,
  }
  const dashedRule = { borderTop: `1px dashed ${palette.border}`, margin: '1rem 0' }

  const itemRows = (items) => items.map((it, i) => (
    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '.85rem', marginBottom: '.5rem', color: palette.text }}>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {it.title} <span style={{ color: palette.secondaryText }}>×{it.quantity}</span>
      </span>
      <span style={{ fontWeight: 600, flexShrink: 0 }}>{currency} {(it.price * it.quantity).toFixed(2)}</span>
    </div>
  ))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: palette.background, fontFamily: 'var(--font-body)', color: palette.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .sfc-main { max-width: 560px; width: 100%; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
        @media (max-width: 420px) { .sfc-main { padding: 1.25rem .9rem 3rem; } }
        .sfc-btn:hover { opacity: .92; }
      `}</style>

      {/* Storefront nav — same sticky bar language as Storefront.jsx */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: palette.background + 'F2', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${palette.border}`, padding: '0 1.25rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to={`/store/${handle}`}
            onClick={(e) => { if (!confirmLeave()) e.preventDefault() }}
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, color: palette.text, textDecoration: 'none', letterSpacing: '-0.02em' }}
          >
            {store.name}
          </Link>
          <span style={{ fontSize: '.72rem', fontWeight: 700, background: palette.surface, color: palette.accent, padding: '.25rem .6rem', borderRadius: 20, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Checkout
          </span>
        </div>
      </nav>

      <main className="sfc-main">
        {/* Escape hatch, not a CTA: quiet way back to the storefront. Plain on
            the bag page and terminal states; guarded while payment is in flight. */}
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to={`/store/${handle}`}
            onClick={(e) => { if (!confirmLeave()) e.preventDefault() }}
            style={{ fontSize: '.85rem', color: palette.secondaryText, textDecoration: 'none', fontWeight: 500 }}
          >
            &larr; Back to store
          </Link>
        </div>
        {!reference ? (
          /* ══ Page 1: bag review + payment method ══ */
          cart.length === 0 ? (
            <div style={{ ...card, padding: '3rem 1.5rem', textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, margin: '0 0 .5rem', letterSpacing: '-0.03em' }}>Your bag is empty</h1>
              <p style={{ fontSize: '.85rem', color: palette.secondaryText, margin: '0 0 1.5rem' }}>Add something you love, then come back to check out.</p>
              <Link to={`/store/${handle}`} style={{ color: palette.accent, fontWeight: 600, textDecoration: 'none', fontSize: '.9rem' }}>&larr; Browse the collection</Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 500, margin: '0 0 1.25rem', letterSpacing: '-0.03em' }}>Review your order</h1>

              <div style={{ ...card, padding: '1.25rem 1.25rem 1rem', marginBottom: '1.25rem' }}>
                {itemRows(cart.map(i => ({ title: i.product.title, price: i.product.price, quantity: i.quantity })))}
                <div style={dashedRule} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', paddingBottom: '.25rem' }}>
                  <span>Total</span>
                  <span>{currency} {total.toFixed(2)} <span style={{ color: palette.secondaryText, fontWeight: 500, fontSize: '.8rem' }}>USDC</span></span>
                </div>
              </div>

              {createError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.75rem', fontSize: '.8rem', color: '#DC2626', marginBottom: '1rem', lineHeight: 1.4 }}>
                  {createError}
                </div>
              )}

              <div style={{ ...card, padding: '1.25rem', background: palette.surface }}>
                <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: palette.secondaryText, margin: '0 0 .75rem' }}>Pay with</p>
                <button className="sfc-btn" onClick={createOrder} disabled={creating} style={primaryBtn}>
                  {creating ? (
                    <><div style={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} /> Creating your order…</>
                  ) : (
                    <>Solana wallet or QR (USDC)</>
                  )}
                </button>
                {/*
                  Privy embedded-wallet payment is intentionally not offered here
                  yet. When it is, it becomes a second method button:
                  <button onClick={payWithPrivy} style={quietBtn}>Pay with linked wallet</button>
                */}
                <p style={{ fontSize: '.75rem', color: palette.secondaryText, margin: '.75rem 0 0', lineHeight: 1.5 }}>
                  You'll get a payment page with a scannable QR code — pay from Phantom in this browser or any Solana wallet on your phone. Devnet demo; no real funds move.
                </p>
              </div>
            </>
          )
        ) : phase === 'confirmed' ? (
          /* ══ Confirmed: the receipt ══ */
          <div style={{ ...card, padding: '1.75rem 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ color: palette.accent, display: 'flex', justifyContent: 'center', marginBottom: '.75rem' }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, margin: '0 0 .25rem', letterSpacing: '-0.03em' }}>Payment received</h1>
              <p style={{ fontSize: '.85rem', color: palette.secondaryText, margin: 0 }}>Thanks for your order at {store.name}.</p>
            </div>

            <div style={dashedRule} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.4rem' }}>
              <span style={{ color: palette.secondaryText }}>Order</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{(confirmedOrderId || orderCtx?.order_id || '').slice(0, 8) || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.4rem' }}>
              <span style={{ color: palette.secondaryText }}>Date</span>
              <span>{receiptDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            {txSignature && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.4rem', gap: '1rem' }}>
                <span style={{ color: palette.secondaryText, flexShrink: 0 }}>Transaction</span>
                <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                   style={{ color: palette.accent, fontWeight: 600, textDecoration: 'none', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {txSignature.slice(0, 8)}…{txSignature.slice(-8)} ↗
                </a>
              </div>
            )}

            {receiptItems.length > 0 && (
              <>
                <div style={dashedRule} />
                {itemRows(receiptItems)}
              </>
            )}

            <div style={dashedRule} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.25rem' }}>
              <span>Total paid</span>
              <span>{currency} {ctxTotal != null ? Number(ctxTotal).toFixed(2) : '—'} <span style={{ color: palette.secondaryText, fontWeight: 500, fontSize: '.8rem' }}>USDC</span></span>
            </div>

            <div style={{ background: palette.surface, borderRadius: 10, padding: '.9rem 1rem', fontSize: '.8rem', color: palette.secondaryText, lineHeight: 1.55, marginBottom: '1.25rem' }}>
              <strong style={{ color: palette.text }}>What happens next:</strong> the seller has your order and will start preparing it. Track its progress any time under My Orders — connect the wallet you paid with.
            </div>

            {/* Optional receipt email. Skippable and non-blocking: nothing on
                this page depends on it, and the receipt above stands alone.
                Once an address is attached (sent this session, or has_email
                from the server on a revisit) the quiet confirmation replaces
                the form — the buyer is never asked twice. */}
            {emailState === 'sent' || receipt?.has_email ? (
              <div style={{ border: `1px solid ${palette.border}`, borderRadius: 10, padding: '.9rem 1rem', fontSize: '.82rem', color: palette.text, lineHeight: 1.5, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m9 12 2 2 4-4"/></svg>
                <span>Receipt sent — check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={submitEmail} style={{ border: `1px solid ${palette.border}`, borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
                <label htmlFor="sfc-email" style={{ display: 'block', fontSize: '.82rem', color: palette.text, fontWeight: 600, marginBottom: '.5rem' }}>
                  Want a receipt and order updates by email?
                </label>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <input
                    id="sfc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={emailState === 'sending'}
                    style={{ flex: '1 1 180px', minWidth: 0, padding: '.7rem .8rem', border: `1px solid ${palette.border}`, borderRadius: 8, fontSize: '.85rem', fontFamily: 'var(--font-body)', color: palette.text, background: '#fff', minHeight: 44 }}
                  />
                  <button
                    className="sfc-btn"
                    type="submit"
                    disabled={!email.trim() || emailState === 'sending'}
                    style={{ ...primaryBtn, width: 'auto', flex: '0 0 auto', padding: '.7rem 1.1rem', minHeight: 44, opacity: !email.trim() || emailState === 'sending' ? .6 : 1 }}
                  >
                    {emailState === 'sending' ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} /> Sending…</>
                    ) : 'Send receipt'}
                  </button>
                </div>
                {emailState === 'error' && (
                  <p style={{ fontSize: '.78rem', color: '#DC2626', margin: '.6rem 0 0', lineHeight: 1.45 }}>
                    {emailError} <span style={{ color: palette.secondaryText }}>Your order is safe regardless — this receipt page stays available.</span>
                  </p>
                )}
                <p style={{ fontSize: '.72rem', color: palette.secondaryText, margin: '.6rem 0 0', lineHeight: 1.45 }}>
                  Optional — we only use it for this order.
                </p>
              </form>
            )}

            <Link to={`/store/${handle}/orders`} style={{ ...primaryBtn, textDecoration: 'none' }} className="sfc-btn">View My Orders</Link>
            <Link to={`/store/${handle}`} style={{ display: 'block', textAlign: 'center', marginTop: '.9rem', color: palette.secondaryText, fontSize: '.85rem', textDecoration: 'none', fontWeight: 500 }}>
              Continue shopping
            </Link>
          </div>
        ) : phase === 'expired' ? (
          /* ══ Order not found ══ */
          <div style={{ ...card, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, margin: '0 0 .5rem', letterSpacing: '-0.03em' }}>This checkout link has expired</h1>
            <p style={{ fontSize: '.85rem', color: palette.secondaryText, margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Unpaid checkouts expire after 15 minutes, or this order may no longer exist. Nothing was charged, and your bag is still saved — start the checkout again.
            </p>
            <button className="sfc-btn" onClick={() => navigate(`/store/${handle}/checkout`)} style={primaryBtn}>Back to your bag</button>
          </div>
        ) : phase === 'failed' ? (
          /* ══ Failed ══ */
          <div style={{ ...card, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, margin: '0 0 .5rem', letterSpacing: '-0.03em', color: '#DC2626' }}>Payment didn't go through</h1>
            <p style={{ fontSize: '.85rem', color: palette.secondaryText, margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              No funds were captured for this order. You can start the checkout again — your bag is still saved.
            </p>
            <button className="sfc-btn" onClick={() => navigate(`/store/${handle}/checkout`)} style={primaryBtn}>Back to your bag</button>
          </div>
        ) : (
          /* ══ Awaiting payment / confirmation / stalled ══ */
          <div style={{ ...card, padding: '1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, margin: '0 0 .35rem', letterSpacing: '-0.03em' }}>
              {phase === 'confirming' ? 'Confirming your payment' : 'Complete your payment'}
            </h1>
            <p style={{ fontSize: '.85rem', color: palette.secondaryText, margin: '0 0 1.25rem' }}>
              {ctxTotal != null
                ? <>Transferring <strong style={{ color: palette.text }}>{Number(ctxTotal).toFixed(2)} USDC</strong> to {store.name}</>
                : 'This payment was started in another session — we’ll keep checking its status here.'}
            </p>

            {payError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.75rem', fontSize: '.8rem', color: '#DC2626', marginBottom: '1rem', lineHeight: 1.4, textAlign: 'left' }}>
                {payError}
              </div>
            )}

            {orderCtx && phase !== 'confirming' && (
              <>
                <button className="sfc-btn" onClick={payWithPhantom} disabled={paying} style={{ ...primaryBtn, marginBottom: '1.25rem' }}>
                  {paying ? (
                    <><div style={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} /> Waiting for wallet…</>
                  ) : (
                    window.solana?.isPhantom ? 'Pay with Phantom' : 'Install Phantom to pay in this browser'
                  )}
                </button>
                {/* Privy embedded-wallet slot — see note on the method selector. */}

                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', margin: '0 0 1.25rem' }}>
                  <div style={{ flex: 1, borderTop: `1px solid ${palette.border}` }} />
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: palette.secondaryText, textTransform: 'uppercase', letterSpacing: '.05em' }}>or scan to pay</span>
                  <div style={{ flex: 1, borderTop: `1px solid ${palette.border}` }} />
                </div>

                <div style={{ background: '#fff', padding: '.75rem', borderRadius: 12, display: 'inline-block', border: `1px solid ${palette.border}`, marginBottom: '.9rem' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1a271c&data=${encodeURIComponent(qrUri)}`}
                    alt="Solana Pay QR code"
                    style={{ width: 200, height: 200, display: 'block', maxWidth: '100%' }}
                  />
                </div>
                <p style={{ fontSize: '.78rem', color: palette.secondaryText, margin: '0 0 .9rem', lineHeight: 1.5 }}>
                  Scan with any Solana wallet on your phone. This page will notice the payment by itself.
                </p>

                <div style={{ maxWidth: 340, margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: '.5rem .5rem .5rem .8rem' }}>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: palette.secondaryText, textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0 }}>Payment ID</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {reference.slice(0, 8)}…{reference.slice(-6)}
                    </span>
                    <button
                      onClick={copyReference}
                      style={{ background: '#fff', border: `1px solid ${palette.border}`, color: copied ? palette.accent : palette.text, borderRadius: 6, padding: '.35rem .7rem', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, minHeight: 32 }}
                      title="Copy the full payment ID"
                    >
                      {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: '.7rem', color: palette.secondaryText, margin: '.5rem 0 0', lineHeight: 1.4 }}>
                    Identifies this payment — handy if you contact the seller about your order.
                  </p>
                </div>
              </>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              {phase === 'stalled' ? (
                <>
                  <p style={{ fontSize: '.8rem', color: palette.text, fontWeight: 600, margin: '0 0 .35rem', lineHeight: 1.5 }}>
                    Still waiting for the network to confirm.
                  </p>
                  <p style={{ fontSize: '.8rem', color: palette.secondaryText, margin: '0 0 .9rem', lineHeight: 1.5 }}>
                    If you approved the payment in your wallet, <strong style={{ color: palette.text }}>don't pay again</strong> — confirmations can take several minutes. We'll keep checking, and this page will update the moment it lands.
                  </p>
                  {!slowExhausted ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', fontSize: '.75rem', color: palette.secondaryText, margin: '0 0 .9rem' }}>
                      <div style={{ width: 10, height: 10, border: `2px solid ${palette.secondaryText}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
                      <span>Checking automatically every 10 seconds</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '.75rem', color: palette.secondaryText, margin: '0 0 .9rem' }}>
                      Automatic checking has paused — use Check again to keep looking.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '.6rem' }}>
                    <button className="sfc-btn" onClick={() => { setPhase('awaiting'); setAttempts(0); setSlowExhausted(false); startPolling(reference) }} style={{ ...quietBtn, borderColor: palette.accent, color: palette.accent }}>
                      Check again
                    </button>
                    <button
                      className="sfc-btn"
                      onClick={() => {
                        if (!confirmLeave()) return
                        navigate(`/store/${handle}/checkout`)
                      }}
                      style={quietBtn}
                    >
                      Back to bag
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', fontSize: '.8rem', color: palette.accent, fontWeight: 500 }}>
                  <div style={{ width: 12, height: 12, border: `2px solid ${palette.accent}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                  <span>{phase === 'confirming' ? 'Payment spotted — waiting for confirmation' : 'Watching for your payment'} ({attempts}/{MAX_ATTEMPTS})</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${palette.border}`, padding: '2rem 1.5rem', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ fontSize: '.8rem', color: palette.secondaryText, margin: 0 }}>
          <a href="/" style={{ color: palette.secondaryText, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.35em' }}>
            <Mark size={12} />
            Powered by Selora
          </a>
        </p>
      </footer>
    </div>
  )
}
