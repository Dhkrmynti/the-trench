import { useMemo } from 'react';
import { Check, Copy, ExternalLink, ScrollText } from 'lucide-react';
import type { ActivityLog, BurnLedgerEntry } from '../../types';

interface SinkingLogProps {
  burnLedger: BurnLedgerEntry[];
  logs: ActivityLog[];
  totalBurned: number;
  tokenSymbol: string;
  deadAddress: string;
  explorerUrl: string;
  copiedDead: boolean;
  onCopyDead: () => void;
  onOpenLog: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(n));
const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1, roundingMode: 'floor' } as Intl.NumberFormatOptions).format(n);
const shortHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;
export const when = (e: BurnLedgerEntry) => {
  // ledger timestamps from the chain are in seconds
  const ms = e.timestamp && e.timestamp < 1e12 ? e.timestamp * 1000 : e.timestamp;
  const d = ms ? new Date(ms) : null;
  if (!d || Number.isNaN(d.getTime())) return e.timeStr?.split(' (')[0] ?? '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};
export const burned = (e: BurnLedgerEntry) => e.burnedJollyburn || e.burnedMuseburn || e.burnedIncinerator || 0;

/** Every sink, oldest first numbering, newest first order. */
export function useSinks(burnLedger: BurnLedgerEntry[]) {
  return useMemo(() => {
    const chrono = [...burnLedger].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return chrono
      .filter((e) => e.cycleType !== 'keep' && (burned(e) > 0 || e.burnTx))
      .map((e, i) => ({ e, n: i + 1 }))
      .reverse();
  }, [burnLedger]);
}

interface HoldRun {
  key: string;
  eth: number;
  time: string;
  tx: string;
}

/** A plumb line: the weight hangs lower the bigger the sink, next to the biggest one shown. */
function Plumb({ share }: { share: number }) {
  const y = 10 + share * 52;
  return (
    <svg viewBox="0 0 24 72" className="h-[4.5rem] w-6 shrink-0" aria-hidden="true">
      <line x1="12" y1="0" x2="12" y2={y} stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="12" cy={y + 5} r="5" fill="#ff6a3d" />
    </svg>
  );
}

/** Every sink to the bottom, and every dive that filled the hold, each with its transaction. */
export function SinkingLog({ burnLedger, logs, totalBurned, tokenSymbol, deadAddress, explorerUrl, copiedDead, onCopyDead, onOpenLog }: SinkingLogProps) {
  const sinks = useSinks(burnLedger);

  // hold dives: keep entries from the ledger, plus the bot's "forwarded … to treasury" log lines
  const hold = useMemo(() => {
    const out: HoldRun[] = [];
    const seen = new Set<string>();
    for (const e of burnLedger) {
      if (e.cycleType !== 'keep') continue;
      const tx = e.claimTx || '';
      seen.add(tx || e.id);
      out.push({ key: e.id, eth: e.retainedETH || e.claimedETH || 0, time: when(e), tx });
    }
    for (const l of logs) {
      const m = /forwarded\s+([\d.]+)\s*ETH\s+to\s+treasury/i.exec(l.details || '');
      if (!m) continue;
      const tx = l.txHash || '';
      const key = tx || l.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, eth: parseFloat(m[1]) || 0, time: l.timestamp, tx });
    }
    return out;
  }, [burnLedger, logs]);

  const shown = sinks.slice(0, 8);
  const biggest = Math.max(1, ...shown.map(({ e }) => burned(e)));

  return (
    <section id="log" data-depth="4000" aria-labelledby="log-title" className="relative bg-[linear-gradient(#082b44,#05182a)] px-4 pb-24 pt-32 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[80rem]">
        <h2 id="log-title" data-rise className="m-0 display text-[clamp(2.8rem,5.6vw,5rem)] text-star">
          The sinking log
        </h2>
        <p data-rise className="m-0 mt-5 max-w-[52ch] text-[1.1rem] leading-relaxed text-star-dim">
          Every time {tokenSymbol} goes to the bottom, it is written here with its transaction, read straight from Robinhood Chain. The deeper the weight hangs, the bigger the sink.
        </p>

        <div data-rise className="hull mt-12 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-panel-line pb-5 text-star-dim">
            <span className="label">
              sinks <span className="reading ml-1 text-[0.95rem] text-ring-hot">{sinks.length}</span>
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <span className="label">the bottom</span>
              <span className="reading truncate text-[0.85rem] text-star" title={deadAddress}>
                {deadAddress.slice(0, 8)}…{deadAddress.slice(-6)}
              </span>
              <button type="button" onClick={onCopyDead} className="btn-ghost cursor-pointer px-3 py-1 text-[0.8rem]">
                {copiedDead ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedDead ? 'copied' : 'copy'}
              </button>
            </span>
          </div>

          <ol className="m-0 list-none p-0" aria-label="Recent sinks to the bottom">
            {shown.length === 0 ? (
              <li data-log-row className="flex items-center gap-5 py-10">
                <Plumb share={0.2} />
                <p className="m-0 max-w-[48ch] text-[1.05rem] text-star-dim">
                  {totalBurned > 0
                    ? `${compact(totalBurned)} ${tokenSymbol} already went down. Reading the sinks from the chain…`
                    : 'Nothing on the bottom yet. The first sink shows up here with its transaction.'}
                </p>
              </li>
            ) : (
              shown.map(({ e, n }) => {
                const tx = e.burnTx || e.buyTx || e.claimTx;
                const amt = burned(e);
                return (
                  <li
                    key={e.id}
                    data-log-row
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-5 gap-y-1 py-3 text-star sm:grid-cols-[1.5rem_8rem_minmax(0,1fr)_auto]"
                  >
                    <span className="row-span-2 text-star-dim sm:row-span-1">
                      <Plumb share={Math.max(0.05, Math.log10(1 + amt) / Math.log10(1 + biggest))} />
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-3 sm:block">
                      <span className="label block text-star-dim">sink {n}</span>
                      <span className="reading block text-[0.82rem] text-star-dim">{when(e)}</span>
                    </span>
                    <span className="display col-start-2 text-[clamp(1.8rem,3vw,2.6rem)] tabular sm:col-start-3">
                      {fmt(amt)} <span className="text-[0.55em] text-ring-hot">{tokenSymbol}</span>
                    </span>
                    {tx && tx.startsWith('0x') ? (
                      <a
                        href={`${explorerUrl}/tx/${tx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="reading col-start-2 inline-flex items-center gap-1 justify-self-start text-[0.85rem] text-ring-hot underline decoration-ring/40 sm:col-start-4 sm:justify-self-end"
                      >
                        {shortHash(tx)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </li>
                );
              })
            )}
          </ol>
          <button type="button" onClick={onOpenLog} className="btn-ghost mt-6 cursor-pointer px-5 py-2.5 text-[0.95rem]">
            <ScrollText className="h-4 w-4" />
            open the full log
          </button>
        </div>

        {/* ───────── The hold: the keep dives, in the open ───────── */}
        <div id="hold" className="mt-24 grid gap-10 rounded-[20px] bg-fuel px-6 py-10 text-pen sm:px-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end">
          <div data-rise>
            <h3 className="m-0 display text-[clamp(2.4rem,4vw,3.4rem)]">The hold</h3>
            <p className="m-0 mt-4 max-w-[44ch] text-[1.05rem] leading-relaxed">
              Every other dive keeps the boat running: the fees go to the project wallet instead of the bottom. Those dives are written up here too, in full.
            </p>
          </div>
          {hold.length === 0 ? (
            <p data-rise className="m-0 text-[1rem] leading-relaxed">
              No hold dive in the recent log. The next one shows up here with its transaction. Older ones are in the project wallet’s history.
            </p>
          ) : (
            <ol data-rise className="m-0 list-none p-0">
              {hold.slice(0, 4).map((f) => (
                <li key={f.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-pen/20 py-3 last:border-b-0">
                  <span className="label">hold dive</span>
                  <span className="reading text-[1rem] font-semibold">{f.eth.toFixed(4)} ETH</span>
                  <span className="reading text-[0.85rem]">{f.time}</span>
                  {f.tx && f.tx.startsWith('0x') ? (
                    <a href={`${explorerUrl}/tx/${f.tx}`} target="_blank" rel="noreferrer" className="reading inline-flex items-center gap-1 text-[0.85rem] underline decoration-pen/40">
                      {shortHash(f.tx)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
