# Lucky Draw Frontend - Spin Wheel Mini Game

## Overview
A modern web3 frontend for the Lucky Draw system featuring an animated spin wheel, instant prize reveals, and admin dashboard.

---

## Tech Stack
| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Web3 | viem + Privy |
| State | React Query |
| Notifications | Sonner (toast) |
| Icons | Lucide React |
| Wheel | Canvas API |

---

## Project Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Home page with draw list
│   │   ├── globals.css             # Global styles
│   │   ├── draw/[id]/page.tsx      # Draw detail + spin wheel
│   │   └── admin/
│   │       ├── page.tsx            # Admin dashboard
│   │       ├── create/page.tsx     # Create new draw wizard
│   │       └── draw/[id]/page.tsx  # Manage specific draw
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts
│   │   ├── Header.tsx              # Navigation header
│   │   ├── ConnectButton.tsx       # Wallet connection
│   │   ├── DrawCard.tsx            # Draw preview card
│   │   ├── TierList.tsx            # Prize tiers display
│   │   ├── ToastProvider.tsx       # Toast notifications
│   │   └── SpinWheel/
│   │       └── SpinWheel.tsx       # Canvas-based wheel
│   ├── hooks/
│   │   ├── useContract.ts          # Contract write functions
│   │   └── useDraw.ts              # Contract read hooks
│   ├── lib/
│   │   ├── contracts/
│   │   │   ├── abi.ts              # LuckyDrawManager ABI
│   │   │   └── addresses.ts        # Contract addresses
│   │   ├── viem.ts                 # Viem client setup
│   │   └── utils.ts                # Utility functions
│   ├── providers/
│   │   └── Web3Provider.tsx        # Privy + React Query
│   └── types/
│       └── draw.ts                 # TypeScript types
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## User Flow

### Entry Flow (Instant VRF)
```
1. Connect Wallet (Privy)
      ↓
2. View Draw Details (tiers, probabilities, stats)
      ↓
3. Check Eligibility (whitelist + not entered)
      ↓
4. Click "Enter & Spin" Button
      ↓
5. Transaction Sent → VRF Requested
      ↓
6. Poll for Result (every 3s)
      ↓
7. VRF Callback → Prize Determined
      ↓
8. Spin Wheel Animation
      ↓
9. Prize Reveal + Confetti 🎉
```

### Status States
| State | UI Display |
|-------|------------|
| Not connected | "Connect your wallet" |
| Not whitelisted | "Your wallet is not whitelisted" |
| Can enter | "Enter & Spin" button |
| Waiting for VRF | Spinner + "Waiting for VRF..." |
| Result ready | "Your prize is ready!" + Spin wheel |
| Draw closed | "This draw is closed" |

---

## Core Features

### 1. Home Page (`/`)
- Animated hero section
- Feature highlights (VRF, fairness, instant)
- Active draws grid
- How it works section
- Footer

### 2. Draw Detail (`/draw/[id]`)
- Draw status badge
- Prize pool display
- Tier list with probabilities
- Spin wheel (canvas-based)
- Entry/status messages
- Stats (entrants, distributed)

### 3. Spin Wheel
- **8 colored segments** based on tier probabilities
- **Canvas rendering** for performance
- **Smooth animation** with cubic easing
- **Predetermined result** from on-chain data
- **Confetti celebration** on reveal

### 4. Admin Dashboard (`/admin`)
- List all draws with stats
- Create new draw button
- Quick actions per draw

### 5. Create Draw (`/admin/create`)
- Step 1: Create draw (select token)
- Step 2: Configure tiers (prize + probability)
- Step 3: Set default prize
- Progress indicator

### 6. Manage Draw (`/admin/draw/[id]`)
- **Info tab**: Draw details, tier stats
- **Whitelist tab**: Bulk add addresses
- **Fund tab**: Approve + deposit tokens
- **Actions tab**: Close, withdraw, cancel

---

## Contract Integration

### Read Functions (React Query)
```typescript
useDraw(drawId)           // Draw info
useTiers(drawId, count)   // All tier details
useUserResult(drawId, addr) // User's prize result
useIsWhitelisted(addr)    // Whitelist check
useNextDrawId()           // Total draws
useContractOwner()        // Admin check
useAvailableFunds(drawId) // Remaining balance
```

### Write Functions (viem)
```typescript
// User
enterDraw(drawId)         // Enter + trigger VRF

// Admin
createDraw(token)
setTiers(drawId, tiers)
setDefaultPrize(drawId, amount)
setWhitelistBatch(addresses, allowed)
fundDraw(drawId, amount)
closeDraw(drawId)
withdrawLeftover(drawId, recipient)
cancelDraw(drawId)
approveToken(token, amount)
```

---

## UI Components

### Button
```tsx
<Button variant="primary|secondary|danger|ghost" size="sm|md|lg" isLoading>
  Click Me
</Button>
```

### Card
```tsx
<Card variant="default|bordered|glow" padding="none|sm|md|lg">
  Content
</Card>
```

### StatusBadge
```tsx
<StatusBadge status={DrawStatus.Open} />
// Renders: green "Open" badge
```

### TierList
```tsx
<TierList tiers={tiers} defaultPrize={1000000n} symbol="USDC" decimals={6} />
```

### SpinWheel
```tsx
<SpinWheel
  tiers={tiers}
  defaultPrize={1000000n}
  userTierIndex={2}        // null for default
  canSpin={true}
  onSpinComplete={(tier, amount) => {}}
/>
```

---

## Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0a1628` | Main bg |
| Surface | `#1a2744` | Cards |
| Gold | `#FFD700` | Jackpot, accents |
| Pink | `#E040FB` | Tier 2 |
| Cyan | `#00BCD4` | Tier 3 |
| Green | `#4CAF50` | Default, success |

### Typography
- **Headings**: Geist Sans, bold
- **Body**: Geist Sans, regular
- **Mono**: Geist Mono (addresses)

### Effects
- Glass-morphism cards
- Glow effects on hover
- Gradient backgrounds
- Smooth animations (framer-motion)

---

## Environment Variables
```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

---

## Development

### Setup
```bash
cd frontend
npm install
# Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local
npm run dev
```

### Build
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
```

---

## Dependencies
```json
{
  "next": "15.1.6",
  "react": "^19",
  "viem": "^2.22.16",
  "@privy-io/react-auth": "^2.0.6",
  "@tanstack/react-query": "^5.64.2",
  "framer-motion": "^12.0.6",
  "sonner": "^1.7.4",
  "lucide-react": "^0.474.0",
  "canvas-confetti": "^1.9.3",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.0.1"
}
```

---

## Key Implementation Details

### VRF Polling
After user enters, poll `getUserResult` every 3 seconds until `hasResult` is true:
```typescript
const pollInterval = setInterval(async () => {
  const result = await refetchUserResult();
  if (result.data?.hasResult) {
    clearInterval(pollInterval);
    // Show spin wheel
  }
}, 3000);
```

### Wheel Animation
1. Fetch `userResult.tierIndex` from contract
2. Calculate target segment angle
3. Add 5-8 full rotations for effect
4. Use cubic ease-out for realistic spin
5. Trigger confetti on completion

### Tier Probability Display
```typescript
const probability = Number(tier.winProbability) / 100; // basis points → %
```

---

## Pages Summary

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Home, draw list | Public |
| `/draw/[id]` | Enter draw, spin wheel | Public |
| `/admin` | Dashboard | Owner only |
| `/admin/create` | Create new draw | Owner only |
| `/admin/draw/[id]` | Manage draw | Owner only |

---

## Contract Addresses

### Sepolia Testnet
```typescript
const ADDRESSES = {
  luckyDrawManager: "[TO BE DEPLOYED]",
  usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};
```

---

## Status Enums
```typescript
enum DrawStatus {
  Open = 0,      // Accepting entries
  Closed = 1,    // No more entries
  Cancelled = 2, // Refunded
}
```

---

## Differences from Previous Version

| Previous | Current |
|----------|---------|
| Wait for batch finalization | Instant VRF per user |
| 5 draw statuses | 3 statuses (Open/Closed/Cancelled) |
| `getWinners()` array | `getUserResult()` per user |
| Phaser 3 wheel | Canvas API wheel |
| Complex entry flow | Simple enter → spin flow |
| Manual VRF request | Automatic on entry |
