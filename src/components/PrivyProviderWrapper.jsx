import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
})

export default function PrivyProviderWrapper({ children }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID || 'cl_your_privy_app_id_here'
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email'],
        embeddedWallets: {
          // 'off' — your users connect external Solana wallets (Phantom etc.).
          // 'users-without-wallets' caused Privy to eagerly load ~15 embedded
          // wallet UI chunks from auth.privy.io on every login, triggering
          // ERR_HTTP2_SERVER_REFUSED_STREAM rate-limit errors from their CDN.
          createOnLogin: 'off',
          noPromptOnSignature: true,
        },
        appearance: {
          walletChainType: 'solana-only',
          theme: 'dark',
          accentColor: '#5F8D76', // Selora brand green
          walletList: ['detected_solana_wallets'],
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
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
