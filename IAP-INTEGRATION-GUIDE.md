# IAP Integration Guide (iOS-only) — Subscription + Consumable Coins

This is the end-to-end walkthrough: App Store Connect → RevenueCat → app code → Supabase.
Follow it top to bottom. Every place you must do something by hand is marked **YOU DO**.
Everything under "Code (done)" is already applied in this repo.

---

## 0. The mental model (read this once)

Two products, two different Apple types. They are NOT the same and behave differently:

| What the user sees            | Apple product type          | RevenueCat gives you        | Who grants the benefit |
|-------------------------------|-----------------------------|-----------------------------|------------------------|
| $10/mo → 15 coins each month  | **Auto-renewable subscription** | An **entitlement** (`pro`) | RC (status) + our webhook (coins) |
| Buy 1/5/10/25/50 coins        | **Consumable**              | A one-off transaction, **no entitlement** | our webhook credits coins |

Key fact that drives the whole design: **consumables do not create an entitlement.**
RevenueCat can't "remember" a consumable as a permanent unlock — that's the point of a
consumable. So *we* own the coin balance. Source of truth = `profiles.coins` in Supabase.

Flow for a coin purchase:
```
tap package → RC purchasePackage() → Apple charges → RC records txn
   → RC fires webhook → Supabase Edge Function credits coins (idempotent by txn id)
   → app refetches balance
```
We credit via the **webhook**, not in the app, so a killed app mid-purchase still gets coins,
and a retried webhook can't double-credit (we dedupe on Apple's transaction id).

---

## 1. App Store Connect — create the products   **YOU DO**

You need an app record first, then 6 products (1 subscription + 5 consumables).

### 1a. App record (skip if it exists)
1. https://appstoreconnect.apple.com → **Apps** → **+** → **New App**.
2. Platform iOS, pick the bundle ID (must match `ios.bundleIdentifier` in `app.json`), fill name/language.

### 1b. Paid Apps agreement + banking   ← easy to forget, blocks everything
- **Business** → **Agreements** → sign **Paid Applications**. Add bank + tax info.
- Until this is "Active", **your products won't load** and RC returns empty offerings.

### 1c. The subscription
1. **Monetization → Subscriptions** → create a **Subscription Group** (e.g. `Enola Pro`).
2. Add a subscription:
   - **Reference Name:** `Pro Monthly`
   - **Product ID:** `enola_pro_monthly`   ← copy this exactly, you'll reuse it
   - Duration: 1 month, Price: $9.99 (closest tier to $10)
3. Add a **localization** (display name + description) and a **review screenshot** later, or it stays "Missing Metadata".

### 1d. The 5 consumables
**Monetization → In-App Purchases → +**, type **Consumable**, once per row:

| Reference Name | Product ID              | Price  |
|----------------|-------------------------|--------|
| 1 Coin         | `enola_coins_1`         | $4.99  |
| 5 Coins        | `enola_coins_5`         | $19.99 |
| 10 Coins       | `enola_coins_10`        | $29.99 |
| 25 Coins       | `enola_coins_25`        | $59.99 |
| 50 Coins       | `enola_coins_50`        | $99.99 |

For each: add a localized display name + description (required to leave "Missing Metadata").

### 1e. Sandbox test user   **YOU DO**
**Users and Access → Sandbox → Testers → +**. Make a fake Apple ID (use a plus-alias email you
control). You'll sign into this on the device to test purchases **without being charged**.
Never test IAP with your real Apple ID.

---

## 2. RevenueCat dashboard   **YOU DO**

### 2a. App + API key
1. Project → **Apps → + New → App Store**. Bundle ID = your app's. Upload the **App Store Connect
   App-Specific Shared Secret** (ASC → your app → App Information → App-Specific Shared Secret) and
   the **In-App Purchase Key** (.p8) — RC's setup screen tells you exactly where each comes from.
   These let RC validate receipts and receive Apple's server notifications.
2. Copy the **Apple public SDK key** — starts with `appl_`. Paste into `.env.local`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxx
   ```
   (Android key stays a placeholder — we're iOS-only for launch.)

### 2b. Entitlement
- **Entitlements → +** → identifier **`pro`**. (Code already expects this exact string.)

### 2c. Products (import from Apple)
- **Products → + / Import** → RC pulls your 6 ASC products once they're "Ready to Submit".
- Attach **`enola_pro_monthly`** to the **`pro`** entitlement.
- The 5 consumables get **NO entitlement** — leave them unattached. That's correct.

### 2d. Offerings — this is what the app actually reads
RevenueCat serves "offerings" (named bundles of packages), not raw products. The app asks for the
**current** offering. Create two offerings:

1. Offering **`default`** (the subscription paywall shown in onboarding):
   - one package → product `enola_pro_monthly`.
   - Build a **Paywall** on it (RC → Paywalls → design) — this is what `RevenueCatUI.Paywall` renders.
2. Offering **`coins`** (the coin store):
   - 5 packages, one per consumable: `enola_coins_1` … `enola_coins_50`.
   - Give each package a stable identifier — use the coin count: `1`, `5`, `10`, `25`, `50`.
     The app maps package identifier → coin amount, so these must match `COIN_PACKAGES` in code.

> Why a separate `coins` offering instead of hardcoded prices? So Apple shows the *real* localized
> price and you can change pricing/packages from the dashboard without an app update. The old
> hardcoded `$4.99` strings in `coins.tsx` are gone.

---

## 3. Code — what changed (already applied)

- **`.env` / `_layout.tsx`** — RC key read from env per platform (done earlier).
- **`src/utils/revenuecat.ts`** — added `getCoinOfferings()` and `COIN_OFFERING_ID`.
- **`src/utils/coins.ts`** (new) — `getCoins`, `spendCoin`, atomic via RPC.
- **`src/app/coins.tsx`** — real `purchasePackage()` flow, prices from RC, no fake increment.
- **`src/app/(tabs)/index.tsx`** — spend uses atomic `spend_coin` RPC (fixes the race).
- **`supabase/coins-and-iap.sql`** (new) — atomic `add_coins` / `spend_coin` + `coin_transactions` ledger.
- **`supabase/functions/revenuecat-webhook/index.ts`** (new) — credits consumables idempotently.

### Why the coin math moved into Postgres (the "concurrency" you asked for)
The old code did `newBalance = coins - 1; update(...)`. Two face scans firing together both read
`coins = 5`, both write `4`, and you just gave away a scan. Same bug on the add side. The fix is to
never compute the balance in JS — do it in one atomic SQL statement:
```sql
UPDATE profiles SET coins = coins + p_amount WHERE id = p_user ...
```
Postgres serializes row updates, so concurrent calls can't clobber each other. `spend_coin` also
checks `coins >= 1` *inside* the same statement, so you can't spend a coin you don't have even
under a race.

---

## 4. Apply the database changes   **YOU DO**
Run `supabase/coins-and-iap.sql` in the Supabase SQL editor (or `supabase db push`). It's
idempotent — safe to re-run. Creates the two RPCs and the `coin_transactions` ledger table.

---

## 5. Deploy the webhook   **YOU DO**
```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase secrets set REVENUECAT_WEBHOOK_AUTH=<pick-a-long-random-string>
```
Then in **RevenueCat → Integrations → Webhooks**:
- URL: `https://<your-project-ref>.supabase.co/functions/v1/revenuecat-webhook`
- **Authorization header:** paste the same random string you set as `REVENUECAT_WEBHOOK_AUTH`.

The function rejects any call whose `Authorization` header doesn't match — that's what stops a
random person from POSTing themselves free coins.

---

## 6. Build & test   **YOU DO**
IAP **cannot** run in Expo Go. You need a dev build:
```bash
npx expo run:ios              # local, needs Xcode + a real device for sandbox IAP
# or
eas build --profile development --platform ios
```
On the device: sign OUT of your real Apple ID in **Settings → App Store**, run the app, buy a coin
pack, and at the purchase sheet sign in with your **sandbox tester**. Verify:
1. Purchase sheet shows the real price.
2. After purchase, `coin_transactions` gets a row and `profiles.coins` goes up by the pack amount.
3. Buying again adds again; a replayed webhook does NOT (idempotency).

---

## 7. Before you submit to Apple   **YOU DO**
- Add **Restore Purchases** button (subscriptions require it — `restorePurchases()` already exists in the util).
- Add links to your **Privacy Policy** and **Terms (EULA)** in the paywall/settings — Apple requires
  them for auto-renewable subs.
- In the subscription localization, list price, period, and "auto-renews unless cancelled".
- Submit the IAP products **for review together with the app build** (first time, they review as a set).

---

## Product ID ↔ coin amount map (keep in sync everywhere)
| RC package id | Product ID       | Coins |
|---------------|------------------|-------|
| `1`           | `enola_coins_1`  | 1     |
| `5`           | `enola_coins_5`  | 5     |
| `10`          | `enola_coins_10` | 10    |
| `25`          | `enola_coins_25` | 25    |
| `50`          | `enola_coins_50` | 50    |
| —             | `enola_pro_monthly` | +15/mo (via webhook on renewal) |
