import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHAPTERS = [
  {
    depth: '0 m',
    title: 'The wrong cable',
    text: 'Otto, a small octopus with big plans, found an old bathysphere tied to a pier, climbed in, and chewed through the cable.',
  },
  {
    depth: '6,000 m',
    title: 'Still going',
    text: 'The sphere sank past the light, past the whales, past the point where anything swims. On chain, this is the way to 0x…dEaD.',
  },
  {
    depth: '10,935 m',
    title: 'The bottom',
    text: 'Otto landed on a floor of sunk coins. Nothing down here floats back up. So Otto stayed, rigged a net to the surface, and started diving for $SINK.',
  },
];

/**
 * How the trench got its bottom: three chapters read sideways while the page keeps sinking.
 * Desktop pans them across a pinned frame; phones and reduced motion stack them.
 */
export function TrenchStory() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const track = trackRef.current;
      if (!wrap || !track) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        wrap.dataset.mode = 'pan';
        const distance = () => Math.max(0, track.scrollWidth - wrap.clientWidth);
        const pan = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        // each chapter's depth figure slides against the pan, so the numbers feel deeper than the words
        gsap.utils.toArray<HTMLElement>('[data-chapter-depth]', wrap).forEach((el) => {
          gsap.fromTo(el, { xPercent: 18 }, { xPercent: -18, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: pan, start: 'left right', end: 'right left', scrub: true } });
        });
        ScrollTrigger.refresh();
        return () => {
          delete wrap.dataset.mode;
        };
      });
      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  return (
    <section id="story" data-depth="7500" aria-labelledby="story-title" className="relative bg-night">
      <div ref={wrapRef} className="group/story relative overflow-hidden data-[mode=pan]:h-[100svh]">
        <div className="px-4 pt-28 sm:px-10 lg:px-16 group-data-[mode=pan]/story:absolute group-data-[mode=pan]/story:left-0 group-data-[mode=pan]/story:top-0 group-data-[mode=pan]/story:pt-28">
          <h2 id="story-title" className="m-0 max-w-[16ch] display text-[clamp(2.8rem,5.6vw,5rem)] text-star">
            How the trench got its bottom
          </h2>
        </div>
        <div
          ref={trackRef}
          className="grid gap-16 px-4 pb-28 pt-16 sm:px-10 lg:px-16 group-data-[mode=pan]/story:flex group-data-[mode=pan]/story:h-full group-data-[mode=pan]/story:w-max group-data-[mode=pan]/story:items-end group-data-[mode=pan]/story:gap-0 group-data-[mode=pan]/story:pb-[12svh] group-data-[mode=pan]/story:pl-[38vw] group-data-[mode=pan]/story:pt-0"
        >
          {CHAPTERS.map((c) => (
            <article key={c.title} data-rise className="relative min-w-0 group-data-[mode=pan]/story:w-[62vw] group-data-[mode=pan]/story:shrink-0 group-data-[mode=pan]/story:pr-[8vw]">
              <p data-chapter-depth aria-hidden="true" className="wordmark m-0 normal-case text-[clamp(4.5rem,14vw,13rem)] text-panel-line">
                {c.depth}
              </p>
              <h3 className="relative m-0 -mt-[0.18em] display text-[clamp(2rem,3.2vw,2.9rem)] text-star">
                <span className="sr-only">{c.depth}: </span>
                {c.title}
              </h3>
              <p className="m-0 mt-4 max-w-[40ch] text-[1.1rem] leading-relaxed text-star-dim">{c.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
