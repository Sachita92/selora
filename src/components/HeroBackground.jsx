import { useEffect, useRef } from "react";

// Full-bleed cross-fade layer with a slow scale drift (1 -> 1.05, ~one product
// cycle) that restarts each time the layer becomes active. The master clock
// advances activeIndex, so drift stays in step with the card. The restart
// happens while the layer is still invisible (opacity 0), and a deactivated
// layer keeps its final scale while fading out, so neither end of the
// cross-fade ever snaps. `drift={false}` (compact layouts) keeps the frame
// perfectly still.
export function DriftImage({ src, srcSet, sizes, pos, active, reducedMotion, drift = true }) {
  const ref = useRef(null);
  const wasActive = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion || !drift) { el.style.animation = "none"; return; }
    if (active && !wasActive.current) {
      el.style.animation = "none";
      void el.offsetWidth; // reflow so re-setting the animation restarts it
      el.style.animation = "heroDrift 10s linear forwards";
    }
    wasActive.current = active;
  }, [active, reducedMotion, drift]);
  return (
    <img
      ref={ref}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? "100vw" : sizes}
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover", objectPosition: pos,
        display: "block",
        opacity: active ? "var(--hero-img-opacity)" : 0,
        transition: reducedMotion ? "none" : "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 0,
        willChange: "transform, opacity",
      }}
    />
  );
}

export default function HeroBackground({ products, activeIndex, reducedMotion, drift }) {
  return (
    <>
      {products.map((p, i) => (
        <DriftImage
          key={p.bgImage}
          src={p.bgImage}
          pos={p.bgPos}
          active={i === activeIndex}
          reducedMotion={reducedMotion}
          drift={drift}
        />
      ))}
    </>
  );
}
