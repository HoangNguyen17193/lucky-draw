# AGENT.md

## Project Overview

Lucky Draw is a Web3 application consisting of:
- **contracts/**: Solidity smart contracts using Hardhat
- **frontend/**: Next.js 14 web application

## Development Commands

### Contracts (from `contracts/` directory)
```bash
npm run compile          # Compile contracts
npm run test             # Run tests
npm run deploy:sepolia   # Deploy to Sepolia testnet
npm run deploy:saigon    # Deploy to Ronin Saigon
```

### Frontend (from `frontend/` directory)
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
```

## Key Files

### Contracts
- `contracts/contracts/LuckyDrawManager.sol` - Main contract
- `contracts/hardhat.config.ts` - Hardhat configuration
- `contracts/scripts/deploy.ts` - Deployment script
- `contracts/.env` - Environment variables (RPC URLs, private keys, VRF config)

### Frontend
- `frontend/src/app/` - Next.js pages
- `frontend/src/components/SpinWheel/` - Canvas-based spin wheel
- `frontend/src/hooks/` - Contract interaction hooks
- `frontend/src/lib/contracts/` - ABI and contract addresses
- `frontend/.env.local` - Environment variables (Privy App ID)

## Architecture Notes

### Smart Contract
- Uses Chainlink VRF v2.5 for randomness
- Each user entry triggers individual VRF request
- Prize distribution happens in VRF callback
- Supports multiple tiers with configurable probabilities (basis points)

### Frontend
- Privy for wallet connection
- viem for contract interactions
- React Query for data fetching/caching
- Polls for VRF result after entry

## Testing

### Contracts
```bash
cd contracts && npm run test
```

### Frontend
```bash
cd frontend && npm run lint
cd frontend && npm run build  # Type checking included
```

## Environment Variables

### Contracts (.env)
- `SEPOLIA_RPC_URL` / `SAIGON_RPC_URL`
- `PRIVATE_KEY`
- `VRF_SUBSCRIPTION_ID` / `SAIGON_VRF_SUBSCRIPTION_ID`

### Frontend (.env.local)
- `NEXT_PUBLIC_PRIVY_APP_ID`
