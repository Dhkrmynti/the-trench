import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const FLOOR_M = 10935;

const ZONES: [number, string][] = [
  [200, 'Sunlight zone'],
  [1000, 'Twilight zone'],
  [4000, 'Midnight zone'],
  [6000, 'Abyssal zone'],
  [Infinity, 'Hadal zone'],
];
const zoneOf = (m: number) => ZONES.find(([max]) => m < max)![1];
const fmt = (m: number) => `${Math.round(m).toLocaleString('en-US')} m`;

/**
 * The depth gauge: scroll is depth. Every section marks the depth at its top with
 * data-depth; the gauge interpolates between them, writes the reading straight into
 * the DOM (no React renders), sets --depth for anything that dims with depth, and flags
 * the page as surface or deep for the header. Also drives the marine snow.
 */
export function DepthGauge() {
  const readRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const snowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    let anchors: { y: number; m: number }[] = [];
    let depth = 0;

    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
      anchors = els.map((el) => ({ y: el.getBoundingClientRect().top + window.scrollY, m: Number(el.dataset.depth) || 0 }));
      anchors.unshift({ y: 0, m: 0 });
      anchors.push({ y: document.documentElement.scrollHeight - window.innerHeight, m: FLOOR_M });
      anchors.sort((a, b) => a.y - b.y);
    };

    const update = () => {
      const probe = window.scrollY;
      let m = 0;
      for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        if (probe >= a.y && probe <= b.y) {
          m = a.m + ((b.m - a.m) * (probe - a.y)) / Math.max(1, b.y - a.y);
          break;
        }
        if (probe > b.y) m = b.m;
      }
      depth = Math.max(0, Math.min(FLOOR_M, m));
      const k = depth / FLOOR_M;
      if (readRef.current) readRef.current.textContent = fmt(depth);
      if (zoneRef.current) zoneRef.current.textContent = zoneOf(depth);
      if (markRef.current) markRef.current.style.transform = `translateY(${(k * 100).toFixed(2)}%)`;
      root.style.setProperty('--depth', k.toFixed(4));
      const zone = window.scrollY < 24 ? 'top' : depth < 160 ? 'surface' : 'deep';
      if (root.dataset.zone !== zone) root.dataset.zone = zone;
    };

    measure();
    update();
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: () => (measure(), update()) });
    ScrollTrigger.addEventListener('refresh', measure);

    // marine snow: slow white specks that only show once the light is gone
    const canvas = snowRef.current;
    const ctx = canvas?.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastY = window.scrollY;
    const flakes: { x: number; y: number; r: number; s: number }[] = [];
    const size = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes.length = 0;
      const n = window.innerWidth < 700 ? 40 : 90;
      for (let i = 0; i < n; i++) flakes.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, r: 0.6 + Math.random() * 1.6, s: 0.15 + Math.random() * 0.5 });
    };
    const draw = () => {
      if (!canvas || !ctx) return;
      const h = window.innerHeight;
      const w = window.innerWidth;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(230,244,241,0.55)';
      for (const f of flakes) {
        if (!reduce) {
          // the snow drifts down; descending makes it stream up past you
          f.y += f.s - dy * f.s * 0.35;
          if (f.y > h + 4) f.y = -4;
          if (f.y < -4) f.y = h + 4;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const loop = () => {
      if (depth > 150 && !document.hidden) draw();
      raf = requestAnimationFrame(loop);
    };
    size();
    draw();
    if (!reduce) raf = requestAnimationFrame(loop);
    window.addEventListener('resize', size);

    return () => {
      st.kill();
      ScrollTrigger.removeEventListener('refresh', measure);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      delete root.dataset.zone;
    };
  }, []);

  return (
    <>
      <canvas ref={snowRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 h-full w-full" style={{ opacity: 'clamp(0, calc((var(--depth) - 0.02) * 3), 0.9)' }} />

      {/* the rail, desktop only */}
      <div aria-hidden="true" className="depth-rail pointer-events-none fixed right-5 top-1/2 z-30 hidden h-[52svh] -translate-y-1/2 lg:block xl:right-8">
        <div className="relative h-full w-px bg-current opacity-40" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <span key={t} className="absolute right-0 h-px w-2.5 bg-current opacity-60" style={{ top: `${t * 100}%` }} />
        ))}
        <span ref={markRef} className="absolute inset-x-0 top-0 block h-full">
          <span className="absolute -right-[5px] -top-[5px] block h-[11px] w-[11px] rounded-full bg-ring" />
        </span>
      </div>

      {/* the reading */}
      <p className="depth-reading pointer-events-none fixed bottom-3 right-3 z-30 m-0 rounded-full px-2.5 py-1 text-right sm:bottom-5 sm:right-5 sm:rounded-2xl sm:px-3 sm:py-1.5 xl:right-8" aria-live="off">
        <span ref={readRef} className="reading block text-[0.78rem] font-semibold sm:text-[0.95rem]">
          0 m
        </span>
        <span ref={zoneRef} className="label hidden text-[0.58rem] opacity-80 sm:block">
          Sunlight zone
        </span>
      </p>
    </>
  );
}
