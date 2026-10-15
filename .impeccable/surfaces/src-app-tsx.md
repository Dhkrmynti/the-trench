---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: public landing + live burn tracker (src/App.tsx)

Mode: Persuade. Visitors arrive from X/Telegram (phone first), want to verify the burn is real, copy the CA, and buy. Brand: The Trench ($SINK). Lore: Otto, an octopus piloting a small bathysphere, lives at the bottom of the Mariana Trench, where 0x…dEaD lies (10,935 m). Every $SINK trade drops ETH into the net (fee escrow). Net full: Otto hauls it (claim); odd dives buy $SINK and sink it to the bottom, even dives fill the hold (project wallet), shown openly. Tone: calm, dry, a little deep.
Constraints: UI and lore only. useBurnEngine, web3 utils, contracts, bot, /memex logic, thresholds and data flow stay untouched. Persisted ledger keys stay readable. Nothing of Lava Pit (pixel mine, Brr) survives.

## Direction contract
THESIS: The page is one dive. Scroll is depth: the visitor starts at the sunlit surface and ends on the floor of the Challenger Deep, with a depth gauge counting the metres. It refuses the dark crypto hero (counter, CA box, stat cards on black) by opening light, in water.
OWN-WORLD: Real ocean zones as the colour field (sunlit aqua, shallow teal, twilight blue, midnight, abyss), international-orange survey buoys as the only accent (live and actionable), kelp chartreuse for the hold. Bathymetric survey drawing: contour lines, depth ticks, a trench cross-section. Bricolage Grotesque condensed heavy for display, Hanken Grotesk text, JetBrains Mono for readings. Pills for controls, circles for instruments (porthole, sonar), 20px hull radius for panels.
STORY: The visitor reads the live sunk total under the waterline, takes CA and BUY $SINK, sees the net fill in a porthole, follows one dive down the trench cross-section (net, full, haul, buy, sink or hold), reads every sink on the sinking log with its tx, sees the hold openly, checks Otto's sonar, reads how the trench got its name in a sideways pan, and lands on the floor where the real sunk coins pile up.
FIRST VIEWPORT: Surface. A canvas sea fills the hero: pale air above a moving waterline at about 34% height, aqua water below with caustic light. THE TRENCH wordmark sits on the waterline, top half dry, bottom half refracted under water. Under the water, left: sunk total in huge numerals, % of supply, one line, CA pill, BUY $SINK (orange), chart, log. Right: the net as a porthole gauge with water level = escrow fill, next dive, Otto's line and "drop one in". On phones: wordmark, total, actions, porthole.
FORM: Bathymetric survey / descent, position 1 on the ordered list, seed: none (unavailable). Signature interaction: the pinned dive, a trench cross-section where the colour field darkens from teal to midnight while one $SINK coin is made and sinks to 0x…dEaD at 10,935 m; plus a page-wide depth gauge driven by scroll. Raises: horizontal pan for the story (expedition log), a real data seafloor where each sunk coin from the ledger lands.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
