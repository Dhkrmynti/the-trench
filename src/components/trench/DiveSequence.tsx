import { useId, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Otto } from './Otto';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface DiveSequenceProps {
  tokenSymbol: string;
  escrow: number;
  threshold: number;
  fill: number;
  claimedETH: number;
  routerName: string;
  nextCycle: 'burn' | 'keep';
}

interface Step {
  name: string;
  body: ReactNode;
  readingLabel: string;
  reading: string;
}

const FLOOR_M = 10935;
const TOP = 70;
const FLOOR_Y = 680;
const yAt = (m: number) => TOP + (m / FLOOR_M) * (FLOOR_Y - TOP);
const TICKS = [0, 2000, 4000, 6000, 8000, 10000];
const AXIS_X = 462;
const BUOY_X = 400;

/**
 * The trench in cross-section, drawn as a survey would: depth axis, the sea surface,
 * the boat with its hold, the buoy and the net, Otto's bathysphere on its cable,
 * and the floor of the trench at 10,935 m. Strokes follow currentColor.
 */
function Section({ still = false }: { still?: boolean }) {
  const clipId = `net-bag-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 560 720" className="h-full w-full overflow-visible" role="img" aria-label="Cross-section of the trench: the net at the surface, Otto's bathysphere, and the floor at 10,935 metres where sunk $SINK lands">
      <defs>
        <clipPath id={clipId}>
          <path d={`M${BUOY_X - 30} 80 Q ${BUOY_X} 150 ${BUOY_X + 30} 80 Z`} />
        </clipPath>
      </defs>

      {/* depth axis */}
      <g className="reading" fontSize="11" fill="currentColor">
        <line x1="40" y1={TOP} x2="40" y2={FLOOR_Y} stroke="currentColor" strokeOpacity="0.45" />
        {TICKS.map((m) => (
          <g key={m}>
            <line x1="34" x2="46" y1={yAt(m)} y2={yAt(m)} stroke="currentColor" strokeOpacity="0.6" />
            <line x1="46" x2="560" y1={yAt(m)} y2={yAt(m)} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 6" />
            <text x="0" y={yAt(m) + 4} fillOpacity="0.75">
              {m === 0 ? '0 m' : m.toLocaleString('en-US')}
            </text>
          </g>
        ))}
      </g>

      {/* the sea surface */}
      <path d={`M40 ${TOP} Q 140 ${TOP - 6} 240 ${TOP} T 440 ${TOP} T 560 ${TOP}`} fill="none" stroke="currentColor" strokeWidth="1.5" />

      {/* the boat and its hold */}
      <g>
        <path d="M86 54 H206 L192 76 H100 Z" fill="#c8e66a" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="126" y="38" width="40" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="146" y="96" textAnchor="middle" className="reading" fontSize="11" fill="currentColor">
          THE HOLD
        </text>
      </g>

      {/* fees falling into the net */}
      {[0, 1, 2].map((i) => (
        <circle key={i} data-fee cx={BUOY_X - 14 + i * 14} cy={still ? -40 : 10} r="4" fill="#ff6a3d" opacity={still ? 0 : 1} />
      ))}

      {/* the buoy and the net */}
      <line x1={BUOY_X} y1={TOP - 8} x2={BUOY_X} y2="80" stroke="currentColor" strokeWidth="1.5" />
      <g clipPath={`url(#${clipId})`}>
        <rect data-net-fill x={BUOY_X - 32} y={still ? 108 : 136} width="64" height={still ? 32 : 4} fill="#ff6a3d" />
      </g>
      <path d={`M${BUOY_X - 30} 80 Q ${BUOY_X} 150 ${BUOY_X + 30} 80`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1={BUOY_X - 30} y1="80" x2={BUOY_X + 30} y2="80" stroke="currentColor" strokeWidth="1.5" />
      <circle cx={BUOY_X} cy={TOP - 10} r="9" fill="#ff6a3d" stroke="currentColor" strokeWidth="1.5" />

      {/* Otto's bathysphere on its cable */}
      <line data-cable x1={BUOY_X + 30} y1="80" x2={BUOY_X + 46} y2={still ? 210 : 260} stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      <g data-sphere transform={`translate(${BUOY_X + 46} ${still ? 226 : 276})`}>
        <circle r="17" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle r="12" fill="#eaf6f2" fillOpacity="0.9" />
        <Otto x={-11} y={-12} width={22} height={23} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={Math.cos((i / 6) * Math.PI * 2) * 12.5} cy={Math.sin((i / 6) * Math.PI * 2) * 12.5} r="1.4" fill="currentColor" />
        ))}
      </g>

      {/* the floor */}
      <path
        d={`M40 270 C 120 272 190 282 250 312 L 340 430 C 390 530 425 640 ${AXIS_X - 10} ${FLOOR_Y - 4} Q ${AXIS_X} ${FLOOR_Y + 6} ${AXIS_X + 10} ${FLOOR_Y - 4} C 495 620 520 520 560 470 L 560 720 L 40 720 Z`}
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <g className="reading" fontSize="11" fill="currentColor">
        <text x={AXIS_X - 14} y={FLOOR_Y + 26} textAnchor="end">
          0x…dEaD
        </text>
        <text x={AXIS_X + 14} y={FLOOR_Y + 26}>
          10,935 m
        </text>
      </g>

      {/* the way down, and the way to the hold */}
      <path data-trail d={`M${BUOY_X} 128 C ${BUOY_X + 20} 300 ${AXIS_X - 30} 480 ${AXIS_X} ${FLOOR_Y - 10}`} fill="none" stroke="#ff6a3d" strokeWidth="2" strokeDasharray="4 6" pathLength={1} style={{ strokeDasharray: '1', strokeDashoffset: still ? 0 : 1 }} />
      <path data-hold-arc d={`M${BUOY_X - 28} 92 C 320 140 220 140 ${150} 80`} fill="none" stroke="#c8e66a" strokeWidth="2" pathLength={1} style={{ strokeDasharray: '1', strokeDashoffset: still ? 0 : 1 }} />
      <text data-hold-label x="262" y="150" textAnchor="middle" className="reading" fontSize="11" fill="currentColor" opacity={still ? 1 : 0}>
        even dives
      </text>

      {/* the $SINK coin */}
      <g data-coin transform={still ? `translate(${AXIS_X} ${FLOOR_Y - 12})` : `translate(${BUOY_X} 112)`} opacity={still ? 1 : 0}>
        <g data-coin-face>
          <circle r="11" fill="#ff6a3d" stroke="currentColor" strokeWidth="2" />
          <circle r="5.5" fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}

export function DiveSequence({ tokenSymbol, escrow, threshold, fill, claimedETH, routerName, nextCycle }: DiveSequenceProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sink = nextCycle === 'burn';

  const steps: Step[] = [
    {
      name: 'Trades fill the net',
      body: <>Every {tokenSymbol} buy and sell pays a creator fee in ETH. It drifts down into the net, which is the Pons fee escrow.</>,
      readingLabel: 'in the net now',
      reading: `${escrow.toFixed(4)} ETH`,
    },
    {
      name: 'The net fills up',
      body: <>It fills to the size of the next dive: 0.01 ETH for a sink, 0.02 ETH for the hold. Full net, Otto dives.</>,
      readingLabel: 'net filled',
      reading: `${Math.round(fill * 100)}% of ${threshold ? threshold.toFixed(2) : '-'} ETH`,
    },
    {
      name: 'Otto hauls it in',
      body: <>Otto is the bot. Otto claims the whole escrow alone, and watches every block, day and night.</>,
      readingLabel: 'ETH hauled so far',
      reading: `${claimedETH.toFixed(4)} ETH`,
    },
    {
      name: `Otto buys ${tokenSymbol}`,
      body: <>On a sink dive, the hauled ETH market-buys {tokenSymbol} on {routerName}. Real buying, every dive.</>,
      readingLabel: 'buying on',
      reading: routerName.replace(/^the /, ''),
    },
    {
      name: 'Sink it, or hold it',
      body: (
        <>
          Dives take turns. <strong className="font-bold text-ring-hot">Odd dives sink every {tokenSymbol} bought</strong> to 0x…dEaD, the bottom of the trench. Nothing comes back up.{' '}
          <strong className="font-bold text-fuel">Even dives put the ETH in the hold</strong>, the project wallet that keeps the boat running.
        </>
      ),
      readingLabel: 'next dive',
      reading: sink ? 'to the bottom' : 'into the hold',
    },
  ];

  useGSAP(
    () => {
      const frame = frameRef.current;
      if (!frame) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        frame.dataset.mode = 'pinned';
        ScrollTrigger.refresh();
        const q = gsap.utils.selector(frame);
        const texts = q('[data-step]');
        const stage = q('[data-pinned-stage]')[0];
        const s = gsap.utils.selector(stage);
        gsap.set(texts, { autoAlpha: 0, y: 28 });
        gsap.set(texts[0], { autoAlpha: 1, y: 0 });

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: { trigger: frame, pin: true, start: 'top top', end: '+=500%', scrub: 0.8 },
        });

        // the water darkens the whole way down, and the ink flips to foam on the way
        // (the ink flips while the step text is between steps, so no step is ever read mid-flip)
        tl.fromTo(frame, { backgroundColor: '#56bccb' }, { backgroundColor: '#0f5a78', duration: 1.4, ease: 'power2.in' }, 0)
          .to(frame, { backgroundColor: '#082b44', duration: 3.6, ease: 'none' }, 1.4)
          .fromTo(frame, { color: '#052733' }, { color: '#e6f4f1', duration: 0.08, ease: 'none' }, 0.88);

        // 1: fees fall into the net
        s('[data-fee]').forEach((el, i) => {
          tl.fromTo(el, { attr: { cy: 0 }, opacity: 1 }, { attr: { cy: 104 }, duration: 0.5, ease: 'power2.in' }, 0.1 + i * 0.18).to(el, { opacity: 0, duration: 0.05 }, 0.6 + i * 0.18);
        });
        // 2: the net fills
        tl.fromTo(s('[data-net-fill]'), { attr: { y: 136, height: 4 } }, { attr: { y: 80, height: 60 }, duration: 0.9, ease: 'none' }, 1.05)
          // 3: Otto comes up the cable and hauls it
          .to(s('[data-sphere]'), { attr: { transform: `translate(${BUOY_X + 46} 150)` }, duration: 0.6 }, 2.05)
          .to(s('[data-cable]'), { attr: { y2: 134 }, duration: 0.6 }, 2.05)
          .to(s('[data-net-fill]'), { attr: { y: 140, height: 0 }, duration: 0.4 }, 2.6)
          // 4: the ETH becomes a $SINK coin
          .to(s('[data-coin]'), { opacity: 1, duration: 0.2 }, 3.1)
          .fromTo(s('[data-coin-face]'), { scale: 0.2, svgOrigin: '0 0' }, { scale: 1, svgOrigin: '0 0', duration: 0.5, ease: 'back.out(2.4)' }, 3.1)
          // 5: it sinks to the floor; the other kind of dive goes to the hold
          .to(s('[data-trail]'), { strokeDashoffset: 0, duration: 0.85, ease: 'none' }, 4.05)
          .to(s('[data-coin]'), { attr: { transform: `translate(${AXIS_X} ${FLOOR_Y - 12})` }, duration: 0.85, ease: 'power1.in' }, 4.05)
          .to(s('[data-hold-arc]'), { strokeDashoffset: 0, duration: 0.6, ease: 'none' }, 4.2)
          .to(s('[data-hold-label]'), { opacity: 1, duration: 0.2 }, 4.6);

        texts.forEach((el, i) => {
          if (i < texts.length - 1) {
            tl.to(el, { autoAlpha: 0, y: -28, duration: 0.2, ease: 'power2.in' }, i + 0.8);
            tl.to(texts[i + 1], { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }, i + 0.98);
          }
        });
        return () => {
          delete frame.dataset.mode;
        };
      });
      return () => mm.revert();
    },
    { scope: frameRef },
  );

  return (
    <section id="dive" data-depth="200" aria-labelledby="dive-title" className="relative">
      <div
        ref={frameRef}
        className="group/dive relative bg-[linear-gradient(#56bccb_0,#0f5a78_9rem,#082b44_100%)] text-star data-[mode=pinned]:h-[100svh] data-[mode=pinned]:overflow-hidden data-[mode=pinned]:bg-none"
      >
        <div className="mx-auto grid max-w-[84rem] gap-10 px-4 pb-28 pt-40 sm:px-10 lg:px-16 group-data-[mode=pinned]/dive:h-full group-data-[mode=pinned]/dive:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] group-data-[mode=pinned]/dive:items-center group-data-[mode=pinned]/dive:gap-14 group-data-[mode=pinned]/dive:py-0 group-data-[mode=pinned]/dive:pt-[4.5rem]">
          <div className="min-w-0">
            <h2 id="dive-title" className="m-0 max-w-[14ch] display text-[clamp(2.8rem,5.6vw,5rem)]">
              One dive, from the net to the bottom
            </h2>

            {/* phones and reduced motion: the whole dive drawn once, above the steps */}
            <div className="mt-10 aspect-[560/720] w-full max-w-[26rem] group-data-[mode=pinned]/dive:hidden" aria-hidden="true">
              <Section still />
            </div>

            <ol className="relative z-10 m-0 mt-12 grid list-none gap-12 p-0 group-data-[mode=pinned]/dive:mt-12 group-data-[mode=pinned]/dive:grid-cols-1 group-data-[mode=pinned]/dive:grid-rows-1 group-data-[mode=pinned]/dive:gap-0">
              {steps.map((s) => (
                <li key={s.name} data-step className="min-w-0 group-data-[mode=pinned]/dive:col-start-1 group-data-[mode=pinned]/dive:row-start-1">
                  <h3 className="m-0 display text-[clamp(1.9rem,2.8vw,2.6rem)]">{s.name}</h3>
                  <p className="m-0 mt-4 max-w-[42ch] text-[1.1rem] leading-relaxed">{s.body}</p>
                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="label opacity-80">{s.readingLabel}</span>
                    <span className="reading text-[1.05rem] font-semibold">{s.reading}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div data-pinned-stage className="relative hidden h-[min(82svh,46rem)] min-w-0 justify-self-center group-data-[mode=pinned]/dive:block" style={{ aspectRatio: '560 / 720' }} aria-hidden="true">
            <Section />
          </div>
        </div>
      </div>
    </section>
  );
}
