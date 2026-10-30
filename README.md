# $KB Burn Verifier

Standalone public verification site for the Kaspa Browser KCC-20 token.

## Token identity

- Network: Kaspa mainnet
- Covenant ID: `b75a6e90f569965bdeec23c460ebd59e0f0445d8aa8f5d4330fe15c66a47b4d8`
- Public data source: [Kascov](https://kascov.io/)
- Token endpoint: `https://kascov.io/data/mainnet/token/{covenant_id}`

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Import `Curious-being99/kb-burn-verifier` into Vercel. Select the Next.js framework preset and use `npm run build`. No environment secrets are required for this read-only version.

## Verification model

The site queries Kascov's public mainnet endpoint documented in its [API guide](https://kascov.io/guide). It requires an exact match on the returned `token.covenant_id`. The API response includes the token record, classified events, validation details and indexer tip.

Kascov documents `token.status = "verified"` as meaning every event in the token history matched a known KCC-20 rule, with state hash checks and supply conservation. The page displays `burned`, `supply`, and `minted` only under that verdict. Burn transactions are selected from events with `token_kind = "burn"`, with their source transaction IDs and raw amounts.

This is an indexer-backed public evidence viewer, not an independently operated full-node replay. The site does not independently decode every transaction or verify the deployed contract artifact. Kascov's validation is a third-party source, not Kaspa consensus itself. The [KCC-20 specification](https://kccs.dev/kcc-20-fungible-token-covenant/) and the actual deployed program still govern what token transitions are possible.

No wallet connection, signing, broadcasting, custody, burn address, or transaction submission is implemented. No burn has been initiated by this project.

## Remaining verification work

1. Confirm the live `$KB` token endpoint returns the exact covenant ID and current schema.
2. Confirm its validation status and review its complete event history.
3. Obtain the actual deployed `$KB` program artifact and constructor parameters, then compare them byte-for-byte with the reviewed source.
4. Determine whether the deployed covenant implements a supply-reducing burn transition. A transfer to an inaccessible owner is not automatically a supply burn.
5. Add independent node-level replay and real transaction fixtures before describing this project as an independent verifier.
