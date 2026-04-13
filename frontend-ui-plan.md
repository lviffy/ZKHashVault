# AdaptiveVault Frontend UI Improvement Plan

## 🎯 The Goal
The current dashboard is highly technical, exposing raw JSON payloads, complex transaction details, and backend mechanics (ZK proofs, strategy instructions) directly to the user. 

**The new goal** is to make the UI friendly, intuitive, and reassuring for a regular DeFi user, while still highlighting the unique AI and ZK-safety features of AdaptiveVault.

---

## 🏗️ Target User Experience (UX)

When a user visits the dashboard, they should immediately understand:
1. **What this is:** A smart vault that auto-balances my yield and risk.
2. **My Money:** How much I deposited and how much I am earning.
3. **The Proof:** A simple, visual way to see the vault is safe (hiding the complex ZK math).

---

## 🎨 Proposed Page Layout

### 1. The Header (Global Vault View)
Instead of abstract strategy text, show what the vault is doing right now.
*   **Total Value Locked (TVL):** e.g., $1.2M
*   **Current Vault APY:** e.g., 11.4%
*   **Current Risk Mode:** Low / Medium / High (Color-coded Green/Yellow/Red)

### 2. "My Position" Section (Main Focus)
A clean, central card for the user's specific funds.
*   **My Balance:** 5,000 avUSD
*   **My Credit Score:** 850 (Excellent) - *Brief tooltip explaining higher scores get better yield.*
*   **Earnings:** +$45.00
*   **Call-to-Action:** The existing `DepositWithdrawForm`, but styled cleanly integrated into this card.

### 3. "AI Strategy Engine" Section
Replace the raw `Rebalance Instruction` JSON with visual components.
*   **Allocation Bar:** A visual progress bar showing where funds are currently deployed (e.g., 60% in Lending Pool A, 40% in Pool B).
*   **Recent Actions:** A readable log instead of code. Example: *"Shifted 5% to Pool B to reduce risk due to high market volatility."*

### 4. "Safety & Verification" Section (ZK Proofs)
Replace the raw `Safety Proof Payload` JSON.
*   **Shield Icon / Status:** "Vault is Cryptographically Secured."
*   **What this means:** "Every movement of your funds is backed by a Zero-Knowledge Proof ensuring the protocol never takes excessive risk."
*   **Action:** The `SubmitProofButton`, renamed to something like **"Verify Vault Safety On-Chain"**, with a green checkmark if the latest proof is verified.

---

## 🗺️ Step-by-Step Implementation Plan

### Phase 1: Clean Up & Hide the Code
*   [x] Remove `JSON.stringify` blocks from `src/app/dashboard/page.tsx`.
*   [x] Hide the `Rebalance Instruction` and `Phase3` raw data under a "Developer Mode" toggle, or remove them entirely for regular users.

### Phase 2: Build the "My Position" Card
*   [x] Fetch the user's deposited balance from the `AdaptiveVault` contract.
*   [x] Create a circular progress or simple score-dial for the Credit Score.
*   [x] Move the Deposit/Withdraw form into a clean modal or an interactive side-panel next to the balance.

### Phase 3: Build the Strategy Visualizer
*   [x] Use the data from `strategyResult` (`targetPoolABps` vs `targetPoolBBps`) to render a simple two-color horizontal bar chart (e.g., 70% Pool A / 30% Pool B).
*   [x] Show the `expectedNetApyBps` as a large, attractive percentage widget.
*   [x] Show `positionHealthFactorBps` as a "Health Status" (e.g., "Healthy", "Warning").

### Phase 4: Polish the ZK Safety Widget
*   [x] Create a "Protected by ZK-Snarks" badge.
*   [x] Keep the `SubmitProofButton` but style it as a secondary, reassuring action rather than a mandatory technical step.

---

## 🛠 Next Steps
All major UI features have been implemented. The dashboard is now clean and natively updates using Wallet Connect. Next step is finalizing the UI failure states if strategy recommendations are blocked by Cryptographic constraints.
