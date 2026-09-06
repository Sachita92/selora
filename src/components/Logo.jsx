import { Link } from "react-router-dom";

// ─── Selora brand mark + wordmark ─────────────────────────────────────────────
// The one place the logo is defined. Every header, footer, modal, loader and
// badge renders <Logo /> (or <Mark />) instead of carrying its own markup.
//
// Mark geometry is the path from public/brand/selora-mark.svg, byte-for-byte.
// That file draws the mark in a 24-unit space inside an app-icon tile; the
// viewBox below is the path's tight bounding box (getBBox), so the rendered
// height is the ink height. Do not redraw or simplify. Fill is currentColor
// so CSS owns the colour; the lockup paints it var(--g), which resolves in
// both themes (src/index.css).

const MARK_VIEWBOX = "4.267 1 15.466 22";
const MARK_W = 15.466;
const MARK_H = 22;
const MARK_PATH =
  "M 13.000,1.000 L 11.750,1.250 L 11.750,1.250 L 5.599,5.679 A 0.620,0.620 0 0 1 5.435,5.853 L 4.359,7.575 A 0.620,0.620 0 0 1 4.267,7.955 L 4.727,13.470 A 0.620,0.620 0 0 1 4.976,13.917 L 10.129,17.726 A 0.620,0.620 0 0 1 10.869,17.723 L 11.289,17.408 A 0.620,0.620 0 0 1 11.533,16.989 L 11.703,15.626 A 0.620,0.620 0 0 1 11.437,15.037 L 6.350,11.568 A 0.620,0.620 0 0 0 6.183,11.400 L 5.854,10.906 A 0.620,0.620 0 0 0 5.750,10.562 L 5.750,10.207 A 0.620,0.620 0 0 0 5.874,9.835 L 6.500,9.000 L 6.500,9.000 L 12.500,4.750 L 12.500,4.750 L 13.500,5.000 L 13.500,5.000 L 14.500,6.500 L 14.500,6.500 L 14.500,2.500 L 14.500,2.500 L 13.000,1.000 L 13.000,1.000 Z M 11.000,23.000 L 12.250,22.750 L 12.250,22.750 L 18.401,18.321 A 0.620,0.620 0 0 1 18.565,18.147 L 19.641,16.425 A 0.620,0.620 0 0 1 19.733,16.045 L 19.273,10.530 A 0.620,0.620 0 0 1 19.024,10.083 L 13.871,6.274 A 0.620,0.620 0 0 1 13.131,6.277 L 12.711,6.592 A 0.620,0.620 0 0 1 12.467,7.011 L 12.297,8.374 A 0.620,0.620 0 0 1 12.563,8.963 L 17.650,12.432 A 0.620,0.620 0 0 0 17.817,12.600 L 18.146,13.094 A 0.620,0.620 0 0 0 18.250,13.438 L 18.250,13.793 A 0.620,0.620 0 0 0 18.126,14.165 L 17.500,15.000 L 17.500,15.000 L 11.500,19.250 L 11.500,19.250 L 10.500,19.000 L 10.500,19.000 L 9.500,17.500 L 9.500,17.500 L 9.500,21.500 L 9.500,21.500 L 11.000,23.000 L 11.000,23.000 Z";

// Lockup geometry, in units of the wordmark's font-size.
//   MARK_RATIO  mark height. Geist 700's "l" ascender measures only 0.72em
//               (15.8px at 22px), so an ascender-height mark would be no
//               taller than a cap-height one; the ratio is set instead so the
//               navbar's size={22} renders the brand spec's 24px minimum.
//   CAP_HEIGHT  Geist 700 caps and "l" both reach ~0.72em. The mark sits on
//               the baseline and is shifted down by half its excess over cap
//               height, so it is centred on the capitals.
const MARK_RATIO = 24 / 22;
const CAP_HEIGHT = 0.72;

// Bare mark. `size` is its rendered height in px; width follows the viewBox.
export function Mark({ size = 24, style, ...rest }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      height={size}
      width={(size * MARK_W) / MARK_H}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flexShrink: 0, ...style }}
      {...rest}
    >
      <path d={MARK_PATH} />
    </svg>
  );
}

/**
 * variant    "lockup" (mark + wordmark, default) | "mark" | "wordmark"
 * size       px. For "mark" it is the mark's height. For "lockup" and
 *            "wordmark" it is the wordmark's font-size; the mark is
 *            MARK_RATIO x size and the gap is half the mark height.
 * markScale  lockup only — multiplies the mark height (and gap) for
 *            instances where the default reads too heavy. Default 1.
 * link       true (default) renders a Link to "/"; false renders a plain div.
 */
export default function Logo({ variant = "lockup", size = 24, markScale = 1, link = true, className, style }) {
  const showMark = variant !== "wordmark";
  const showWord = variant !== "mark";
  const lockup = showMark && showWord;
  const markSize = variant === "mark" ? size : size * MARK_RATIO * markScale;
  // Centre the mark on the capitals: bottom on the baseline, then down by
  // half of (mark height - cap height).
  const markShift = lockup ? (markSize - size * CAP_HEIGHT) / 2 : 0;

  const inner = (
    <span
      style={{
        display: "inline-flex",
        alignItems: lockup ? "baseline" : "center",
        gap: markSize * 0.5,
        lineHeight: 1,
        color: "var(--logo-text)",
        whiteSpace: "nowrap",
      }}
    >
      {showMark && <Mark size={markSize} style={{ color: "var(--g)", position: "relative", top: markShift }} />}
      {showWord && (
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: size, letterSpacing: "-0.01em", lineHeight: 1 }}>
          {"Se"}<span style={{ color: "var(--g)" }}>{"lo"}</span>{"ra"}
        </span>
      )}
    </span>
  );

  const box = { display: "inline-flex", alignItems: "center", textDecoration: "none", color: "inherit", ...style };
  return link
    ? <Link to="/" aria-label="Selora" className={className} style={box}>{inner}</Link>
    : <div role="img" aria-label="Selora" className={className} style={box}>{inner}</div>;
}
