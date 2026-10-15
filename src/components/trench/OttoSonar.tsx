import { ScrollText } from 'lucide-react';
import type { FlywheelState, MachineConfig } from '../../types';
import { Otto } from './Otto';

interface OttoSonarProps {
  state: FlywheelState;
  config: MachineConfig;
  live: boolean;
  onOpenLog: () => void;
}

const PHASE: Record<string, string> = {
  accumulate: 'watching the net fill',
  claim: 'hauling the net',
  buyback: 'buying $SINK',
  burn: 'sinking it to the bottom',
  keep: 'filling the hold',
};

/** Otto's shift: what the bot is doing right now, read from the engine, around a sonar scope. */
export function OttoSonar({ state, config, live, onOpenLog }: OttoSonarProps) {
  const running = state.isWheelSpinning;
  const doing = !live ? 'docked until the contract address is set' : running ? PHASE[state.currentPhase] ?? 'diving' : 'watching the net';
  const left = [
    { k: 'dives done', v: String(state.cycleCount || 0) },
    { k: 'next dive', v: state.nextCycleType === 'keep' ? 'hold, 0.02 ETH' : 'sink, 0.01 ETH' },
    { k: 'buys on', v: state.swapRouter === 'uniswap' || state.isTokenMigrated ? 'Uniswap v4' : 'Pons curve' },
  ];
  const right = [
    { k: 'ETH hauled', v: `${(state.totalFeesClaimedETH || 0).toFixed(4)} ETH` },
    { k: 'ETH to the hold', v: `${(state.totalFeesRetainedETH || 0).toFixed(4)} ETH` },
    { k: 'the bottom', v: `${config.deadAddress.slice(0, 6)}…${config.deadAddress.slice(-4)}` },
  ];

  const Readings = ({ rows, align }: { rows: typeof left; align: 'left' | 'right' }) => (
    <dl className={`m-0 grid grid-cols-2 gap-6 text-left sm:grid-cols-3 lg:grid-cols-1 lg:gap-7 ${align === 'right' ? 'lg:text-left' : 'lg:text-right'}`}>
      {rows.map((r) => (
        <div key={r.k}>
          <dt className="label text-star-dim">{r.k}</dt>
          <dd className="reading m-0 mt-1.5 text-[1.15rem] text-star">{r.v}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section id="otto" data-depth="6000" aria-labelledby="otto-title" className="relative bg-[linear-gradient(#05182a,#040f1b)] px-4 py-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[72rem] text-center">
        <h2 id="otto-title" data-rise className="m-0 display text-[clamp(2.8rem,5.6vw,5rem)] text-star">
          Otto’s shift
        </h2>
        <p data-rise className="mx-auto mt-5 max-w-[50ch] text-[1.1rem] leading-relaxed text-star-dim">
          Otto is the bot: an octopus in a bathysphere, very far from any tide pool. Otto pings the net around the clock, hauls it when it is full, and does the dive alone. Every move lands on chain.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-[72rem] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <Readings rows={left} align="left" />
        </div>

        {/* the sonar scope */}
        <div data-rise className="order-1 mx-auto lg:order-2">
          <div className="relative aspect-square w-[min(80vw,22rem)] overflow-hidden rounded-full border border-panel-line bg-[radial-gradient(circle,#0a2537_0%,#05182a_70%)]" aria-hidden="true">
            {[0.25, 0.5, 0.75].map((r) => (
              <span key={r} className="absolute left-1/2 top-1/2 rounded-full border border-panel-line" style={{ width: `${r * 100}%`, height: `${r * 100}%`, transform: 'translate(-50%,-50%)' }} />
            ))}
            <span className="absolute left-1/2 top-0 h-full w-px bg-panel-line" />
            <span className="absolute left-0 top-1/2 h-px w-full bg-panel-line" />
            <span
              data-fast={running ? 'true' : 'false'}
              className="sonar-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(255,106,61,0.38),rgba(255,106,61,0)_22%,transparent_100%)]"
            />
            {running ? <span className="ping absolute inset-0 rounded-full border-2 border-ring" /> : null}
            <span className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-panel-line bg-air">
              <Otto mood={!live ? 'sleep' : running ? 'busy' : 'idle'} track className="bob mt-3 h-auto w-20" />
            </span>
          </div>
          <p className="m-0 mt-6 text-center">
            <span className="label block text-star-dim">right now</span>
            <span className={`display mt-1 block text-[clamp(1.5rem,2.4vw,2rem)] ${running ? 'text-ring-hot' : 'text-star'}`} aria-live="polite">
              {doing}
            </span>
            {state.lastActionText ? <span className="reading mx-auto mt-2 block max-w-[34ch] truncate text-[0.8rem] text-star-dim">{state.lastActionText}</span> : null}
          </p>
        </div>

        <div className="order-3">
          <Readings rows={right} align="right" />
        </div>
      </div>

      <div className="mt-14 text-center">
        <button type="button" onClick={onOpenLog} className="btn-ghost cursor-pointer px-5 py-2.5 text-[0.95rem]">
          <ScrollText className="h-4 w-4" />
          open the full log
        </button>
      </div>
    </section>
  );
}
