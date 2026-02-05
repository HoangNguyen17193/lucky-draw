# Lucky Draw

A blockchain-based lucky draw system with instant VRF randomness and prize distribution. Users enter a draw, receive provably fair randomness via Chainlink VRF, and get prizes immediately.

## Features

- **Instant Prize Distribution**: Enter → VRF request → Prize sent immediately
- **Probability-Based Tiers**: Configurable prize tiers with fixed amounts and win probabilities
- **Chainlink VRF v2.5**: Provably fair randomness for each participant
- **Global Whitelist**: Only approved addresses can participate
- **ERC20 Prizes**: Flexible token rewards (USDC, etc.)
- **Multi-Network**: Supports Sepolia (dev) and Ronin Saigon (target)

## Project Structure

```
lucky-draw/
├── contracts/          # Solidity smart contracts (Hardhat)
│   ├── contracts/      # LuckyDrawManager.sol
│   ├── scripts/        # Deployment and management scripts
│   └── test/           # Contract tests
└── frontend/           # Next.js web application
    └── src/
        ├── app/        # Pages (home, draw, admin)
        ├── components/ # React components + SpinWheel
        ├── hooks/      # Contract interaction hooks
        └── lib/        # Utils, ABI, addresses
```

## Tech Stack

### Smart Contracts
- Solidity + Hardhat
- Chainlink VRF v2.5
- OpenZeppelin (SafeERC20, Pausable, ReentrancyGuard)

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS + Framer Motion
- viem + Privy (Web3)
- React Query

## Quick Start

### Contracts
```bash
cd contracts
npm install
cp .env.example .env  # Configure your environment
npm run compile
npm run test
npm run deploy:sepolia
```

### Frontend
```bash
cd frontend
npm install
# Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local
npm run dev
```

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Sepolia | LuckyDrawManager | `0xe1da5B6A890d5FdfAe4FdDC2Cb056287c599637F` |
| Sepolia | USDC Mock | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| Ronin Saigon | LuckyDrawManager | _Pending deployment_ |

## How It Works

1. **Admin Setup**: Create draw → Configure tiers → Set default prize → Fund draw → Whitelist users
2. **User Entry**: Connect wallet → Enter draw → VRF request sent → Wait for callback
3. **Prize Distribution**: VRF callback → Prize tier determined → Tokens transferred → Result stored

## License

MIT
