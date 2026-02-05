# Lucky Draw Smart Contract - Technical Specification

## Overview
A blockchain-based lucky draw system where users enter, get instant VRF randomness, and receive prizes immediately. Each user pays for their own VRF request through the subscription model.

## Key Features
- **Instant Prize Distribution**: User enters → VRF request → Prize sent immediately
- **Probability-Based Tiers**: Each tier has a fixed prize amount and win probability
- **Chainlink VRF v2.5**: Provably fair randomness for each participant
- **Global Whitelist**: Only approved addresses can participate
- **ERC20 Prizes**: Flexible token rewards (USDC, etc.)
- **Multi-Network Ready**: Shared codebase deploys to Sepolia (dev) and Ronin Saigon (target) with per-network VRF config

---

## Contract Architecture

### LuckyDrawManager.sol
- **Inherits**: VRFConsumerBaseV2Plus, Pausable, ReentrancyGuard
- **Chainlink VRF**: Individual request per user entry

### Enums
```solidity
enum DrawStatus {
    Open,       // Accepting entries
    Closed,     // No more entries
    Cancelled   // Refunded
}
```

### Structs
```solidity
struct Tier {
    uint256 prizeAmount;     // Fixed prize for this tier
    uint256 winProbability;  // Basis points (500 = 5%)
    uint256 winnersCount;    // Actual winners
    uint256 totalPaid;       // Total distributed
}

struct Draw {
    bool exists;
    DrawStatus status;
    address token;
    uint256 fundedAmount;
    uint256 totalDistributed;
    uint256 entrantCount;
    Tier[] tiers;
    uint256 defaultPrize;
}

struct PendingEntry {
    uint256 drawId;
    address user;
}

struct UserResult {
    bool hasEntered;
    bool hasResult;
    uint256 tierIndex;    // type(uint256).max = default
    uint256 prizeAmount;
}
```

---

## Core Flows

### A. Admin Setup
1. `createDraw(token)` - Initialize draw with ERC20 token
2. `setTiers(drawId, tiers[])` - Configure prize tiers
   - Each tier: `{prizeAmount, winProbability}`
   - Total probability must be ≤ 10000 (100%)
3. `setDefaultPrize(drawId, amount)` - Consolation prize for non-winners
4. `fundDraw(drawId, amount)` - Deposit prize tokens
5. `setWhitelistBatch(addresses, true)` - Approve participants

### B. User Entry (Instant VRF)
```
User calls enter(drawId)
    ↓
Contract validates: whitelisted, draw open, not entered, sufficient funds
    ↓
VRF request sent (1 random word)
    ↓
Request stored in pendingEntries[requestId]
    ↓
User marked as entered, waits for VRF callback
```

### C. VRF Callback (Prize Distribution)
```
Chainlink calls fulfillRandomWords(requestId, randomWords[])
    ↓
Lookup user from pendingEntries[requestId]
    ↓
Determine prize tier based on random number:
    - roll = randomWord % 10000
    - Check cumulative tier thresholds
    - If no tier matches → default prize
    ↓
Transfer prize to user
    ↓
Store result in userResults[drawId][user]
    ↓
Emit PrizeAwarded event
```

### D. Admin Close
1. `closeDraw(drawId)` - Stop accepting new entries
2. `withdrawLeftover(drawId, recipient)` - Withdraw remaining funds
3. `cancelDraw(drawId)` - Cancel and refund (emergency)

---

## Probability System

### Example Configuration
| Tier | Prize | Probability | Cumulative |
|------|-------|-------------|------------|
| 0 (Jackpot) | 50 USDC | 5% (500 bp) | 0-499 |
| 1 | 10 USDC | 15% (1500 bp) | 500-1999 |
| 2 | 3 USDC | 30% (3000 bp) | 2000-4999 |
| Default | 1 USDC | 50% (remaining) | 5000-9999 |

### Prize Determination
```solidity
uint256 roll = randomWord % 10000;

// Check tiers in order
cumulative = 0;
for each tier:
    cumulative += tier.winProbability
    if roll < cumulative:
        return tier.prizeAmount
        
// No tier matched → return defaultPrize
```

---

## Events
```solidity
event WhitelistUpdated(address indexed user, bool allowed);
event DrawCreated(uint256 indexed drawId, address indexed token);
event TiersConfigured(uint256 indexed drawId, uint256 tierCount);
event DefaultPrizeConfigured(uint256 indexed drawId, uint256 amount);
event DrawFunded(uint256 indexed drawId, uint256 amount, uint256 totalFunded);
event DrawClosed(uint256 indexed drawId);
event DrawCancelled(uint256 indexed drawId);
event EntryRequested(uint256 indexed drawId, address indexed user, uint256 indexed requestId);
event PrizeAwarded(uint256 indexed drawId, address indexed winner, uint256 tierIndex, uint256 amount);
event LeftoverWithdrawn(uint256 indexed drawId, uint256 amount, address indexed recipient);
```

---

## Security Measures

### Access Control
- `onlyOwner`: All admin functions
- Global whitelist for user entry
- Pausable for emergencies

### Token Safety
- SafeERC20 for all transfers
- Check available funds before entry
- NonReentrant on VRF callback

### VRF Safety
- Map requestId → drawId/user to prevent confusion
- Validate request exists before processing
- Delete pending entry after fulfillment


### Input Validation
- Reject zero prize amounts
- Reject zero probabilities
- Total probability ≤ 100%
- Token address validation

---

## Gas Optimization
- Single VRF word per user (expand with keccak if needed)
- Minimal storage in UserResult struct
- No loops in user-facing functions

---

## Deployment
### Network & VRF Configuration

| Network | Chain ID | RPC ENV | VRF Coordinator | Key Hash | Subscription ENV | Native Payment |
|---------|----------|---------|-----------------|----------|------------------|----------------|
| Sepolia (staging) | 11155111 | `SEPOLIA_RPC_URL` | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` | `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae` | `VRF_SUBSCRIPTION_ID` | `false` |
| Ronin Saigon (target) | 2021 | `SAIGON_RPC_URL` | `0xc052324E6A27D0E4b2CbF0FdFFBCb3796ea8f8B8` | `0x0a79a60cc054d8da06a5050a1d07f0fec08088ca64192cf67477f8cc3e549f71` | `SAIGON_VRF_SUBSCRIPTION_ID` | `false` |

Both `deploy.ts` and `update-vrf-config.ts` auto-select the proper configuration based on Hardhat `network.name` (`sepolia` or `saigon`). Optional overrides via `VRF_CALLBACK_GAS_LIMIT`, `VRF_REQUEST_CONFIRMATIONS`, `VRF_NATIVE_PAYMENT`, and `VRF_KEY_HASH` env vars.

### Steps (per network)
1. Set RPC + subscription env vars (`.env`).
2. Create/fund VRF subscription (Chainlink UI: Sepolia → https://vrf.chain.link/sepolia, Saigon → VRF Portal pending; manage via Ronin dashboard).
3. Deploy contract with `npm --prefix contracts run deploy:<network>`.
4. Add deployed contract as VRF consumer for that subscription.
5. Update on-chain VRF config if parameters change using `npx hardhat run scripts/update-vrf-config.ts --network <network>`.
6. (Optional) Verify on chain explorer supported for that network.

---

## Testing Checklist
- [x] Whitelist management (single + batch)
- [x] Draw creation and tier configuration
- [x] Probability validation (≤ 100%)
- [x] User entry with VRF request
- [x] VRF callback prize distribution
- [x] Tier prize assignment
- [x] Default prize for non-winners
- [x] Draw close and withdraw
- [x] Draw cancellation and refund
- [x] Pausable functionality
- [x] VRF config update

---

## Contract Addresses
- **Sepolia**: LuckyDrawManager `0xe1da5B6A890d5FdfAe4FdDC2Cb056287c599637F` (latest deployment), USDC mock `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **Ronin Saigon**: _Pending deployment_ (use `deploy:saigon` script when ready)

---

## Differences from Previous Version

| Previous | Current |
|----------|---------|
| Batch VRF for all users | Individual VRF per user |
| Admin triggers VRF | User entry triggers VRF |
| Wait for draw finalization | Instant prize distribution |
| Complex draw states | Simple: Open/Closed/Cancelled |
| getWinners() returns array | getUserResult() per user |
