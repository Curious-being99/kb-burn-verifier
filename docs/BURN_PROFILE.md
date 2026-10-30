# $KB holder-authorized burn profile — implementation notes

## What this source implements

`contracts/kb_kcc20_burn.sil` is a burn-enabled KCC-20 covenant template derived from the published KaspaRocket KCC-20 SilverScript source. It adds a separate `burn(next_states, witness)` entrypoint.

The burn amount is not accepted as a caller-supplied integer. The covenant derives it from:

`burned_amount = sum(token input amounts) - sum(validated successor token amounts)`

The entrypoint requires:
- The leader input is first in its covenant family.
- All delegate token inputs are included in the family and authorize the transaction through the existing `transfer_delegator` entrypoint.
- The leader provides normal owner authorization; borrowed-receive mode is rejected.
- Every successor keeps the same extension commitment and uses a valid owner and borrow scheme.
- Every successor output is validated against the token template.
- At least one successor remains, and total successor amount is strictly less than total input amount.

A transaction that does not satisfy all checks fails at the covenant level. The difference between input and output token amounts is the only quantity this branch treats as burned.

## Critical compatibility boundary

This is a **new covenant program source**, not an upgrade to the already deployed `$KB` covenant. The published KaspaRocket source's existing `transfer` branch enforces exact amount conservation (`output_total == input_total`) and does not expose this `burn` entrypoint.

Adding an entrypoint changes the compiled program/template. It cannot be injected into an already deployed covenant by updating this repository or the Vercel site. We must retrieve and verify the actual deployed `$KB` artifact and genesis details before claiming compatibility. If the deployed artifact matches the published conservation-only source, this new burn entrypoint cannot spend those existing token UTXOs under the old covenant ID. A migration would require an explicitly designed and accepted bridge/migration path; this source does not provide one.

## Compile check

The GitHub Actions workflow pins the upstream SilverScript compiler repository to a fixed commit, compiles this source using dummy constructor arguments, and uploads the resulting artifact. Dummy constructor arguments are only for reproducible compilation; they are not deployable token parameters.

## Not done by this source

- It does not deploy a covenant.
- It does not create a mainnet transaction.
- It does not sign or broadcast a burn.
- It does not prove that the current live `$KB` covenant uses this template.
- It does not by itself update any token supply indexer.

A burn is not counted by the public verifier until a corresponding accepted mainnet transaction is independently observed and the token's actual deployed program is verified.
