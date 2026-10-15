import type { ReactNode } from 'react';

interface NetPortholeProps {
  /** whoever sits on the rim (Otto) */
  rider?: ReactNode;
  escrow: number;
  threshold: number;
  fill: number;
  nextCycle: 'burn' | 'keep';
  live: boolean;
  running: boolean;
}

const BOLTS = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);

/**
 * The net: the Pons fee escrow seen through a porthole. The water level is the escrow
 * against the next dive's threshold; orange when the next dive sinks, kelp when it fills the hold.
 */
export function NetPorthole({ rider, escrow, threshold, fill, nextCycle, live, running }: NetPortholeProps) {
  const sink = nextCycle === 'burn';
  const status = !live
    ? 'waiting for the contract address'
    : running
      ? sink
        ? 'Otto is diving: sinking it now'
        : 'Otto is diving: filling the hold'
      : fill >= 0.85
        ? 'almost full'
        : 'every trade adds to it';
  const level = Math.max(0.04, fill);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center">
      <div
        className="relative aspect-square w-[12.5rem] shrink-0 sm:w-[13.5rem]"
        role="meter"
        aria-label="The net: fee escrow toward the next dive"
        aria-valuemin={0}
        aria-valuemax={threshold || 1}
        aria-valuenow={escrow}
      >
        {/* the steel ring, with bolts */}
        <div className="absolute inset-0 rounded-full bg-pen shadow-[0_24px_40px_-20px_rgba(5,39,51,0.75)]" />
        {BOLTS.map((a, i) => (
          <span
            key={i}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#2c5966]"
            style={{ left: `calc(50% + ${Math.cos(a) * 44.5}% - 5px)`, top: `calc(50% + ${Math.sin(a) * 44.5}% - 5px)` }}
          />
        ))}
        {/* the glass */}
        <div className="absolute inset-[13%] overflow-hidden rounded-full bg-air">
          <div className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out" style={{ height: `${level * 100}%` }}>
            <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="porthole-water absolute -top-[9px] left-[-10%] h-[10px] w-[120%]" aria-hidden="true">
              <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" fill={sink ? '#ff6a3d' : '#c8e66a'} />
            </svg>
            <div className={`h-full w-full ${sink ? 'bg-ring' : 'bg-fuel'}`} />
          </div>
          {/* the reading, printed on the glass */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-pen">
            <span className="label text-[0.62rem]">the net</span>
            <span className="reading mt-1 text-[1.15rem] font-semibold">{escrow.toFixed(4)}</span>
            <span className="reading text-[0.74rem]">of {threshold ? threshold.toFixed(2) : '-'} ETH</span>
          </div>
        </div>
        {rider ? <div className="pointer-events-none absolute -top-[44%] left-1/2 w-[58%] -translate-x-1/2">{rider}</div> : null}
      </div>

      <div className="min-w-0 max-w-[19rem] text-pen">
        <p className="m-0 label" aria-live="polite">
          {status}
        </p>
        <p className="m-0 mt-2 text-[1.02rem] leading-snug">
          Next dive:{' '}
          <b className="font-bold">{sink ? `buy $SINK and sink it` : 'the ETH goes in the hold'}</b>
          <span className="mt-1 block text-[0.9rem]">{sink ? 'odd dives sink, at 0.01 ETH' : 'even dives keep, at 0.02 ETH'}</span>
        </p>
      </div>
    </div>
  );
}
