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
          createOnLogin: 'users-without-wallets',
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
