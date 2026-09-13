export default function DarkLock({ active = true, children }) {
  return (
    <div
      className={active ? 'dark dark-locked' : undefined}
      style={active ? { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', colorScheme: 'dark' } : undefined}
    >
      {children}
    </div>
  )
}
