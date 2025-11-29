import { http, createConfig } from 'wagmi'
import { worldchainSepolia } from 'wagmi/chains'

// Configuración de World Chain Sepolia
export const config = createConfig({
  chains: [worldchainSepolia],
  transports: {
    [worldchainSepolia.id]: http(
      `https://worldchain-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
  },
})

// Re-export para facilidad de uso
export { worldchainSepolia }
