/**
 * The Trench mark: a porthole looking at the trench profile, with one coin on the floor.
 * Strokes use currentColor; the coin is always the buoy orange.
 */
export function TrenchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M5 21 H14 L20 36 Q24 41 28 36 L34 21 H43" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="24" cy="34.5" r="3.6" fill="#ff6a3d" />
    </svg>
  );
}
