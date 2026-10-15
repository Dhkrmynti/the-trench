import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface SurfaceHandle {
  /** Drop one $SINK coin from above the water; it splashes and sinks. */
  toss: () => void;
}

interface SurfaceSceneProps {
  /** true while the bot is really running: the sea gets choppier */
  busy?: boolean;
  className?: string;
}

interface Coin {
  x: number;
  y: number;
  vy: number;
  phase: number;
  born: number;
  splashed: boolean;
}
interface Ring {
  x: number;
  born: number;
}
interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
}

const AIR_TOP = '#eef9f6';
const AIR_LOW = '#cdeee9';
const WATER_TOP = '#8fe0dc';
const WATER_LOW = '#56bccb';

/**
 * The sea at the surface, drawn live: pale air, a moving waterline, caustic light and
 * light shafts under the water, bubbles, and coins that splash in and sink.
 * The waterline follows the element marked [data-waterline]. It pauses off screen and
 * draws one still frame under reduced motion.
 */
export const SurfaceScene = forwardRef<SurfaceHandle, SurfaceSceneProps>(function SurfaceScene({ busy = false, className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coins = useRef<Coin[]>([]);
  const rings = useRef<Ring[]>([]);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const drawStill = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({
    toss() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.clientWidth;
      const x = w * (0.52 + Math.random() * 0.36);
      coins.current.push({ x, y: -20, vy: 0, phase: Math.random() * Math.PI * 2, born: performance.now(), splashed: false });
      if (coins.current.length > 14) coins.current.shift();
      drawStill.current();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let line = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const bubbles: Bubble[] = [];

    const measure = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mark = document.querySelector<HTMLElement>('[data-waterline]');
      if (mark) {
        const m = mark.getBoundingClientRect();
        line = m.top - rect.top + m.height * 0.56;
      } else {
        line = h * 0.34;
      }
      bubbles.length = 0;
      const count = w < 700 ? 16 : 30;
      for (let i = 0; i < count; i++) {
        bubbles.push({ x: Math.random() * w, y: line + Math.random() * (h - line), r: 1 + Math.random() * 2.6, speed: 12 + Math.random() * 26, drift: Math.random() * Math.PI * 2 });
      }
    };

    const surfaceY = (x: number, t: number, chop: number) =>
      line + Math.sin(x * 0.012 + t * 1.1) * 5 * chop + Math.sin(x * 0.031 - t * 1.7) * 2.4 * chop + Math.sin(x * 0.004 + t * 0.4) * 6;

    const draw = (now: number) => {
      const t = now / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const chop = busyRef.current ? 1.8 : 1;

      // air
      const air = ctx.createLinearGradient(0, 0, 0, line);
      air.addColorStop(0, AIR_TOP);
      air.addColorStop(1, AIR_LOW);
      ctx.fillStyle = air;
      ctx.fillRect(0, 0, w, line + 20);

      // water body, under a wavy surface
      const water = ctx.createLinearGradient(0, line, 0, h);
      water.addColorStop(0, WATER_TOP);
      water.addColorStop(1, WATER_LOW);
      ctx.fillStyle = water;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, surfaceY(x, t, chop));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.clip();

      // light shafts from the surface
      for (let i = 0; i < 5; i++) {
        const sx = ((i * 0.23 + 0.08) * w + Math.sin(t * 0.2 + i) * 30) % (w + 200);
        const g = ctx.createLinearGradient(0, line, 0, h);
        g.addColorStop(0, 'rgba(255,255,255,0.20)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(sx, line);
        ctx.lineTo(sx + 70, line);
        ctx.lineTo(sx + 70 - h * 0.35, h);
        ctx.lineTo(sx - 40 - h * 0.35, h);
        ctx.closePath();
        ctx.fill();
      }

      // caustics: thin bright filaments just under the surface
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 7; k++) {
        const base = line + 18 + k * 22;
        const alpha = 0.22 * (1 - k / 7);
        ctx.strokeStyle = `rgba(240,255,252,${alpha.toFixed(3)})`;
        ctx.beginPath();
        for (let x = -10; x <= w + 10; x += 10) {
          const y = base + Math.sin(x * 0.02 + t * (0.9 + k * 0.13) + k) * 6 + Math.sin(x * 0.047 - t * 1.3) * 3;
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // bubbles
      ctx.fillStyle = 'rgba(240,255,252,0.55)';
      for (const b of bubbles) {
        if (!reduce) {
          b.y -= b.speed * dt * (busyRef.current ? 1.6 : 1);
          b.x += Math.sin(t * 2 + b.drift) * 0.25;
          if (b.y < line + 6) {
            b.y = h + 10;
            b.x = Math.random() * w;
          }
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // coins under the water
      for (const c of coins.current) {
        if (c.y <= line) continue;
        drawCoin(c, t, true);
      }
      ctx.restore();

      // the waterline itself
      ctx.strokeStyle = 'rgba(5,39,51,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w + 8; x += 8) {
        const y = surfaceY(x, t, chop);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // coins in the air, and their splash rings
      for (const c of coins.current) {
        if (c.y > line) continue;
        drawCoin(c, t, false);
      }
      for (const r of rings.current) {
        const age = (now - r.born) / 1000;
        const k = Math.min(1, age / 1.2);
        ctx.strokeStyle = `rgba(5,39,51,${(0.5 * (1 - k)).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(r.x, line, 10 + k * 70, 3 + k * 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      rings.current = rings.current.filter((r) => now - r.born < 1200);

      // physics
      for (const c of coins.current) {
        if (c.y < line) {
          c.vy += 900 * dt;
          c.y += c.vy * dt;
          if (c.y >= line) {
            c.splashed = true;
            c.vy = 90;
            rings.current.push({ x: c.x, born: now });
          }
        } else {
          c.vy += (40 - c.vy) * dt * 2;
          c.y += c.vy * dt;
        }
      }
      coins.current = coins.current.filter((c) => c.y < h + 40);
    };

    const drawCoin = (c: Coin, t: number, under: boolean) => {
      const wob = under ? Math.sin(t * 2.4 + c.phase) * 10 : 0;
      const squash = under ? 0.45 + Math.abs(Math.cos(t * 2.4 + c.phase)) * 0.55 : 1;
      const x = c.x + wob;
      const depth = under ? Math.min(1, (c.y - line) / Math.max(1, h - line)) : 0;
      ctx.save();
      ctx.globalAlpha = 1 - depth * 0.75;
      ctx.translate(x, c.y);
      ctx.scale(squash, 1);
      ctx.fillStyle = '#ff6a3d';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#052733';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(5,39,51,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    const loop = (now: number) => {
      draw(now);
      raf = visible && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!raf && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    drawStill.current = () => {
      if (reduce) {
        // no motion: show the coin already under the water
        const c = coins.current[coins.current.length - 1];
        if (c) {
          c.y = line + (h - line) * 0.4;
          c.splashed = true;
        }
        draw(performance.now());
      }
    };

    measure();
    draw(performance.now());
    start();

    const ro = new ResizeObserver(() => {
      measure();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onFonts = () => {
      measure();
      draw(performance.now());
    };
    document.fonts?.ready.then(onFonts);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
});
