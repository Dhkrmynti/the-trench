---
name: The Trench
description: One dive from the sunlit surface to the floor of the Challenger Deep. Real ocean zones as the colour field, survey-buoy orange for what is live, kelp for the hold, and Otto the octopus.
colors:
  air: "#e4f6f2"
  surf: "#8fe0dc"
  surf-deep: "#56bccb"
  shallow: "#3aa9b9"
  twilight: "#0f5a78"
  midnight: "#082b44"
  abyss: "#05182a"
  night: "#040f1b"
  panel: "#0a2537"
  panel-line: "#1f4a60"
  star: "#e6f4f1"
  star-dim: "#9dbdc1"
  paper: "#eaf6f2"
  pen: "#052733"
  pen-soft: "#36606b"
  ring: "#ff6a3d"
  ring-hot: "#ff9a72"
  marker: "#c9441c"
  fuel: "#c8e66a"
  fuel-ink: "#4a6610"
  silt: "#22343a"
typography:
  wordmark:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(4.4rem, 17vw, 14rem)"
    fontWeight: 800
    lineHeight: 0.82
    letterSpacing: "-0.03em"
  display:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(2.8rem, 5.6vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(1.9rem, 2.8vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  reading:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    fontFeature: "\"tnum\", \"lnum\""
rounded:
  hull: "20px"
  pill: "999px"
spacing:
  gutter-phone: "16px"
  gutter-tablet: "40px"
  gutter-desktop: "64px"
  section-top: "112px"
  section-bottom: "96px"
components:
  button-ring:
    backgroundColor: "{colors.ring}"
    textColor: "{colors.pen}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-ring-hover:
    backgroundColor: "{colors.ring-hot}"
    textColor: "{colors.pen}"
  button-ink:
    textColor: "{colors.pen}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-ink-hover:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.paper}"
  button-ghost:
    textColor: "{colors.star}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-ghost-hover:
    textColor: "{colors.ring-hot}"
  hull:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.star}"
    rounded: "{rounded.hull}"
    padding: "32px"
  hold-band:
    backgroundColor: "{colors.fuel}"
    textColor: "{colors.pen}"
    rounded: "{rounded.hull}"
    padding: "40px"
---

# Design System: The Trench

## Overview

**Creative North Star: "One Dive"**

The page is one dive. Scroll is depth: the visitor starts at the sunlit surface, in pale air over aqua water, and ends on the floor of the Challenger Deep at 10,935 m. The colour field is the real ocean zones (sunlight, twilight, midnight, abyssal, hadal), and a depth gauge on the right counts the metres the whole way down. The site opens light on purpose, refusing the dark crypto hero.

The world is a bathymetric survey: depth axes, a trench cross-section, plumb lines, a porthole gauge, a sonar scope. Everything is drawn from exact geometry (SVG and canvas), never painted. One character lives in it: Otto, an octopus in a bathysphere, who is the bot.

**Key Characteristics:**
- The background darkens with depth, section by section and, inside the pinned dive, continuously with scroll.
- International-orange survey buoys mark what is live or clickable; kelp marks the hold (keep dives).
- Ink text in the light water, foam text in the deep; never mid-grey on a mid-blue.
- Pills for controls, circles for instruments, a 20px hull radius for panels.
- Scroll-driven motion with a still, complete reduced-motion fallback everywhere.

## Colors

### Primary
- **Buoy Orange** (ring): the primary action (Buy $SINK, the header CA chip), live readings in the deep, the sunk coin, the depth marker, the net when the next dive sinks, focus outlines and text selection. Ink text on it, never white.
- **Buoy Hot** (ring-hot): hover of the primary action, live numerals and tx links on deep water.

### Secondary
- **Kelp** (fuel): the hold. The keep-dive band, the boat's hull, the net when the next dive fills the hold, the hold half of step 5.
- **Kelp Ink** (fuel-ink): kelp dark enough to read on light surfaces.

### The water (neutral field, top to bottom)
- **Air** (air), **Surf** (surf), **Shallow** (shallow): the hero and the top of the dive. Text on them is Pen.
- **Twilight** (twilight), **Midnight** (midnight), **Abyss** (abyss), **Night** (night): the deep sections. Text on them is Star / Star Dim.
- **Silt** (silt): the seafloor in the finale only.
- **Panel** / **Panel Line**: hulls and hairlines in the deep.
- **Pen** / **Pen Soft**: ink on light water and on the survey-sheet drawer. Pen Soft only on Paper, never on aqua (it fails contrast there).

### Named Rules
**The Depth Rule.** A section's background is the zone it sits in. Never put a lighter zone below a darker one, except the kelp hold band, which is a lit object, not water.
**The Buoy Rule.** Orange means live or actionable. It is never body copy and never decoration. Otto is the one exception: the mascot wears the buoy orange.
**The Ink Flip Rule.** Text colour flips from Pen to Star only while no text is being read (between steps in the pinned dive, or at a section boundary).

## Typography

**Display:** Bricolage Grotesque Variable, condensed (font-stretch 75% to 78%), weight 800.
**Body:** Hanken Grotesk.
**Readings:** JetBrains Mono with tabular lining numerals, for ETH amounts, addresses, tx hashes, depths.

### Hierarchy
- **Wordmark** (800, 75% stretch, clamp(4.4rem, 17vw, 14rem), 0.82, uppercase): THE TRENCH on the waterline, the depth figures in the story, LET IT SINK.
- **Display** (800, clamp(2.8rem, 5.6vw, 5rem), 0.9): section headings.
- **Headline** (800, clamp(1.9rem, 2.8vw, 2.6rem)): dive step names, chapter titles, the sonar's "right now".
- **Body** (400, 1.05rem to 1.15rem, 1.625): explanations, held to 40ch to 52ch.
- **Label** (600, 0.6rem to 0.72rem, 0.08em, uppercase): reading labels only, never above a section heading.
- **Reading** (mono): every number that changes.

## Layout

Containers at 84rem (header, hero, dive) and 72rem to 80rem (log, sonar, floor). Gutters 16px / 40px / 64px. Each section uses a different layout family: hero split under the waterline, pinned diagram split, hull list, kelp band, centred instrument with flanking readings, horizontal pan, centred finale over the floor.

## Elevation & Depth

Depth is the colour field, not shadows. Hulls are flat with a 1px Panel Line border. Shadows are rare and soft: the buoy button's orange under-glow (0 10px 24px -12px), the porthole's drop (0 24px 40px -20px), the drawer's edge (-30px 0 60px -30px).

## Shapes

Controls are full pills. Panels (hulls, the hold band) are 20px. Instruments are true circles: the porthole with ten bolts, the sonar scope, the bathysphere, coins.

## Components

### Buttons
- **Buoy (primary):** orange pill, ink text, bold Hanken, lifts 2px and brightens to Buoy Hot on hover, presses to scale 0.98.
- **Ink (on light water):** transparent, Pen border at 45%; hover fills Pen with Paper text.
- **Ghost (on deep water):** transparent, Star border at 35%; hover turns the border orange and the text Buoy Hot.
- **Icon:** 40px circle, currentColor border at 35%; hover orange.

### The Net (signature)
A porthole gauge: Pen ring with ten bolts, Air glass, a water level equal to escrow over threshold with a sloshing wave top, orange for a sink dive, kelp for a hold dive. Otto sits on the rim.

### The Dive (signature)
A pinned survey cross-section (500% of the viewport, from 900px): depth axis 0 to 10,935 m, the boat and its hold, the buoy and net, Otto's bathysphere on a cable, the trench floor at 0x…dEaD. Scroll drops fees into the net, fills it, brings Otto up to haul it, turns the ETH into a coin, and sinks the coin along a dashed trail to the floor while a kelp arc goes to the hold. The frame's background darkens from #56bccb to Midnight.

### Depth Gauge
Fixed rail on the right (desktop) and a reading pill bottom-right on every size. Every section declares `data-depth`; the gauge interpolates between them, names the zone, sets `--depth`, and flips the header between surface and deep styles. Marine snow fades in below the light.

### Sinking Log
A hull list where each sink hangs a plumb weight, lower for a bigger sink (log scale against the biggest shown), with amount in display numerals and the tx in mono.

### Otto
Geometric octopus: orange mantle with ink outline, six ink-outlined arms that sway, eyes that blink and follow the pointer. Moods: sleep (no contract address), idle, busy (bot running: faster arms, round mouth). The right arm swings on "drop one in".

## Do's and Don'ts

### Do:
- **Do** keep each section in its zone colour and let the page darken as it goes down.
- **Do** use Buoy Orange only for live state, the primary action and interactive response.
- **Do** set every changing number in mono with tabular numerals.
- **Do** draw instruments and diagrams from exact geometry.
- **Do** gate every animation behind prefers-reduced-motion with a still fallback.

### Don't:
- **Don't** open on a dark hero with a counter, a CA box and stat cards.
- **Don't** put Star text on Shallow or Surf, or Pen Soft on aqua.
- **Don't** use eyebrow labels above section headings.
- **Don't** add neon glows, glass panels or gradient text.
- **Don't** use the legacy alias tokens (soot, ember, plaque and the rest) on public surfaces; they exist only for /memex.
