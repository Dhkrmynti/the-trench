import { useMemo, useRef } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Otto } from './Otto';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SeafloorProps {
  sinkCount: number;
  tokenSymbol: string;
  buyHref: string;
  hasCA: boolean;
  copiedCA: boolean;
  onCopyCA: () => void;
}

const MAX_COINS = 60;
const W = 1200;
const H = 260;
/** the silt line, as a function of x, so coins can rest on it */
const floorY = (x: number) => 150 + Math.sin(x * 0.006) * 18 + Math.sin(x * 0.017 + 1) * 7 + Math.cos(x * 0.0021) * 12;

/** A deterministic pile: the same ledger always lands the same way. */
function pile(n: number) {
  const out: { x: number; y: number; tilt: number }[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const heights = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    // most coins land near the trench axis, a few roll away
    const spread = (rnd() + rnd() + rnd() - 1.5) * 520;
    const x = Math.round((W / 2 + spread) / 22) * 22;
    const stack = heights.get(x) ?? 0;
    heights.set(x, stack + 1);
    out.push({ x, y: floorY(x) - 6 - stack * 7, tilt: (rnd() - 0.5) * 18 });
  }
  return out;
}

/** The floor of the Challenger Deep: every real sink from the ledger lands here as one coin. */
export function Seafloor({ sinkCount, tokenSymbol, buyHref, hasCA, copiedCA, onCopyCA }: SeafloorProps) {
  const ref = useRef<HTMLElement>(null);
  const coins = useMemo(() => pile(Math.min(sinkCount, MAX_COINS)), [sinkCount]);
  const floorPath = useMemo(() => {
    let d = `M0 ${H} L0 ${floorY(0)}`;
    for (let x = 0; x <= W; x += 20) d += ` L${x} ${floorY(x).toFixed(1)}`;
    return `${d} L${W} ${H} Z`;
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const els = gsap.utils.toArray<SVGGElement>('[data-floor-coin]');
        if (!els.length) return;
        gsap.from(els, {
          y: -340,
          opacity: 0,
          duration: 1.4,
          ease: 'power2.in',
          stagger: { each: 0.05, from: 'random' },
          scrollTrigger: { trigger: '[data-floor]', start: 'top 85%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [coins.length] },
  );

  return (
    <section ref={ref} id="floor" data-depth="10200" aria-labelledby="floor-title" className="relative overflow-hidden bg-[linear-gradient(#040f1b,#02080f)]">
      <div className="mx-auto max-w-[56rem] px-4 pb-10 pt-36 text-center sm:px-10">
        <h2 id="floor-title" data-rise className="m-0 wordmark text-[clamp(4rem,12vw,9rem)] text-star">
          Let it sink.
        </h2>
        <p data-rise className="mx-auto mt-6 max-w-[42ch] text-[1.15rem] leading-relaxed text-star-dim">
          Hold {tokenSymbol}, trade {tokenSymbol}, and watch Otto take the supply down, one dive at a time.
        </p>
        <div data-rise className="mt-10 flex flex-wrap justify-center gap-4">
          <a href={buyHref} target="_blank" rel="noreferrer" className="btn-ring px-8 py-4 text-[1.1rem] no-underline">
            Buy {tokenSymbol}
            <ArrowUpRight className="h-5 w-5" />
          </a>
          {hasCA ? (
            <button type="button" onClick={onCopyCA} className="btn-ghost cursor-pointer px-6 py-4 text-[1rem]">
              {copiedCA ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copiedCA ? 'copied' : 'Copy CA'}
            </button>
          ) : null}
        </div>
      </div>

      <div data-floor className="relative mt-6">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="block h-[clamp(11rem,26vw,17rem)] w-full" role="img" aria-label={sinkCount > 0 ? `${sinkCount} sinks resting on the floor` : 'The floor, still empty'}>
          <path d={floorPath} fill="#22343a" />
          <path d={floorPath} fill="none" stroke="#3b5960" strokeWidth="1.5" />
          {coins.map((c, i) => (
            <g key={i} data-floor-coin>
              <g transform={`translate(${c.x} ${c.y}) rotate(${c.tilt})`}>
                <ellipse rx="11" ry="4.5" fill="#ff6a3d" stroke="#052733" strokeWidth="1.5" />
              </g>
            </g>
          ))}
          <Otto x={W / 2 - 46} y={floorY(W / 2) - 86} width={92} height={95} track title="Otto, sitting on the floor of the trench" />
        </svg>
        <p className="reading absolute bottom-4 left-0 right-0 m-0 text-center text-[0.8rem] text-star-dim">
          {sinkCount > 0
            ? `${sinkCount} ${sinkCount === 1 ? 'sink' : 'sinks'} on the floor${sinkCount > MAX_COINS ? `, ${MAX_COINS} drawn` : ''} · 10,935 m`
            : 'The floor is empty. The first sink lands here · 10,935 m'}
        </p>
      </div>
    </section>
  );
}
