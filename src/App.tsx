import { useState, useEffect, useRef } from 'react';
import { useFlywheelEngine } from './hooks/useBurnEngine';
import { PONS_V2_CONFIG } from './contracts';
import { sounds } from './utils/audio';
import { Volume2, VolumeX, Copy, Check, ArrowUpRight, ScrollText } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { BurnLedgerDrawer } from './components/BurnLedgerDrawer';
import { MemexAdmin } from './components/MemexAdmin';
import { TrenchMark } from './components/trench/TrenchMark';
import { LiveNumber } from './components/trench/LiveNumber';
import { SurfaceScene, type SurfaceHandle } from './components/trench/SurfaceScene';
import { NetPorthole } from './components/trench/NetPorthole';
import { DiveSequence } from './components/trench/DiveSequence';
import { SinkingLog, useSinks } from './components/trench/SinkingLog';
import { OttoSonar } from './components/trench/OttoSonar';
import { TrenchStory } from './components/trench/TrenchStory';
import { Seafloor } from './components/trench/Seafloor';
import { DepthGauge } from './components/trench/DepthGauge';
import { Otto } from './components/trench/Otto';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** What Otto says when a coin goes in. */
const OTTO_SAYS = [
  'blub.',
  'down it goes.',
  'odd dives sink. even dives fill the hold.',
  '1,086 bar down there. nothing floats back.',
  'eight arms, one job.',
  'keep trading. I keep diving.',
  'the bottom is never full.',
  'see you at 10,935 m.',
];

/** X account for the project: empty until there is one. */
const X_URL = '';
const EXPLORER_URL = 'https://explorer.mainnet.chain.robinhood.com';
/** Where to trade and where to watch, once the CA is known. */
const buyUrl = (ca: string) => (ca ? `https://ponsfamily.com/launchpad/${ca}` : EXPLORER_URL);
const chartUrl = (ca: string) => (ca ? `https://dexscreener.com/robinhood/${ca}` : EXPLORER_URL);

const NAME = 'THE TRENCH';

export function App() {
  const { state, config, setConfig, logs, burnLedger } = useFlywheelEngine();

  const getIsMemex = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/memex') || hash.startsWith('#memex') || hash.startsWith('#/memex');
  };

  const [isMemexRoute, setIsMemexRoute] = useState(getIsMemex());
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [copiedCA, setCopiedCA] = useState(false);
  const [copiedDead, setCopiedDead] = useState(false);
  const [dropped, setDropped] = useState(0);
  const [sayIndex, setSayIndex] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);
  const seaRef = useRef<SurfaceHandle>(null);
  const sinks = useSinks(burnLedger);

  useEffect(() => {
    const handleLocationChange = () => setIsMemexRoute(getIsMemex());
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Late fonts change line heights; re-measure every trigger once they land
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  // The ledger and logs arrive after the first layout and make the page taller; re-measure
  // the pins and the depth gauge whenever the page height really changes
  useEffect(() => {
    const page = pageRef.current;
    if (isMemexRoute || !page) return;
    let last = page.offsetHeight;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      const h = page.offsetHeight;
      if (Math.abs(h - last) < 2) return;
      last = h;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        last = page.offsetHeight;
      }, 250);
    });
    ro.observe(page);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, [isMemexRoute]);

  // While the bot is really running, Otto keeps dropping coins
  useEffect(() => {
    if (!state.isWheelSpinning) return;
    const id = window.setInterval(() => seaRef.current?.toss(), 1800);
    return () => window.clearInterval(id);
  }, [state.isWheelSpinning]);

  const dropOne = () => {
    setDropped((prev) => prev + 1);
    setSayIndex((prev) => (prev + 1) % OTTO_SAYS.length);
    seaRef.current?.toss();
    sounds.playBuybackSound();
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setIsMemexRoute(false);
  };

  const threshold = state.currentThresholdETH || state.claimThresholdETH || config.claimThresholdETH || 0;
  const escrow = state.currentEscrowBalanceETH || 0;
  const netFill = threshold > 0 ? Math.max(0, Math.min(1, escrow / threshold)) : 0;

  useEffect(() => {
    document.documentElement.style.setProperty('--hearth', netFill.toFixed(3));
  }, [netFill]);

  useGSAP(
    () => {
      if (isMemexRoute) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Arrival: the name surfaces through the waterline, then the readings settle in, then a coin goes in
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
        intro
          .from('[data-name-dry]', { yPercent: 55, duration: 1.4 }, 0.1)
          .from('[data-name-wet]', { yPercent: -30, opacity: 0, duration: 1.4 }, 0.1)
          .from('[data-hero-line]', { y: 26, opacity: 0, duration: 1, stagger: 0.07 }, 0.45)
          .call(() => seaRef.current?.toss(), [], 1.3);

        // Leaving the surface: the name stays at the waterline a little longer than the water
        gsap.to('[data-name]', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to('[data-hero-dim]', { opacity: 1, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'center top', end: 'bottom top', scrub: true } });

        // One reveal grammar for the deep: things rise out of the dark as they come into view
        ScrollTrigger.batch('[data-rise]', {
          start: 'top 88%',
          once: true,
          onEnter: (els) => gsap.fromTo(els, { y: 44, opacity: 0, filter: 'blur(6px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
        });
        ScrollTrigger.batch('[data-log-row]', {
          start: 'top 94%',
          once: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06 }),
        });
      });
      return () => mm.revert();
    },
    { scope: pageRef, dependencies: [isMemexRoute] },
  );

  if (isMemexRoute) {
    return <MemexAdmin onBack={navigateToHome} />;
  }

  const copyCA = () => {
    if (!config.tokenAddress) return;
    navigator.clipboard?.writeText(config.tokenAddress).catch(() => {});
    setCopiedCA(true);
    sounds.playClaimSound();
    setTimeout(() => setCopiedCA(false), 2500);
  };

  const copyDead = () => {
    navigator.clipboard?.writeText(config.deadAddress || PONS_V2_CONFIG.contracts.deadAddress).catch(() => {});
    setCopiedDead(true);
    sounds.playBurnSound();
    setTimeout(() => setCopiedDead(false), 2000);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(num));

  const totalTokensBurned =
    state.totalTokensBurned > 0
      ? state.totalTokensBurned
      : burnLedger.reduce((acc, cur) => acc + (cur.burnedJollyburn || cur.burnedMuseburn || cur.burnedIncinerator || 0), 0);

  const burnedPercent =
    state.burnedPercentageOfSupply > 0
      ? state.burnedPercentageOfSupply
      : state.totalSupply > 0
        ? (totalTokensBurned / state.totalSupply) * 100
        : 0;

  const tokenSymbol = '$SINK';
  const deadAddress = config.deadAddress || PONS_V2_CONFIG.contracts.deadAddress;
  const isConfigured = Boolean(config.tokenAddress && config.tokenAddress.startsWith('0x') && config.tokenAddress.length === 42);
  const nextCycle = state.nextCycleType || 'burn';
  const routerName = state.swapRouter === 'uniswap' || state.isTokenMigrated ? 'Uniswap v4' : 'the Pons bonding curve';

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-x-clip bg-night font-body text-star">
      {/* ───────── The nav ───────── */}
      <header className="site-header fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-10 lg:px-16">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateToHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center gap-2.5 no-underline"
            aria-label="The Trench home"
          >
            <TrenchMark className="h-8 w-8 transition-transform duration-500 ease-out group-hover:rotate-[-20deg]" />
            <span className="display text-[1.55rem] uppercase">The Trench</span>
          </a>

          <nav className="hidden items-center gap-7 text-[0.92rem] font-semibold md:flex" aria-label="Sections">
            <a href="#dive" className="nav-link no-underline">the dive</a>
            <a href="#log" className="nav-link no-underline">the log</a>
            <a href="#hold" className="nav-link no-underline">the hold</a>
            <a href="#otto" className="nav-link no-underline">otto</a>
            <button type="button" onClick={() => setIsLogOpen(true)} className="nav-link cursor-pointer font-semibold">
              full log
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })}
              title={config.soundEnabled ? 'Mute the sea' : 'Turn the sounds on'}
              aria-label={config.soundEnabled ? 'Mute the sea' : 'Turn the sounds on'}
              className="btn-icon h-10 w-10 cursor-pointer"
            >
              {config.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            {X_URL ? (
              <a href={X_URL} target="_blank" rel="noreferrer" title="The Trench on X" aria-label="The Trench on X" className="btn-icon h-10 w-10">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-6.4L6.5 22H3.4l7.2-8.2L2.9 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.8h1.7L8.3 4.1H6.5l11.3 15.7Z" />
                </svg>
              </a>
            ) : null}
            {config.tokenAddress ? (
              <button type="button" onClick={copyCA} className="btn-ring hidden h-10 cursor-pointer px-4 text-[0.82rem] lg:inline-flex" title="Copy contract address">
                {copiedCA ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCA ? 'Copied' : <>CA <span className="reading text-[0.8rem] font-medium">{`${config.tokenAddress.slice(0, 6)}…${config.tokenAddress.slice(-4)}`}</span></>}</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <DepthGauge />

      <main className="relative z-10">
        {/* ───────── The surface ───────── */}
        <section data-hero data-depth="0" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(#eef9f6_0,#cdeee9_30%,#8fe0dc_34%,#56bccb_100%)] text-pen">
          <SurfaceScene ref={seaRef} busy={state.isWheelSpinning} className="absolute inset-0 -z-10 h-full w-full" />
          <div data-hero-dim className="pointer-events-none absolute inset-0 -z-10 bg-[#56bccb] opacity-0" aria-hidden="true" />

          {/* the name, half dry, half under */}
          <h1 id="hero-title" aria-label="The Trench" className="relative m-0 px-4 pt-24 sm:px-10 sm:pt-28 lg:px-16">
            <span data-name className="relative mx-auto block max-w-[84rem]">
              <span data-waterline className="relative block h-[0.82em] text-[clamp(4.4rem,17vw,14rem)]" aria-hidden="true">
                <span data-name-dry className="wordmark absolute inset-0 block whitespace-nowrap [clip-path:inset(0_0_44%_0)]">
                  {NAME}
                </span>
                <span className="absolute inset-0 block overflow-hidden [clip-path:inset(56%_0_0_0)]">
                  <span data-name-wet className="wave-under wordmark block whitespace-nowrap text-[#0e5a6b]/75">
                    {NAME}
                  </span>
                </span>
              </span>
            </span>
          </h1>

          {/* under the water: the proof, the way in, and the net */}
          <div className="relative mx-auto grid w-full max-w-[84rem] flex-1 items-center gap-10 px-4 pb-14 pt-8 sm:px-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14 lg:px-16 lg:pb-[6svh]">
            <div className="min-w-0">
              <p data-hero-line className="m-0 label">{tokenSymbol} sunk to the bottom</p>
              <div data-hero-line className="mt-1 display tabular text-[clamp(3.4rem,8.4vw,7rem)] leading-[0.9]">
                <LiveNumber value={totalTokensBurned} format={(n) => formatNumber(n)} />
              </div>
              <p data-hero-line className="m-0 mt-2 reading text-[0.95rem] font-semibold">
                {burnedPercent > 0 ? (Math.floor(burnedPercent * 100) / 100).toFixed(2) : '0.00'}% of the whole supply, gone for good
              </p>
              <p data-hero-line className="m-0 mt-5 max-w-[46ch] text-[1.12rem] font-medium leading-relaxed">
                Every trade drops ETH in the net. Otto hauls it, buys {tokenSymbol} back, and sinks it to 0x…dEaD.
              </p>

              <div data-hero-line className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                {config.tokenAddress ? (
                  <button
                    type="button"
                    onClick={copyCA}
                    className="group flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-full border-[1.5px] border-pen/40 bg-air/70 py-2 pl-5 pr-2 text-left transition-colors hover:border-pen sm:max-w-[27rem]"
                    title="Copy contract address"
                  >
                    <span className="min-w-0">
                      <span className="label block text-[0.6rem]">contract address</span>
                      <span className="reading block truncate text-[0.82rem]">{config.tokenAddress}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-pen px-3 py-1.5 text-[0.78rem] font-bold text-air">
                      {copiedCA ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCA ? 'copied' : 'copy'}
                    </span>
                  </button>
                ) : (
                  <p className="m-0 rounded-full border-[1.5px] border-dashed border-pen/45 px-5 py-3 text-[0.98rem]">The contract address shows up here at launch.</p>
                )}
                <div className="flex items-center gap-3">
                  <a href={buyUrl(config.tokenAddress)} target="_blank" rel="noreferrer" className="btn-ring px-7 py-3.5 text-[1.02rem] no-underline">
                    Buy {tokenSymbol}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a href={chartUrl(config.tokenAddress)} target="_blank" rel="noreferrer" className="btn-ink px-5 py-3 text-[0.95rem] no-underline">
                    chart
                  </a>
                  <button type="button" onClick={() => setIsLogOpen(true)} className="btn-ink cursor-pointer px-4 py-3 text-[0.95rem]" aria-label="Open the full log">
                    <ScrollText className="h-4 w-4" />
                    <span className="hidden sm:inline">log</span>
                  </button>
                </div>
              </div>
            </div>

            <div data-hero-line className="min-w-0 justify-self-center pt-24 lg:justify-self-end">
              <NetPorthole
                rider={<Otto mood={!isConfigured ? 'sleep' : state.isWheelSpinning ? 'busy' : 'idle'} tossKey={dropped} track className="block h-auto w-full drop-shadow-[0_14px_18px_rgba(5,39,51,0.35)]" />}
                escrow={escrow} threshold={threshold} fill={netFill} nextCycle={nextCycle} live={isConfigured} running={state.isWheelSpinning} />
              <div className="mt-6 flex min-h-[2.4rem] flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
                <p key={sayIndex} className="reink m-0 text-[1rem] font-semibold">
                  Otto: “{OTTO_SAYS[sayIndex]}”
                </p>
                <button type="button" onClick={dropOne} className="btn-ink cursor-pointer px-4 py-1.5 text-[0.85rem]">
                  drop one in · <span className="reading">{dropped}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── One dive, pinned ───────── */}
        <DiveSequence tokenSymbol={tokenSymbol} escrow={escrow} threshold={threshold} fill={netFill} claimedETH={state.totalFeesClaimedETH || 0} routerName={routerName} nextCycle={nextCycle} />

        {/* ───────── The sinking log and the hold ───────── */}
        <SinkingLog
          burnLedger={burnLedger}
          totalBurned={totalTokensBurned}
          logs={logs}
          tokenSymbol={tokenSymbol}
          deadAddress={deadAddress}
          explorerUrl={EXPLORER_URL}
          copiedDead={copiedDead}
          onCopyDead={copyDead}
          onOpenLog={() => setIsLogOpen(true)}
        />

        {/* ───────── Otto's shift ───────── */}
        <OttoSonar state={state} config={config} live={isConfigured} onOpenLog={() => setIsLogOpen(true)} />

        {/* ───────── How the trench got its bottom ───────── */}
        <TrenchStory />

        {/* ───────── The floor ───────── */}
        <Seafloor sinkCount={sinks.length} tokenSymbol={tokenSymbol} buyHref={buyUrl(config.tokenAddress)} hasCA={Boolean(config.tokenAddress)} copiedCA={copiedCA} onCopyCA={copyCA} />

        <footer className="relative bg-[#02080f]">
          <div className="mx-auto flex max-w-[80rem] flex-col gap-4 border-t border-panel-line px-4 pb-24 pt-8 text-[0.95rem] text-star-dim sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16 lg:pb-10">
            <div className="flex items-center gap-2.5 text-star">
              <TrenchMark className="h-7 w-7" />
              <span className="font-semibold">{tokenSymbol} on Robinhood Chain</span>
            </div>
            <p className="m-0 max-w-[52ch]">Sinks and hold dives are done by a bot and every one is on chain. A meme, not financial advice.</p>
            <div className="reading text-[0.8rem]">
              Chain ID 4663 · {!isConfigured ? 'boat docked' : state.isWheelSpinning ? 'dive in progress' : 'Otto on shift'}
            </div>
          </div>
        </footer>
      </main>

      <BurnLedgerDrawer isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} logs={logs} burnLedger={burnLedger} state={state} config={config} />
    </div>
  );
}

export default App;
