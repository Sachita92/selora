import { useEffect, useRef } from "react";

const HERO_VIDEO = {
  mp4: "/hero-loop.mp4",
  webm: null,
  poster: "/hero-loop-poster.webp",
  pos: "center 40%",
};

const layerStyle = {
  position: "absolute", inset: 0,
  width: "100%", height: "100%",
  objectFit: "cover", objectPosition: HERO_VIDEO.pos,
  display: "block",
  opacity: "var(--hero-img-opacity)",
  zIndex: 0,
};

export default function HeroVideo({ still }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // React sets `muted` as a property, not an attribute, and autoplay
    // policies key off the attribute at parse time in some engines. Assert
    // both and ask for playback explicitly; a rejected play() is fine (the
    // poster stays up).
    el.muted = true;
    el.defaultMuted = true;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [still]);

  if (still) {
    return <img src={HERO_VIDEO.poster} alt="" aria-hidden="true" style={layerStyle} />;
  }
  return (
    <video
      ref={ref}
      muted
      autoPlay
      loop
      playsInline
      disablePictureInPicture
      poster={HERO_VIDEO.poster}
      aria-hidden="true"
      tabIndex={-1}
      style={layerStyle}
    >
      {HERO_VIDEO.webm && <source src={HERO_VIDEO.webm} type="video/webm" />}
      <source src={HERO_VIDEO.mp4} type="video/mp4" />
    </video>
  );
}
