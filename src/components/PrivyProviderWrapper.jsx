import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'

// Strict singleton to prevent WalletConnect Core from re-initializing multiple times
// across StrictMode mounts, page re-renders, and HMR module re-evaluations.
let solanaConnectorsInstance = null
function getSolanaConnectors() {
  if (typeof window !== 'undefined' && !solanaConnectorsInstance) {
    try {
      solanaConnectorsInstance = toSolanaWalletConnectors({
        shouldAutoConnect: false,
      })
    } catch (e) {
      console.warn('[Privy] Failed to initialize Solana connectors:', e)
    }
  }
  return solanaConnectorsInstance
}

export default function PrivyProviderWrapper({ children }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID || 'cl_your_privy_app_id_here'
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

  const connectors = getSolanaConnectors()

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email'],
        embeddedWallets: {
          createOnLogin: 'off',
          noPromptOnSignature: true,
        },
        appearance: {
          walletChainType: 'solana-only',
          theme: 'dark',
          accentColor: '#5F8D76', // Selora brand green
          walletList: ['phantom', 'solflare'],
        },
        ...(connectors ? {
          externalWallets: {
            solana: {
              connectors: connectors,
            },
          },
        } : {}),
        solanaClusters: [
          {
            name: 'devnet',
            rpcUrl: rpcUrl,
          }
        ]
      }}
    >
      {children}
    </PrivyProvider>
  )
}
