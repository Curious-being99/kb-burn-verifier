"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_ID = "b75a6e90f569965bdeec23c460ebd59e0f0445d8aa8f5d4330fe15c66a47b4d8";
const API_URL = `https://kascov.io/data/mainnet/token/${TOKEN_ID}`;

type Token = { covenant_id?: string; name?: string; status?: string; supply?: number | string; minted?: number | string; burned?: number | string; fields?: Record<string, unknown>; invalid_reason?: string; };
type TokenEvent = { txid?: string; token_kind?: string; amount?: number | string; accepting_daa?: number; };
type TokenPayload = { token?: Token; events?: TokenEvent[]; validation?: { checked?: number }; note?: string; tip_daa?: number; tip_at_ms?: number; };

function formatRaw(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  const raw = String(value);
  if (!/^\d+$/.test(raw)) return raw;
  return BigInt(raw).toLocaleString("en-US");
}
function shortId(value: string): string { return value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value; }
function timeLabel(value: number | undefined): string { return value ? new Date(value).toLocaleString() : "—"; }

export default function Home() {
  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404 ? "The indexer does not currently have this covenant indexed." : `Indexer returned HTTP ${response.status}.`);
      const data = await response.json() as TokenPayload;
      if (!data.token || data.token.covenant_id?.toLowerCase() !== TOKEN_ID) throw new Error("The returned record did not match the configured $KB covenant ID. No figures were accepted.");
      setPayload(data); setCheckedAt(new Date().toLocaleString());
    } catch (cause) {
      setPayload(null); setError(cause instanceof Error ? cause.message : "Unable to retrieve token data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const token = payload?.token;
  const verified = token?.status === "verified";
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const burns = events.filter((event) => event.token_kind === "burn");
  const ticker = String(token?.fields?.tick ?? "KB");
  const name = token?.name || "$KB";

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">K</span><span><strong>KB BURN</strong><small>PUBLIC VERIFIER</small></span></a>
        <a className="network" href="https://explorer.kaspa.org/" target="_blank" rel="noreferrer">KASPA MAINNET <span>↗</span></a>
      </header>
      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> ON-CHAIN TOKEN RECORD</div>
        <h1>Every burn.<br /><em>Accounted for.</em></h1>
        <p className="intro">A public evidence page for $KB token burns. Figures come from Kascov’s chain-indexed KCC-20 record and are shown only when its full-history validation verdict is verified.</p>
        <div className="token-line"><span className="token-symbol">$</span><div><strong>{name} ({ticker})</strong><small>KCC-20 · Kaspa Mainnet</small></div></div>
      </section>
      <section className="status-panel" aria-live="polite">
        <div className="status-head"><div><span className="section-kicker">VERIFICATION STATUS</span><h2>{loading ? "Checking chain index…" : error ? "Data unavailable" : verified ? "Full history verified by indexer" : "Not verified"}</h2></div><span className={verified ? "status-chip good" : "status-chip pending"}>{loading ? "CHECKING" : error ? "UNAVAILABLE" : (token?.status || "UNVALIDATED").toUpperCase()}</span></div>
        {error ? <div className="notice">{error} No cached or invented figures are substituted. <button onClick={() => void load()}>Try again</button></div> : null}
        {!error && !loading && !verified ? <div className="notice">The indexer has not marked the complete token history as verified. Burn totals and supply are withheld. {token?.invalid_reason || ""}</div> : null}
        <div className="stats">
          <article><span>CHAIN-REPORTED BURNED</span><strong>{loading ? "…" : verified ? formatRaw(token?.burned) : "Not verified"}</strong><small>Raw token units</small></article>
          <article><span>CHAIN-REPORTED SUPPLY</span><strong>{loading ? "…" : verified ? formatRaw(token?.supply) : "Not verified"}</strong><small>Raw token units</small></article>
          <article><span>TOTAL MINTED</span><strong>{loading ? "…" : verified ? formatRaw(token?.minted) : "Not verified"}</strong><small>Raw token units</small></article>
        </div>
        <div className="status-foot"><span>Validation: <b>{token?.status || (loading ? "checking" : "unavailable")}</b> · Events checked: <b>{payload?.validation?.checked ?? "—"}</b></span><span>Last checked: {checkedAt || "—"}</span></div>
      </section>
      <section className="evidence">
        <div className="section-heading"><div><span className="section-kicker">PUBLIC AUDIT TRAIL</span><h2>Burn transactions</h2></div><span className="count">{burns.length} indexed</span></div>
        {loading ? <p className="empty">Loading indexed token events…</p> : error ? <p className="empty">No transaction list is available while the source is unreachable.</p> : burns.length === 0 ? <p className="empty">No burn events were returned by the indexer for this token record.</p> : <div className="event-list">{burns.map((event, index) => {
          const tx = event.txid || "";
          return <article className="event" key={tx || index}><div className="event-icon">↘</div><div className="event-main"><strong>Burn event</strong><small>{tx ? shortId(tx) : "Transaction ID not supplied by source"}</small><small>Accepted DAA: {event.accepting_daa ?? "—"}</small></div><div className="event-amount">{formatRaw(event.amount)}<small>raw units</small></div>{tx ? <a className="tx-link" href={`https://explorer.kaspa.org/txs/${encodeURIComponent(tx)}`} target="_blank" rel="noreferrer" aria-label="Open transaction in Kaspa Explorer">↗</a> : null}</article>;
        })}</div>}
      </section>
      <section className="identity">
        <span className="section-kicker">TOKEN IDENTITY</span><p className="mono">{TOKEN_ID}</p>
        <div className="identity-links"><a href={API_URL} target="_blank" rel="noreferrer">Open raw chain-indexed token record ↗</a><a href="https://kascov.io/guide" target="_blank" rel="noreferrer">Indexer API and validation methodology ↗</a></div>
        <p className="disclaimer">Verification scope: Kascov documents that its verified verdict means every event in the token history matched a known KCC-20 rule, with state hash checks and supply conservation. This site displays that third-party verdict and the indexer’s classified burn events; it is not itself an independently operated Kaspa node and does not claim a separate replay. The source is public and can be queried directly using the token ID above. If the source record is unavailable, unvalidated, or mismatched, totals are not presented as verified.</p>
        <p className="source-meta">Indexer tip DAA: {payload?.tip_daa ?? "—"} · Source timestamp: {timeLabel(payload?.tip_at_ms)}</p>
      </section>
      <footer><span>KB BURN VERIFIER</span><span>Independent project · Read-only · No custody</span></footer>
    </main>
  );
}
