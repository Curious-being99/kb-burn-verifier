"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_ID = "b75a6e90f569965bdeec23c460ebd59e0f0445d8aa8f5d4330fe15c66a47b4d8";
const API_URL = `https://kascov.io/data/mainnet/token/${TOKEN_ID}`;

type JsonObject = Record<string, unknown>;
type TokenPayload = {
  token?: JsonObject;
  events?: JsonObject[];
  balances?: JsonObject[];
  tip_daa?: number | string;
  tip_at_ms?: number;
  [key: string]: unknown;
};

function stringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}

function formatRaw(value: unknown): string {
  const raw = stringValue(value);
  if (!raw) return "—";
  if (!/^\\d+$/.test(raw)) return raw;
  return BigInt(raw).toLocaleString("en-US");
}

function shortId(value: string): string {
  return value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

function dateLabel(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const date = new Date(n > 1e12 ? n : n * 1000);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function Home() {
  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404 ? "The indexer does not currently have this covenant indexed." : `Indexer returned HTTP ${response.status}.`);
      const data = await response.json() as TokenPayload;
      const token = data.token;
      if (!token || stringValue(token.covenant_id).toLowerCase() !== TOKEN_ID) {
        throw new Error("The returned record did not match the configured $KB covenant ID. No figures were accepted.");
      }
      setPayload(data);
      setCheckedAt(new Date().toLocaleString());
    } catch (cause) {
      setPayload(null);
      setError(cause instanceof Error ? cause.message : "Unable to retrieve token data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const token = payload?.token ?? {};
  const verdict = stringValue(token.status).toLowerCase();
  const verified = verdict === "verified";
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const burns = events.filter((event) => stringValue(event.type ?? event.action ?? event.kind).toLowerCase() === "burn");
  const name = stringValue(token.name) || "$KB";
  const ticker = stringValue(token.ticker ?? token.tick) || "KB";
  const supply = verified ? formatRaw(token.supply) : "Not verified";
  const burned = verified ? formatRaw(token.burned) : "Not verified";
  const minted = verified ? formatRaw(token.minted) : "Not verified";
  const eventTx = (event: JsonObject) => stringValue(event.tx_id ?? event.txid ?? event.transaction_id ?? event.transactionId ?? event.tx_hash);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">K</span><span><strong>KB BURN</strong><small>PUBLIC VERIFIER</small></span></a>
        <a className="network" href="https://explorer.kaspa.org/" target="_blank" rel="noreferrer">KASPA MAINNET <span>↗</span></a>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> ON-CHAIN TOKEN RECORD</div>
        <h1>Every burn.<br /><em>Accounted for.</em></h1>
        <p className="intro">A public evidence page for $KB token burns. Figures are shown only when the indexed token history returns a verified verdict for the exact covenant ID.</p>
        <div className="token-line"><span className="token-symbol">$</span><div><strong>{name} ({ticker})</strong><small>KCC-20 · Kaspa Mainnet</small></div></div>
      </section>

      <section className="status-panel" aria-live="polite">
        <div className="status-head"><div><span className="section-kicker">VERIFICATION STATUS</span><h2>{loading ? "Checking chain index…" : error ? "Data unavailable" : verified ? "Indexer reports verified" : "Not verified"}</h2></div><span className={verified ? "status-chip good" : "status-chip pending"}>{loading ? "CHECKING" : error ? "UNAVAILABLE" : verified ? "VERIFIED" : (verdict || "UNVALIDATED").toUpperCase()}</span></div>
        {error ? <div className="notice">{error} The site will not substitute cached or invented values. <button onClick={() => void load()}>Try again</button></div> : null}
        {!error && !loading && !verified ? <div className="notice">The source has not supplied a verified verdict. Burn totals and supply are withheld rather than presented as confirmed.</div> : null}
        <div className="stats">
          <article><span>VERIFIED BURNED</span><strong>{loading ? "…" : burned}</strong><small>Raw token base units</small></article>
          <article><span>REMAINING SUPPLY</span><strong>{loading ? "…" : supply}</strong><small>Raw token base units</small></article>
          <article><span>TOTAL MINTED</span><strong>{loading ? "…" : minted}</strong><small>Raw token base units</small></article>
        </div>
        <div className="status-foot"><span>Source verdict: <b>{verdict || (loading ? "checking" : "unavailable")}</b></span><span>Last checked: {checkedAt || "—"}</span></div>
      </section>

      <section className="evidence">
        <div className="section-heading"><div><span className="section-kicker">PUBLIC AUDIT TRAIL</span><h2>Burn transactions</h2></div><span className="count">{burns.length} indexed</span></div>
        {loading ? <p className="empty">Loading indexed token events…</p> : error ? <p className="empty">No transaction list is available while the source is unreachable.</p> : burns.length === 0 ? <p className="empty">No burn events were returned by the indexer for this token record.</p> : <div className="event-list">{burns.map((event, index) => {
          const tx = eventTx(event);
          const amount = event.amount ?? event.value ?? event.token_amount;
          return <article className="event" key={tx || index}><div className="event-icon">↘</div><div className="event-main"><strong>Burn event</strong><small>{tx ? shortId(tx) : "Transaction ID not supplied by source"}</small><small>{dateLabel(event.timestamp_ms ?? event.timestamp ?? event.time)}</small></div><div className="event-amount">{formatRaw(amount)}<small>raw units</small></div>{tx ? <a className="tx-link" href={`https://explorer.kaspa.org/txs/${encodeURIComponent(tx)}`} target="_blank" rel="noreferrer" aria-label="Open transaction in Kaspa Explorer">↗</a> : null}</article>;
        })}</div>}
      </section>

      <section className="identity">
        <span className="section-kicker">TOKEN IDENTITY</span>
        <p className="mono">{TOKEN_ID}</p>
        <div className="identity-links"><a href={`https://kascov.io/data/mainnet/token/${TOKEN_ID}`} target="_blank" rel="noreferrer">Open source indexer record ↗</a><a href="https://kccs.dev/kcc-20-fungible-token-covenant/" target="_blank" rel="noreferrer">KCC-20 specification ↗</a></div>
        <p className="disclaimer">Verification note: this first release reads a public third-party indexer and displays its validation verdict and indexed burn events. It is not yet an independent node-level replay or a cryptographic proof generated by this website. A burn event is not treated as a supply reduction unless the source marks the token history verified and reports the corresponding burned and remaining supply.</p>
        <p className="source-meta">Indexer DAA: {stringValue(payload?.tip_daa) || "—"} · Source timestamp: {dateLabel(payload?.tip_at_ms)}</p>
      </section>

      <footer><span>KB BURN VERIFIER</span><span>Independent project · Not a wallet · No custody</span></footer>
    </main>
  );
}
