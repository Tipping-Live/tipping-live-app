import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com',
  ),
})
