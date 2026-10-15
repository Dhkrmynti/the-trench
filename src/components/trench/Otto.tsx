import { useEffect, useRef } from 'react';

export type OttoMood = 'idle' | 'busy' | 'sleep';

interface OttoProps {
  mood?: OttoMood;
  /** bump this number to make Otto swing the right arm (a toss) */
  tossKey?: number;
  /** pupils follow the pointer */
  track?: boolean;
  className?: string;
  /** when nested inside another SVG */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  title?: string;
}

const ORANGE = '#ff6a3d';
const INK = '#052733';
const SPOT = '#c9441c';

/**
 * Six arms, outermost first; the last one is the throwing arm. Each grows from a root on
 * the mantle along a heading (degrees, 90 = straight down) and curls by `curl` degrees
 * towards the tip. A travelling wave runs down every arm, stronger near the tip.
 */
const ARMS = [
  { x: 40, y: 70, a: 128, len: 44, curl: 70, phase: 0 },
  { x: 47, y: 75, a: 106, len: 42, curl: 40, phase: 1.7 },
  { x: 56, y: 78, a: 94, len: 40, curl: -30, phase: 3.1 },
  { x: 64, y: 78, a: 86, len: 40, curl: 30, phase: 4.4 },
  { x: 73, y: 75, a: 74, len: 42, curl: -40, phase: 2.3 },
  { x: 80, y: 70, a: 52, len: 44, curl: -70, phase: 5.2 },
];
const SEGMENTS = 9;

/** One arm at time t (seconds) as a smooth SVG path. */
function armPath(arm: (typeof ARMS)[number], t: number, speed: number, amp: number) {
  const pts: [number, number][] = [[arm.x, arm.y]];
  let x = arm.x;
  let y = arm.y;
  const step = arm.len / SEGMENTS;
  for (let i = 1; i <= SEGMENTS; i++) {
    const s = i / SEGMENTS;
    // the heading bends with the curl and swings with the wave, more towards the tip
    const wave = Math.sin(t * speed - s * 3.4 + arm.phase) * amp * (0.25 + s * s * 1.6);
    const heading = ((arm.a + arm.curl * s * s + wave) * Math.PI) / 180;
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
    pts.push([x, y]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}

/**
 * Otto, the octopus who pilots the bathysphere. Drawn from plain shapes so it scales from
 * a favicon to the hero, in the buoy orange with ink outlines. Arms wave like real tentacles, eyes blink, pupils
 * follow the pointer; all of it stops under reduced motion.
 */
export function Otto({ mood = 'idle', tossKey = 0, track = false, className, x, y, width, height, title }: OttoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupils = useRef<SVGGElement>(null);
  const tossArm = useRef<SVGGElement>(null);
  const armEls = useRef<(SVGPathElement | null)[]>([]);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  // the arms: a travelling wave, slow and lazy when idle, quick when Otto is diving, barely moving asleep
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = (t: number) => {
      const m = moodRef.current;
      const speed = m === 'busy' ? 5.2 : m === 'sleep' ? 1.4 : 2.4;
      const amp = m === 'busy' ? 17 : m === 'sleep' ? 9 : 13;
      ARMS.forEach((arm, i) => {
        const d = armPath(arm, t, speed, amp);
        armEls.current[i * 2]?.setAttribute('d', d);
        armEls.current[i * 2 + 1]?.setAttribute('d', d);
      });
    };
    paint(0);
    if (reduce) return;
    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      paint(now / 1000);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(svg);
    const onVis = () => {
      if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // pupils follow the pointer, a couple of units at most
  useEffect(() => {
    if (!track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const svg = svgRef.current;
        const g = pupils.current;
        if (!svg || !g) return;
        const r = svg.getBoundingClientRect();
        const cx = r.left + r.width * 0.5;
        const cy = r.top + r.height * 0.42;
        const dx = px - cx;
        const dy = py - cy;
        const d = Math.max(1, Math.hypot(dx, dy));
        const k = Math.min(1, d / 260) * 3.2;
        g.setAttribute('transform', `translate(${((dx / d) * k).toFixed(2)} ${((dy / d) * k).toFixed(2)})`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [track]);

  // the toss: one swing of the right arm
  useEffect(() => {
    if (!tossKey) return;
    const el = tossArm.current;
    if (!el) return;
    el.classList.remove('otto-toss');
    // restart the animation
    void el.getBoundingClientRect();
    el.classList.add('otto-toss');
    const id = window.setTimeout(() => el.classList.remove('otto-toss'), 700);
    return () => window.clearTimeout(id);
  }, [tossKey]);

  const busy = mood === 'busy';
  const asleep = mood === 'sleep';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 124"
      x={x}
      y={y}
      width={width}
      height={height}
      className={`otto ${busy ? 'otto-busy' : ''} ${className ?? ''}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow="visible"
    >
      {/* arms: an ink outline under an orange stroke */}
      {ARMS.map((arm, i) => {
        const d = armPath(arm, 0, 0, 0);
        return (
          <g key={i} ref={i === ARMS.length - 1 ? tossArm : undefined} className="otto-arm">
            <path ref={(el) => void (armEls.current[i * 2] = el)} d={d} fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path ref={(el) => void (armEls.current[i * 2 + 1] = el)} d={d} fill="none" stroke={ORANGE} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* the mantle */}
      <path d="M60 8 C 87 8, 97 31, 95 52 C 93 70, 81 80, 60 80 C 39 80, 27 70, 25 52 C 23 31, 33 8, 60 8 Z" fill={ORANGE} stroke={INK} strokeWidth="3" />
      <circle cx="43" cy="27" r="3.6" fill={SPOT} opacity="0.55" />
      <circle cx="75" cy="22" r="2.6" fill={SPOT} opacity="0.55" />
      <circle cx="82" cy="38" r="3.1" fill={SPOT} opacity="0.55" />
      <circle cx="36" cy="40" r="2.1" fill={SPOT} opacity="0.55" />

      {/* eyes */}
      {asleep ? (
        <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d="M39 54 Q 47 59 55 54" />
          <path d="M65 54 Q 73 59 81 54" />
        </g>
      ) : (
        <g>
          <ellipse cx="47" cy="51" rx="10" ry="11.5" fill="#f6fcfa" stroke={INK} strokeWidth="2.5" />
          <ellipse cx="73" cy="51" rx="10" ry="11.5" fill="#f6fcfa" stroke={INK} strokeWidth="2.5" />
          <g ref={pupils}>
            <circle cx="47" cy="53" r={busy ? 4 : 5.2} fill={INK} />
            <circle cx="73" cy="53" r={busy ? 4 : 5.2} fill={INK} />
            <circle cx="45.2" cy="50.6" r="1.7" fill="#f6fcfa" />
            <circle cx="71.2" cy="50.6" r="1.7" fill="#f6fcfa" />
          </g>
          {/* lids, for the blink */}
          <g className="otto-lid">
            <rect x="35" y="38" width="24" height="26" fill={ORANGE} />
            <rect x="61" y="38" width="24" height="26" fill={ORANGE} />
          </g>
        </g>
      )}

      {/* mouth */}
      {busy ? (
        <ellipse cx="60" cy="69.5" rx="3.2" ry="3.8" fill={INK} />
      ) : (
        <path d="M54.5 67.5 Q 60 72.5 65.5 67.5" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
