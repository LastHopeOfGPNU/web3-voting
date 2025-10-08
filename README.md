# Web3 Vote

A simple, end-to-end decentralized voting dApp showcasing on-chain proposals and a modern frontend. It supports creating proposals, voting For/Against, deadline enforcement, one-person-one-vote restriction, clear transaction status feedback, and bilingual (English/Chinese) UI.

## Overview

- Smart Contract: `contracts/Voting.sol` — proposal creation and voting logic (custom errors, events, deadlines, single-vote enforcement).
- Frontend: `frontend/` — React + Vite, integrated with RainbowKit + wagmi + viem for on-chain interactions; React Query for data; built-in i18n.
- Types & Tools: `types/ethers-contracts` (generated via Hardhat/TypeChain), `scripts/` for deployment, `test/` for contract tests.

## Features

- Create proposals: specify a voting duration (seconds) and automatic deadline calculation.
- One-person-one-vote: an address can vote only once per proposal; repeat votes revert with `AlreadyVoted`.
- Deadline control: voting after the deadline is disallowed and reverts with `VotingClosed`.
- Status feedback: the frontend displays submission, confirmation waiting, success/failure, and decodes contract custom errors.
- List & detail pages: home shows proposal list and progress; detail page displays content and live vote counts.
- i18n: English and Chinese resources with a simple language switcher in navigation.

## Project Structure

```
d:\projects\web3-vote
├─ contracts\Voting.sol             # Smart contract
├─ frontend\                        # Frontend app
│  ├─ config\contract.json          # Contract address config for the frontend
│  ├─ src\i18n.ts                   # i18n resources & initialization
│  ├─ src\wagmi.tsx                 # RainbowKit/wagmi/QueryClient providers
│  ├─ src\pages\Home.tsx           # Home: proposal list
│  ├─ src\pages\Create.tsx         # Create proposal page
│  ├─ src\pages\ProposalDetail.tsx # Proposal detail & voting
│  └─ src\components\...           # Components (vote button, cards, background effects, etc.)
├─ scripts\deploy.ts                # Deployment script (example)
├─ test\Voting.test.ts              # Contract test example
└─ types\ethers-contracts           # Contract type definitions
```

## Prerequisites

- Node.js 18+ (or compatible)
- A testnet wallet (e.g., Sepolia) and a browser wallet extension (e.g., MetaMask)
- Optional: Hardhat environment for compiling/testing/deploying contracts

## Smart Contract

- File: `contracts/Voting.sol`
- Key functions:
  - `createProposal(string description, uint256 durationSeconds)` — validates non-empty description, bounded length, and valid duration.
  - `vote(uint256 proposalId, bool support)` — validates existence, deadline, and repeat votes; increments For/Against counts accordingly.
- Custom errors: `EmptyDescription`, `DescriptionTooLong`, `ProposalNotExist`, `AlreadyVoted`, `VotingClosed`, `InvalidDuration`.
- Events: `ProposalCreated`, `VoteCast`.

### Compile & Test (example)

Run from the project root (assuming a Hardhat setup):

```bash
npm i
npx hardhat compile
npx hardhat test
```

### Deploy (example)

See `docs/hardhat_cookbook.md` or run:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

After deployment, update the frontend contract address (see below).

## Frontend

### Install & Start

```bash
cd frontend
npm i
npm run dev
```

The dev server typically runs at `http://localhost:5176/` (or a custom port).

### Configure Contract Address

Update `frontend/config/contract.json` with your deployed `Voting` address, e.g.:

```json
{
  "sepolia": {
    "Voting": "0xYourDeployedContractAddress"
  }
}
```

The frontend reads this via `src/utils/contract.ts#getVotingAddress()` for on-chain interactions.

### Interactions & Voting Flow

1. Connect your wallet via RainbowKit in the navigation.
2. Create a proposal on the “Create” page (default duration can be adjusted in the frontend).
3. Browse proposals on the Home page and open a detail page.
4. On the detail page, choose “Vote For” or “Vote Against”. The frontend will:
   - Validate wallet connection, whether you already voted, and whether the deadline has passed.
   - Submit the transaction and display the hash and confirmation status.
   - Decode custom contract errors (e.g., `AlreadyVoted`, `VotingClosed`) and show clear messages.
   - Refresh counts after confirmation.

### i18n (English / Chinese)

- Resources & init: `frontend/src/i18n.ts`
- Toggle: `LanguageSwitcher` in the navigation (Chinese/English buttons)
- Coverage: navigation, home, proposal cards, detail page messages & transaction statuses
- Extend: add new language keys in `resources` and use `t('key.path')` in components

## Development Notes

- Vite + React Query ensure quick refreshes; counts are re-fetched after confirmations.
- viem `decodeErrorResult` is used to decode custom errors and map them to user-friendly messages.
- Reads use wagmi `useReadContract` plus frontend caching strategies.

## Contributing

Issues and PRs are welcome to improve features, performance, and documentation.

---

Built as a decentralized voting dApp to demonstrate full-stack Web3 capability.
